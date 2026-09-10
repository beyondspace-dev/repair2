import { app, shell } from "electron";
import { createDialogs } from "../system/dialog";
import type { MainApp } from "./mainApp";
import { createBoot } from "../system/boot";

export function createSystem(_app: MainApp) {
  return {
    app,
    dialog: createDialogs(_app),
    shell,
    boot: createBoot()
  };
}
