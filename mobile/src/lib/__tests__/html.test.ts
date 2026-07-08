import { describe, expect, it } from 'vitest';

import { decodeEntities, parseHtml, type HElement } from '../html';

const el = (n: any): HElement => n as HElement;

describe('decodeEntities', () => {
  it('decodes named entities', () => {
    expect(decodeEntities('a &amp; b &lt;c&gt; &nbsp;&mdash;&rsquo;')).toBe('a & b <c>  —’');
  });
  it('decodes decimal and hex numeric entities', () => {
    expect(decodeEntities('&#65;&#x42;')).toBe('AB');
  });
  it('leaves unknown/invalid entities intact', () => {
    expect(decodeEntities('&unknown; &#xZZ;')).toBe('&unknown; &#xZZ;');
  });
});

describe('parseHtml', () => {
  it('parses paragraphs with nested bold/italic', () => {
    const tree = parseHtml('<p>Hello <strong>bold <em>italic</em></strong>!</p>');
    expect(tree).toHaveLength(1);
    const p = el(tree[0]);
    expect(p.tag).toBe('p');
    expect(p.children[0]).toEqual({ type: 'text', text: 'Hello ' });
    const strong = el(p.children[1]);
    expect(strong.tag).toBe('strong');
    expect(el(strong.children[1]).tag).toBe('em');
  });

  it('extracts link hrefs (double and single quoted, with entities)', () => {
    const tree = parseHtml('<p><a href="https://x.com/?a=1&amp;b=2">x</a><a href=\'/y\'>y</a></p>');
    const p = el(tree[0]);
    expect(el(p.children[0]).attrs.href).toBe('https://x.com/?a=1&b=2');
    expect(el(p.children[1]).attrs.href).toBe('/y');
  });

  it('parses lists, including a nested list inside an item', () => {
    const tree = parseHtml('<ul><li>one</li><li>two<ul><li>deep</li></ul></li></ul>');
    const ul = el(tree[0]);
    expect(ul.tag).toBe('ul');
    expect(ul.children).toHaveLength(2);
    const second = el(ul.children[1]);
    // The nested <ul> stays inside its parent <li> rather than being lost.
    expect(el(second.children[1]).tag).toBe('ul');
    expect(el(el(second.children[1]).children[0]).tag).toBe('li');
  });

  it('parses blockquotes containing paragraphs', () => {
    const tree = parseHtml('<blockquote><p>quoted &mdash; text</p></blockquote>');
    const bq = el(tree[0]);
    expect(bq.tag).toBe('blockquote');
    expect(el(bq.children[0]).children[0]).toEqual({ type: 'text', text: 'quoted — text' });
  });

  it('treats br/img/hr as void (self-closing or not)', () => {
    const tree = parseHtml('<p>a<br>b<br/>c</p><img src="https://i.png"><hr>');
    const p = el(tree[0]);
    // br must not swallow following content as children.
    expect(p.children.map((c: any) => c.type)).toEqual(['text', 'el', 'text', 'el', 'text']);
    expect(el(tree[1]).tag).toBe('img');
    expect(el(tree[1]).attrs.src).toBe('https://i.png');
    expect(el(tree[2]).tag).toBe('hr');
  });

  it('keeps children of unknown tags', () => {
    const tree = parseHtml('<p><span data-x="1">kept</span></p>');
    const span = el(el(tree[0]).children[0]);
    expect(span.tag).toBe('span');
    expect(span.children[0]).toEqual({ type: 'text', text: 'kept' });
  });

  it('does not crash or loop on malformed input', () => {
    expect(parseHtml('<p>unclosed <strong>bold')).toBeTruthy();
    expect(parseHtml('</em>stray close</p><p>next</p>')).toBeTruthy();
    expect(parseHtml('<<<>>>')).toBeTruthy();
    expect(parseHtml('')).toEqual([]);
    // Mismatched nesting closes the nearest matching ancestor and continues.
    const tree = parseHtml('<p><em>a</p></em><p>b</p>');
    expect(tree.length).toBeGreaterThanOrEqual(2);
  });

  it('handles a realistic TipTap article body end to end', () => {
    const html =
      '<p>Buprenorphine access <strong>expanded</strong> under the <a href="https://example.org/rule">new rule</a>.</p>' +
      '<h2>What changed</h2>' +
      '<ul><li>X-waiver <em>eliminated</em></li><li>Pharmacy limits eased</li></ul>' +
      '<blockquote><p>&ldquo;A major shift.&rdquo;</p></blockquote>' +
      '<h3>Why it matters</h3><p>More PAs can prescribe.</p>';
    const tree = parseHtml(html);
    expect(tree.map((n: any) => n.tag)).toEqual(['p', 'h2', 'ul', 'blockquote', 'h3', 'p']);
    expect(el(el(tree[3]).children[0]).children[0]).toEqual({
      type: 'text',
      text: '“A major shift.”',
    });
  });
});
