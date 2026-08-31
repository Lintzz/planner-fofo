/**
 * Processo principal do Electron.
 *
 * Abre a janela do Planner Fofo com o mesmo rosa do fundo do design, para não
 * haver flash branco antes do React montar.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { app, BrowserWindow, shell } from 'electron';

import { iniciarAtualizacaoAutomatica } from './atualizador';

// Cor do começo do gradiente radial do artboard web.
const FUNDO = '#fce7f3';

/**
 * Ícone da janela em desenvolvimento.
 *
 * No app empacotado o ícone vem do próprio executável, que o electron-builder
 * gera a partir de `build/icon.png` — e `build/` não é distribuído. Por isso o
 * caminho é opcional: existe rodando do código-fonte, não existe no pacote.
 */
const ICONE = join(__dirname, '../../build/icon.png');

function criarJanela(): void {
  const janela = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    show: false,
    backgroundColor: FUNDO,
    title: 'Planner Fofo',
    autoHideMenuBar: true,
    ...(existsSync(ICONE) ? { icon: ICONE } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // O renderer só fala com o Supabase pela rede; nada de Node nele.
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Só exibe quando o conteúdo já pintou.
  janela.on('ready-to-show', () => janela.show());

  // Links externos abrem no navegador do sistema, nunca numa janela Electron.
  janela.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  const urlDev = process.env['ELECTRON_RENDERER_URL'];
  if (urlDev) {
    void janela.loadURL(urlDev);
  } else {
    void janela.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Uma instância só: abrir de novo foca a janela existente.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [janela] = BrowserWindow.getAllWindows();
    if (janela) {
      if (janela.isMinimized()) janela.restore();
      janela.focus();
    }
  });

  void app.whenReady().then(() => {
    criarJanela();

    // Atualização pelas releases do GitHub. Só faz algo no app empacotado.
    iniciarAtualizacaoAutomatica();

    // No macOS é normal a app seguir viva sem janelas.
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) criarJanela();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
