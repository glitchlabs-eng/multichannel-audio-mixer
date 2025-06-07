import { app, BrowserWindow, ipcMain, Menu, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

class AudioMixerApp {
  private mainWindow: BrowserWindow | null = null;
  private isDevelopment = process.env.NODE_ENV === 'development';

  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    app.whenReady().then(() => {
      this.createMainWindow();
      this.setupMenu();
      this.setupIpcHandlers();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createMainWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'default',
      show: false,
    });

    // Load the app
    if (this.isDevelopment) {
      this.mainWindow.loadURL('http://localhost:3000');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.handleNewProject(),
          },
          {
            label: 'Open Project',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.handleOpenProject(),
          },
          {
            label: 'Save Project',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.handleSaveProject(),
          },
          { type: 'separator' },
          {
            label: 'Import Audio',
            accelerator: 'CmdOrCtrl+I',
            click: () => this.handleImportAudio(),
          },
          {
            label: 'Export Mix',
            accelerator: 'CmdOrCtrl+E',
            click: () => this.handleExportMix(),
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit(),
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    ipcMain.handle('get-audio-devices', async () => {
      return { inputDevices: [], outputDevices: [] };
    });

    ipcMain.handle('save-project', async (event, projectData) => {
      try {
        const result = await dialog.showSaveDialog(this.mainWindow!, {
          filters: [{ name: 'Audio Mixer Project', extensions: ['amp'] }],
        });

        if (!result.canceled && result.filePath) {
          fs.writeFileSync(result.filePath, JSON.stringify(projectData, null, 2));
          return { success: true, filePath: result.filePath };
        }
        return { success: false };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    ipcMain.handle('load-project', async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow!, {
          filters: [{ name: 'Audio Mixer Project', extensions: ['amp'] }],
          properties: ['openFile'],
        });

        if (!result.canceled && result.filePaths.length > 0) {
          const data = fs.readFileSync(result.filePaths[0], 'utf-8');
          return { success: true, data: JSON.parse(data) };
        }
        return { success: false };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });

    ipcMain.handle('import-audio-file', async () => {
      try {
        const result = await dialog.showOpenDialog(this.mainWindow!, {
          filters: [
            { name: 'Audio Files', extensions: ['wav', 'mp3', 'flac', 'aac', 'ogg'] },
          ],
          properties: ['openFile', 'multiSelections'],
        });

        if (!result.canceled) {
          return { success: true, filePaths: result.filePaths };
        }
        return { success: false };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
      }
    });
  }

  private handleNewProject(): void {
    this.mainWindow?.webContents.send('menu-new-project');
  }

  private handleOpenProject(): void {
    this.mainWindow?.webContents.send('menu-open-project');
  }

  private handleSaveProject(): void {
    this.mainWindow?.webContents.send('menu-save-project');
  }

  private handleImportAudio(): void {
    this.mainWindow?.webContents.send('menu-import-audio');
  }

  private handleExportMix(): void {
    this.mainWindow?.webContents.send('menu-export-mix');
  }
}

// Initialize the application
new AudioMixerApp();
