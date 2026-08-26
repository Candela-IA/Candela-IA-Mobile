// Genera el foregroundImage del icono adaptativo de Android a partir del logo.
//
// El logo viene como RGB opaco sobre negro. Eso, para Android, es un cuadrado
// que su mascara recorta: la llama pierde las puntas. Lo que hace falta es la
// llama sola sobre transparente y metida en la zona segura.
//
// Como el logo esta compuesto sobre negro, sus valores RGB YA son alfa
// premultiplicado: un pixel a media cobertura de un rosa (255,60,90) aparece
// como (128,30,45). Asi que el alfa se recupera con max(r,g,b) y el color
// dividiendo por el. Eso conserva el antialiasing del borde en vez de
// recortarlo a lo bruto con un umbral.
const path = require('path');
const { leerPng, escribirPng } = require('./png.js');

const ASSETS = path.join(__dirname, '..', 'assets');

const ORIGEN = path.join(ASSETS, 'logo-candela.png');
const DESTINO = process.argv[2] || path.join(ASSETS, 'adaptive-icon-candela.png');
const LIENZO = 1024;
// Android garantiza el circulo central de 66/108 del lienzo. 66% en el lado
// mayor es el estandar de facto: entra en las mascaras cuadradas y deja las
// puntas de la llama a salvo en la circular.
const OCUPACION = 0.66;

const img = leerPng(ORIGEN);

// 1. RGB sobre negro -> RGBA con el fondo (y el corazon calado) transparentes.
const alfa = new Float64Array(img.w * img.h);
for (let i = 0; i < img.w * img.h; i++) {
  const r = img.rgba[i*4], g = img.rgba[i*4+1], b = img.rgba[i*4+2];
  const a = Math.max(r, g, b) / 255;
  // Remapear para que el velo del fondo caiga a cero del todo. Sin esto queda
  // un cuadrado translucido sobre el color de fondo del icono.
  const piso = 30 / 255;
  alfa[i] = a <= piso ? 0 : (a - piso) / (1 - piso);
}

// 2. Recuadro del contenido visible.
let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
// El histograma del logo separa limpiamente: 74% del lienzo en 0-9, un velo
// tenue hasta 29, y la llama de 200 para arriba. Cortar en 30 quita el velo
// sin tocar la llama — los umbrales 30, 40, 50 y 60 dan el mismo 24.8%.
const UMBRAL = 30 / 255;
for (let y = 0; y < img.h; y++) {
  for (let x = 0; x < img.w; x++) {
    if (alfa[y * img.w + x] > UMBRAL) {
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
}
const anchoC = x1 - x0 + 1, altoC = y1 - y0 + 1;
console.log(`Contenido: ${anchoC}x${altoC} en (${x0},${y0}) — ocupa el ${(100*Math.max(anchoC,altoC)/img.w).toFixed(1)}% del lienzo original`);

// 3. Escalar el recorte con promediado de area, sobre valores premultiplicados
//    (que es lo que ya son) para que los bordes no cojan color del vacio.
const destino = Math.round(LIENZO * OCUPACION);
const escala = destino / Math.max(anchoC, altoC);
const nw = Math.max(1, Math.round(anchoC * escala));
const nh = Math.max(1, Math.round(altoC * escala));
console.log(`Escalado a ${nw}x${nh} dentro de un lienzo de ${LIENZO}x${LIENZO}`);

const salida = Buffer.alloc(LIENZO * LIENZO * 4); // transparente por defecto
const offX = Math.round((LIENZO - nw) / 2);
const offY = Math.round((LIENZO - nh) / 2);

for (let y = 0; y < nh; y++) {
  const sy0 = y0 + (y * altoC) / nh, sy1 = y0 + ((y + 1) * altoC) / nh;
  for (let x = 0; x < nw; x++) {
    const sx0 = x0 + (x * anchoC) / nw, sx1 = x0 + ((x + 1) * anchoC) / nw;
    let sr = 0, sg = 0, sb = 0, sa = 0, n = 0;
    for (let py = Math.floor(sy0); py < Math.ceil(sy1); py++) {
      for (let px = Math.floor(sx0); px < Math.ceil(sx1); px++) {
        if (px < 0 || py < 0 || px >= img.w || py >= img.h) continue;
        const i = py * img.w + px;
        sr += img.rgba[i*4]; sg += img.rgba[i*4+1]; sb += img.rgba[i*4+2];
        sa += alfa[i]; n++;
      }
    }
    if (!n) continue;
    const a = sa / n;
    const d = ((y + offY) * LIENZO + (x + offX)) * 4;
    if (a > 0.002) {
      // Desmultiplicar: color real = premultiplicado / alfa
      salida[d]   = Math.min(255, Math.round((sr / n) / a));
      salida[d+1] = Math.min(255, Math.round((sg / n) / a));
      salida[d+2] = Math.min(255, Math.round((sb / n) / a));
      salida[d+3] = Math.round(a * 255);
    }
  }
}

escribirPng(DESTINO, LIENZO, LIENZO, salida);
console.log('Escrito:', DESTINO);
