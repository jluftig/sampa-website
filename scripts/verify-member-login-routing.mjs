#!/usr/bin/env node
// Member Login: signed-in editors → /editor; members → /dashboard;
// signed-out → /login. Join upsell only when THIS profile has no membership.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isActiveMemberProfile,
  isEditorProfile,
  memberLoginHref,
  memberLoginLabel,
  oauthReturnPath,
  postAuthPath,
  safeNext,
  signedInHomePath,
} from '../src/lib/memberHome.js';

const editor = { role: 'editor', email: 'josh@addictionpas.org', membership_status: 'active' };
const admin = { role: 'admin', email: 'luftig@gmail.com', can_edit_news: true, membership_status: 'active' };
const newsFlag = { role: 'member', can_edit_news: true, membership_status: null };
const member = { role: 'member', membership_status: 'active', email: 'pa@example.com' };
const unpaid = { role: 'member', membership_status: null, email: 'luftig@gmail.com', full_name: null };

describe('editor / member detection', () => {
  it('treats admin, legacy editor role, and can_edit_news as editor', () => {
    assert.equal(isEditorProfile(editor), true);
    assert.equal(isEditorProfile(admin), true);
    assert.equal(isEditorProfile(newsFlag), true);
    assert.equal(isEditorProfile(member), false);
    assert.equal(isEditorProfile(unpaid), false);
    assert.equal(isEditorProfile(null), false);
  });

  it('treats only membership_status=active as a paid member', () => {
    assert.equal(isActiveMemberProfile(member), true);
    assert.equal(isActiveMemberProfile(unpaid), false);
    assert.equal(isActiveMemberProfile({ membership_status: 'canceled' }), false);
    assert.equal(isActiveMemberProfile(null), false);
  });
});

describe('signed-in home + Member Login href/label', () => {
  it('sends editors to /editor and everyone else to /dashboard', () => {
    assert.equal(signedInHomePath(editor), '/editor');
    assert.equal(signedInHomePath(admin), '/editor');
    assert.equal(signedInHomePath(newsFlag), '/editor');
    assert.equal(signedInHomePath(member), '/dashboard');
    assert.equal(signedInHomePath(unpaid), '/dashboard');
    assert.equal(signedInHomePath(null), '/dashboard');
  });

  it('signed-out Member Login goes to /login, not /dashboard or /join', () => {
    assert.equal(memberLoginHref({ user: null, profile: null, loading: false }), '/login');
    assert.equal(memberLoginHref({ loading: true }), '/login');
    assert.equal(memberLoginLabel({ user: null, loading: false }), 'Member Login');
  });

  it('signed-in Member Login uses editor vs dashboard label and path', () => {
    assert.equal(memberLoginHref({ user: { id: '1' }, profile: editor, loading: false }), '/editor');
    assert.equal(memberLoginLabel({ user: { id: '1' }, profile: editor, loading: false }), 'Editor');
    assert.equal(memberLoginHref({ user: { id: '2' }, profile: member, loading: false }), '/dashboard');
    assert.equal(memberLoginLabel({ user: { id: '2' }, profile: member, loading: false }), 'Dashboard');
    assert.equal(memberLoginHref({ user: { id: '3' }, profile: unpaid, loading: false }), '/dashboard');
    assert.equal(memberLoginLabel({ user: { id: '3' }, profile: unpaid, loading: false }), 'Dashboard');
  });

  it('treats a held session without a profiles row as signed-out', () => {
    const staleUser = { id: 'stale', email: 'luftig@gmail.com' };
    assert.equal(memberLoginHref({ user: staleUser, profile: null, loading: false }), '/login');
    assert.equal(memberLoginLabel({ user: staleUser, profile: null, loading: false }), 'Member Login');
  });
});

describe('post-auth next + OAuth return', () => {
  it('rejects absolute and protocol-relative nexts', () => {
    assert.equal(safeNext('/editor/members'), '/editor/members');
    assert.equal(safeNext('https://evil.example/phish'), null);
    assert.equal(safeNext('//evil.example'), null);
    assert.equal(safeNext(null), null);
  });

  it('honors an explicit in-app next the profile can actually keep', () => {
    assert.equal(postAuthPath(editor, '/join'), '/join');
    assert.equal(postAuthPath(editor, '/dashboard'), '/dashboard');
    assert.equal(postAuthPath(admin, '/editor/members'), '/editor/members');
    assert.equal(postAuthPath(editor, '/editor/members'), '/editor');
    assert.equal(postAuthPath(member, '/editor/members'), '/dashboard');
    assert.equal(postAuthPath(member, '/news/hello'), '/news/hello');
  });

  it('with no next, editors go to /editor and unpaid accounts stay on /dashboard', () => {
    assert.equal(postAuthPath(editor, null), '/editor');
    assert.equal(postAuthPath(member, null), '/dashboard');
    assert.equal(postAuthPath(unpaid, null), '/dashboard');
  });

  it('OAuth returns to /login when Member Login left next empty', () => {
    assert.equal(oauthReturnPath(null), '/login');
    assert.equal(oauthReturnPath('/join?tier=fellow'), '/join?tier=fellow');
    assert.equal(oauthReturnPath('/dashboard'), '/dashboard');
  });
});

describe('header/footer and login wiring', () => {
  it('Navbar and Footer use MemberLoginLink instead of a hardcoded /dashboard login', () => {
    const navbar = readFileSync(new URL('../src/components/Navbar.jsx', import.meta.url), 'utf8');
    const footer = readFileSync(new URL('../src/components/Footer.jsx', import.meta.url), 'utf8');
    assert.match(navbar, /MemberLoginLink/);
    assert.match(footer, /MemberLoginLink/);
    assert.doesNotMatch(navbar, /to="\/dashboard"[\s\S]*Member Login/);
    assert.doesNotMatch(footer, /to="\/dashboard"[\s\S]*Member Login/);
  });

  it('Login resolves next from the profile after auth and sends OAuth back through /login by default', () => {
    const login = readFileSync(new URL('../src/pages/Login.jsx', import.meta.url), 'utf8');
    assert.match(login, /decideAuthRedirect/);
    assert.match(login, /oauthReturnPath/);
    assert.match(login, /signInWithGoogle\(oauthNext\)/);
    assert.match(login, /signInWithEmail\([^,]+, oauthNext\)/);
    assert.match(login, /sessionUsable/);
    assert.doesNotMatch(login, /if \(!loading && user\)/);
  });

  it('route guards use sessionUsable + guardLoginPath', () => {
    const auth = readFileSync(new URL('../src/components/RequireAuth.jsx', import.meta.url), 'utf8');
    const editor = readFileSync(new URL('../src/components/RequireEditor.jsx', import.meta.url), 'utf8');
    const roster = readFileSync(new URL('../src/components/RequireMemberViewer.jsx', import.meta.url), 'utf8');
    assert.match(auth, /sessionUsable/);
    assert.match(editor, /sessionUsable/);
    assert.match(roster, /sessionUsable/);
    assert.match(auth, /guardLoginPath/);
    assert.match(editor, /guardLoginPath/);
    assert.match(roster, /guardLoginPath/);
  });

  it('dashboard does not call the no-membership upsell when the profile row failed to load', () => {
    const dashboard = readFileSync(new URL('../src/pages/Dashboard.jsx', import.meta.url), 'utf8');
    assert.match(dashboard, /couldn't load a membership profile/);
    assert.match(dashboard, /!profile \?/);
    assert.match(dashboard, /profile\.membership_status/);
  });
});
