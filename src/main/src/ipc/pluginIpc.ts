import { createEmptyPlugin } from "../plugin/createEmptyPlugin";
import { makeManifestErrorsForRenderer, makeSimplePluginList } from "../plugin/sendPluginUpdate";
import { logger } from "../logs/logger";
import { ipc } from "./ipcMethods";
import type { PluginManager } from "../plugin/pluginManager";
import type { MainApp } from "../app/mainApp";
import { openVsCode } from "../system/externalTools";
import { deletePlugin } from "../plugin/pluginUtils";

function requirePluginManager(app: MainApp): PluginManager;
function requirePluginManager(app: MainApp, soft: boolean): PluginManager | null;
function requirePluginManager(app: MainApp, soft: boolean = false) {
  const pluginManager = app.service.pluginManager;
  if (!pluginManager && soft) return null;
  if (!pluginManager) throw new Error("PluginManager is not initialized.");
  return pluginManager;
}

export function setupPluginIpc(app: MainApp) {
  ipc.handle("plugin:get-list", () => {
    const pluginMap = requirePluginManager(app)?.plugins;
    if (!pluginMap) return {};
    return makeSimplePluginList(pluginMap);
  });
  ipc.handle("plugin:get-manifest-errors", () => {
    const pluginManager = requirePluginManager(app);
    if (!pluginManager) return [];
    return makeManifestErrorsForRenderer(pluginManager);
  });

  ipc.handle("plugin:runtime:activate", async (evt, pluginName, payload) => {
    const { activationId, rendererMethods, attributes } = payload;
    logger.info("PLUGIN ACTIVATING: ", pluginName);
    const pluginManager = requirePluginManager(app);
    const instance = await pluginManager.mainRuntime.createInstance(pluginName, activationId);
    if (!instance) return null;
    try {
      await instance.activate(rendererMethods, attributes);
      return instance.mainMethods;
    } catch (err) {
      pluginManager.mainRuntime.disposeInstance(pluginName, activationId);
      throw err;
    }
  });

  ipc.handle("plugin:runtime:deactivate", (evt, payload) => {
    return requirePluginManager(app, true)?.mainRuntime.disposeInstance(
      payload.pluginName,
      payload.activationId
    );
  });

  ipc.on("plugin:runtime:deactivate-all", (evt) => {
    requirePluginManager(app, true)?.mainRuntime.disposeAll();
  });

  ipc.handle("plugin:runtime:to-main", (evt, payload) => {
    const { pluginName, activationId, methodName, args } = payload;
    const instance = requirePluginManager(app).mainRuntime.getActiveInstance(
      pluginName,
      activationId
    );
    if (!instance) return null;
    return instance.callMainMethod(methodName, args);
  });

  ipc.handle("plugin:create", async (evt, { name, type, isExternal, typescript }) => {
    let path: string | undefined;
    if (isExternal) {
      const selected = await app.system.dialog.showOpenDialog({
        title: "Select the plugin directory",
        properties: ["openDirectory"]
      });
      if (selected.canceled) return { canceled: true as const };
      path = selected.filePaths[0] as string;
    }
    const createResult = await createEmptyPlugin(
      name,
      type,
      {
        root: path,
        typescript
      },
      {
        paths: app.paths,
        skipNameValidation: false,
        npmInstalled: app.state.externalTools.npm,
        status(status) {
          logger.info(`[${name}]: ${status}`);
        }
      }
    );
    if ("error" in createResult) return { canceled: true as const, error: createResult.error };
    if (isExternal) {
      const linkResult = await requirePluginManager(app).pluginLinkService.addPluginLink(
        createResult.dir
      );
      if (!linkResult.ok) return { canceled: true as const, error: linkResult.message };
    }
    if (app.state.externalTools.vscode) openVsCode(createResult.dir);
    else app.system.shell.openPath(createResult.dir);
    await requirePluginManager(app).updateAllPluginInfo();
    return { dir: createResult.dir, warning: createResult.warning };
  });

  ipc.handle("plugin:runtime-error", (_, payload) => {
    requirePluginManager(app).reportPluginError("renderer", "runtime", payload);
  });

  ipc.handle("plugin:delete", async (_, pluginName) => {
    const pm = requirePluginManager(app);
    if (!pm.plugins.has(pluginName)) {
      logger.toast().error(`"${pluginName}" 플러그인이 없습니다.`);
      return { ok: false, message: "PLUGIN NOT FOUND" };
    }
    const confirm = await app.system.dialog.showMessageBox({
      title: `${pluginName} 플러그인 삭제`,
      message: `"${pluginName}" 플러그인을 삭제합니다.`,
      detail: "이 동작은 되돌릴 수 없습니다.",
      buttons: ["확인", "취소"],
      cancelId: 1,
      defaultId: 1,
      noLink: true
    });

    if (confirm.response) return { ok: false, message: "USER ABORTED" };

    const result = await deletePlugin(pm, pluginName);

    return { ok: result.ok, message: result.message };
  });

  ipc.handle("plugin:rebuild", async (_, pluginName) => {
    const pm = requirePluginManager(app);
    const plugin = pm.plugins.get(pluginName);

    if (!plugin) {
      logger.toast().error(`"${pluginName}" 플러그인이 없습니다.`);
      return;
    }
    const result = await pm.reupdatePlugin({
      info: plugin.info,
      forceBuild: true,
      forceUpdateSource: true
    });
    if ("error" in result) logger.toast().error("Failed to rebuild plugin", result.reason);
  });

  ipc.handle("plugin:relink", async (_, pluginName) => {
    const pm = requirePluginManager(app);
    const plugin = pm.plugins.get(pluginName);

    if (!plugin) {
      logger.toast().error(`"${pluginName}" 플러그인이 없습니다.`);
      return;
    }
    if (!plugin.info.linked) {
      logger.toast().error(`"${pluginName}" 플러그인은 외부 플러그인이 아닙니다.`);
      return;
    }

    const dialogResult = await app.system.dialog.showOpenDialog({
      title: `Select the [${pluginName}] source directory to link`,
      properties: ["openDirectory"]
    });

    if (dialogResult.canceled || !dialogResult.filePaths[0]) return;

    const newPath = dialogResult.filePaths[0];
    if (newPath === plugin.info.linked.sourcePath) {
      logger.toast().warning("Updating aborted", "Selected same source directory");
      return;
    }

    const relinkResult = await pm.pluginLinkService.addPluginLink(newPath, plugin.info);

    if (!relinkResult.ok) {
      logger.toast().error("Failed to update plugin link", relinkResult.message ?? "Unknown error");
      return;
    }

    const oldPath = plugin.info.linked.sourcePath;

    const newInfo = await pm.getPluginInfoFromDir(plugin.info.dir);
    if (!newInfo.info) {
      logger.toast().error("Failed to load plugin info", newInfo.reason);
      return;
    }
    await pm.reupdatePlugin({ info: newInfo.info, forceBuild: true, forceUpdateSource: true });
    logger.toast().debug("Plugin link updated", `${oldPath} => ${newPath}`);
  });
}
