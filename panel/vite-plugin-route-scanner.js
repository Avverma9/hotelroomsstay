/**
 * vite-plugin-route-scanner
 *
 * Scans every .jsx / .js file under src/ at build time and extracts:
 *   - navigate('/static/path')
 *   - navigate(`/prefix/${expr}`)   → /prefix/:id
 *   - <Link to="/static/path">
 *   - <Link to={`/prefix/${expr}`}> → /prefix/:id
 *
 * Exposes results as virtual module: "virtual:scanned-routes"
 *   export const SCANNED_ROUTES: string[]
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const VIRTUAL_ID = 'virtual:scanned-routes'
const RESOLVED_ID = '\0virtual:scanned-routes'

/**
 * Recursively walk a directory and return all file paths matching given extensions.
 */
function walk(dir, exts, results = []) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return results
  }
  for (const name of entries) {
    const full = join(dir, name)
    let stat
    try { stat = statSync(full) } catch { continue }
    if (stat.isDirectory()) {
      walk(full, exts, results)
    } else if (exts.includes(extname(name))) {
      results.push(full)
    }
  }
  return results
}

/**
 * Extract all navigable route paths from a source string.
 * Returns deduplicated array of normalised path strings.
 */
function extractRoutes(src) {
  const found = new Set()

  // ── 1. navigate('/static/path') or navigate("/static/path")
  const staticNav = /navigate\(\s*['"](\/?\/[^'"?\s]+?)['"]\s*[,)]/g
  let m
  while ((m = staticNav.exec(src)) !== null) {
    found.add(normalise(m[1]))
  }

  // ── 2. navigate(`/prefix/${expr}…`) — template literal with at least one ${…}
  const tmplNav = /navigate\(\s*`(\/[^`]*?)\$\{[^}]*\}([^`]*?)`\s*[,)]/g
  while ((m = tmplNav.exec(src)) !== null) {
    found.add(templateToPattern(m[1], m[2]))
  }

  // ── 3. <Link to="/static/path">  or  to={"/static/path"}
  const staticLink = /\bto=\{?\s*['"](\/?\/[^'"?\s]+?)['"]\s*\}?/g
  while ((m = staticLink.exec(src)) !== null) {
    found.add(normalise(m[1]))
  }

  // ── 4. <Link to={`/prefix/${expr}…`}>
  const tmplLink = /\bto=\{\s*`(\/[^`]*?)\$\{[^}]*\}([^`]*?)`\s*\}/g
  while ((m = tmplLink.exec(src)) !== null) {
    found.add(templateToPattern(m[1], m[2]))
  }

  // Filter to only real route-like paths
  return [...found].filter(
    (p) => p.startsWith('/') && p.length > 1 && !p.includes(' '),
  )
}

/**
 * Strip trailing slash and query/hash noise.
 */
function normalise(path = '') {
  return path.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/'
}

/**
 * Convert a template literal with a dynamic segment into a pattern.
 * e.g.  prefix="/tours/"  suffix=""  →  "/tours/:id"
 *       prefix="/cars/"   suffix="/edit"  →  "/cars/:id/edit"
 */
function templateToPattern(prefix, suffix) {
  const base = normalise(prefix)
  const tail = suffix ? suffix.replace(/^\//, '').replace(/\/+$/, '') : ''
  return tail ? `${base}/:id/${tail}` : `${base}/:id`
}

/**
 * Scan the entire src/ tree, extract routes from all JS/JSX files,
 * and return a deduplicated sorted array.
 */
function scanAllRoutes(rootDir) {
  const srcDir = join(rootDir, 'src')
  const files = walk(srcDir, ['.jsx', '.js', '.tsx', '.ts'])
  const all = new Set()

  for (const file of files) {
    try {
      const code = readFileSync(file, 'utf8')
      for (const r of extractRoutes(code)) all.add(r)
    } catch {
      // ignore unreadable files
    }
  }

  return [...all].sort()
}

export function routeScanner() {
  let rootDir = process.cwd()
  let cachedCode = null

  return {
    name: 'vite-route-scanner',

    configResolved(config) {
      rootDir = config.root
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return

      if (!cachedCode) {
        const routes = scanAllRoutes(rootDir)
        cachedCode = `export const SCANNED_ROUTES = ${JSON.stringify(routes, null, 2)}\n`
      }

      return cachedCode
    },

    // Invalidate cache on any source file change in dev mode
    handleHotUpdate({ file, server }) {
      if ((file.endsWith('.jsx') || file.endsWith('.js')) && file.includes('/src/')) {
        cachedCode = null
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
      }
    },
  }
}
