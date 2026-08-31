/**
 * Sobe a versao do projeto inteiro de uma vez.
 *
 *     npm run versao 1.1.0
 *     npm run versao            (so mostra as versoes atuais)
 *
 * A versao vive em quatro arquivos, e uma release sai errada se um deles ficar
 * para tras: o instalador do desktop e o APK do Android acabariam com numeros
 * diferentes dentro da mesma release.
 *
 * O `versionCode` do Android nao entra aqui de proposito — ele e derivado da
 * `version` em `apps/mobile/app.config.js`, entao anda sozinho.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Cada arquivo e o caminho ate a versao dentro dele. */
const ARQUIVOS = [
  { arquivo: 'package.json', caminho: ['version'], rotulo: 'monorepo' },
  { arquivo: 'apps/desktop/package.json', caminho: ['version'], rotulo: 'desktop' },
  { arquivo: 'apps/mobile/package.json', caminho: ['version'], rotulo: 'mobile (pacote)' },
  { arquivo: 'apps/mobile/app.json', caminho: ['expo', 'version'], rotulo: 'mobile (app)' },
];

const ler = (arquivo) => JSON.parse(readFileSync(join(RAIZ, arquivo), 'utf8'));

function pegar(objeto, caminho) {
  return caminho.reduce((acc, chave) => acc?.[chave], objeto);
}

function definir(objeto, caminho, valor) {
  const ultimo = caminho[caminho.length - 1];
  const pai = caminho.slice(0, -1).reduce((acc, chave) => acc[chave], objeto);
  pai[ultimo] = valor;
}

const nova = process.argv[2];

// Sem argumento: so relata o estado atual.
if (!nova) {
  console.log('\nVersoes atuais:\n');
  const vistas = new Set();
  for (const { arquivo, caminho, rotulo } of ARQUIVOS) {
    const v = pegar(ler(arquivo), caminho);
    vistas.add(v);
    console.log(`  ${rotulo.padEnd(16)} ${String(v).padEnd(10)} ${arquivo}`);
  }
  console.log(
    vistas.size === 1
      ? '\n✓ Tudo na mesma versao.\n'
      : `\n⚠️  ${vistas.size} versoes diferentes! Rode: npm run versao <x.y.z>\n`,
  );
  process.exit(vistas.size === 1 ? 0 : 1);
}

if (!/^\d+\.\d+\.\d+$/.test(nova)) {
  console.error(`\n✗ "${nova}" nao e uma versao valida. Use x.y.z (ex: 1.1.0).\n`);
  process.exit(1);
}

const [, menor, correcao] = nova.split('.').map(Number);
if (menor > 99 || correcao > 99) {
  console.error(
    `\n✗ ${nova} nao cabe no versionCode do Android (minor e patch vao ate 99).\n` +
      '  Veja versionCodeDe() em apps/mobile/app.config.js.\n',
  );
  process.exit(1);
}

console.log(`\n🌸 Planner Fofo -> ${nova}\n`);
for (const { arquivo, caminho, rotulo } of ARQUIVOS) {
  const dados = ler(arquivo);
  const antes = pegar(dados, caminho);
  definir(dados, caminho, nova);
  writeFileSync(join(RAIZ, arquivo), `${JSON.stringify(dados, null, 2)}\n`, 'utf8');
  console.log(`  ${rotulo.padEnd(16)} ${antes} -> ${nova}`);
}

console.log(`
Agora gere os artefatos:

  GH_TOKEN=$(gh auth token) npm run desktop:release   instalador + latest.yml no GitHub
  npm run mobile:apk                                  APK assinado, para anexar na release
`);
