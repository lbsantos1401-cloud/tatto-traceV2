(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const imageInput = $("imageInput");
  const emptyState = $("emptyState");
  const imageStage = $("imageStage");
  const traceImage = $("traceImage");
  const lockButton = $("lockButton");
  const lockIcon = $("lockIcon");
  const lockShield = $("lockShield");
  const lockedIndicator = $("lockedIndicator");
  const controls = $("controls");
  const zoomSlider = $("zoomSlider");
  const zoomValue = $("zoomValue");
  const zoomIn = $("zoomIn");
  const zoomOut = $("zoomOut");
  const resetButton = $("resetButton");
  const fitButton = $("fitButton");
  const toast = $("toast");
  const workspace = $("workspace");

  let imageLoaded = false;
  let locked = false;
  let scale = 1;
  let objectUrl = null;
  let toastTimer = null;

  const MIN_SCALE = 0.25;
  const MAX_SCALE = 3;

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function render() {
    const percent = Math.round(scale * 100);
    traceImage.style.transform = `scale(${scale})`;
    zoomSlider.value = percent;
    zoomValue.textContent = `${percent}%`;
  }

  function setScale(nextScale) {
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    render();
  }

  function fitImage() {
    if (!imageLoaded || !traceImage.naturalWidth || !traceImage.naturalHeight) return;

    const stageWidth = imageStage.clientWidth;
    const stageHeight = imageStage.clientHeight;

    const padding = Math.min(stageWidth, stageHeight) * 0.10;
    const availableWidth = Math.max(1, stageWidth - padding * 2);
    const availableHeight = Math.max(1, stageHeight - padding * 2);

    const fitScale = Math.min(
      availableWidth / traceImage.naturalWidth,
      availableHeight / traceImage.naturalHeight
    );

    // 100% means the image's natural pixel size. The fitted scale is allowed
    // to be smaller than 100% on high-resolution photos.
    setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, fitScale)));
    showToast("Imagem ajustada à tela");
  }

  function reset() {
    if (!imageLoaded) return;
    setScale(1);
    showToast("Escala redefinida para 100%");
  }

  function setLocked(value) {
    locked = value;

    lockButton.classList.toggle("locked", locked);
    lockIcon.textContent = locked ? "🔒" : "🔓";
    lockButton.setAttribute("aria-label", locked ? "Desbloquear desenho" : "Travar desenho");
    lockButton.title = locked ? "Desbloquear desenho" : "Travar desenho";

    // Only the drawing area is shielded. The lock button remains above it,
    // so the user can unlock without moving the image.
    lockShield.classList.toggle("hidden", !locked);
    lockedIndicator.classList.toggle("hidden", !locked);

    // While locked, the zoom controls and image-changing controls are disabled.
    [imageInput, zoomSlider, zoomIn, zoomOut, resetButton, fitButton].forEach((el) => {
      el.disabled = locked;
    });

    if (locked) {
      showToast("Tela travada — pode apoiar o papel e copiar");
    } else {
      showToast("Tela desbloqueada");
    }
  }

  function loadImage(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Escolha uma imagem válida");
      return;
    }

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }

    objectUrl = URL.createObjectURL(file);

    traceImage.onload = () => {
      imageLoaded = true;
      emptyState.classList.add("hidden");
      imageStage.classList.remove("hidden");
      controls.classList.remove("hidden");

      setLocked(false);
      setScale(1);
      showToast("Desenho carregado");
    };

    traceImage.onerror = () => {
      imageLoaded = false;
      showToast("Não foi possível abrir essa imagem");
    };

    traceImage.src = objectUrl;
  }

  imageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    loadImage(file);
    event.target.value = "";
  });

  zoomSlider.addEventListener("input", () => {
    setScale(Number(zoomSlider.value) / 100);
  });

  zoomIn.addEventListener("click", () => {
    setScale(scale + 0.05);
  });

  zoomOut.addEventListener("click", () => {
    setScale(scale - 0.05);
  });

  resetButton.addEventListener("click", reset);
  fitButton.addEventListener("click", fitImage);

  lockButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setLocked(!locked);
  });

  // Defensive touch handling: the shield consumes touch/pointer input while
  // locked, so a pen/finger touching the display cannot drag, zoom or select
  // the image. The lock button is outside the shield's interaction layer.
  ["touchstart", "touchmove", "touchend", "pointerdown", "pointermove", "pointerup", "contextmenu"]
    .forEach((eventName) => {
      lockShield.addEventListener(eventName, (event) => {
        event.preventDefault();
        event.stopPropagation();
      }, { passive: false });
    });

  // Prevent browser gestures such as pinch zoom inside the workspace.
  workspace.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
  workspace.addEventListener("gesturechange", (event) => event.preventDefault(), { passive: false });
  workspace.addEventListener("gestureend", (event) => event.preventDefault(), { passive: false });

  // If the browser/PWA sends a Back navigation while locked, try to unlock
  // first instead of leaving the tracing screen. This is best-effort because
  // browser back behavior is controlled by the host browser.
  window.addEventListener("popstate", () => {
    if (locked) setLocked(false);
  });

  window.addEventListener("resize", () => {
    // Keep the drawing centered and at its selected scale after rotation/
    // browser UI changes.
    render();
  });

  // Make Android/browser back unlock first when this page has a history entry.
  history.pushState({ tracing: true }, "", window.location.href);

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && locked) {
      setLocked(false);
    }
  });

  // Initial UI state.
  controls.classList.remove("hidden");
  render();
})();
      
