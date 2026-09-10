import { fileURLToPath } from "url";
import { join, dirname } from "path";
import { is } from "@electron-toolkit/utils";
import { app } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const userDataPath = app.getPath("userData");

export const storePath = join(userDataPath, is.dev ? "dev_store" : "store");

export const root = is.dev ? join(__dirname, "../..") : join(app.getPath("exe"), "..");
export const templateDir = join(root, "templates");
export const sdkDir = join(root, "packages/plugin-sdk");

export const appResource = join(app.getAppPath(), "assets");
