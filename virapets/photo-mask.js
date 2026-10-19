/* Pure local binary-mask operations. Nonzero input values mean selected. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PetPhotoMask = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function check(mask, width, height) {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width * height > 16777216) throw new RangeError('Invalid mask dimensions');
    if (!(mask instanceof Uint8Array) || mask.length !== width * height) throw new TypeError('Mask must be a Uint8Array matching dimensions');
  }
  function invert(mask, width, height) {
    check(mask, width, height);
    return Uint8Array.from(mask, value => value ? 0 : 1);
  }
  function combine(base, candidate, width, height, op) {
    check(base, width, height); check(candidate, width, height);
    if (!['replace', 'add', 'subtract'].includes(op)) throw new RangeError('Invalid combination');
    return Uint8Array.from(base, (value, i) => +(op === 'replace' ? !!candidate[i] : op === 'add' ? !!(value || candidate[i]) : !!value && !candidate[i]));
  }
  // A clipped circular neighborhood never samples beyond the photo edges.
  // Smooth is a majority filter; ties preserve the original pixel.
  function refine(mask, width, height, options) {
    check(mask, width, height);
    const { operation, radius } = options || {};
    if (!['grow', 'shrink', 'smooth'].includes(operation) || !Number.isInteger(radius) || radius < 1 || radius > 4) throw new RangeError('Invalid refinement');
    const result = new Uint8Array(mask.length), offsets = [];
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) if (dx * dx + dy * dy <= radius * radius) offsets.push([dx, dy]);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      let selected = 0, count = 0;
      for (const [dx, dy] of offsets) {
        const px = x + dx, py = y + dy;
        if (px < 0 || px >= width || py < 0 || py >= height) continue;
        count++; if (mask[py * width + px]) selected++;
      }
      result[y * width + x] = +(operation === 'grow' ? selected > 0 : operation === 'shrink' ? selected === count : selected * 2 === count ? !!mask[y * width + x] : selected * 2 > count);
    }
    return result;
  }
  return { invert, combine, refine };
});
