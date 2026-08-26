// Decodificador PNG minimo (sin dependencias) para analizar y generar iconos.
const fs = require('fs');
const zlib = require('zlib');

function crc32(buf) {
  let c, crc = 0xFFFFFFFF;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xFF;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function leerPng(ruta) {
  const b = fs.readFileSync(ruta);
  let p = 8, ihdr = null, idat = [], plte = null, trns = null;
  while (p < b.length) {
    const len = b.readUInt32BE(p);
    const tipo = b.slice(p + 4, p + 8).toString('latin1');
    const datos = b.slice(p + 8, p + 8 + len);
    if (tipo === 'IHDR') ihdr = {
      w: datos.readUInt32BE(0), h: datos.readUInt32BE(4),
      prof: datos[8], color: datos[9], interlace: datos[12],
    };
    else if (tipo === 'IDAT') idat.push(datos);
    else if (tipo === 'PLTE') plte = datos;
    else if (tipo === 'tRNS') trns = datos;
    else if (tipo === 'IEND') break;
    p += 12 + len;
  }
  if (ihdr.interlace) throw new Error('PNG entrelazado (Adam7): no soportado');
  if (ihdr.prof !== 8) throw new Error('Profundidad ' + ihdr.prof + ' bits: no soportada');

  const canales = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ihdr.color];
  const bpp = canales;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const anchoLinea = ihdr.w * bpp;
  const out = Buffer.alloc(ihdr.h * anchoLinea);

  let pos = 0;
  for (let y = 0; y < ihdr.h; y++) {
    const filtro = raw[pos++];
    const linea = raw.slice(pos, pos + anchoLinea); pos += anchoLinea;
    const dest = out.slice(y * anchoLinea, (y + 1) * anchoLinea);
    const prev = y > 0 ? out.slice((y - 1) * anchoLinea, y * anchoLinea) : null;
    for (let i = 0; i < anchoLinea; i++) {
      const a = i >= bpp ? dest[i - bpp] : 0;
      const bb = prev ? prev[i] : 0;
      const c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = linea[i];
      if (filtro === 1) v += a;
      else if (filtro === 2) v += bb;
      else if (filtro === 3) v += (a + bb) >> 1;
      else if (filtro === 4) {
        const pp = a + bb - c, pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? bb : c);
      }
      dest[i] = v & 0xFF;
    }
  }

  // Normalizar a RGBA
  const rgba = Buffer.alloc(ihdr.w * ihdr.h * 4);
  for (let i = 0, n = ihdr.w * ihdr.h; i < n; i++) {
    let r, g, bl, al = 255;
    if (ihdr.color === 6) { r = out[i*4]; g = out[i*4+1]; bl = out[i*4+2]; al = out[i*4+3]; }
    else if (ihdr.color === 2) { r = out[i*3]; g = out[i*3+1]; bl = out[i*3+2]; }
    else if (ihdr.color === 0) { r = g = bl = out[i]; }
    else if (ihdr.color === 4) { r = g = bl = out[i*2]; al = out[i*2+1]; }
    else if (ihdr.color === 3) { const k = out[i]; r = plte[k*3]; g = plte[k*3+1]; bl = plte[k*3+2]; al = trns && k < trns.length ? trns[k] : 255; }
    rgba[i*4] = r; rgba[i*4+1] = g; rgba[i*4+2] = bl; rgba[i*4+3] = al;
  }
  return { w: ihdr.w, h: ihdr.h, color: ihdr.color, rgba };
}

function escribirPng(ruta, w, h, rgba) {
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0; // filtro None
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const chunk = (tipo, datos) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(datos.length);
    const cuerpo = Buffer.concat([Buffer.from(tipo, 'latin1'), datos]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(cuerpo));
    return Buffer.concat([len, cuerpo, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  fs.writeFileSync(ruta, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

module.exports = { leerPng, escribirPng };
