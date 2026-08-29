import { supabaseAdmin, requireUser, json } from './_lib/clients.js';

const BREVO_BASE = 'https://api.brevo.com/v3';

// GET → SAMPA Updates (Brevo list 3) for the member-viewer roster.
// Footer DOI, Google Group import, and members-on-Updates live here —
// not in profiles. Browser never sees BREVO_API_KEY.

function canView(profile) {
  if (!profile) return false;
  return profile.role === 'admin' || profile.can_view_members === true;
}

async function brevoListContacts(listId) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY is not set');
  const out = [];
  let offset = 0;
  for (;;) {
    const res = await fetch(
      `${BREVO_BASE}/contacts/lists/${listId}/contacts?limit=50&offset=${offset}`,
      { headers: { accept: 'application/json', 'api-key': key } },
    );
    const text = await res.text();
    let data = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }
    if (!res.ok) {
      const err = new Error(`Brevo list contacts → ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    const contacts = data.contacts || [];
    out.push(...contacts);
    if (contacts.length < 50) break;
    offset += 50;
    if (offset > 5000) break;
  }
  return out;
}

export async function GET(request) {
  try {
    const user = await requireUser(request);
    if (!user) return json({ error: 'Sign in required' }, 401);

    const { data: profile } = await supabaseAdmin()
      .from('profiles')
      .select('role, can_view_members, privileged_terms_accepted_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!canView(profile)) {
      return json({ error: 'Member-viewer access required' }, 403);
    }
    if (!profile?.privileged_terms_accepted_at) {
      return json({ error: 'Privileged access agreement required' }, 403);
    }

    const listId = Number(process.env.BREVO_LIST_UPDATES);
    if (!Number.isFinite(listId) || listId <= 0) {
      return json({ error: 'BREVO_LIST_UPDATES is not configured' }, 503);
    }

    const raw = await brevoListContacts(listId);
    const contacts = raw.map((c) => {
      const attrs = c.attributes || {};
      return {
        email: c.email || '',
        firstName: attrs.FIRSTNAME || attrs.FIRST_NAME || '',
        lastName: attrs.LASTNAME || attrs.LAST_NAME || '',
        source: attrs.SOURCE || '',
        memberStatus: attrs.MEMBER_STATUS || '',
        blacklisted: Boolean(c.emailBlacklisted),
        createdAt: c.createdAt || null,
      };
    });

    return json({
      ok: true,
      listId,
      total: contacts.length,
      contacts,
    });
  } catch (err) {
    console.error('admin-updates-list:', err.message || err);
    return json({ error: 'Could not load Updates list' }, err.status === 403 ? 403 : 500);
  }
}
