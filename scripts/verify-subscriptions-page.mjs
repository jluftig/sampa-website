import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../src/lib/authState.js';
import Subscriptions from '../src/pages/Subscriptions.jsx';
import NewsletterConfirmed from '../src/pages/NewsletterConfirmed.jsx';

const auth = {
  loading: false,
  user: null,
  profile: null,
  signOut() {},
};

function render(node, path) {
  return renderToStaticMarkup(createElement(
    MemoryRouter,
    { initialEntries: [path] },
    createElement(AuthContext.Provider, { value: auth }, node),
  ));
}

test('submitting with nothing checked asks for a newsletter and does not post', () => {
  const page = readFileSync(new URL('../src/pages/Subscriptions.jsx', import.meta.url), 'utf8');
  const start = page.indexOf('const onSubmit');
  const submit = page.slice(start, page.indexOf('apiPost', start));
  assert.match(submit, /Choose at least one newsletter\./);
  const boxAt = page.indexOf('type="checkbox"');
  const boxes = page.slice(boxAt, page.indexOf('setSelected', boxAt));
  assert.match(boxes, /if \(checked\) setError\(null\)/);
  const news = readFileSync(new URL('../src/pages/News.jsx', import.meta.url), 'utf8');
  const footer = readFileSync(new URL('../src/components/Footer.jsx', import.meta.url), 'utf8');
  assert.match(news, /to="\/subscriptions"/);
  assert.match(news, /Manage subscriptions/);
  assert.match(footer, /to="\/subscriptions"/);
  assert.match(footer, /Manage subscriptions/);
});

test('the subscriptions page offers three lists and warns that unchecked lists are removed', () => {
  const markup = render(createElement(Subscriptions), '/subscriptions');
  assert.match(markup, /<h1[^>]*>\s*Manage subscriptions\s*<\/h1>/);
  assert.match(markup, /People can choose the SAMPA emails they want\./);
  assert.match(markup, /confirm before anything is removed/);
  assert.equal(/unchecked lists are removed/.test(markup), false);
  assert.match(markup, /<label[^>]*>[\s\S]*Daily News Roundup[\s\S]*<\/label>/);
  assert.match(markup, /<label[^>]*>[\s\S]*Weekly Newsletter[\s\S]*<\/label>/);
  assert.match(markup, /<label[^>]*>[\s\S]*Weekly Topic Roundup[\s\S]*<\/label>/);
  const boxes = markup.match(/<input[^>]*type="checkbox"[^>]*>/g) || [];
  assert.equal(boxes.length, 3);
  assert.equal(boxes.some((tag) => /\schecked(?:=|\s|>)/.test(tag)), false);
  assert.equal(markup.includes('SAMPA Updates'), false);
});

test('inherited list names fall back to the weekly confirmation', () => {
  for (const list of ['toString', 'constructor', '__proto__']) {
    const markup = render(
      createElement(NewsletterConfirmed),
      `/newsletter-confirmed?list=${encodeURIComponent(list)}`,
    );
    assert.match(markup, /the SAMPA Weekly Newsletter/);
    assert.match(markup, /Read the news/);
    const main = markup.slice(markup.indexOf('<main'), markup.indexOf('</main>'));
    assert.equal(main.includes('href=""'), false);
    assert.equal(main.includes('>undefined<'), false);
  }
});

test('weekly confirmation names the SAMPA Weekly Newsletter', () => {
  const withQuery = render(createElement(NewsletterConfirmed), '/newsletter-confirmed?list=weekly');
  assert.match(withQuery, /the SAMPA Weekly Newsletter/);
  const bare = render(createElement(NewsletterConfirmed), '/newsletter-confirmed');
  assert.match(bare, /the SAMPA Weekly Newsletter/);
  assert.equal(bare.includes('SAMPA Updates'), false);
});

test('topic confirmation names the Weekly Topic Roundup', () => {
  const markup = render(createElement(NewsletterConfirmed), '/newsletter-confirmed?list=topic');
  assert.match(markup, /subscribed to the Weekly Topic Roundup/);
  assert.equal(markup.includes('Friday'), false);
});

test('a confirm link shows a confirm button and removes nothing on load', () => {
  const payload = Buffer.from(JSON.stringify({ e: 'a@b.co', l: ['daily', 'topic'], x: 1 })).toString('base64url');
  const markup = render(createElement(Subscriptions), `/subscriptions?confirm=${payload}.sig`);
  assert.match(markup, /Confirm and stop these emails/);
  assert.match(markup, /Daily News Roundup, Weekly Topic Roundup/);
  assert.equal(markup.includes('type="email"'), false);
});

test('topic confirmation links to the news page, not a missing roundup route', () => {
  const markup = render(createElement(NewsletterConfirmed), '/newsletter-confirmed?list=topic');
  const main = markup.slice(markup.indexOf('<main'), markup.indexOf('</main>'));
  assert.match(main, /href="\/news"/);
  assert.equal(main.includes('/news/topic'), false);
  assert.match(main, /Read the news/);
});
