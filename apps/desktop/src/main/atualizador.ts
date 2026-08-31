/**
 * Atualização automática pelas releases do GitHub.
 *
 * O `electron-builder` publica, junto do instalador, um `latest.yml` com a
 * versão e o hash de cada artefato. O `electron-updater` lê esse arquivo na
 * release mais recente de `Lintzz/planner-fofo`, compara com a versão que está
 * rodando e, quando há novidade, baixa o instalador em segundo plano.
 *
 * Fluxo visto pela usuária: nada acontece até o download terminar. Aí aparece
 * uma única caixa perguntando se quer reiniciar. Dizer "depois" não repete a
 * pergunta — a instalação acontece sozinha quando ela fechar o app.
 *
 * Em desenvolvimento tudo isto fica desligado: sem `app.isPackaged` não existe
 * versão instalada para substituir, e o updater só reclamaria no terminal.
 */
import { app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

/** De quanto em quanto tempo reconsultar a release mais recente. */
const INTERVALO_MS = 6 * 60 * 60 * 1000; // 6 horas

/** Espera antes da primeira consulta, para não competir com a janela abrindo. */
const ESPERA_INICIAL_MS = 8 * 1000;

const log = (...partes: unknown[]): void => console.log('[Planner Fofo · updater]', ...partes);
const avisar = (...partes: unknown[]): void => console.warn('[Planner Fofo · updater]', ...partes);

/** Evita empilhar duas caixas de diálogo se o evento vier mais de uma vez. */
let perguntando = false;

/**
 * Liga o ciclo de atualização. Chamar uma vez, depois de `app.whenReady()`.
 * Não lança: falha de rede ou release ausente nunca pode derrubar o app.
 */
export function iniciarAtualizacaoAutomatica(): void {
  if (!app.isPackaged) {
    log('desligado em desenvolvimento.');
    return;
  }

  // Baixa sozinho, mas só instala quando a usuária deixar (ou ao fechar o app).
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = { info: log, warn: avisar, error: avisar, debug: () => {} };

  autoUpdater.on('update-available', (info) => log(`versão ${info.version} disponível, baixando…`));
  autoUpdater.on('update-not-available', () => log('já está na versão mais recente.'));
  autoUpdater.on('error', (erro) => avisar('falhou:', erro?.message ?? erro));
  autoUpdater.on('update-downloaded', (info) => void oferecerReinicio(info.version));

  const verificar = (): void => {
    autoUpdater.checkForUpdates().catch((erro: unknown) => {
      // `checkForUpdates` rejeita quando o GitHub está fora do ar ou o usuário
      // está sem internet. É esperado e não merece incomodar ninguém.
      avisar('não deu para checar agora:', erro instanceof Error ? erro.message : erro);
    });
  };

  setTimeout(verificar, ESPERA_INICIAL_MS);
  setInterval(verificar, INTERVALO_MS).unref();
}

/** Caixa única: reinicia agora ou instala no próximo fechamento. */
async function oferecerReinicio(versao: string): Promise<void> {
  if (perguntando) return;
  perguntando = true;

  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: 'Planner Fofo',
    message: `A versão ${versao} chegou! 🌸`,
    detail:
      'A atualização já foi baixada. Dá para reiniciar agora ou deixar que ela ' +
      'se instale sozinha da próxima vez que você fechar o Planner Fofo.',
    buttons: ['Reiniciar agora', 'Depois'],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (response === 0) {
    // `isSilent: false` mostra o instalador; `isForceRunAfter: true` reabre o app.
    autoUpdater.quitAndInstall(false, true);
  }
}
