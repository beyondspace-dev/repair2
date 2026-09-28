import { mount } from "svelte";
import "./global.css";
import { updateProject } from "./project/store";
import App from "./App.svelte";

updateProject();

const app = mount(App, {
  target: document.getElementById("app")!
});

export default app;
