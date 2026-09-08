import type {
  SettingField,
  StringField,
  NumberField,
  SelectField,
  CheckboxField,
  SpecialField,
  SpecialFieldTypeMap
} from "./settings.types";

export const SettingFields = [
  {
    id: "startOnBoot",
    name: "부팅 시 자동 시작",
    type: "checkbox"
  },
  {
    id: "anchorDisplay",
    name: "기준 디스플레이",
    description: "창을 표시할 위치의 기준점이 될 디스플레이를 지정합니다.",
    type: "display"
  },
  {
    id: "defaultSerialPath",
    name: "기본 시리얼 포트",
    description:
      '"포트 번호"와 "연결 키워드"가 지정되지 않은 시리얼 통신 연결에서 이 포트를 기본으로 사용합니다.',
    type: "serialPath",
    nullable: true
  },
  {
    id: "projectPath",
    name: "프로젝트 경로",
    description: "이 경로에 프로젝트 파일을 작성하고 수정합니다.",
    type: "string",
    requireRestart: true
  }
] as const satisfies SettingField[];

type SettingFieldUnion = (typeof SettingFields)[number];

export type SettingValue<F extends SettingField> =
  | (F extends StringField
      ? string
      : F extends SpecialField
        ? SpecialFieldTypeMap[F["type"]]
        : F extends NumberField
          ? number
          : F extends CheckboxField
            ? boolean
            : F extends SelectField
              ? keyof F["options"][0]
              : never)
  | (F["nullable"] extends true ? null : never);

export type SettingValueMap = {
  [k in SettingFieldUnion["id"]]: SettingValue<Extract<SettingFieldUnion, { id: k }>>;
};

export type SettingId = SettingFieldUnion["id"];
