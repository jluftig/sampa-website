import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from '../components/LegalPage';

const CONTACT_FORM_URL = 'https://forms.gle/YqYYRVE9z2nCYdNz5';

export default function Privacy() {
  return (
    <LegalPage label="Legal" title="Privacy Policy" effectiveDate="July 6, 2026">
      <p>
        The Society of Addiction Medicine Physician Associates ("SAMPA," "we,"
        "us") operates <strong>www.addictionpas.org</strong>, a professional
        membership association for physician associates practicing addiction
        medicine. SAMPA, Inc. is a Wyoming corporation pending 501(c)(3)
        nonprofit status. This policy explains what information we collect,
        why, and the choices you have.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>You can read everything public on this site without an account, and we don't track who you are when you do.</li>
        <li>If you create an account, we collect your name and email, plus any professional details you choose to add.</li>
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

      <h3>Accounts</h3>
      <p>
        When you sign in with Google, Google shares your name and email address
        with us. When you sign in with an email link, we collect your email
        address. That's what creates your account — there is no password for us
        to store.
      </p>

      <h3>Member profile (provided by you)</h3>
      <p>
        On your dashboard you may add account contact details (mobile phone and
        newsletter preferences; your sign-in email comes from Google or magic
        link) and a directory profile for peer networking: name, credentials,
        NPI, organizations/employers (each with role, city, state, practice
        setting, and optional website), and optional directory-specific email
        or phone when you do not want peers to use your account contact. These
        are optional and editable by you at any time. They are professional
        details about you as a clinician — never information about patients.
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
        <li>To send the SAMPA newsletter and member updates — only if you've opted in, and you can opt out on your dashboard at any time.</li>
        <li>To respond when you contact us.</li>
        <li>To keep the site secure and understand aggregate (not individual) usage.</li>
      </ul>
      <p>
        We do not sell personal information, and we do not share it with
        advertisers. Ever.
      </p>

      <h2>Service providers</h2>
      <p>These companies process data on our behalf to run the site:</p>
      <ul>
        <li><strong>Supabase</strong> — our database and sign-in infrastructure (stores accounts and profiles).</li>
        <li><strong>Stripe</strong> — payment processing and billing management.</li>
        <li><strong>Vercel</strong> — website hosting.</li>
        <li><strong>Google</strong> — the optional "Sign in with Google" service.</li>
      </ul>
      <p>
        Beyond these providers, we disclose personal information only if
        required by law, or as part of a reorganization of SAMPA as a nonprofit
        entity (in which case this policy would continue to apply).
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
        <li>View and edit your profile details anytime on your <Link to="/dashboard">dashboard</Link>.</li>
        <li>Opt out of the newsletter with one checkbox on the same page.</li>
        <li>Manage or cancel your membership through the billing portal on your dashboard.</li>
        <li>Request a copy or deletion of your information via the <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">contact form</a>.</li>
      </ul>

      <h2>Security</h2>
      <p>
        Data is encrypted in transit, access to member records is restricted by
        database-level access rules, and payment credentials never touch our
        systems. No method of storage or transmission is 100% secure, but we
        design so that the most sensitive data (your card) is held by Stripe,
        not us.
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
        out in member communications.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy or your data? Reach us through the{' '}
        <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">SAMPA contact form</a>.
      </p>
    </LegalPage>
  );
}
