/**
 * Resolve a public asset path considering Vite's BASE_URL (for GitHub Pages support)
 */
export function resolvePublicAssetPath(path: string): string {
  // @ts-ignore - import.meta.env is provided by Vite
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}
