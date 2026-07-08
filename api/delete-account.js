import { stripeClient, supabaseAdmin, requireUser, json } from './_lib/clients.js';

// POST → permanently delete the signed-in user's account. Added for the mobile
// app: App Store guideline 5.1.1(v) requires in-app account deletion for any
// app with sign-in (the website may link to this later too).
//
// Order matters:
//   1. Cancel any Stripe subscriptions FIRST — if this fails we abort, so we
//      never leave someone being billed with no account. The Stripe customer
//      record itself is kept (financial/refund history), only stripped of
//      subscriptions; Stripe remains billing's source of truth.
//   2. Delete the auth user. profiles.id → auth.users is ON DELETE CASCADE and
//      favorites.user_id → profiles cascades too; posts.author_id is SET NULL,
//      so an author's published posts survive (author_name is denormalized).
export async function POST(request) {
  try {
    const user = await requireUser(request);
    if (!user) return json({ error: 'Sign in required' }, 401);

    const admin = supabaseAdmin();
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    // 1. Stop all future billing.
    if (profile?.stripe_customer_id) {
      const stripe = stripeClient();
      const subs = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: 'all',
        limit: 100,
      });
      const cancelable = subs.data.filter(
        (s) => s.status !== 'canceled' && s.status !== 'incomplete_expired'
      );
      for (const sub of cancelable) {
        await stripe.subscriptions.cancel(sub.id);
      }
    }

    // 2. Delete the account (cascades profile, favorites).
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return json({ ok: true });
  } catch (err) {
    console.error('delete-account:', err);
    return json({ error: 'Could not finish deleting the account. Your sign-in still works — please try again.' }, 500);
  }
}
