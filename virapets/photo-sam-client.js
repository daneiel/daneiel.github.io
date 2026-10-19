(function () {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  const revision = '5850ab45f587c112167512ffef949107115e26a0';
  // Raw response sizes, before optional HTTP compression. Generated from official artifacts.
  const manifest = Object.freeze({"runtime":"@huggingface/transformers","runtimeVersion":"3.8.1","model":"Xenova/slimsam-77-uniform","revision":"5850ab45f587c112167512ffef949107115e26a0","dtype":"q8","device":"wasm","runtimeFiles":[{"path":"vendor/transformers-3.8.1/ort-wasm-simd-threaded.jsep.mjs","bytes":44484,"sha256":"08fb86ec433c78bfb032c5d84a68b8e8e5a8d81268fa39e24314179a5767a5b9"},{"path":"vendor/transformers-3.8.1/ort-wasm-simd-threaded.jsep.wasm","bytes":21596019,"sha256":"c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39"},{"path":"vendor/transformers-3.8.1/transformers.min.js","bytes":888173,"sha256":"aa5002b70e789798da263f5f99c62bd3e8fcd0c119258a493c40c180648365fa"}],"modelFiles":[{"path":"config.json","bytes":379},{"path":"preprocessor_config.json","bytes":466},{"path":"onnx/vision_encoder_quantized.onnx","bytes":8882165},{"path":"onnx/prompt_encoder_mask_decoder_quantized.onnx","bytes":4903810}],"runtimeBytes":22528676,"modelBytes":13786820,"totalColdBytes":36315496});
  function create(onProgress = () => {}) {
    let worker, nextId = 0, disposed = false, initializing;
    const pending = new Map();
    function fail(error) {
      worker?.terminate(); worker = undefined; initializing = undefined;
      for (const { reject } of pending.values()) reject(error);
      pending.clear();
    }
    function request(type, data = {}) {
      if (disposed) return Promise.reject(new Error('Sessão SlimSAM encerrada.'));
      if (!worker) {
        worker = new Worker(new URL('photo-sam-worker.js', base), { type: 'module' });
        worker.onmessage = ({ data: message }) => {
          if (message.type === 'progress') { try { onProgress(message); } catch {} return; }
          const job = pending.get(message.id);
          if (!job) return;
          pending.delete(message.id);
          if (message.type === 'error') job.reject(new Error(message.error)); else job.resolve(message);
        };
        worker.onerror = event => { event.preventDefault(); fail(new Error(event.message || 'Falha no Worker SlimSAM.')); };
        worker.onmessageerror = () => fail(new Error('Falha ao comunicar com SlimSAM.'));
      }
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        try { worker.postMessage({ ...data, id, type }); } catch (error) { pending.delete(id); reject(error); }
      });
    }
    return {
      init() { return initializing ||= request('init').catch(error => { fail(error); throw error; }); },
      segment(data) { return request('segment', data); },
      resetImage() { return worker ? request('reset') : Promise.resolve(); },
      dispose() { disposed = true; fail(new DOMException('Operação cancelada.', 'AbortError')); },
    };
  }
  window.PetPhotoSam = Object.freeze({ manifest, create, async clearCache() {
    if (typeof caches !== 'undefined') await caches.delete(`virapets-slimsam-${revision}`);
  } });
})();
