// The same small audio clip is used for the preview and the pour. Playing it
// from a click first unlocks the media element for later pointer holds on iOS.
export function createPourAudio(element) {
  let previewTimer;
  let pouring = false;

  function clearPreview() {
    if (previewTimer) clearTimeout(previewTimer);
    previewTimer = undefined;
  }

  function stop() {
    pouring = false;
    clearPreview();
    element.pause();
    element.currentTime = 0;
  }

  function start() {
    clearPreview();
    pouring = true;
    element.currentTime = 0;
    // The media element was unlocked by the ON click, so it can play on hold.
    element.play().catch((error) => console.warn('No se pudo reproducir el vertido', error));
  }

  async function activate() {
    clearPreview();
    element.currentTime = 0;
    try {
      // Call play synchronously from the ON click to satisfy mobile browsers.
      await element.play();
      previewTimer = setTimeout(() => {
        if (!pouring) {
          element.pause();
          element.currentTime = 0;
        }
        previewTimer = undefined;
      }, 680);
      return true;
    } catch (error) {
      console.warn('No se pudo activar el audio', error);
      return false;
    }
  }

  return { activate, start, stop };
}
