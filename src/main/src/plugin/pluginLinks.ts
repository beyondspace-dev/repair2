import { join } from "path";
import fs from "fs/promises";
import { getManifest, MANIFEST, normalizeManifest } from "./pluginManifest";
import { pathExists } from "../system/pathExists";
import type { PluginDiagnostics } from "./pluginDiagnostics";
import type { PluginManifest, PluginType } from "./type";
import { toKebabCase } from "@shared/stringUtils";
import type { PathManager } from "../app/mainAppPaths";

type Result = { ok: boolean; message?: string };

export type PluginLinks = Record<string, { sourcePath: string; linked: boolean }>;

export function createPluginLinkService({
  pluginDiagnostics,
  paths
}: {
  pluginDiagnostics: PluginDiagnostics;
  paths: PathManager;
}) {
  const getLinksPath = () => paths.inProject("plugin-links.json");
  const diagnostics = pluginDiagnostics;

  let currentPluginLinks: PluginLinks;

  async function readManifest(manifestPath: string) {
    const manifestReadResult = await getManifest(manifestPath);
    if (manifestReadResult.ok === false) {
      if (!manifestReadResult.silent) {
        await diagnostics.linkedManifestLoadFailed({
          manifestPath,
          content: [manifestReadResult]
        });
      }
      return null;
    }
    return normalizeManifest(manifestReadResult.data);
  }

  async function replaceName(beforeName: string, newName: string) {
    if (newName === beforeName) return false;
    await getPluginLinks();
    if (currentPluginLinks[newName]) return false;
    const temp = currentPluginLinks[beforeName];
    if (!temp) return false;
    delete currentPluginLinks[beforeName];
    currentPluginLinks[newName] = temp;
    await updatePluginLinks();
    return true;
  }

  async function updateManifestFromSource(
    sourceDir: string,
    destDir: string,
    forceUpdate = false,
    { name, type }: { name: string | null; type: PluginType | null } = {
      name: null,
      type: null
    }
  ): Promise<{ updated: false; unlinked?: boolean } | { updated: true }> {
    const sourceManifest = join(sourceDir, MANIFEST);
    const destManifest = join(destDir, MANIFEST);
    if (!forceUpdate) {
      const should = await shouldUpdate(sourceManifest, destManifest);
      if (name && should.unlinked && name in currentPluginLinks)
        currentPluginLinks[name].linked = false;
      if (!should.update) return { updated: false, unlinked: should.unlinked };
    }
    try {
      await fs.mkdir(destDir, { recursive: true }).then(() =>
        fs.cp(sourceManifest, destManifest, {
          preserveTimestamps: true
        })
      );
      if (name && name in currentPluginLinks) currentPluginLinks[name].linked = true;
      return { updated: true };
    } catch (err) {
      await diagnostics.linkedManifestCopyFailed({
        pluginName: name ?? "unknown",
        pluginType: type ?? "unknown",
        sourceManifest,
        destManifest,
        content: [err]
      });
      return { updated: false };
    }
  }

  async function addPluginLink(
    sourceDir: string,
    replace: boolean = false
  ): Promise<{ ok: false; message?: string } | { ok: true; manifest: PluginManifest }> {
    const current = await getPluginLinks();
    if (!current) return { ok: false, message: "Failed to access current plugin links" };
    const manifest = await readManifest(join(sourceDir, MANIFEST));
    if (!manifest) return { ok: false, message: `"${sourceDir}" is not a valid plugin directory` };
    if (!replace && current[manifest.name]) {
      await diagnostics.duplicateLink({
        pluginName: manifest.name,
        pluginType: manifest.type,
        currentSourcePath: current[manifest.name].sourcePath,
        requestedSourcePath: sourceDir
      });
      return { ok: false, message: `"${manifest.name}" is already registered plugin name` };
    }
    if (
      !(
        await updateManifestFromSource(
          sourceDir,
          join(paths.inProject("plugins"), toKebabCase(manifest.name)),
          true,
          manifest
        )
      ).updated
    )
      return { ok: false, message: "Failed to copy plugin manifest file" };
    const newLinks = { ...current, [manifest.name]: { sourcePath: sourceDir, linked: true } };
    const updateResult = await updatePluginLinks(newLinks);
    return updateResult.ok
      ? { ok: true, manifest: manifest }
      : { ok: false, message: updateResult.message };
  }

  async function unlinkPlugin(pluginName: string): Promise<Result> {
    const current = await getPluginLinks();
    if (!current) return { ok: false, message: "Failed to access current plugin links" };
    if (!(pluginName in current))
      return { ok: false, message: `"${pluginName}" is not registered linked plugin` };
    delete current[pluginName];

    return await updatePluginLinks(current);
  }

  async function getPluginLinks(): Promise<PluginLinks | null> {
    if (currentPluginLinks) return currentPluginLinks;

    const linksPath = getLinksPath();
    if (!(await pathExists(linksPath))) {
      currentPluginLinks = {};
      return currentPluginLinks;
    }

    try {
      const content = await fs.readFile(linksPath, "utf8");
      const obj = JSON.parse(content);
      const links = await normalizeLinks(obj);
      if (!links) {
        await diagnostics.linkRegistryInvalid(linksPath);
        return null;
      }
      currentPluginLinks = links;
      return links;
    } catch (err) {
      await diagnostics.linkRegistryReadFailed(linksPath, [err]);
      return null;
    }
  }

  async function updatePluginLinks(newLinks: PluginLinks = currentPluginLinks): Promise<Result> {
    const linksPath = getLinksPath();
    try {
      currentPluginLinks = newLinks;
      await fs.writeFile(linksPath, JSON.stringify(serializePluginLinks(newLinks)), "utf8");
      return { ok: true };
    } catch (err) {
      await diagnostics.linkRegistrySaveFailed(linksPath, [err]);
      return { ok: false, message: "Failed to write plugin-links.json file" };
    }
  }

  return {
    addPluginLink,
    unlinkPlugin,
    updateManifestFromSource,
    getPluginLinks,
    replaceName
  };
}

export type PluginLinkService = ReturnType<typeof createPluginLinkService>;

function serializePluginLinks(links: PluginLinks) {
  const result: Record<string, { sourcePath: string }> = {};
  for (const [name, link] of Object.entries(links)) {
    result[name] = { sourcePath: link.sourcePath };
  }
  return result;
}

const UPDATE_TIME_TOLERANCE_MS = 1000;
async function shouldUpdate(sourcePath: string, destPath: string) {
  const destStat = await fs.stat(destPath).catch(() => null);
  if (!destStat) return { update: true };
  const srcStat = await fs.stat(sourcePath).catch(() => null);
  if (!srcStat) return { unlinked: true };
  return {
    update:
      !destStat ||
      srcStat.size !== destStat.size ||
      Math.abs(srcStat.mtimeMs - destStat.mtimeMs) > UPDATE_TIME_TOLERANCE_MS
  };
}

async function normalizeLinks(
  value: Record<string, { sourcePath: string }>
): Promise<PluginLinks | null> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const links: PluginLinks = {};
  await Promise.all(
    Object.entries(value).map(async ([pluginName, link]) => {
      if (typeof link.sourcePath !== "string") return;
      links[pluginName] = {
        sourcePath: link.sourcePath,
        linked: await pathExists(join(link.sourcePath, MANIFEST))
      };
    })
  );
  return links;
}
