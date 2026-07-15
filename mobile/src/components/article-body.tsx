// Renders article body_html as native components.
//
// Parsing lives in src/lib/html.ts (pure, unit-tested); this file maps the tree
// to <Text>/<View>. The tag set is the website's constrained TipTap output
// (p, h2/h3, strong/em, a, ul/ol/li incl. nesting, blockquote, br — plus
// img/figure/hr defensively). Unknown tags degrade to their children. No script
// execution anywhere (no DOM), so this is XSS-safe by construction.

import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseHtml, type HElement, type HNode } from '@/lib/html';

function openLink(href?: string) {
  if (href) WebBrowser.openBrowserAsync(href).catch(() => {});
}

const LIST_TAGS = new Set(['ul', 'ol']);

export function ArticleBody({ html }: { html: string }) {
  const theme = useTheme();
  const nodes = parseHtml(html);

  // Inline content → strings / <Text> spans nested inside a <Text>.
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

  // A list item may contain inline content AND nested lists (TipTap supports
  // Tab-indented sub-lists). Render the inline run as the item text, then any
  // nested lists indented beneath it.
  function renderListItem(li: HElement, marker: string, key: string): ReactNode {
    const inline = li.children.filter((c) => !(c.type === 'el' && LIST_TAGS.has(c.tag)));
    const sublists = li.children.filter((c): c is HElement => c.type === 'el' && LIST_TAGS.has(c.tag));
    return (
      <View key={key} style={styles.li}>
        <Text style={[styles.bullet, { color: theme.tint }]}>{marker}</Text>
        <View style={styles.liBody}>
          <Text style={[styles.p, styles.liText, { color: theme.text }]}>
            {renderInline(inline, key)}
          </Text>
          {sublists.map((sub, j) => renderList(sub, `${key}-sub${j}`))}
        </View>
      </View>
    );
  }

  function renderList(list: HElement, key: string): ReactNode {
    const ordered = list.tag === 'ol';
    const items = list.children.filter((c): c is HElement => c.type === 'el' && c.tag === 'li');
    return (
      <View key={key} style={styles.list}>
        {items.map((li, j) => renderListItem(li, ordered ? `${j + 1}.` : '•', `${key}-${j}`))}
      </View>
    );
  }

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
        case 'ol':
          out.push(renderList(node, key));
          break;
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
          if (node.attrs.src) {
            out.push(
              <Image key={key} source={{ uri: node.attrs.src }} style={styles.img} contentFit="cover" />
            );
          }
          break;
        case 'figure':
        case 'div':
          out.push(...renderBlocks(node.children, key));
          break;
        default:
          out.push(paragraph(node.children, key));
      }
    });
    return out;
  }

  return <View>{renderBlocks(nodes, 'b')}</View>;
}

const styles = StyleSheet.create({
  p: { fontFamily: Fonts.sans, fontSize: 17, lineHeight: 27, marginBottom: Spacing.three },
  h2: { fontFamily: Fonts.serifBold, fontSize: 24, lineHeight: 30, marginTop: Spacing.two, marginBottom: Spacing.two },
  h3: { fontFamily: Fonts.semibold, fontSize: 20, lineHeight: 26, marginTop: Spacing.two, marginBottom: Spacing.one },
  list: { marginBottom: Spacing.three, gap: Spacing.one },
  li: { flexDirection: 'row', gap: Spacing.two, paddingRight: Spacing.two },
  liBody: { flex: 1 },
  bullet: { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 27, minWidth: 18 },
  liText: { marginBottom: 0 },
  quote: { borderLeftWidth: 3, paddingLeft: Spacing.three, marginBottom: Spacing.three },
  hr: { height: 1, marginVertical: Spacing.three },
  img: { width: '100%', height: 200, borderRadius: Radius.md, marginBottom: Spacing.three },
});
