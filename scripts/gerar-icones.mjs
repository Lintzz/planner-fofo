/**
 * Gera os ícones do Planner Fofo.
 *
 *     node scripts/gerar-icones.mjs
 *
 * Desenha uma flor de cerejeira sobre o gradiente rosa→lilás que já é a marca
 * do app (o mesmo `GRADIENTES.primario` do logo e do botão principal), e grava
 * os PNGs que o Expo e o electron-builder consomem.
 *
 * O desenho é procedural de propósito: os ícones ficam versionados como código,
 * dá para reajustar cor ou proporção sem abrir editor de imagem, e não entra
 * dependência nova — o PNG é montado na mão com o `zlib` do próprio Node.
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// --- Paleta (mesma de packages/shared/src/theme.ts) -------------------------

const ROSA = [0xff, 0x9f, 0xd0];
const LILAS = [0xc9, 0x8a, 0xf0];
const PETALA = [0xff, 0xfa, 0xfd];
const PETALA_SOMBRA = [0xfb, 0xe6, 0xf3];
const MIOLO = [0xff, 0xdd, 0x77];
const MIOLO_BORDA = [0xf7, 0xc0, 0x4a];

// --- PNG --------------------------------------------------------------------

const TABELA_CRC = Uint32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = TABELA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pedaco(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

/** RGBA cru -> PNG de 8 bits com canal alfa. */
function paraPng(largura, altura, rgba) {
  // Cada linha do PNG começa com um byte de filtro; 0 = sem filtro.
  const bruto = Buffer.alloc((largura * 4 + 1) * altura);
  for (let y = 0; y < altura; y += 1) {
    const destino = y * (largura * 4 + 1);
    bruto[destino] = 0;
    rgba.copy(bruto, destino + 1, y * largura * 4, (y + 1) * largura * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largura, 0);
  ihdr.writeUInt32BE(altura, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // truecolor com alfa
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filtro adaptativo
  ihdr[12] = 0; // sem entrelaçamento

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pedaco('IHDR', ihdr),
    pedaco('IDAT', deflateSync(bruto, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ]);
}

// --- Geometria --------------------------------------------------------------

const misturar = (a, b, t) => a.map((canal, i) => canal + (b[i] - canal) * t);

/** Distância com sinal a um quadrado de cantos arredondados. */
function distQuadradoRedondo(x, y, meio, raio) {
  const dx = Math.abs(x) - (meio - raio);
  const dy = Math.abs(y) - (meio - raio);
  const fora = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return fora + Math.min(Math.max(dx, dy), 0) - raio;
}

/** Distância com sinal a uma elipse girada — cada pétala é uma destas. */
function distPetala(x, y, cx, cy, angulo, semiLargura, semiAltura) {
  const px = x - cx;
  const py = y - cy;
  const cos = Math.cos(-angulo);
  const sen = Math.sin(-angulo);
  const lx = (px * cos - py * sen) / semiLargura;
  const ly = (px * sen + py * cos) / semiAltura;
  // Aproximação boa o bastante para anti-aliasing nesta escala.
  return (Math.hypot(lx, ly) - 1) * Math.min(semiLargura, semiAltura);
}

/**
 * Cor de um ponto do ícone.
 *
 * `comFundo` liga o quadrado com gradiente. O ícone adaptativo do Android
 * desenha só a flor, porque o sistema pinta o fundo e recorta a máscara.
 */
function corDoPonto(x, y, lado, { comFundo, escalaFlor }) {
  const meio = lado / 2;
  const px = x - meio;
  const py = y - meio;
  const suavizar = lado / 512; // largura da borda anti-serrilhada

  let cor = [0, 0, 0];
  let alfa = 0;

  if (comFundo) {
    // Quadrado arredondado na mesma proporção do logo (raio ≈ 36% do lado).
    const d = distQuadradoRedondo(px, py, meio, lado * 0.36);
    const dentro = Math.min(Math.max(0.5 - d / suavizar, 0), 1);
    if (dentro > 0) {
      // Gradiente a 140°, como `linear-gradient(140deg, #ff9fd0, #c98af0)`.
      const t = Math.min(Math.max((px * 0.64 + py * 0.77) / lado + 0.5, 0), 1);
      cor = misturar(ROSA, LILAS, t);
      alfa = dentro;

      // Bolha clara do canto, ecoando a decoração dos cartões do design.
      const dBolha = Math.hypot(px + lado * 0.26, py + lado * 0.3) - lado * 0.26;
      const naBolha = Math.min(Math.max(0.5 - dBolha / (suavizar * 24), 0), 1);
      cor = misturar(cor, [255, 255, 255], naBolha * 0.13);
    }
  }

  // --- Flor: cinco pétalas em volta de um miolo ---
  const raioFlor = lado * escalaFlor;
  let dFlor = Infinity;
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const cx = Math.cos(a) * raioFlor * 0.52;
    const cy = Math.sin(a) * raioFlor * 0.52;
    // Pétala mais comprida no sentido radial: cara de sakura.
    dFlor = Math.min(dFlor, distPetala(px, py, cx, cy, a + Math.PI / 2, raioFlor * 0.34, raioFlor * 0.5));
  }

  const naFlor = Math.min(Math.max(0.5 - dFlor / suavizar, 0), 1);
  if (naFlor > 0) {
    // Sombra suave no encontro das pétalas, para elas se distinguirem.
    const profundidade = Math.min(Math.max(-dFlor / (raioFlor * 0.4), 0), 1);
    const corPetala = misturar(PETALA, PETALA_SOMBRA, (1 - profundidade) * 0.55);
    cor = alfa > 0 ? misturar(cor, corPetala, naFlor) : corPetala;
    alfa = Math.max(alfa, naFlor);
  }

  const dMiolo = Math.hypot(px, py) - raioFlor * 0.2;
  const noMiolo = Math.min(Math.max(0.5 - dMiolo / suavizar, 0), 1);
  if (noMiolo > 0) {
    const t = Math.min(Math.max((Math.hypot(px, py) / (raioFlor * 0.2)) ** 2, 0), 1);
    cor = misturar(cor, misturar(MIOLO, MIOLO_BORDA, t), noMiolo);
    alfa = Math.max(alfa, noMiolo);
  }

  return [...cor, alfa * 255];
}

/** Desenha o ícone com supersampling 3x3 por pixel. */
function desenhar(lado, opcoes) {
  const rgba = Buffer.alloc(lado * lado * 4);
  const AMOSTRAS = 3;

  for (let y = 0; y < lado; y += 1) {
    for (let x = 0; x < lado; x += 1) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < AMOSTRAS; sy += 1) {
        for (let sx = 0; sx < AMOSTRAS; sx += 1) {
          const [pr, pg, pb, pa] = corDoPonto(
            x + (sx + 0.5) / AMOSTRAS,
            y + (sy + 0.5) / AMOSTRAS,
            lado,
            opcoes,
          );
          // Pré-multiplica para não sujar a borda com cor de pixel transparente.
          const peso = pa / 255;
          r += pr * peso;
          g += pg * peso;
          b += pb * peso;
          a += pa;
        }
      }
      const n = AMOSTRAS * AMOSTRAS;
      const alfaMedio = a / n;
      const destino = (y * lado + x) * 4;
      // As somas de cor estão pré-multiplicadas por (alfa/255); para voltar à
      // cor pura basta dividir pela soma dos pesos, que é `a / 255`.
      const desmultiplicar = a > 0 ? 255 / a : 0;
      rgba[destino] = Math.round(Math.min(r * desmultiplicar, 255));
      rgba[destino + 1] = Math.round(Math.min(g * desmultiplicar, 255));
      rgba[destino + 2] = Math.round(Math.min(b * desmultiplicar, 255));
      rgba[destino + 3] = Math.round(alfaMedio);
    }
  }

  return paraPng(lado, lado, rgba);
}

