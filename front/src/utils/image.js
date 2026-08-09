// Small helper to request optimized image variants for common hosts (Unsplash etc.)
export function isUnsplash(url) {
  try {
    const u = new URL(url);
    return u.hostname.includes('images.unsplash.com') || u.hostname.includes('unsplash.com');
  } catch (e) {
    return false;
  }
}

export function optimizeImage(url, opts = {}) {
  if (!url) return url;
  const { w, q = 80, fm = 'webp' } = opts;
  try {
    const u = new URL(url);
    if (isUnsplash(url)) {
      const params = new URLSearchParams(u.search);
      if (w) params.set('w', String(w));
      params.set('auto', 'format');
      if (fm) params.set('fm', fm);
      if (q) params.set('q', String(q));
      u.search = params.toString();
      return u.toString();
    }
    return url;
  } catch (e) {
    return url;
  }
}

export function srcSetFor(url, widths = [400, 800, 1200]) {
  if (!url) return '';
  return widths.map((w) => `${optimizeImage(url, { w })} ${w}w`).join(', ');
}
