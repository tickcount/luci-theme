"use strict";
"require baseclass";

/*
 * App icon generator: one source picture in, every icon the theme serves
 * out -- favicon (the SVG itself, or a 64 px PNG), favicon.ico (32 + 48 px
 * PNG frames), the 180 px Apple touch icon and the 192/512 px web-app icons.
 *
 * The router has no image tools, so the browser renders the sizes on a
 * canvas. A picture with transparent corners gets a white tile and a margin
 * where the platform would otherwise fill or crop it: iOS paints transparent
 * home-screen icons black, and Android masks "maskable" icons to the inner
 * 80 %. A full-bleed picture (opaque corners) is used as it is.
 */

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(_("The image could not be read")));
    img.src = url;
  });
}

/* An SVG without width/height reports 0×0 (or 150×150); give it a size. */
function naturalSize(img) {
  const w = img.naturalWidth || img.width || 512;
  const h = img.naturalHeight || img.height || 512;
  return [w, h];
}

function draw(img, size, opts) {
  opts = opts || {};
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  if (opts.bg) {
    ctx.fillStyle = opts.bg;
    ctx.fillRect(0, 0, size, size);
  }
  const pad = Math.round(size * (opts.pad || 0));
  const box = size - pad * 2;
  const [w, h] = naturalSize(img);
  const scale = Math.min(box / w, box / h);
  const dw = w * scale,
    dh = h * scale;
  ctx.drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
  return c;
}

/* Opaque corners = a full-bleed icon that already fills its square. */
function fullBleed(img) {
  const c = draw(img, 64);
  const d = c.getContext("2d").getImageData(0, 0, 64, 64).data;
  const alpha = (x, y) => d[(y * 64 + x) * 4 + 3];
  return [
    [1, 1],
    [62, 1],
    [1, 62],
    [62, 62],
  ].every((p) => alpha(p[0], p[1]) > 250);
}

function png(canvas) {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new Error(_("The image could not be rendered"))),
      "image/png",
    ),
  );
}

/* ICO container around PNG frames: ICONDIR, one ICONDIRENTRY per frame,
   then the PNG bytes. Every browser that still asks for favicon.ico reads
   PNG-in-ICO. */
function ico(frames) {
  return Promise.all(frames.map((f) => f.blob.arrayBuffer())).then((bufs) => {
    const head = 6 + 16 * frames.length;
    const total = bufs.reduce((n, b) => n + b.byteLength, head);
    const out = new Uint8Array(total);
    const v = new DataView(out.buffer);
    v.setUint16(0, 0, true);
    v.setUint16(2, 1, true);
    v.setUint16(4, frames.length, true);
    let offset = head;
    frames.forEach((f, i) => {
      const e = 6 + i * 16;
      v.setUint8(e, f.size >= 256 ? 0 : f.size);
      v.setUint8(e + 1, f.size >= 256 ? 0 : f.size);
      v.setUint8(e + 2, 0);
      v.setUint8(e + 3, 0);
      v.setUint16(e + 4, 1, true);
      v.setUint16(e + 6, 32, true);
      v.setUint32(e + 8, bufs[i].byteLength, true);
      v.setUint32(e + 12, offset, true);
      out.set(new Uint8Array(bufs[i]), offset);
      offset += bufs[i].byteLength;
    });
    return new Blob([out], { type: "image/x-icon" });
  });
}

/* Resolves to { slot: File } for favicon, favicon_ico, apple_touch,
   pwa_192 and pwa_512. */
function generate(url) {
  const isSvg = /\.svg(\?|$)/i.test(url);
  return loadImage(url).then((img) => {
    const bleed = fullBleed(img);
    const tile = bleed ? {} : { bg: "#ffffff" };
    const file = (blob, name) => new File([blob], name, { type: blob.type });

    const favicon = isSvg
      ? fetch(url, { credentials: "same-origin" })
          .then((r) => r.blob())
          .then((b) => file(b, "favicon.svg"))
      : png(draw(img, 64)).then((b) => file(b, "favicon.png"));

    return Promise.all([
      favicon,
      Promise.all([png(draw(img, 32)), png(draw(img, 48))])
        .then((b) =>
          ico([
            { size: 32, blob: b[0] },
            { size: 48, blob: b[1] },
          ]),
        )
        .then((b) => file(b, "favicon.ico")),
      png(draw(img, 180, Object.assign({ pad: bleed ? 0 : 0.12 }, tile))).then(
        (b) => file(b, "apple-touch-icon.png"),
      ),
      png(draw(img, 192, Object.assign({ pad: bleed ? 0 : 0.1 }, tile))).then(
        (b) => file(b, "app-192.png"),
      ),
      png(draw(img, 512, Object.assign({ pad: bleed ? 0 : 0.1 }, tile))).then(
        (b) => file(b, "app-512.png"),
      ),
    ]).then((f) => ({
      favicon: f[0],
      favicon_ico: f[1],
      apple_touch: f[2],
      pwa_192: f[3],
      pwa_512: f[4],
    }));
  });
}

return baseclass.extend({
  generate: generate,
  fullBleed: fullBleed,
});
