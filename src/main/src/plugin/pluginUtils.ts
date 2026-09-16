import { rm } from "fs/promises";
import { logger } from "../logs/logger";
import type { PluginManager } from "./pluginManager";

export async function deletePlugin(pm: PluginManager, pluginName: string) {
  const result = await pm.touchPlugin(pluginName, async (plugin) => {
    await pm.mainRuntime.withPluginsStopped(async () => {
      logger.info(`Deleting plugin ${pluginName}...`);

      if (plugin.info.linked) {
        logger.debug("Unlinking", pluginName);
        const unlinkResult = await pm.pluginLinkService.unlinkPlugin(pluginName);
        if (!unlinkResult.ok) throw new Error(unlinkResult.message);

        logger.debug("Unlinked", pluginName);
      }

      try {
        await rm(plugin.info.path, { force: true, recursive: true });
      } catch (err) {
        throw err;
      }
    }, [pluginName]);
  });

  if (!result.ok) {
    logger
      .toast()
      .error(`Failed to delete plugin [${pluginName}]`, result.error ?? "Unknown error");
  } else logger.debug("PLUGIN DELETED:", pluginName);
  await pm.updateAllPluginInfo();

  return result;
}
