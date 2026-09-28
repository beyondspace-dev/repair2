import { matchAccelerator, parseAccelerator, type ParsedAccelerator } from "@shared/accelerator";
import { addGlobalKeyEvent } from "./globalKey";
import { ipc } from "./ipc";

const passwordEl = document.getElementById("repair-editor-password")!;

let accelerator: ParsedAccelerator | null = null;
let password = "";

let inputtingPassword = false;
let currentPassword = "";

function setAccelerator(value: unknown) {
  accelerator = typeof value === "string" ? parseAccelerator(value) : null;
}
function setPassword(value: unknown) {
  password = typeof value === "string" ? value.trim().toUpperCase() : "";
  if (inputtingPassword) stopInputting();
}

ipc
  .invoke("settings:get", "editorAccelerator")
  .then(setAccelerator)
  .catch(() => {});
ipc
  .invoke("settings:get", "editorPassword")
  .then(setPassword)
  .catch(() => {});

ipc.on("settings:changed", (_evt, [key, value]) => {
  if (key === "editorAccelerator") setAccelerator(value);
  else if (key === "editorPassword") setPassword(value);
});

function toPasswordChar(key: string) {
  if (/^[A-Z0-9]$/.test(key)) return key;
  const numpad = /^Numpad([0-9])$/.exec(key);
  return numpad ? numpad[1] : null;
}

function stopInputting() {
  inputtingPassword = false;
  currentPassword = "";
  passwordEl.innerText = "";
  passwordEl.style.display = "none";
}

addGlobalKeyEvent("keydown", (e) => {
  if (!e.key) return;

  if (matchAccelerator(accelerator, e)) {
    if (!password) {
      ipc.send("editor-on");
      return;
    }
    inputtingPassword = true;
    currentPassword = "";
    return;
  }
  if (!inputtingPassword) return;

  if (!password) {
    stopInputting();
    ipc.send("editor-on");
    return;
  }

  const char = toPasswordChar(e.key);
  if (char === null) {
    if (e.key === "Shift" || e.key === "ShiftRight") return;
    stopInputting();
    return;
  }
  if (password[currentPassword.length] !== char) {
    stopInputting();
    return;
  }

  currentPassword += char;
  passwordEl.style.display = "block";
  passwordEl.innerText = currentPassword;

  if (currentPassword.length < password.length) return;
  ipc.send("editor-on");
  setTimeout(stopInputting, 500);
});

window.addEventListener("click", () => {
  if (inputtingPassword) stopInputting();
});
