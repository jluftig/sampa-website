#!/usr/bin/env node
// Assert T48 Kerith Hartmann ASIO officer card on About.
import {
  LEADERSHIP,
  listLeadershipByGroup,
} from '../src/data/leadership.js';

const ASIO_EXPAND = 'Advocacy, Success, and Impact Officer';
const FORM_BIO =
  'Kerith Hartmann, PA-C, finds meaning in work through therapeutic relationships with patients as they navigate change. Her academic interests include teaching, interprofessional dialogue and supporting best practices. She leans on approaches based on patient-centered, trauma-informed and evidence-based care.';

const fail = (msg) => {
  console.error(`verify-kerith-asio: ${msg}`);
  process.exit(1);
};

const matches = LEADERSHIP.filter((person) => person.id === 'kerith-hartmann');
if (matches.length !== 1) fail(`expected one #kerith-hartmann card, found ${matches.length}`);

const kerith = matches[0];
if (kerith.name !== 'Kerith Hartmann') fail('spelling must stay Kerith Hartmann (double n)');
if (kerith.role !== 'ASIO') fail(`primary role must be ASIO (got ${kerith.role})`);
if (kerith.roleExpand !== ASIO_EXPAND) fail('roleExpand must be the bylaws ASIO expansion');
if (kerith.group !== 'board') fail('ASIO is an officer — card belongs in Board and officers');
if (kerith.bio !== FORM_BIO) fail('do not invent or rewrite Kerith’s form bio');
if (kerith.photo !== '/leadership/kerith-hartmann.jpg') fail('keep the form headshot path');
if (!kerith.also?.includes('Certification Co-Chair')) fail('keep Certification Co-Chair as a secondary role');
if (!kerith.also?.includes('News and Newsletter Member')) fail('keep News and Newsletter Member');

const board = listLeadershipByGroup('board');
const committees = listLeadershipByGroup('committees');
if (!board.some((person) => person.id === 'kerith-hartmann')) {
  fail('Kerith missing from board/officers group');
}
if (committees.some((person) => person.id === 'kerith-hartmann')) {
  fail('Kerith must not also appear under committees');
}

const treasurer = board.find((person) => person.role === 'Treasurer');
const firstDal = board.find((person) => person.role === 'Director at large');
if (!treasurer || kerith.sort <= treasurer.sort) {
  fail('ASIO should sort after Treasurer');
}
if (!firstDal || kerith.sort >= firstDal.sort) {
  fail('ASIO should sort before directors at large');
}

const vacant = LEADERSHIP.filter((person) => !person.name || /vacant/i.test(person.role));
if (vacant.length) fail('do not add unnamed or vacant officer cards');

console.log('verify-kerith-asio: ok');
