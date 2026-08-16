import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from '../components/LegalPage';

const CONTACT_FORM_URL = 'https://forms.gle/YqYYRVE9z2nCYdNz5';

export default function Privacy() {
  return (
    <LegalPage label="Legal" title="Privacy Policy" effectiveDate="August 7, 2026">
      <p>
        The Society of Addiction Medicine Physician Associates ("SAMPA," "we,"
        "us") operates <strong>www.addictionpas.org</strong>, a professional
        membership association for physician associates practicing addiction
        medicine. SAMPA, Inc. is a Wyoming corporation and a 501(c)(3)
        nonprofit organization (EIN 42-2288772). This policy explains what information we collect,
        why, and the choices you have.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>You can read everything public on this site without an account, and we don't track who you are when you do.</li>
        <li>You can subscribe to <strong>SAMPA Updates</strong> by email without becoming a member (double opt-in via Brevo).</li>
        <li>If you create an account, we collect your name and email, plus any professional details you choose to add.</li>
        <li>Active members can use a <strong>member networking directory</strong> to find each other. That directory is not public. You control whether you appear and whether peers see your email or phone.</li>
        <li>Payments are handled by Stripe — <strong>we never see or store your card number</strong>.</li>
        <li>This is a site for clinicians. <strong>We do not collect patient information of any kind.</strong></li>
        <li>We don't sell your information, and we don't show ads.</li>
      </ul>

      <h2>Information we collect</h2>

      <h3>Visitors (no account)</h3>
      <p>
        Reading our news, key points, and other public pages requires no account
        and no personal information. We do not use advertising trackers or
        third-party analytics. Like nearly every website, our hosting providers
        keep standard, short-lived server logs (such as IP address and browser
        type) for security and operations.
      </p>
      <p>
        If you use the public newsletter form, we collect the email address you
        submit so we can send a confirmation message and — only after you
        confirm — add you to our <strong>SAMPA Updates</strong> list. That list
        is for organizational and news updates. Membership is not required.
        Email delivery and list management are handled by{' '}
        <strong>Brevo</strong> (see Service providers).
      </p>
      <p>
        If you request an employer or institutional membership invoice, we
        collect the name, email, employer, billing contact, address, membership
        level, term, and any notes you submit so staff can send a SAMPA invoice.
        That request is emailed to SAMPA officers (treasurer, with a copy to
        the site operator). It is not a payment and does not create a Stripe
        charge.
      </p>

      <h3>Accounts</h3>
      <p>
        When you sign in with Google, Google shares your name and email address
        with us. When you sign in with an email link, we collect your email
        address. That's what creates your account — there is no password for us
        to store. Your sign-in email is how we identify your membership account
        (for example after payment) and how we contact you about the account if
        needed.
      </p>

      <h3>Account contact (for SAMPA)</h3>
      <p>
        On your dashboard you may add a mobile phone number and choose
        newsletter or text-message preferences. We use this so SAMPA can reach
        you about membership, the organization, and (if you opt in) updates. It
        is not shown to other members unless you also choose to share that same
        contact information in the member directory (see below).
      </p>

      <h3>Directory profile (for peer networking)</h3>
      <p>
        You may also complete a <strong>directory profile</strong>: name,
        credentials, optional NPI, home/membership state, and one or more
        organizations or employers (each with role/title, practice setting,
        city, state, and optional website). You can share your account email
        and phone with other members, or enter a different directory email
        and/or phone (for example a work inbox if you sign in with a personal
        Gmail). These are professional details about you as a clinician — never
        information about patients. Everything is optional and editable on your
        dashboard.
      </p>

      <h3>Membership and payments</h3>
      <p>
        Membership dues are processed by <strong>Stripe</strong>. Your card
        number, billing address, and payment credentials go directly to Stripe
        and are never seen or stored by SAMPA. From Stripe we store only: your
        membership tier, membership status, renewal date, and Stripe's customer
        reference ID, so the site can show your membership and grant member
        benefits. Stripe's handling of your data is described in{' '}
        <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe's privacy policy</a>.
      </p>

      <h3>Saved articles</h3>
      <p>
        If you save news articles to your account, we store which articles you
        saved so your dashboard can show them. Only you (and site
        administrators) can see your saved list.
      </p>

      <h2>Member networking directory</h2>
      <p>
        Active members can browse a <strong>member networking directory</strong>
        so physician associates in addiction medicine can find and contact each
        other for professional networking. The directory is{' '}
        <strong>not part of the public website</strong> — only signed-in active
        members (and authorized SAMPA staff) can open it.
      </p>
      <p>
        <strong>What peers may see when you are listed:</strong> name,
        credentials, organizations and roles, practice settings, locations
        (city/state), optional organization websites, Board badge if applicable,
        and email and/or phone only if you turn on those share options.
      </p>
      <p>
        <strong>What peers do not see:</strong> your billing or payment data,
        Stripe identifiers, newsletter/SMS preferences, NPI number, staff-only
        permission flags, or other internal account fields. NPI, if you provide
        it, is for SAMPA membership operations (for example the staff roster),
        not for peer directory cards.
      </p>
      <p>
        <strong>Default listing:</strong> when your membership is active, you
        appear in the directory by default so members can find each other without
        an extra step. You can uncheck "Show me in the member directory" on your
        dashboard at any time and disappear from peer listings immediately.
        Defaults for contact: email sharing is on when you are listed (so peers
        have a way to reach you for networking); phone sharing is off. You can
        change either anytime, or point the directory at a work email instead of
        your sign-in address.
      </p>
      <p>
        <strong>Staff roster (separate):</strong> a small set of authorized SAMPA
        people (for example membership committee or admins) can access an
        internal roster for membership operations — pledges, billing status, and
        related admin work. That is not the same as the peer directory, uses
        stricter access controls, and is not available to ordinary members.
      </p>

      <h2>What we do NOT collect</h2>
      <p>
        SAMPA's website serves clinicians and students of the profession. We do
        not collect, store, or process patient information or protected health
        information (PHI). Reading clinical content on this site does not
        identify you to us, and we make no attempt to infer anything about you
        or your patients from what you read.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>To operate your account, membership, and member benefits.</li>
        <li>To process dues and send receipts (via Stripe).</li>
        <li>To run the member networking directory under the listing and contact choices you set.</li>
        <li>To operate membership (staff roster) for people authorized to manage memberships.</li>
        <li>To send <strong>SAMPA Updates</strong> and related organizational email — only if you've opted in (public double opt-in or member preference), and you can unsubscribe anytime.</li>
        <li>To respond when you contact us, including employer or institutional invoice requests.</li>
        <li>To keep the site secure and understand aggregate (not individual) usage.</li>
      </ul>
      <p>
        We do not sell personal information, and we do not share it with
        advertisers. Ever. We also do not sell or rent the member directory.
      </p>

      <h2>Service providers</h2>
      <p>These companies process data on our behalf to run the site:</p>
      <ul>
        <li><strong>Supabase</strong> — our database and sign-in infrastructure (stores accounts and profiles).</li>
        <li><strong>Stripe</strong> — payment processing and billing management.</li>
        <li><strong>Vercel</strong> — website hosting.</li>
        <li><strong>Brevo</strong> — email delivery for magic-link / auth messages and for the public <strong>SAMPA Updates</strong> newsletter list (and related campaigns). Brevo's handling of subscriber data is described in{' '}
          <a href="https://www.brevo.com/legal/privacypolicy/" target="_blank" rel="noopener noreferrer">Brevo's privacy policy</a>.</li>
        <li><strong>Google</strong> — the optional "Sign in with Google" service.</li>
      </ul>
      <p>
        Beyond these providers, we disclose personal information only if
        required by law, or as part of a reorganization of SAMPA as a nonprofit
        entity (in which case this policy would continue to apply). Other members
        see only the directory fields you allow (as described above) — that is
        member-to-member visibility you control, not a sale of your data.
      </p>

      <h2>Cookies and local storage</h2>
      <p>
        We use your browser's local storage for one purpose: keeping you signed
        in. There are no advertising cookies and no cross-site tracking.
      </p>

      <h2>Retention and deletion</h2>
      <p>
        We keep your account information for as long as you have an account. If
        you'd like your account and profile deleted, contact us via the{' '}
        <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">contact form</a>{' '}
        and we'll remove them. Billing records may be retained where required
        for tax and accounting purposes.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>View and edit your profile and directory settings anytime on your <Link to="/dashboard">dashboard</Link>.</li>
        <li>Hide yourself from the member directory, or share/unshare email and phone, with the checkboxes on that page.</li>
        <li>Use a directory email or phone that differs from your sign-in / account contact.</li>
        <li>Opt out of member newsletter preferences with the checkbox on your dashboard.</li>
        <li>Unsubscribe from <strong>SAMPA Updates</strong> (public or member) via the link in any email we send through Brevo.</li>
        <li>Manage or cancel your membership through the billing portal on your dashboard.</li>
        <li>Request a copy or deletion of your information via the <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">contact form</a>.</li>
      </ul>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit, access to member records is restricted by
        database-level rules, peer directory data is limited to an allowlisted
        set of fields, and payment credentials never touch our systems. No
        method of storage or transmission is 100% secure, but we design so that
        the most sensitive data (your card) is held by Stripe, not us, and peer
        networking never exposes billing details.
      </p>

      <h2>Children</h2>
      <p>
        This site is intended for clinicians and adult students of the
        profession, and is not directed at children under 13.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy, we'll post the new version here and update the
        effective date above. Material changes affecting members will be called
        out in member communications when practical.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy or your data? Reach us through the{' '}
        <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">SAMPA contact form</a>.
      </p>
    </LegalPage>
  );
}
