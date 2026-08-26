// Simula como se vera el icono adaptativo en un telefono Android.
//
// Android no solo recorta: el lienzo son 108dp y la ventana visible son 72dp
// centrados, asi que ademas AMPLIA. Un logo que llena el lienzo pierde el 33%
// exterior. Esta simulacion hace lo mismo — recorte central y mascara — para
// poder comparar el antes y el despues sin esperar al build.
const path = require('path');
const { leerPng, escribirPng } = require('./png.js');

const ASSETS = path.join(__dirname, '..', 'assets');

const FONDO = [0x09, 0x09, 0x0B];
const VISIBLE = 72 / 108; // la ventana que Android deja ver
const TILE = 300;
const SEP = 24;

function componerYRecortar(img) {
  // Lienzo de trabajo: el foreground sobre el color de fondo del icono.
  const L = img.w;
  const plano = Buffer.alloc(L * L * 3);
  for (let i = 0; i < L * L; i++) {
    const a = img.color === 6 ? img.rgba[i*4+3] / 255 : 1;
    for (let c = 0; c < 3; c++) {
      plano[i*3+c] = Math.round(img.rgba[i*4+c] * a + FONDO[c] * (1 - a));
    }
  }
  // Recorte central del 66.7% y escalado al tamano del tile.
  const lado = Math.round(L * VISIBLE);
  const off = Math.round((L - lado) / 2);
  const tile = Buffer.alloc(TILE * TILE * 3);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const sx0 = off + (x * lado) / TILE, sx1 = off + ((x + 1) * lado) / TILE;
      const sy0 = off + (y * lado) / TILE, sy1 = off + ((y + 1) * lado) / TILE;
      let s = [0, 0, 0], n = 0;
      for (let py = Math.floor(sy0); py < Math.ceil(sy1); py++)
        for (let px = Math.floor(sx0); px < Math.ceil(sx1); px++) {
          if (px < 0 || py < 0 || px >= L || py >= L) continue;
          const i = py * L + px;
          s[0] += plano[i*3]; s[1] += plano[i*3+1]; s[2] += plano[i*3+2]; n++;
        }
      const d = (y * TILE + x) * 3;
      for (let c = 0; c < 3; c++) tile[d+c] = n ? Math.round(s[c] / n) : FONDO[c];
    }
  }
  return tile;
}

// Cobertura de cada mascara en un punto (con antialiasing por supermuestreo).
function mascara(forma, x, y) {
  const r = TILE / 2, cx = TILE / 2 - 0.5, cy = TILE / 2 - 0.5;
  let dentro = 0;
  for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
    const px = x + (sx + 0.5) / 3 - 0.5, py = y + (sy + 0.5) / 3 - 0.5;
    const dx = Math.abs(px - cx), dy = Math.abs(py - cy);
    let ok;
    if (forma === 'circulo') ok = Math.hypot(dx, dy) <= r - 1;
    else if (forma === 'squircle') ok = Math.pow(dx / (r - 1), 4) + Math.pow(dy / (r - 1), 4) <= 1;
    else { // cuadrado redondeado
      const k = r * 0.42;
      ok = (dx <= r - 1 && dy <= r - 1) &&
        !(dx > r - 1 - k && dy > r - 1 - k && Math.hypot(dx - (r - 1 - k), dy - (r - 1 - k)) > k);
    }
    if (ok) dentro++;
  }
  return dentro / 9;
}

const ENTRADAS = [
  { etiqueta: 'antes', ruta: path.join(ASSETS, 'logo-candela.png') },
  { etiqueta: 'despues', ruta: path.join(ASSETS, 'adaptive-icon-candela.png') },
];
const FORMAS = ['circulo', 'squircle', 'redondeado'];

const W = SEP + FORMAS.length * (TILE + SEP);
const H = SEP + ENTRADAS.length * (TILE + SEP);
const salida = Buffer.alloc(W * H * 4);
// Lienzo gris medio, para que se note lo que es transparente o negro.
for (let i = 0; i < W * H; i++) {
  salida[i*4] = 0x2A; salida[i*4+1] = 0x2A; salida[i*4+2] = 0x2E; salida[i*4+3] = 255;
}

ENTRADAS.forEach((entrada, fila) => {
  const tile = componerYRecortar(leerPng(entrada.ruta));
  FORMAS.forEach((forma, col) => {
    const ox = SEP + col * (TILE + SEP), oy = SEP + fila * (TILE + SEP);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const cob = mascara(forma, x, y);
      if (cob <= 0) continue;
      const s = (y * TILE + x) * 3, d = ((oy + y) * W + ox + x) * 4;
      for (let c = 0; c < 3; c++) {
        salida[d+c] = Math.round(tile[s+c] * cob + salida[d+c] * (1 - cob));
      }
    }
  });
  console.log(entrada.etiqueta, '-> fila', fila + 1);
});

const destino = process.argv[2] || path.join(__dirname, 'icono-comparacion.png');
escribirPng(destino, W, H, salida);
console.log('Escrito:', destino, `(${W}x${H})`);
console.log('Fila 1 = logo actual · Fila 2 = icono nuevo · Columnas: circulo, squircle, redondeado');
