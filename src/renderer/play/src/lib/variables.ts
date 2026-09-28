import { registerPluginContextApi } from "./plugin/pluginContext";
import { registerUtils } from "./repairUtils";
import { sendChanges } from "./runtimeMonitor";
import type { Types } from "@shared/projectData/types";

type VarSubscriber = (v: string | null) => void;

function createRuntimeVariable(v: Types.Variable, id: string) {
  return {
    id: id,
    name: v.name,
    value: v.defaultValue,
    defaultValue: v.defaultValue ?? null,
    subscriptions: new Set<VarSubscriber>(),
    set(v: string | null) {
      this.value = v;
      this.subscriptions.forEach((c) => c(v));

      sendChanges("variable", "changed", id, v);
    },
    subscribe(cb: VarSubscriber) {
      this.subscriptions.add(cb);
      return () => this.subscriptions.delete(cb);
    }
  };
}

type RuntimeVariableData = ReturnType<typeof createRuntimeVariable>;

const variables: Map<string, RuntimeVariableData> = new Map();
const variablesByName: Map<string, RuntimeVariableData> = new Map();
export function getVariables() {
  return variables;
}
export function getVariable(id: string) {
  return variables.get(id);
}

export function registerVariables(variableMap: Map<string, Types.Variable>) {
  variables.clear();
  variablesByName.clear();
  variableMap.forEach((v, id) => {
    const runtimeVar = createRuntimeVariable(v, id);
    variables.set(runtimeVar.id, runtimeVar);
    if (runtimeVar.name) variablesByName.set(runtimeVar.name, runtimeVar);
  });
}

export function getVar(id: string) {
  return variables.get(id)?.value;
}

export function setVar(id: string, value: string | null) {
  variables.get(id)?.set(value);
}

export function resetAllVar() {
  variables.forEach((v) => v.set(v.defaultValue));
}

export function subscribe(id: string, callback: VarSubscriber) {
  return variables.get(id)?.subscribe(callback);
}

function getVariableByName(variableName: string) {
  return variablesByName.get(variableName) ?? null;
}

registerUtils("variables", {
  get(variableName) {
    return getVariableByName(variableName)?.value ?? null;
  },
  set(variableName, value) {
    return getVariableByName(variableName)?.set(value);
  },
  subscribe(variableName, callback) {
    return getVariableByName(variableName)?.subscribe(callback);
  }
});

registerPluginContextApi("variable", ({ warn, error, onDispose }) => {
  function getVariable(variableName: string) {
    const v = getVariableByName(variableName);
    if (!v) warn(`Variable does not exist: ${variableName}`);

    return v;
  }

  return {
    get(variableName: string) {
      return getVariable(variableName)?.value;
    },
    set(variableName: string, value: unknown) {
      getVariable(variableName)?.set(value as string);
    },
    subscribe(variableName: string, listener: (value: unknown) => void) {
      const unsubscribe = getVariable(variableName)?.subscribe((value) => {
        try {
          listener(value);
        } catch (err) {
          error(`Variable subscriber failed: ${variableName}`, err);
        }
      });
      if (!unsubscribe) return () => {};
      onDispose(unsubscribe);
      return unsubscribe;
    }
  };
});

export type { RuntimeVariableData };
