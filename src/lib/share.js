// Copy text to the clipboard; returns true on success. Falls back to the
// hidden-textarea trick for older/insecure contexts without the async API.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

// True when the device offers a native share sheet (iOS/Android/some desktop).
export function canNativeShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

// Open the native share sheet when available, otherwise copy the URL.
// Returns 'shared' | 'dismissed' (user closed the sheet) | 'copied' | false.
export async function shareOrCopy({ title, text, url }) {
  if (canNativeShare()) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'dismissed';
      /* NotAllowedError etc. — fall through to copying */
    }
  }
  return (await copyText(url || text)) ? 'copied' : false;
}
