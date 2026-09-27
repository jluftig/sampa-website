#!/usr/bin/env node
// Assert T49 Harrison Keyes Education Committee co-chair on About.
import { LEADERSHIP, listLeadershipByGroup } from '../src/data/leadership.js';

const FORM_BIO =
  'Harrison Keyes currently practices in primary care at Boston Health Care for the Homeless Program. He started in the respite program following his graduation from the MGH Institute of Health Professions in 2018. During the COVID-19 pandemic, Harrison conducted the program’s COVID testing and screening endeavors across Boston’s shelter system. He now works as the medical director of the JYP clinic, overseeing the program’s largest outpatient site, offering primary care, psychiatry, Hep C and HIV care as well as addiction and recovery support. Harrison also volunteers as the Chief Delegate for the Massachusetts Association of PAs.';

const SHANI_ALSO = ['Education chair', 'AAPA HOD Chief Delegate', 'Bylaws and Policy member'];
const SHANI_BIO =
  'Shani Wilson, PA-C, practices addiction medicine, specializing in the treatment of substance use disorders with a particular focus on opioid use disorder and MOUD. Her clinical background also includes primary care, LGBTQ+ health, HIV prevention and treatment, and hepatitis C care. Her involvement with SAMPA reflects a broader commitment to advancing PA practice and leadership in addiction medicine. Shani has served in leadership roles across several PA and community organizations and brings a strong interest in organizational leadership and health equity to her work. A recent professional highlight has been contributing to SAMPA’s advocacy efforts to expand recognition of addiction medicine as an area of advanced PA practice.';

const fail = (msg) => {
  console.error(`verify-harrison-education-cochair: ${msg}`);
  process.exit(1);
};

const harrisonMatches = LEADERSHIP.filter((person) => person.id === 'harrison-keyes');
if (harrisonMatches.length !== 1) {
  fail(`expected one #harrison-keyes card, found ${harrisonMatches.length}`);
}

const harrison = harrisonMatches[0];
if (harrison.name !== 'Harrison Paul Keyes') fail('do not change Harrison’s name');
if (harrison.credentials !== 'MPAS, PA-C') fail('do not change Harrison’s credentials');
if (harrison.role !== 'Director at large') fail(`primary role must stay Director at large (got ${harrison.role})`);
if (!Array.isArray(harrison.also) || harrison.also.length !== 1 || harrison.also[0] !== 'Education co-chair') {
  fail("also must be ['Education co-chair'] (house style: Education chair / Bylaws and Policy co-chair)");
}
if (harrison.location !== 'Boston, MA') fail('do not change Harrison’s location');
if (harrison.bio !== FORM_BIO) fail('do not invent or rewrite Harrison’s form bio');
if (harrison.photo !== '/leadership/harrison-keyes.jpg') fail('keep the existing headshot path');
if (harrison.linkedin !== 'https://www.linkedin.com/in/harrison-keyes-8a3b353a') {
  fail('do not change Harrison’s LinkedIn');
}
if (harrison.group !== 'board') fail('Harrison stays a Director at large in Board and officers');

const shaniMatches = LEADERSHIP.filter((person) => person.id === 'shani-wilson');
if (shaniMatches.length !== 1) fail(`expected one #shani-wilson card, found ${shaniMatches.length}`);
const shani = shaniMatches[0];
if (shani.role !== 'President') fail('Shani remains President');
if (JSON.stringify(shani.also) !== JSON.stringify(SHANI_ALSO)) {
  fail('leave Shani’s also roles unchanged; she remains Education chair');
}
if (shani.bio !== SHANI_BIO) fail('do not change Shani’s bio');

const board = listLeadershipByGroup('board');
const committees = listLeadershipByGroup('committees');
if (!board.some((person) => person.id === 'harrison-keyes')) {
  fail('Harrison missing from board/officers group');
}
if (committees.some((person) => person.id === 'harrison-keyes')) {
  fail('Harrison must not also appear under committees');
}
if (!board.some((person) => person.id === 'shani-wilson' && person.also?.includes('Education chair'))) {
  fail('Shani must still show Education chair on the board card');
}

console.log('verify-harrison-education-cochair: ok');
