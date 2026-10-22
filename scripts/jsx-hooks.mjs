import { readFile } from 'node:fs/promises';
import { dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const ENV_BINDING = 'globalThis.__SAMPA_IMPORT_META_ENV';

function shimEnv(source) {
  if (!source.includes('import.meta.env')) return source;
  return source.replaceAll('import.meta.env', ENV_BINDING);
}

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (!specifier.startsWith('.') || /\.(js|jsx)$/.test(specifier)) throw error;
    try {
      return await nextResolve(`${specifier}.js`, context);
    } catch {
      return nextResolve(`${specifier}.jsx`, context);
    }
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.jsx')) {
    const source = shimEnv(await readFile(fileURLToPath(url), 'utf8'));
    const { code } = transformSync(source, {
      loader: 'jsx',
      format: 'esm',
      jsx: 'automatic',
      sourcefile: url,
    });
    return { format: 'module', source: code, shortCircuit: true };
  }
  if (url.startsWith('file:') && url.endsWith('.js') && !url.includes('/node_modules/')) {
    const path = fileURLToPath(url);
    if (path.startsWith(`${repoRoot}${sep}`)) {
      const source = await readFile(path, 'utf8');
      if (source.includes('import.meta.env')) {
        return { format: 'module', source: shimEnv(source), shortCircuit: true };
      }
    }
  }
  return nextLoad(url, context);
}
