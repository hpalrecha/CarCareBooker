import path from "path";

/**
 * The repository root, from `import.meta.dirname` of the calling module.
 *
 * In production the server is one esbuild bundle at `dist/index.js`, so the root is one
 * level up. When run from source (tsx in dev and tests) the module lives in
 * `apps/api/src`, three levels down. Static folders (`attached_assets`, `uploads`) and the
 * dev `index.html` hang off this root in both cases.
 */
export function repoRoot(dirname: string): string {
  const posix = dirname.split(path.sep).join("/");
  return path.resolve(dirname, posix.endsWith("/apps/api/src") ? "../../.." : "..");
}
