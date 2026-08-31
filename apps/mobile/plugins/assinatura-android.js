/**
 * Config plugin: assinatura do APK de release.
 *
 * O template do React Native assina o build de release com a **chave de
 * debug** — a mesma chave pública que vem no SDK, igual na máquina de todo
 * mundo. Um APK assim instala, mas qualquer pessoa consegue publicar uma
 * "atualização" que o Android aceita como sendo do mesmo app.
 *
 * Trocar isso na mão em `android/app/build.gradle` não adianta: a pasta
 * `android/` é gerada pelo `expo prebuild` e está no `.gitignore`, então a
 * edição some no próximo `--clean`. Por isso a troca mora aqui, num plugin que
 * o Expo reaplica toda vez que regenera o projeto nativo.
 *
 * As credenciais NÃO ficam no repositório. O Gradle as lê de
 * `~/.gradle/gradle.properties`:
 *
 *     PLANNER_FOFO_KEYSTORE=C:/caminho/para/planner-fofo-release.p12
 *     PLANNER_FOFO_KEY_ALIAS=planner-fofo
 *     PLANNER_FOFO_KEYSTORE_PASSWORD=...
 *     PLANNER_FOFO_KEY_PASSWORD=...
 *
 * Sem essas propriedades o build de release cai de volta na chave de debug, de
 * propósito: quem clonou o projeto para mexer no código continua conseguindo
 * compilar sem ter a chave de ninguém.
 */
const { withAppBuildGradle } = require('@expo/config-plugins');

/** Marca de idempotência: se já está no arquivo, não aplica de novo. */
const MARCA = 'PLANNER_FOFO_KEYSTORE';

const BLOCO_RELEASE = `        release {
            // Preenchido a partir de ~/.gradle/gradle.properties. Ver
            // apps/mobile/plugins/assinatura-android.js.
            if (project.hasProperty('PLANNER_FOFO_KEYSTORE')) {
                storeFile file(PLANNER_FOFO_KEYSTORE)
                storePassword PLANNER_FOFO_KEYSTORE_PASSWORD
                keyAlias PLANNER_FOFO_KEY_ALIAS
                keyPassword PLANNER_FOFO_KEY_PASSWORD
            }
        }
`;

/** Sem a chave configurada, volta para a de debug em vez de quebrar o build. */
const ESCOLHA =
  "signingConfig project.hasProperty('PLANNER_FOFO_KEYSTORE') ? signingConfigs.release : signingConfigs.debug";

function aplicar(conteudo) {
  if (conteudo.includes(MARCA)) return conteudo;

  // 1. Declara o signingConfig `release` ao lado do `debug` que já existe.
  if (!conteudo.includes('signingConfigs {')) {
    throw new Error(
      'assinatura-android: não achei o bloco `signingConfigs {` em app/build.gradle. ' +
        'O template do Expo mudou — ajuste o plugin antes de gerar um APK.',
    );
  }
  let saida = conteudo.replace('signingConfigs {\n', `signingConfigs {\n${BLOCO_RELEASE}`);

  // 2. Aponta o buildType de release para ele. O `signingConfig
  //    signingConfigs.debug` aparece duas vezes no template (uma no buildType
  //    debug, outra no release); só a que está dentro de `release {` muda.
  const buildTypes = saida.indexOf('buildTypes {');
  const release = saida.indexOf('release {', buildTypes);
  const alvo = saida.indexOf('signingConfig signingConfigs.debug', release);

  if (buildTypes < 0 || release < 0 || alvo < 0) {
    throw new Error(
      'assinatura-android: não achei o `signingConfig` do buildType de release. ' +
        'Sem isso o APK sairia assinado com a chave de debug — abortando de propósito.',
    );
  }

  saida =
    saida.slice(0, alvo) + ESCOLHA + saida.slice(alvo + 'signingConfig signingConfigs.debug'.length);

  return saida;
}

module.exports = function withAssinaturaAndroid(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(
        `assinatura-android: esperava app/build.gradle em Groovy, veio ${cfg.modResults.language}.`,
      );
    }
    cfg.modResults.contents = aplicar(cfg.modResults.contents);
    return cfg;
  });
};

// Exportado só para o teste manual: `node plugins/assinatura-android.js` não
// faz nada, mas dá para importar `aplicar` num REPL e conferir o resultado.
module.exports.aplicar = aplicar;
