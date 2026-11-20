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


function addInvitationMusic() {
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;
  const control = document.createElement("button");
  control.type = "button";
  control.textContent = "OFF";
  control.setAttribute("aria-label", "배경음악");
  control.setAttribute("aria-pressed", "false");
  Object.assign(control.style, {
    position: "absolute", top: "18px", right: "18px", zIndex: "2",
    padding: "0 8px", minWidth: "44px", minHeight: "32px", border: "1px solid #d5b76870", borderRadius: "20px",
    background: "#141e35", color: "#f9e4ab", font: "600 11px system-ui, sans-serif", cursor: "pointer"
  });
  document.querySelector(".invitation").append(control);

  let context;
  let source;
  let buffer;
  let requested = true;

  // A quiet original piano-style phrase, voiced in eight bars of 3/4.
  function makePhrase() {
    const rate = context.sampleRate;
    const beat = 0.88;
    const result = context.createBuffer(1, Math.round(rate * beat * 24), rate);
    const samples = result.getChannelData(0);
    const bars = [
      [48,55,60, 76,74,72], [47,55,62, 71,74,79],
      [45,52,60, 76,72,69], [43,52,59, 71,76,74],
      [41,48,57, 72,69,65], [40,48,55, 67,72,76],
      [38,45,53, 74,71,67], [43,50,59, 71,74,72]
    ];
    function note(midi, time, strength, decay) {
      const start = Math.round(time * rate);
      const phase = 2 * Math.PI * 440 * 2 ** ((midi - 69) / 12);
      for (let i = 0; i < rate * 2.2; i++) {
        const seconds = i / rate;
        const envelope = Math.min(1, seconds / 0.012) * Math.exp(-seconds / decay)
          * Math.min(1, (2.2 - seconds) / 0.18);
        const tone = Math.sin(phase * seconds) + 0.24 * Math.sin(2 * phase * seconds)
          + 0.09 * Math.sin(3 * phase * seconds);
        samples[(start + i) % samples.length] += tone * envelope * strength;
      }
    }
    bars.forEach((bar, index) => {
      for (let step = 0; step < 3; step++) {
        const time = (index * 3 + step) * beat;
        note(bar[step], time, 0.037, 0.55);
        note(bar[step + 3], time + 0.055, 0.064, 0.46);
      }
    });
    return result;
  }

  function showState() {
    const playing = Boolean(source && context?.state === "running");
    control.setAttribute("aria-pressed", String(playing));
    control.textContent = playing ? "ON" : "OFF";
  }

  function startMusic() {
    if (source || !requested || context.state !== "running") return;
    buffer ||= makePhrase();
    source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const volume = context.createGain();
    volume.gain.setValueAtTime(0, context.currentTime);
    volume.gain.linearRampToValueAtTime(0.6, context.currentTime + 0.65);
    source.connect(volume).connect(context.destination);
    source.start();
    showState();
  }

  function tryPlay() {
    try {
      if (!context) {
        context = new AudioEngine();
        context.onstatechange = () => {
          startMusic();
          showState();
        };
      }
      context.resume().then(startMusic).catch(showState);
      startMusic();
    } catch {
      showState();
    }
  }

  control.addEventListener("click", () => {
    if (source && context.state === "running") {
      requested = false;
      source.stop();
      source = undefined;
      showState();
    } else {
      requested = true;
      tryPlay();
    }
  });
  function startOnInteraction(event) {
    if (!event.isTrusted || control.contains(event.target) || !requested || source) return;
    tryPlay();
  }

  // A permitted gesture can resume audio when autoplay was blocked.
  document.addEventListener("click", startOnInteraction, { capture: true });
  document.addEventListener("keydown", startOnInteraction, { capture: true });
  document.addEventListener("touchend", startOnInteraction, { capture: true, passive: true });
  tryPlay();
}

addInvitationMusic();


