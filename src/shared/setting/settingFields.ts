import type {
  SettingField,
  StringField,
  NumberField,
  SelectField,
  CheckboxField,
  AcceleratorField,
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
    id: "keepAwake",
    name: "절전 모드 방지",
    description:
      "앱이 실행되는 동안 디스플레이가 꺼지거나 시스템이 절전 모드로 전환되지 않도록 합니다.",
    type: "checkbox",
    default: false
  },
  {
    id: "anchorDisplay",
    name: "기준 디스플레이",
    description: "창을 표시할 위치의 기준점이 될 디스플레이를 지정합니다.",
    type: "display"
  },
  {
    id: "alwaysOnTop",
    name: "창을 항상 최상위에 표시",
    description: "플레이 화면과 편집기 창을 다른 창보다 항상 위에 표시합니다.",
    type: "checkbox",
    default: false
  },
  {
    id: "audioOutputHardware",
    name: "오디오 출력 장치",
    description:
      "플레이 화면의 소리를 출력할 장치를 지정합니다. 지정하지 않거나 장치가 연결되어 있지 않으면 시스템 기본 장치를 사용합니다.",
    type: "audioOutput",
    nullable: true
  },
  {
    id: "suppressGlobalKeys",
    name: "시스템 키 비활성화",
    description:
      "플레이 화면에 포커스가 있는 동안 Windows 키, Alt+Tab, Alt+F4 등 시스템 단축키를 막습니다.",
    type: "checkbox",
    default: false
  },
  {
    id: "editorAccelerator",
    name: "편집기 열기 단축키",
    description: "플레이 화면에서 이 단축키를 누르면 편집기를 엽니다.",
    type: "accelerator",
    default: "Ctrl+Shift+E",
    requireModifier: true
  },
  {
    id: "editorPassword",
    name: "편집기 비밀번호",
    description:
      "편집기 열기 단축키를 누른 뒤 이 비밀번호를 입력해야 편집기가 열립니다. 영문 대문자와 숫자만 입력할 수 있습니다.",
    type: "string",
    nullable: true,
    secret: true,
    uppercase: true,
    allowedChars: "A-Z0-9",
    placeholder: "비밀번호 없음"
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
    id: "devMode",
    name: "개발 모드",
    description: "플러그인 코드의 변경과 global.css 파일 수정을 감지해 실시간으로 적용합니다.",
    type: "checkbox",
    default: false
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

type SettingValue<F extends SettingField> =
  | (F extends StringField
      ? string
      : F extends SpecialField
        ? SpecialFieldTypeMap[F["type"]]
        : F extends NumberField
          ? number
          : F extends CheckboxField
            ? boolean
            : F extends AcceleratorField
              ? string
              : F extends SelectField
                ? F["options"][number][0]
                : never)
  | (F["nullable"] extends true ? null : never);

export type SettingFieldValueMap = {
  readonly [k in SettingFieldUnion["id"]]: SettingValue<Extract<SettingFieldUnion, { id: k }>>;
};

export type SettingFieldId = SettingFieldUnion["id"];
