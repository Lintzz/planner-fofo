/**
 * Gera o APK de release do app mobile.
 *
 *     npm run mobile:apk
 *
 * Roda o Gradle do projeto nativo (`apps/mobile/android`), confere com quem o
 * APK foi assinado e copia o arquivo para `apps/mobile/release/` com o nome da
 * versao — do mesmo jeito que o electron-builder faz no desktop.
 *
 * Nao precisa de conta no Expo: o build e local, o mesmo que o `expo
 * run:android` dispara. O que precisa e do JDK 17 e do Android SDK.
 *
 * A chave de assinatura vem de `~/.gradle/gradle.properties`
 * (`PLANNER_FOFO_KEYSTORE` e companhia) — ver
 * `apps/mobile/plugins/assinatura-android.js`. Sem ela o Gradle assina com a
 * chave de debug, e este script avisa em vez de deixar passar quieto.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ANDROID = join(RAIZ, 'apps/mobile/android');
const SAIDA = join(RAIZ, 'apps/mobile/release');
const APK_GRADLE = join(ANDROID, 'app/build/outputs/apk/release/app-release.apk');

const ehWindows = process.platform === 'win32';

function morrer(mensagem) {
  console.error(`\n✗ ${mensagem}\n`);
  process.exit(1);
}

// --- 1. Projeto nativo -----------------------------------------------------

if (!existsSync(ANDROID)) {
  morrer(
    'apps/mobile/android nao existe.\n' +
      '  Gere o projeto nativo primeiro:  cd apps/mobile && npx expo prebuild --platform android',
  );
}

// --- 2. Versao, para nomear o arquivo --------------------------------------

const appJson = JSON.parse(readFileSync(join(RAIZ, 'apps/mobile/app.json'), 'utf8'));
const versao = appJson.expo?.version ?? '0.0.0';

// --- 3. Build --------------------------------------------------------------

console.log(`\n🌸 Planner Fofo ${versao} — montando o APK de release...\n`);

// Caminho absoluto de proposito: com `shell: true` o cmd.exe nem sempre acha o
// `gradlew.bat` pelo diretorio de trabalho.
const gradlew = join(ANDROID, ehWindows ? 'gradlew.bat' : 'gradlew');
if (!existsSync(gradlew)) morrer(`nao achei o wrapper do Gradle em ${gradlew}.`);

const gradle = ehWindows
  ? spawnSync('cmd.exe', ['/d', '/s', '/c', gradlew, 'assembleRelease'], {
      cwd: ANDROID,
      stdio: 'inherit',
    })
  : spawnSync(gradlew, ['assembleRelease'], { cwd: ANDROID, stdio: 'inherit' });

if (gradle.status !== 0) morrer('o Gradle falhou. A saida acima diz onde.');
if (!existsSync(APK_GRADLE)) morrer(`o Gradle terminou, mas nao achei ${APK_GRADLE}.`);

// --- 4. Com qual chave? ----------------------------------------------------

/** `apksigner` fica no build-tools mais novo instalado. */
function acharApksigner() {
  const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
  if (!sdk) return null;
  const buildTools = join(sdk, 'build-tools');
  if (!existsSync(buildTools)) return null;

  const versoes = readdirSync(buildTools).sort().reverse();
  for (const v of versoes) {
    const caminho = join(buildTools, v, ehWindows ? 'apksigner.bat' : 'apksigner');
    if (existsSync(caminho)) return caminho;
  }
  return null;
}

const apksigner = acharApksigner();
if (apksigner) {
  // `apksigner` e um .bat no Windows, entao precisa passar pelo cmd.exe. Com
  // `shell: true` o Node avisa (DEP0190) que os argumentos vao concatenados
  // sem escape; chamando o cmd direto eles seguem como lista.
  const info = ehWindows
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', apksigner, 'verify', '--print-certs', APK_GRADLE], {
        encoding: 'utf8',
      })
    : spawnSync(apksigner, ['verify', '--print-certs', APK_GRADLE], { encoding: 'utf8' });
  const saida = `${info.stdout ?? ''}${info.stderr ?? ''}`;
  // O apksigner rotula o signatario de dois jeitos, conforme o esquema usado:
  // "Signer #1 certificate DN:" e "V2 Signer: certificate DN:".
  const dono = saida.match(/(?:Signer #\d+|V\d+ Signer:) certificate DN: (.+)/)?.[1]?.trim();

  if (dono?.includes('Android Debug')) {
    console.warn(
      '\n⚠️  ESTE APK ESTA ASSINADO COM A CHAVE DE DEBUG.\n' +
        '   Instala, mas nao serve para distribuir: a chave de debug e publica.\n' +
        '   Configure PLANNER_FOFO_KEYSTORE em ~/.gradle/gradle.properties.\n',
    );
  } else if (dono) {
    console.log(`\n🔏 Assinado por: ${dono}`);
  } else {
    console.warn('\n⚠️  nao consegui ler o signatario do APK. Confira na mao:');
    console.warn(`   "${apksigner}" verify --print-certs "${APK_GRADLE}"`);
  }
} else {
  console.warn('\n⚠️  apksigner nao encontrado no Android SDK; pulei a conferencia da assinatura.');
}

// --- 5. Copia com nome de versao -------------------------------------------

mkdirSync(SAIDA, { recursive: true });
const destino = join(SAIDA, `PlannerFofo-${versao}.apk`);
copyFileSync(APK_GRADLE, destino);

const mb = (statSync(destino).size / 1024 / 1024).toFixed(1);
console.log(`\n✓ APK pronto: ${destino} (${mb} MB)\n`);
