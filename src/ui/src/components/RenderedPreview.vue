<template>
  <iframe
    ref="frame"
    class="rendered-frame"
    :class="{ fill: fullHeight }"
    sandbox="allow-same-origin allow-scripts"
    :srcdoc="docHtml"
    :key="docKey"
  />
  
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue';

const props = withDefaults(defineProps<{
  html: string;
  padding?: number;
  fullHeight?: boolean;
}>(), {
  padding: 8,
  fullHeight: false,
});

const frame = ref<HTMLIFrameElement | null>(null);

function buildDoc(html: string) {
  const pad = Number(props.padding) || 0;
  const inject = `<base target=\"_blank\"><style>html,body{margin:0;padding:${pad}px;box-sizing:border-box;background:#fff;color:#000;}</style>`;
  if (/<!doctype/i.test(html) || /<html[\s>]/i.test(html)) {
    // Full HTML document provided: inject our base/style into <head> if present
    if (/<head[\s>]/i.test(html)) {
      return html.replace(/<head[\s>]/i, (m) => `${m}${inject}`);
    }
    // No head tag — return as-is to avoid breaking layout
    return html;
  }
  // Fragment: wrap in minimal document
  return `<!doctype html><html><head><meta charset=\"utf-8\">${inject}</head><body>${html ?? ''}</body></html>`;
}

async function syncHeight() {
  if (props.fullHeight) return; // parent controls height via CSS
  await nextTick();
  const el = frame.value;
  if (!el) return;
  try {
    const doc = el.contentDocument || el.contentWindow?.document;
    if (!doc) return;
    // set to minimal first then grow to content
    el.style.height = '0px';
    const h = Math.max(
      doc.body?.scrollHeight || 0,
      doc.documentElement?.scrollHeight || 0,
      200
    );
    el.style.height = h + 'px';
  } catch {
    // ignore sizing issues
  }
}

onMounted(() => {
  frame.value?.addEventListener('load', () => syncHeight());
  // initial sizing pass
  syncHeight();
});

watch(() => props.html, () => refresh());
watch(() => props.padding, () => refresh());

function refresh() {
  // Set srcdoc to trigger load event
  if (frame.value) frame.value.srcdoc = docHtml.value;
  // After a short delay, if still empty, fallback to blob src
  setTimeout(() => {
    const el = frame.value;
    if (!el) return;
    try {
      const doc = el.contentDocument || el.contentWindow?.document;
      const content = doc?.body?.innerHTML ?? '';
      if (!content || content.trim().length === 0) {
        const blob = new Blob([docHtml.value], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        el.removeAttribute('srcdoc');
        el.src = url;
      }
    } catch {
      // on any error, also fallback
      try {
        const blob = new Blob([docHtml.value], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const el2 = frame.value;
        if (el2) {
          el2.removeAttribute('srcdoc');
          el2.src = url;
        }
      } catch {}
    }
  }, 50);
}

const docHtml = computed(() => buildDoc(props.html));
const docKey = computed(() => String(docHtml.value.length) + ':' + Number(props.fullHeight));
</script>

<style scoped>
.rendered-frame {
  width: 100%;
  border: 0;
  background: #fff;
  display: block;
  min-height: 200px;
}
.rendered-frame.fill {
  height: 100%;
  min-height: 0;
}
</style>
