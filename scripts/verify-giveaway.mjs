#!/usr/bin/env node
import { readFileSync, statSync } from 'node:fs';
import {
  ANNOUNCEMENTS,
  GIVEAWAY_ENDS_AT,
  GIVEAWAY_ID,
  announcementById,
  isAnnouncementOpen,
  openAnnouncements,
} from '../src/lib/announcements.js';

const fail = (msg) => {
  console.error(`verify-giveaway: ${msg}`);
  process.exit(1);
};

const giveaway = announcementById(GIVEAWAY_ID);
if (!giveaway) fail('missing giveaway announcement');
if (giveaway.endsAt !== GIVEAWAY_ENDS_AT) fail('endsAt must be the shared constant');
if (giveaway.href !== '/giveaway') fail('banner must link to /giveaway');
if (!giveaway.message.includes('Orlando') || !giveaway.message.includes('Oct 1')) {
  fail('banner copy drifted');
}
if (giveaway.linkLabel !== 'How to enter') fail('link label must be How to enter');

if (new Date(GIVEAWAY_ENDS_AT).toISOString() !== '2026-10-02T06:59:59.999Z') {
  fail(`endsAt parsed as ${new Date(GIVEAWAY_ENDS_AT).toISOString()}`);
}

const lastOpen = new Date('2026-10-01T23:59:00-07:00');
const atEnd = new Date(GIVEAWAY_ENDS_AT);
const firstClosed = new Date('2026-10-02T00:00:00-07:00');

if (!isAnnouncementOpen(giveaway, lastOpen)) fail('still open at 23:59 local');
if (!isAnnouncementOpen(giveaway, atEnd)) fail('inclusive through the stated end instant');
if (isAnnouncementOpen(giveaway, firstClosed)) fail('must close at 2026-10-02 00:00 America/Los_Angeles');
if (openAnnouncements(firstClosed).length !== 0) fail('no announcement stays open after the deadline');
if (ANNOUNCEMENTS[0].id !== GIVEAWAY_ID) fail('giveaway should be the first announcement row');

const page = readFileSync('src/pages/Giveaway.jsx', 'utf8');
const footer = readFileSync('src/components/Footer.jsx', 'utf8');
const app = readFileSync('src/App.jsx', 'utf8');
const navbar = readFileSync('src/components/Navbar.jsx', 'utf8');

if (!page.includes('This giveaway has ended')) fail('ended state copy missing');

const REEL_URL = 'https://www.instagram.com/reel/DdwVzwmABiw/';
const reelTokens = page.match(/https:\/\/www\.instagram\.com\/reel\/[^\s"'`)<]+/g) || [];
if (reelTokens.length !== 1 || reelTokens[0] !== REEL_URL) {
  fail(`reel URL must be exactly ${REEL_URL}`);
}
if (reelTokens[0].includes('?') || reelTokens[0].includes('igsh') || page.includes('igsh')) {
  fail('reel URL must not include igsh or a query');
}
const reelAt = page.indexOf(REEL_URL);
const reelAnchor = page.slice(page.lastIndexOf('<a', reelAt), page.indexOf('>', reelAt));
if (!reelAnchor.includes('target="_blank"')) fail('reel link needs target="_blank"');
if (!reelAnchor.includes('noopener')) fail('reel link needs rel noopener');
const endedFn = page.slice(page.indexOf('function GiveawayEnded'), page.indexOf('function GiveawayOpen'));
if (endedFn.includes('/reel/') || endedFn.includes('Watch the giveaway reel')) {
  fail('ended state must not show the reel CTA');
}
if (/<iframe/i.test(page) || page.includes('instagram.com/embed')) fail('no Instagram embed');
if (!page.includes('https://www.instagram.com/pa_mindsetmatters/')) fail('mindset matters URL');
if (!page.includes('https://www.instagram.com/societyofaddictionmedicinepas/')) fail('SAMPA instagram URL');
if (!footer.includes('https://www.instagram.com/societyofaddictionmedicinepas/')) {
  fail('footer Instagram URL changed');
}
if (!page.includes(footer.match(/https:\/\/www\.instagram\.com\/societyofaddictionmedicinepas\//)[0])) {
  fail('giveaway SAMPA Instagram must match the footer');
}
for (const line of [
  'Like and save the post',
  'Tag a PA or PA student',
  'Why does addiction medicine education matter in your practice?',
  'share to your story and tag us',
  'Travel and lodging not included',
  'psych-congress-pa-institute.webp',
]) {
  if (!page.includes(line)) fail(`page missing: ${line}`);
}
if (!app.includes('path="/giveaway"')) fail('route missing');
if (!navbar.includes('AnnouncementBanner')) fail('banner not mounted in Navbar');

const flyer = statSync('public/giveaway/psych-congress-pa-institute.webp');
if (flyer.size > 200_000) fail(`flyer is ${flyer.size} bytes`);
if (flyer.size < 10_000) fail('flyer looks empty');

console.log('verify-giveaway: ok');
