import { createApp, watch } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { useMessagesStore } from "./stores/messages";
import '@mdi/font/css/materialdesignicons.css';
import "./style.css";

import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

const vuetify = createVuetify({
  components,
  directives
});


const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(vuetify);
app.mount("#app");

const store = useMessagesStore();

const link =
  (document.querySelector("link[rel='icon']") as HTMLLinkElement) ||
  (() => {
    const l = document.createElement("link");
    l.rel = "icon";
    document.head.appendChild(l);
    return l;
  })();
link.href = "/favicon.ico";
const img = new Image();
img.src = link.href;
const canvas = document.createElement("canvas");
const size = 18;
canvas.width = size;
canvas.height = size;
const ctx = canvas.getContext("2d")!;

function updateFavicon(count: number) {
  if (!img.complete) return;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  if (count > 0) {
    ctx.fillStyle = "#d00";
    ctx.beginPath();
    ctx.arc(size - 8, 8, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "10px sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(count < 100? String(count) : '99+', size - 8, 8);
  }
  link.href = canvas.toDataURL("image/png");
}

img.onload = () => updateFavicon(store.unreadCount);
watch(
  () => store.unreadCount,
  (cnt) => updateFavicon(cnt),
  { immediate: true }
);
