<script lang="ts">
  import { nanoid } from "nanoid";
  import { forEachRelationId } from "@shared/projectData/relation";
  import {
    createVariantPayload,
    isGroupDescriptor,
    type VariantCases
  } from "@shared/projectData/definitions";
  import { PayloadVariants, type TypePayloadMap } from "@shared/projectData/typePayload";
  import type { RecordKey } from "@shared/constants";
  import type { FieldBinding } from "../../project/mutator";
  import { getMutator } from "../../project/store";
  import Select from "./Select.svelte";
  import type { SelectOption } from "./select.types";

  type TypeName = keyof TypePayloadMap;
  type TypePayloadValue = { type: string; payload: unknown; [key: string]: unknown };

  let {
    binding,
    typeName,
    options: labelMap = {},
    onchange = null
  }: {
    binding: FieldBinding<TypePayloadValue>;
    typeName: TypeName;
    options?: Record<string, string>;
    onchange?: (() => unknown) | null;
  } = $props();

  let value = $derived(binding.value);

  /** Builds submenus that follow the variant case hierarchy (groups). */
  function createTypeOptions(cases: VariantCases, prefix: string[] = []): SelectOption<string>[] {
    return Object.keys(cases).map((key) => {
      const child = cases[key];
      const parts = [...prefix, key];
      const path = parts.join(".");
      const label = labelMap[key] ?? labelMap[path] ?? key;

      if (isGroupDescriptor(child)) {
        return {
          type: "submenu",
          label,
          options: createTypeOptions(child.cases, parts)
        };
      }

      return { value: path, label };
    });
  }

  let typeOptions = $derived(createTypeOptions(PayloadVariants[typeName].cases));
  let selectedLabel = $derived.by(() => {
    if (!value.type) return undefined;
    const shortType = value.type.split(".").at(-1)!;
    return labelMap[value.type] ?? labelMap[shortType] ?? value.type;
  });

  function changeType(nextType: string) {
    if (nextType === value.type) return;

    const mutator = getMutator();
    mutator.transaction(() => {
      const oldOwned: { type: RecordKey; id: string }[] = [];
      const isRootRecord = binding.target.kind === "record" && binding.path.length === 0;

      if (isRootRecord) {
        forEachRelationId(
          binding.target.type,
          value as never,
          ({ type, id }) => oldOwned.push({ type, id }),
          { onlyOwns: true }
        );
      }

      const payload = createVariantPayload(
        PayloadVariants[typeName],
        nextType,
        undefined,
        (type, data) => {
          const id = "id" in data && typeof data.id === "string" ? data.id : nanoid();
          mutator.add(type, id, data);
          return id;
        }
      );
      const nextValue = { ...value, type: nextType, payload };
      binding.set(nextValue);

      if (isRootRecord) {
        const retained = new Set<string>();
        forEachRelationId(
          binding.target.type,
          nextValue as never,
          ({ type, id }) => retained.add(`${type}:${id}`),
          { onlyOwns: true }
        );

        for (const owned of oldOwned) {
          if (!retained.has(`${owned.type}:${owned.id}`)) {
            mutator.deleteTree(owned.type, owned.id);
          }
        }
      }
    });

    onchange?.();
  }
</script>

<div class="types">
  <Select
    value={value.type || null}
    options={typeOptions}
    {selectedLabel}
    placeholder={labelMap[""] ?? "유형 선택"}
    onchange={(nextType) => {
      if (nextType !== null) changeType(nextType);
    }}
  />
</div>

<style>
  .types {
    width: 100%;
  }

  .types :global(.select) {
    width: 100%;
  }
</style>
