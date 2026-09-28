import { BrowserWindow, ipcMain, type IpcMainEvent } from "electron";
import { join } from "path";
import { createEditorMenu } from "./editorMenu";
import type { MainApp } from "../app/mainApp";
import { logger } from "../logs/logger";
import { ipc } from "../ipc/ipcMethods";
import { getMainScreenArea, getWindowArea, isBoundsOnScreen } from "../system/screenManager";

export class WindowController {
  #app: MainApp;
  #editorWindowCreating = false;

  constructor(app: MainApp) {
    this.#app = app;
  }

  createMainWindow() {
    const { controllers, globalKey, service, settings, startup, state, system } = this.#app;
    if (state.window.main) return;

    let playRendererShown = false;
    let playRendererFailed = false;
    const quitOnStartupError = () => {
      if (playRendererShown || playRendererFailed) return;
      playRendererFailed = true;
      system.app.quit();
    };
    const mainWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: false,
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false,
        backgroundThrottling: false
      },
      title: state.project.data?.config?.title ?? "REPAIRv2",
      frame: false,
      transparent: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      movable: false
    });
    state.window.main = mainWindow;
    mainWindow.setMenu(null);

    const onPlayWindowReady = (event: IpcMainEvent) => {
      if (event.sender !== mainWindow.webContents) return;
      ipc.off("play-win-ready", onPlayWindowReady);
      playRendererShown = true;
      startup.closeSplash();
      mainWindow.show();

      controllers.project.applyDataConfig();
      this.applyAlwaysOnTop();
    };
    ipc.on("play-win-ready", onPlayWindowReady);

    if (this.#app.isDev) {
      mainWindow.loadURL("http://localhost:3100");
    } else {
      mainWindow.loadFile(join(__dirname, "../play/index.html"));
    }

    mainWindow.on("closed", () => {
      ipcMain.removeListener("play-win-ready", onPlayWindowReady);
      state.window.main = null;
      globalKey.stopSuppress("play");
      if (!service.projectFileManager.importing) {
        startup.closeSplash();
        system.app.quit();
      }
    });
    mainWindow.on("focus", async () => {
      if (!(await settings.get("suppressGlobalKeys"))) return;
      if (state.window.main === mainWindow && mainWindow.isFocused())
        globalKey.startSuppress("play");
    });
    mainWindow.on("blur", () => {
      globalKey.stopSuppress("play");
    });

    mainWindow.webContents.on("render-process-gone", (evt, details) => {
      logger.error("[Play renderer gone]", details.reason);
      quitOnStartupError();
    });
    mainWindow.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription, validatedURL) => {
        logger.error(
          "Play load failed",
          JSON.stringify(
            {
              errorCode,
              errorDescription,
              validatedURL
            },
            null,
            4
          )
        );
        quitOnStartupError();
      }
    );
    mainWindow.webContents.on("console-message", ({ level, message, lineNumber, sourceId }) => {
      if (level !== "error") return;
      logger.error("Play renderer error", message + `\n\tat ${sourceId}:${lineNumber}`);
      quitOnStartupError();
    });
  }

  async updateMainWindowArea() {
    if (!this.#app.state.window.main) return;
    this.#app.state.window.main.setBounds?.(
      this.#app.state.project.data
        ? getWindowArea(
            this.#app.state.project.data.config,
            await this.#app.settings.get("anchorDisplay")
          )
        : getMainScreenArea()
    );
  }

  async createEditorWindow() {
    const { state, editorSave, globalKey, message, settings, system } = this.#app;
    if (state.window.editor || this.#editorWindowCreating) return;

    this.#editorWindowCreating = true;
    const savedState = await settings.get("editorWindowState");
    this.#editorWindowCreating = false;
    const savedBounds =
      savedState && isBoundsOnScreen(savedState.bounds) ? savedState.bounds : undefined;

    const editorWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      ...savedBounds,
      minWidth: 750,
      minHeight: 500,
      show: false,
      webPreferences: {
        sandbox: false,
        nodeIntegration: true,
        contextIsolation: false,
        webSecurity: false
      },
      titleBarStyle: "hidden",
      titleBarOverlay: {
        color: "#1b1c1d",
        symbolColor: "rgba(255, 255, 255, 0.6)",
        height: 36
      }
    });
    state.window.editor = editorWindow;

    editorWindow.setMenu(createEditorMenu(this.#app));
    editorWindow.setMenuBarVisibility(false);

    const showEditorWin = (evt: IpcMainEvent) => {
      if (evt.sender !== editorWindow.webContents) return;

      ipc.off("editor-win-ready", showEditorWin);

      if (savedState?.maximized) editorWindow.maximize();
      else editorWindow.show();
      editorWindow.focus();
      this.applyAlwaysOnTop();
    };
    ipc.on("editor-win-ready", showEditorWin);

    editorWindow.webContents.setWindowOpenHandler((details) => {
      system.shell.openExternal(details.url);
      return { action: "deny" };
    });

    if (this.#app.isDev) {
      editorWindow.loadURL("http://localhost:3101");
    } else {
      editorWindow.loadFile(join(__dirname, "../editor/index.html"));
    }

    editorWindow.on("blur", () => {
      globalKey.stopSuppress("capture");
    });

    editorWindow.on("close", () => {
      settings.set("editorWindowState", {
        bounds: editorWindow.getNormalBounds(),
        maximized: editorWindow.isMaximized()
      });
      globalKey.stopSuppress("capture");
      if (editorSave.pending) {
        editorSave.resolveEditorSaveRequest(editorSave.pending.requestId, false);
      }
      state.window.editor = null;
    });
  }

  async applyAlwaysOnTop() {
    const { settings, state } = this.#app;
    const alwaysOnTop = await settings.get("alwaysOnTop");
    for (const win of [state.window.main, state.window.editor]) {
      if (win && !win.isDestroyed()) win.setAlwaysOnTop(alwaysOnTop, "screen-saver");
    }
  }

  closeProjectWindows() {
    const { state } = this.#app;
    if (state.window.editor) {
      state.window.editor.close();
      state.window.editor = null;
    }
    if (state.window.main) {
      state.window.main.close();
      state.window.main = null;
    }
  }
}