// --- Saídas -----------------------------------------------------------------

const ARQUIVOS = [
  // Mobile: ícone cheio (iOS e fallback do Android).
  ['apps/mobile/assets/icone.png', 1024, { comFundo: true, escalaFlor: 0.3 }],
  // Android adaptativo: só a flor, porque o sistema pinta o fundo
  // (`adaptiveIcon.backgroundColor`) e recorta a máscara. A zona segura é o
  // círculo central de ~61% do lado; 0.27 deixa a flor em ~55%, com folga.
  ['apps/mobile/assets/icone-adaptativo.png', 1024, { comFundo: false, escalaFlor: 0.27 }],
  // Splash: flor sozinha sobre o rosa definido em app.json.
  ['apps/mobile/assets/splash.png', 512, { comFundo: false, escalaFlor: 0.3 }],
  ['apps/mobile/assets/favicon.png', 64, { comFundo: true, escalaFlor: 0.3 }],
  // Desktop: o electron-builder gera .ico/.icns a partir deste.
  ['apps/desktop/build/icon.png', 1024, { comFundo: true, escalaFlor: 0.3 }],
];

for (const [caminhoRelativo, lado, opcoes] of ARQUIVOS) {
  const destino = resolve(RAIZ, caminhoRelativo);
  mkdirSync(dirname(destino), { recursive: true });
  const png = desenhar(lado, opcoes);
  writeFileSync(destino, png);
  console.log(`  ${caminhoRelativo}  ${lado}x${lado}  ${(png.length / 1024).toFixed(1)} KB`);
}

console.log('\nÍcones gerados. 🌸\n');
