import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

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
  if (!url.endsWith('.jsx')) return nextLoad(url, context);
  const source = await readFile(fileURLToPath(url), 'utf8');
  const { code } = transformSync(source, {
    loader: 'jsx',
    format: 'esm',
    jsx: 'automatic',
    sourcefile: url,
  });
  return { format: 'module', source: code, shortCircuit: true };
}
