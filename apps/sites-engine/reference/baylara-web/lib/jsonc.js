// Minimal JSONC reader: strips // and /* */ comments outside strings, then JSON.parse.
// Lets data files carry field-by-field comments (e.g. content/buildings/*.jsonc).
import fs from 'node:fs';

export function parseJsonc(text) {
  let out = '';
  let inStr = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const n = text[i + 1];
    if (inStr) {
      out += c;
      if (c === '\\') { out += n; i++; } else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') { inStr = true; out += c; continue; }
    if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++; i++; continue; }
    out += c;
  }
  // allow trailing commas
  out = out.replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(out);
}

export function readJsonc(file) {
  return parseJsonc(fs.readFileSync(file, 'utf8'));
}
