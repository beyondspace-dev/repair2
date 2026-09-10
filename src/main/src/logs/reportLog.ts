import { toKebabCase } from "@shared/stringUtils";
import {
  normalizeLogLevel,
  normalizeLogSubject,
  stringifyLogValue,
  type LogEntry,
  type LogLevel
} from "./logEntry";
import type { LogContent } from "@shared/logContent";
import type { LogEntryInput } from "@shared/log.types";
import type { NewDialogs } from "../system/dialog";
import type { LogStore } from "./logStore";
import type { MainApp } from "../app/mainApp";
import type { ToastTypes } from "@shared/toast.types";

export type LogPayload = Omit<LogEntryInput, "createdAt" | "updatedAt" | "count"> & {
  log?: boolean;
  dialog?: boolean;
  toast?: boolean;
};

const LOG_SEGMENT_MAX_LENGTH = 16;

function getSubjectLabel(subject: ReturnType<typeof normalizeLogSubject>) {
  if (!subject) return null;
  return [subject.id, subject.type, subject.instanceId].filter(Boolean).join(" / ") || null;
}

function getOtherType(level: LogLevel, forToast: true): ToastTypes;
function getOtherType(level: LogLevel, forToast?: false): "error" | "warning" | "info";
function getOtherType(level: LogLevel, forToast: boolean = false) {
  if (level === "error") return "error";
  if (level === "warning") return "warning";
  return forToast ? "normal" : "info";
}

function compactSegment(value: string) {
  if (value.length <= LOG_SEGMENT_MAX_LENGTH) return value;

  const sideLength = Math.floor((LOG_SEGMENT_MAX_LENGTH - 4) / 2);
  const left = value.slice(0, sideLength);
  const right = value.slice(value.length - sideLength);
  return `${left}....${right}`;
}

function normalizeLogSegment(value: string) {
  return compactSegment(toKebabCase(value) || "log");
}

function shouldLogByDefault(level: LogLevel) {
  return level === "error" || level === "warning";
}

function makeLogFileContent({
  source,
  subject,
  subjectLabel,
  detailText
}: {
  source: string;
  subject: ReturnType<typeof normalizeLogSubject>;
  subjectLabel: string | null;
  detailText: string;
}) {
  return [
    source ? `Source: ${source}` : null,
    subjectLabel ? `Subject: ${subjectLabel}` : null,
    subject ? JSON.stringify(subject, null, 4) : null,
    detailText
  ]
    .filter(Boolean)
    .join("\n\n");
}

function writeLogFileLater({
  makeLogFile,
  type,
  source,
  subject,
  subjectLabel,
  detailText
}: {
  makeLogFile?: (type: string, content: string) => Promise<string>;
  type: string;
  source: string;
  subject: ReturnType<typeof normalizeLogSubject>;
  subjectLabel: string | null;
  detailText: string;
}) {
  if (typeof makeLogFile !== "function") return;

  makeLogFile(
    normalizeLogSegment(type),
    makeLogFileContent({ source, subject, subjectLabel, detailText })
  ).catch(() => {});
}

export type ReportLog = (
  payload: LogPayload | (LogPayload & { content: LogContent }),
  processedDetail?: boolean
) => LogEntry;

export function createLogReporter({
  makeLogFile,
  app
}: {
  makeLogFile?: (type: string, content: string) => Promise<string>;
  app: MainApp;
}): ReportLog {
  function reportLog(
    {
      level = "info",
      content = null,
      source = "app",
      subject = null,
      log = undefined,
      dialog = false,
      toast = false,
      type = null,
      phase = null,
      from
    }: LogPayload | (LogPayload & { content: LogContent }),
    processedInput = false
  ): LogEntry {
    const normalizedLevel = normalizeLogLevel(level);
    const normalizedSubject = normalizeLogSubject(subject);
    const normalizedSource = source ?? "app";
    const normalizedType = type ?? `${normalizedSource}-log`;
    const subjectLabel = getSubjectLabel(normalizedSubject);

    const entry = app.logStore.record(
      {
        type: normalizedType,
        source: normalizedSource,
        level: normalizedLevel,
        subject: normalizedSubject,
        phase,
        content,
        from
      },
      processedInput
    );
    const detailText = stringifyLogValue(entry.content);

    if (log ?? shouldLogByDefault(normalizedLevel)) {
      writeLogFileLater({
        makeLogFile,
        type: normalizedType,
        source: normalizedSource,
        subject: normalizedSubject,
        subjectLabel,
        detailText
      });
    }

    if (dialog) {
      app.system.dialog.showMessageBox({
        type: getOtherType(entry.level),
        title: "Repair2",
        message: `${entry.level} at ${entry.source}`,
        detail: detailText,
        noLink: true
      });
    }

    if (toast) {
      app.message.sendToEditor("toast:show", {
        type: getOtherType(entry.level, true),
        title: entry.content[0]?.toString() ?? `${entry.level} at ${entry.source}`,
        content: entry.content.length > 1 ? entry.content.toSpliced(0, 1).join(" ") : undefined
      });
    }

    return entry;
  }

  return reportLog;
}
