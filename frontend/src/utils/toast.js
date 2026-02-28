// simple global toast using CustomEvent

export function showToast(message, type = 'success', duration = 2000) {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type, duration } }));
}