import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";
import { logger } from "../logs/logger";
import { toKebabCase } from "@shared/stringUtils";

function keyAndPath(key: string | string[], safe: boolean = true): [string, string[]] {
  const arr = Array.isArray(key) ? key : key.split(".");
  const k = toKebabCase(arr[0]);
  return [k === Store.SETTING_KEY && safe ? `_${k}` : k, arr.toSpliced(0, 1)];
}

function isPlainObject(val: any) {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function deletePropertyAt(data: any, keys: string[], _step = 0): any {
  if (!isPlainObject(data)) return data;
  const currentKey = keys[_step];
  if (!(currentKey in data)) return data;
  if (_step === keys.length - 1) {
    const { [currentKey]: _, ...rest } = data;
    return rest;
  }
  return { ...data, [currentKey]: deletePropertyAt(data[currentKey], keys, _step + 1) };
}

function setPropertyAt(data: any, keys: string[], val: any, _step = 0): any {
  if (_step === keys.length) return val;

  if (!isPlainObject(data)) data = {};
  const currentKey = keys[_step];
  return { ...data, [currentKey]: setPropertyAt(data[currentKey], keys, val, _step + 1) };
}

export class Store {
  static SETTING_KEY = "settings";

  #stores: Map<string, any> = new Map();
  #storePath: string;
  constructor(storePath: string) {
    this.#storePath = storePath;
  }
  async #getData(k: string, forceUpdate: boolean): Promise<any> {
    if (!forceUpdate) {
      const existing = this.#stores.get(k);
      if (existing) return existing;
    }
    let data;
    try {
      const content = await readFile(join(this.#storePath, `${k}.json`), "utf8");
      data = JSON.parse(content);
    } catch {
      data = {};
    }
    this.#stores.set(k, data);
    return data;
  }
  async #setData(k: string, value: any) {
    this.#stores.set(k, value);
    try {
      await mkdir(this.#storePath, { recursive: true });
      await writeFile(join(this.#storePath, `${k}.json`), JSON.stringify(value, null, 2), "utf8");
    } catch (err: any) {
      logger.source("store").error("An error occurred while storing data: ", err);
    }
  }
  async get(key: string | string[], forceUpdate: boolean = false, safe = true) {
    const [k, p] = keyAndPath(key, safe);
    let result: any = await this.#getData(k, forceUpdate);
    for (const current of p) {
      if (!result || !(current in result)) return undefined;
      result = result[current];
    }
    return result;
  }
  async set(key: string | string[], value: any, safe = true) {
    const [k, p] = keyAndPath(key, safe);
    return this.#setData(k, setPropertyAt(await this.#getData(k, false), p, value));
  }
  async delete(key: string | string[], safe = true) {
    const [k, p] = keyAndPath(key, safe);
    const data = await this.#getData(k, false);
    return this.#setData(k, p.length ? deletePropertyAt(data, p) : {});
  }
}
