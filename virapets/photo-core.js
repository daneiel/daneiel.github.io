/* Local-only photo processing: no network, storage, or generated facial features. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PetPhotoCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function dimensions(width, height) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 16777216) throw new RangeError('Invalid image dimensions (maximum 16 megapixels)');
  }
  function checkMask(mask, width, height) {
    dimensions(width, height);
    if (!(mask instanceof Uint8Array) || mask.length !== width * height) throw new TypeError('Mask must be a Uint8Array matching the image');
  }
  // Mutates only the supplied mask. Coordinates and radius are in source pixels.
  function paintMask(mask, width, height, x, y, radius, value) {
    checkMask(mask, width, height);
    if (![x, y, radius].every(Number.isFinite) || radius < 0 || radius > Math.max(width, height) * 2 || (value !== 0 && value !== 1 && value !== 255)) throw new RangeError('Invalid brush');
    for (var py = Math.max(0, Math.ceil(y - radius)); py <= Math.min(height - 1, Math.floor(y + radius)); py++) {
      for (var px = Math.max(0, Math.ceil(x - radius)); px <= Math.min(width - 1, Math.floor(x + radius)); px++) {
        if ((px - x) ** 2 + (py - y) ** 2 <= radius ** 2) mask[py * width + px] = value;
      }
    }
    return mask;
  }
  function quantize(points, count) {
    var boxes = [points];
    function span(box) { return [0, 1, 2].map(function (c) { return Math.max.apply(null, box.map(function (p) { return p[c]; })) - Math.min.apply(null, box.map(function (p) { return p[c]; })); }); }
    while (boxes.length < count) {
      var chosen = -1, score = -1;
      boxes.forEach(function (box, i) { var s = Math.max.apply(null, span(box)) * box.reduce(function (n, p) { return n + p[3]; }, 0); if (box.length > 1 && s > score) { score = s; chosen = i; } });
      if (chosen < 0) break;
      var box = boxes[chosen], ranges = span(box), channel = ranges.indexOf(Math.max.apply(null, ranges));
      box.sort(function (a, b) { return a[channel] - b[channel] || a[0] - b[0] || a[1] - b[1] || a[2] - b[2]; });
      var total = box.reduce(function (n, p) { return n + p[3]; }, 0), sum = 0, cut = 1;
      for (; cut < box.length; cut++) { sum += box[cut - 1][3]; if (sum >= total / 2) break; }
      // A dominant final point can put the weighted median beyond the last gap.
      // Always split at a gap so neither child is empty.
      cut = Math.min(cut, box.length - 1);
      boxes.splice(chosen, 1, box.slice(0, cut), box.slice(cut));
    }
    return boxes.map(function (box) { var total = box.reduce(function (n, p) { return n + p[3]; }, 0); return [0, 1, 2].map(function (c) { return Math.round(box.reduce(function (n, p) { return n + p[c] * p[3]; }, 0) / total); }); });
  }
  function pixelize(image, mask, options) {
    if (!image) throw new TypeError('Image required');
    var width = image.width, height = image.height, data = image.data;
    checkMask(mask, width, height);
    if (!(data instanceof Uint8ClampedArray) || data.length !== width * height * 4) throw new TypeError('Image must contain RGBA Uint8ClampedArray data');
    options = options || {};
    var grid = options.grid === undefined ? 32 : options.grid, colors = options.colors === undefined ? 16 : options.colors, outline = options.outline === undefined ? false : options.outline;
    if (!Number.isInteger(grid) || grid < 16 || grid > 96 || !Number.isInteger(colors) || colors < 2 || colors > 32 || typeof outline !== 'boolean') throw new RangeError('Invalid pixel options');
    var left = width, top = height, right = -1, bottom = -1, histogram = new Map();
    for (var i = 0; i < mask.length; i++) if (mask[i] && data[i * 4 + 3]) { var x = i % width, y = Math.floor(i / width); left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); var key = (data[i * 4] >> 3) * 1024 + (data[i * 4 + 1] >> 3) * 32 + (data[i * 4 + 2] >> 3); var p = histogram.get(key) || [0, 0, 0, 0]; for (var c = 0; c < 3; c++) p[c] += data[i * 4 + c]; p[3]++; histogram.set(key, p); }
    if (right < left) throw new RangeError('Mask contains no visible pixels');
    var palette = quantize(Array.from(histogram.values()).map(function (p) { return [p[0] / p[3], p[1] / p[3], p[2] / p[3], p[3]]; }), colors - (outline ? 1 : 0));
    var bw = right - left + 1, bh = bottom - top + 1, usable = grid - (outline ? 2 : 0), scale = usable / Math.max(bw, bh), gw = Math.max(1, Math.round(bw * scale)), gh = Math.max(1, Math.round(bh * scale));
    var cells = Array.from({length: gw * gh}, function () { return [0, 0, 0, 0]; });
    for (var ty = 0; ty < gh; ty++) for (var tx = 0; tx < gw; tx++) {
      var cell = cells[ty * gw + tx];
      var startX = left + Math.floor(tx * bw / gw), endX = left + Math.max(Math.floor(tx * bw / gw) + 1, Math.floor((tx + 1) * bw / gw));
      var startY = top + Math.floor(ty * bh / gh), endY = top + Math.max(Math.floor(ty * bh / gh) + 1, Math.floor((ty + 1) * bh / gh));
      for (var sy = startY; sy < endY; sy++) for (var sx = startX; sx < endX; sx++) { var index = sy * width + sx; if (!mask[index] || !data[index * 4 + 3]) continue; for (var ch = 0; ch < 3; ch++) cell[ch] += data[index * 4 + ch]; cell[3]++; }
    }
    var painted = new Int16Array(grid * grid); painted.fill(-1);
    var ox = Math.floor((grid - gw) / 2), oy = Math.floor((grid - gh) / 2);
    cells.forEach(function (cell, index) { if (!cell[3]) return; var best = 0, distance = Infinity; palette.forEach(function (p, n) { var d = p.reduce(function (s, v, c) { return s + (v - cell[c] / cell[3]) ** 2; }, 0); if (d < distance) { distance = d; best = n; } }); painted[(oy + Math.floor(index / gw)) * grid + ox + index % gw] = best; });
    if (outline) { var original = painted.slice(), border = palette.length; palette.push([24, 24, 32]); for (var cy = 0; cy < grid; cy++) for (var cx = 0; cx < grid; cx++) if (original[cy * grid + cx] < 0 && [[-1,0],[1,0],[0,-1],[0,1]].some(function (d) { var nx = cx + d[0], ny = cy + d[1]; return nx >= 0 && nx < grid && ny >= 0 && ny < grid && original[ny * grid + nx] >= 0; })) painted[cy * grid + cx] = border; }
    var output = new Uint8ClampedArray(256 * 256 * 4);
    for (var gy = 0; gy < grid; gy++) for (var gx = 0; gx < grid; gx++) { var color = painted[gy * grid + gx]; if (color < 0) continue; for (var dy = 16 + Math.floor(gy * 224 / grid); dy < 16 + Math.floor((gy + 1) * 224 / grid); dy++) for (var dx = 16 + Math.floor(gx * 224 / grid); dx < 16 + Math.floor((gx + 1) * 224 / grid); dx++) { var offset = (dy * 256 + dx) * 4; output.set(palette[color], offset); output[offset + 3] = 255; } }
    return {data: output, width: 256, height: 256, palette: Array.from(new Set(palette.map(function (p) { return '#' + p.map(function (v) { return v.toString(16).padStart(2, '0'); }).join(''); })))};
  }
  // Eight looping affine cutout poses per mood; expressions are never redrawn.
  function drawFrame(ctx, sourceCanvas, mood, frame) {
    var moods = ['happy', 'barking', 'waiting', 'sleeping'];
    if (!ctx || typeof ctx.drawImage !== 'function' || !sourceCanvas || !Number.isFinite(sourceCanvas.width) || !Number.isFinite(sourceCanvas.height) || sourceCanvas.width <= 0 || sourceCanvas.height <= 0 || !moods.includes(mood) || !Number.isInteger(frame) || frame < 0 || frame > 7) throw new RangeError('Invalid animation frame');
    var phase = frame * Math.PI / 4, sin = Math.sin(phase), cos = Math.cos(phase), fit = 232 / Math.max(sourceCanvas.width, sourceCanvas.height);
    var amplitude = {happy: 2, barking: 3, waiting: 1, sleeping: 0.6}[mood];
    ctx.save();
    try { ctx.clearRect(0, 0, 256, 256); ctx.imageSmoothingEnabled = false; ctx.translate(128 + sin * amplitude, 128 + cos * amplitude); ctx.rotate(sin * amplitude * 0.008); ctx.scale(fit * (1 + cos * amplitude * 0.004), fit * (1 - cos * amplitude * 0.004)); ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2); } finally { ctx.restore(); }
  }
  return {pixelize: pixelize, paintMask: paintMask, drawFrame: drawFrame};
});
