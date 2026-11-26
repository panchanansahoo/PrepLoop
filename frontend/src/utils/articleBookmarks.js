export function articleBookmarkKey(slug, source) {
  return `preploop:article:${source === 'editorial' ? 'editorial:' : ''}${slug}`;
}

export function isArticleBookmarked(slug, source) {
  try {
    return localStorage.getItem(articleBookmarkKey(slug, source)) === '1';
  } catch {
    return false;
  }
}
