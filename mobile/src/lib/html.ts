// Tiny HTML parser for article bodies — pure TypeScript, no React Native imports,
// so it's unit-testable in Node (see __tests__/html.test.ts).
//
// Scope: the constrained tag set the website's TipTap editor emits (p, h2/h3,
// strong/em, a, ul/ol/li, blockquote, br — plus img/figure/hr defensively).
// It builds a tree; rendering to native components happens in
// components/article-body.tsx. There is no script execution anywhere (no DOM),
// so this is XSS-safe by construction. Unknown tags keep their children.

export type HNode =
  | { type: 'text'; text: string }
  | { type: 'el'; tag: string; attrs: Record<string, string>; children: HNode[] };

export type HElement = Extract<HNode, { type: 'el' }>;

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, code: string) => {
    if (code[0] === '#') {
      const n =
        code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code] ?? match;
  });
}

function parseAttrs(s: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:-]+)\s*=\s*"([^"]*)"|([a-zA-Z_:-]+)\s*=\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[1]) attrs[m[1].toLowerCase()] = decodeEntities(m[2]);
    else if (m[3]) attrs[m[3].toLowerCase()] = decodeEntities(m[4]);
  }
  return attrs;
}

const VOID_TAGS = new Set(['br', 'img', 'hr']);

/** Parse an HTML fragment into a tree. Tolerant of unclosed/mismatched tags. */
export function parseHtml(html: string): HNode[] {
  const root: HElement = { type: 'el', tag: '#root', attrs: {}, children: [] };
  const stack: HElement[] = [root];
  const re = /<\/?([a-zA-Z0-9]+)([^>]*?)(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[4] != null) {
      top.children.push({ type: 'text', text: decodeEntities(m[4]) });
      continue;
    }
    const tag = m[1].toLowerCase();
    const isClose = m[0][1] === '/';
    if (isClose) {
      // Close the nearest matching open element; ignore stray close tags.
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
    } else {
      const node: HElement = { type: 'el', tag, attrs: parseAttrs(m[2] || ''), children: [] };
      top.children.push(node);
      if (!(m[3] === '/' || VOID_TAGS.has(tag))) stack.push(node);
    }
  }
  return root.children;
}
