/**
 * Adelgaza los PNG del proyecto sin dependencias.
 *
 * Dos cosas, en este orden:
 *
 * 1. REDIMENSIONAR. `hero-home.png` viene a 1404 px de ancho y se dibuja en
 *    una franja de 172 dp. Aun contando pantallas a 3x, sobran más de 800 px
 *    de imagen que nadie llega a ver nunca — pero que sí viajan dentro del
 *    APK y sí ocupan memoria al decodificarse.
 *
 * 2. RECOMPRIMIR. El PNG se reescribe eligiendo el filtro por línea (ver
 *    `png.js`). Muchos exportadores escriben sin filtrar, y eso deja al
 *    deflate sin patrones que repetir.
 *
 * Se ejecuta a mano y deja el resultado en su sitio:
 *
 *   node scripts/optimizar-imagenes.js
 */
const fs = require('fs');
const path = require('path');
const { leerPng, escribirPng } = require('./png.js');

const ASSETS = path.join(__dirname, '..', 'assets');

/** `null` = no redimensionar, solo recomprimir. */
const OBJETIVOS = [
  { archivo: 'hero-home.png', anchoMaximo: 800 },
  { archivo: 'logo-candela.png', anchoMaximo: 1024 },
  { archivo: 'adaptive-icon-candela.png', anchoMaximo: null },
  { archivo: 'hielo-onboarding.png', anchoMaximo: null },
];

/** Reduce con promediado de área, sobre alfa premultiplicado. */
function redimensionar(img, nuevoAncho) {
  const escala = nuevoAncho / img.w;
  const nh = Math.max(1, Math.round(img.h * escala));
  const salida = Buffer.alloc(nuevoAncho * nh * 4);

  for (let y = 0; y < nh; y++) {
    const sy0 = (y * img.h) / nh;
    const sy1 = ((y + 1) * img.h) / nh;

    for (let x = 0; x < nuevoAncho; x++) {
      const sx0 = (x * img.w) / nuevoAncho;
      const sx1 = ((x + 1) * img.w) / nuevoAncho;
      let sr = 0, sg = 0, sb = 0, sa = 0, n = 0;

      for (let py = Math.floor(sy0); py < Math.ceil(sy1); py++) {
        for (let px = Math.floor(sx0); px < Math.ceil(sx1); px++) {
          if (px < 0 || py < 0 || px >= img.w || py >= img.h) continue;
          const i = (py * img.w + px) * 4;
          const a = img.rgba[i + 3] / 255;
          // Premultiplicar antes de promediar: si no, los bordes cogen el
          // color de píxeles invisibles y aparece un halo.
          sr += img.rgba[i] * a;
          sg += img.rgba[i + 1] * a;
          sb += img.rgba[i + 2] * a;
          sa += a;
          n++;
        }
      }

      if (!n) continue;
      const a = sa / n;
      const d = (y * nuevoAncho + x) * 4;
      if (a > 0.002) {
        salida[d] = Math.min(255, Math.round(sr / n / a));
        salida[d + 1] = Math.min(255, Math.round(sg / n / a));
        salida[d + 2] = Math.min(255, Math.round(sb / n / a));
        salida[d + 3] = Math.round(a * 255);
      }
    }
  }

  return { w: nuevoAncho, h: nh, rgba: salida };
}

let antes = 0;
let despues = 0;

for (const { archivo, anchoMaximo } of OBJETIVOS) {
  const ruta = path.join(ASSETS, archivo);
  if (!fs.existsSync(ruta)) {
    console.log(`  (no está) ${archivo}`);
    continue;
  }

  const pesoAntes = fs.statSync(ruta).size;
  let img = leerPng(ruta);
  const medidasAntes = `${img.w}x${img.h}`;

  if (anchoMaximo && img.w > anchoMaximo) img = redimensionar(img, anchoMaximo);

  escribirPng(ruta, img.w, img.h, img.rgba);
  const pesoDespues = fs.statSync(ruta).size;

  antes += pesoAntes;
  despues += pesoDespues;

  const ahorro = Math.round((1 - pesoDespues / pesoAntes) * 100);
  console.log(
    `${archivo.padEnd(28)} ${medidasAntes.padEnd(11)} → ${`${img.w}x${img.h}`.padEnd(11)} ` +
      `${String(Math.round(pesoAntes / 1024)).padStart(5)} KB → ${String(Math.round(pesoDespues / 1024)).padStart(5)} KB  (${ahorro > 0 ? '-' : '+'}${Math.abs(ahorro)}%)`,
  );
}

console.log(
  `\nTotal: ${Math.round(antes / 1024)} KB → ${Math.round(despues / 1024)} KB ` +
    `(${Math.round((antes - despues) / 1024)} KB menos)`,
);
