import { join } from "path";
import { templateDir, storePath, userDataPath, sdkDir, appResource } from "../system/dirs";
import type { MainApp } from "./mainApp";
import type { Prettify } from "@shared/utils.types";

const PathsInProjects = ["assets", "plugins", "styles", "plugin-links.json", "data.json"];
export function createPathManager(app: MainApp) {
  let projectDir: string;
  const inProjects = new Map<(typeof PathsInProjects)[number], string>();
  return {
    updateProjectDir: async () => {
      projectDir = await app.settings.get("projectPath");
      PathsInProjects.forEach((p) => inProjects.set(p, join(projectDir, p)));
    },
    getProjectDir: () => projectDir,
    inProject: (path: (typeof PathsInProjects)[number]) => inProjects.get(path)!,
    storePath,
    userDataPath,
    sdkDir,
    appResource,
    templateDir,
    templates: {
      default: join(templateDir, "projects/default.repair"),
      empty: join(templateDir, "projects/empty.repair")
    }
  };
}

export type PathManager = Prettify<ReturnType<typeof createPathManager>>;
