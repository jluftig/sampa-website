// Minimal, dependency-free HTML renderer for article bodies.
//
// The body_html comes from a constrained TipTap editor (paragraphs, H2/H3, bold,
// italic, links, ordered/unordered lists, blockquotes — see the web repo's
// CLAUDE.md). Rather than depend on react-native-render-html (unmaintained; leans
// on function-component defaultProps that React 19 ignores), we parse that small
// tag set into native <Text>/<View>. Unknown tags degrade to their children.
// There is no <script> execution here (no DOM), so this is XSS-safe by construction.

import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HNode =
  | { type: 'text'; text: string }
  | { type: 'el'; tag: string; attrs: Record<string, string>; children: HNode[] };

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

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : _;
    }
    return ENTITIES[code] ?? _;
  });
}

function parseAttrs(s: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:-]+)\s*=\s*"([^"]*)"|([a-zA-Z_:-]+)\s*=\s*'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (m[1]) attrs[m[1].toLowerCase()] = m[2];
    else if (m[3]) attrs[m[3].toLowerCase()] = m[4];
  }
  return attrs;
}

const VOID_TAGS = new Set(['br', 'img', 'hr']);

function parseHtml(html: string): HNode[] {
  const root: HNode = { type: 'el', tag: '#root', attrs: {}, children: [] };
  const stack: HNode[] = [root];
  const re = /<\/?([a-zA-Z0-9]+)([^>]*?)(\/?)>|([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1] as Extract<HNode, { type: 'el' }>;
    if (m[4] != null) {
      top.children.push({ type: 'text', text: decodeEntities(m[4]) });
      continue;
    }
    const tag = m[1].toLowerCase();
    const isClose = m[0][1] === '/';
    if (isClose) {
      for (let i = stack.length - 1; i > 0; i--) {
        if ((stack[i] as Extract<HNode, { type: 'el' }>).tag === tag) {
          stack.length = i;
          break;
        }
      }
    } else {
      const node: HNode = { type: 'el', tag, attrs: parseAttrs(m[2] || ''), children: [] };
      top.children.push(node);
      if (!(m[3] === '/' || VOID_TAGS.has(tag))) stack.push(node);
    }
  }
  return root.children;
}

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote', 'figure', 'hr', 'img', 'div']);

export function ArticleBody({ html }: { html: string }) {
  const theme = useTheme();
  const nodes = parseHtml(html);

  const openLink = (href?: string) => {
    if (href) WebBrowser.openBrowserAsync(href).catch(() => {});
  };

  // Inline content → an array of strings / <Text> spans to sit inside a <Text>.
  function renderInline(children: HNode[], keyBase: string): ReactNode[] {
    const out: ReactNode[] = [];
    children.forEach((node, i) => {
      const key = `${keyBase}-${i}`;
      if (node.type === 'text') {
        out.push(node.text);
        return;
      }
      switch (node.tag) {
        case 'strong':
        case 'b':
          out.push(
            <Text key={key} style={{ fontFamily: Fonts.bold }}>
              {renderInline(node.children, key)}
            </Text>
          );
          break;
        case 'em':
        case 'i':
          out.push(
            <Text key={key} style={{ fontStyle: 'italic' }}>
              {renderInline(node.children, key)}
            </Text>
          );
          break;
        case 'a':
          out.push(
            <Text
              key={key}
              onPress={() => openLink(node.attrs.href)}
              style={{ color: theme.tint, fontFamily: Fonts.medium }}>
              {renderInline(node.children, key)}
            </Text>
          );
          break;
        case 'br':
          out.push('\n');
          break;
        default:
          // Unknown inline (or a stray block) → render its children inline.
          out.push(...renderInline(node.children, key));
      }
    });
    return out;
  }

  const paragraph = (children: HNode[], key: string, extra?: object) => (
    <Text key={key} style={[styles.p, { color: theme.text }, extra]}>
      {renderInline(children, key)}
    </Text>
  );

  // Block-level rendering.
  function renderBlocks(children: HNode[], keyBase: string): ReactNode[] {
    const out: ReactNode[] = [];
    children.forEach((node, i) => {
      const key = `${keyBase}-${i}`;
      if (node.type === 'text') {
        if (node.text.trim()) out.push(paragraph([node], key));
        return;
      }
      switch (node.tag) {
        case 'h1':
        case 'h2':
          out.push(
            <Text key={key} style={[styles.h2, { color: theme.text }]}>
              {renderInline(node.children, key)}
            </Text>
          );
          break;
        case 'h3':
        case 'h4':
          out.push(
            <Text key={key} style={[styles.h3, { color: theme.text }]}>
              {renderInline(node.children, key)}
            </Text>
          );
          break;
        case 'ul':
        case 'ol': {
          const ordered = node.tag === 'ol';
          const items = node.children.filter((c) => c.type === 'el' && c.tag === 'li');
          out.push(
            <View key={key} style={styles.list}>
              {items.map((li, j) => (
                <View key={`${key}-${j}`} style={styles.li}>
                  <Text style={[styles.bullet, { color: theme.tint }]}>
                    {ordered ? `${j + 1}.` : '•'}
                  </Text>
                  <Text style={[styles.p, styles.liText, { color: theme.text }]}>
                    {renderInline((li as Extract<HNode, { type: 'el' }>).children, `${key}-${j}`)}
                  </Text>
                </View>
              ))}
            </View>
          );
          break;
        }
        case 'blockquote':
          out.push(
            <View key={key} style={[styles.quote, { borderLeftColor: theme.tint }]}>
              {renderBlocks(node.children, key)}
            </View>
          );
          break;
        case 'hr':
          out.push(<View key={key} style={[styles.hr, { backgroundColor: theme.border }]} />);
          break;
        case 'img':
          node.attrs.src ? (
            out.push(
              <Image key={key} source={{ uri: node.attrs.src }} style={styles.img} contentFit="cover" />
            )
          ) : null;
          break;
        case 'figure':
        case 'div':
          out.push(...renderBlocks(node.children, key));
          break;
        default:
          // p and anything else with inline content.
          out.push(paragraph(node.children, key));
      }
    });
    return out;
  }

  return <View style={styles.container}>{renderBlocks(nodes, 'b')}</View>;
}

const styles = StyleSheet.create({
  container: { gap: 0 },
  p: { fontFamily: Fonts.sans, fontSize: 17, lineHeight: 27, marginBottom: Spacing.three },
  h2: { fontFamily: Fonts.serifBold, fontSize: 24, lineHeight: 30, marginTop: Spacing.two, marginBottom: Spacing.two },
  h3: { fontFamily: Fonts.semibold, fontSize: 20, lineHeight: 26, marginTop: Spacing.two, marginBottom: Spacing.one },
  list: { marginBottom: Spacing.three, gap: Spacing.one },
  li: { flexDirection: 'row', gap: Spacing.two, paddingRight: Spacing.two },
  bullet: { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 27, minWidth: 18 },
  liText: { flex: 1, marginBottom: 0 },
  quote: { borderLeftWidth: 3, paddingLeft: Spacing.three, marginBottom: Spacing.three },
  hr: { height: 1, marginVertical: Spacing.three },
  img: { width: '100%', height: 200, borderRadius: Radius.md, marginBottom: Spacing.three },
});
