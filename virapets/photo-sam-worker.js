// Loaded only by PetPhotoSam.init(), following explicit user opt-in.
const MODEL = 'Xenova/slimsam-77-uniform';
const REVISION = '5850ab45f587c112167512ffef949107115e26a0';
const CACHE = `virapets-slimsam-${REVISION}`;
let api, model, processor, initialization, image, embeddings, imageKey;
const send = (id, type, data = {}) => self.postMessage({ id, type, ...data });
function clearImage() {
  for (const value of Object.values(embeddings || {})) value.dispose?.();
  embeddings = image = imageKey = undefined;
}
async function init(id) {
  if (!initialization) initialization = (async () => {
    api = await import('./vendor/transformers-3.8.1/transformers.min.js');
    const { env, SamModel, AutoProcessor } = api;
    env.allowLocalModels = false;
    env.useBrowserCache = false;
    env.useFSCache = false;
    if (typeof caches !== 'undefined') {
      try {
        const cache = await caches.open(CACHE);
        env.useCustomCache = true;
        env.customCache = { match: key => cache.match(key), put: (key, response) => cache.put(key, response) };
      } catch { env.useCustomCache = false; }
    }
    env.backends.onnx.wasm.numThreads = 1;
    env.backends.onnx.wasm.proxy = false;
    env.backends.onnx.wasm.wasmPaths = new URL('./vendor/transformers-3.8.1/', import.meta.url).href;
    const options = { revision: REVISION, progress_callback: p => send(id, 'progress', {
      status: p.status, file: p.file, loaded: p.loaded, total: p.total,
      message: p.file ? `Baixando ${p.file}` : 'Preparando SlimSAM local',
    }) };
    [model, processor] = await Promise.all([
      SamModel.from_pretrained(MODEL, { ...options, dtype: 'q8', device: 'wasm' }),
      AutoProcessor.from_pretrained(MODEL, options),
    ]);
  })().catch(error => { initialization = undefined; throw error; });
  await initialization;
}
// Object mode favors extent only among credible candidates satisfying every click.
// It is a heuristic: SlimSAM may still need extra positive/negative prompts.
function chooseCandidate(data, scores, width, height, points, selectionMode = 'object') {
  const size = width * height;
  const candidates = Array.from(scores, (score, index) => {
    const start = index * size;
    let area = 0;
    for (let p = 0; p < size; p++) if (data[start + p]) area++;
    const respectsPoints = points.every(([x, y, label]) => +!!data[start + Math.floor(y) * width + Math.floor(x)] === label);
    return { index, score: Number.isFinite(score) ? score : -1, area, respectsPoints };
  });
  const valid = candidates.filter(c => c.respectsPoints);
  // Never silently return a mask contradicting explicit prompts.
  if (!valid.length) throw Error('Nenhuma máscara respeitou todos os pontos. Ajuste os pontos e tente novamente.');
  const highest = valid.reduce((a, b) => b.score > a.score ? b : a);
  const credible = valid.filter(c => c.score >= Math.max(0.5, highest.score - 0.15));
  const chosen = selectionMode === 'detail' || !credible.length ? highest : credible.reduce((a, b) => b.area > a.area || (b.area === a.area && b.score > a.score) ? b : a);
  return { chosen: chosen.index, candidates };
}
async function segment(id, request) {
  if (!model || !processor) throw Error('Inicialize o modelo antes de segmentar.');
  const { pixels, width, height, points, imageId, selectionMode = 'object' } = request;
  if (!['object', 'detail'].includes(selectionMode)) throw Error('Modo de seleção inválido.');
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 16777216 || !(pixels instanceof Uint8ClampedArray) || pixels.length !== width * height * 4) throw Error('Pixels ou dimensões inválidos.');
  if (!Array.isArray(points) || !points.length || points.length > 128 || points.some(p => !Array.isArray(p) || p.length !== 3 || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || p[0] < 0 || p[0] >= width || p[1] < 0 || p[1] >= height || ![0, 1].includes(p[2]))) throw Error('Pontos inválidos.');
  // Without an explicit identity always recompute; callers must change imageId when pixels change.
  const key = imageId == null ? undefined : `${imageId}:${width}:${height}`;
  if (!embeddings || key === undefined || key !== imageKey) {
    clearImage();
    send(id, 'progress', { message: 'Analisando a foto neste dispositivo' });
    image = await processor(new api.RawImage(pixels, width, height, 4));
    embeddings = await model.get_image_embeddings(image);
    image.pixel_values.dispose?.();
    delete image.pixel_values;
    imageKey = key;
  }
  const input_points = processor.reshape_input_points([points.map(p => p.slice(0, 2))], image.original_sizes, image.reshaped_input_sizes);
  const input_labels = new api.Tensor('int64', BigInt64Array.from(points, p => BigInt(p[2])), [1, 1, points.length]);
  let output;
  try {
    output = await model({ ...embeddings, input_points, input_labels });
    const scores = output.iou_scores.data;
    const masks = await processor.post_process_masks(output.pred_masks, image.original_sizes, image.reshaped_input_sizes);
    let mask, candidateSummary;
    try {
      candidateSummary = chooseCandidate(masks[0].data, scores, width, height, points, selectionMode);
      const best = candidateSummary.chosen;
      mask = Uint8Array.from(masks[0].data.subarray(best * width * height, (best + 1) * width * height), value => +!!value);
    } finally { for (const item of masks) item.dispose?.(); }
    self.postMessage({ id, type: 'result', mask, width, height, candidateSummary }, [mask.buffer]);
  } finally {
    input_points.dispose?.(); input_labels.dispose?.();
    for (const value of Object.values(output || {})) value.dispose?.();
  }
}
// Serialize inference/reset to avoid disposing embeddings during an in-flight decode.
let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    const { id, type } = data;
    try {
      if (type === 'init') { await init(id); send(id, 'ready'); }
      else if (type === 'segment') await segment(id, data);
      else if (type === 'reset') { clearImage(); send(id, 'reset'); }
      else throw Error('Operação desconhecida.');
    } catch (error) { send(id, 'error', { error: error?.message || String(error) }); }
  });
};
