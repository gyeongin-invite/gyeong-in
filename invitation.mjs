import { getMapLinks } from "./map-links.mjs";

const button = document.getElementById("naver-map-link");
let fallbackTimer;
let detachListeners = () => {};

button.addEventListener("click", (event) => {
  const isTouchIpad = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  const userAgent = isTouchIpad ? "iPad" : navigator.userAgent;
  const links = getMapLinks(userAgent, window.location.href.split("#")[0]);
  if (!links.app || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  clearTimeout(fallbackTimer);
  detachListeners();

  if (links.platform === "android") {
    window.location.assign(links.app);
    return;
  }

  // A successful app handoff hides the page; cancel the web fallback then.
  let handedOff = false;
  const stopFallback = () => {
    handedOff = true;
    clearTimeout(fallbackTimer);
    detachListeners();
  };
  const onVisibility = () => {
    if (document.hidden) stopFallback();
  };
  detachListeners = () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", stopFallback);
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", stopFallback, { once: true });
  const clickedAt = Date.now();
  fallbackTimer = setTimeout(() => {
    detachListeners();
    if (!handedOff && !document.hidden && Date.now() - clickedAt < 3000) {
      window.location.assign(links.web);
    }
  }, 1700);
  window.location.assign(links.app);
});

