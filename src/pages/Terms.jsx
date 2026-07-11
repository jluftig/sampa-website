import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from '../components/LegalPage';

const CONTACT_FORM_URL = 'https://forms.gle/YqYYRVE9z2nCYdNz5';

export default function Terms() {
  return (
    <LegalPage label="Legal" title="Terms of Service" effectiveDate="July 11, 2026">
      <p>
        These terms govern your use of <strong>www.addictionpas.org</strong>,
        operated by the Society of Addiction Medicine Physician Associates
        ("SAMPA," "we," "us") — SAMPA, Inc., a Wyoming corporation pending
        501(c)(3) status — a professional membership association for physician
        associates practicing addiction medicine. By using the site or becoming
        a member, you agree to these terms.
      </p>

      <h2>Educational content — not medical advice</h2>
      <p>
        SAMPA publishes news summaries, key points, and other educational
        material for clinicians. This content is provided for informational and
        educational purposes only. It is <strong>not medical advice</strong>,
        does not establish a standard of care, and is no substitute for your own
        professional judgment, training, and review of primary sources.
        Treatment decisions are always the responsibility of the treating
        clinician. Content may become outdated as evidence and regulation
        evolve.
      </p>

      <h2>Accounts</h2>
      <p>
        You can read public content without an account. Creating an account
        requires signing in with Google or an email link. You agree to provide
        accurate information (including your professional details, if you add
        them) and you're responsible for activity on your account. We may
        suspend accounts that abuse the site or misrepresent credentials.
      </p>

      <h2>Membership and payments</h2>
      <ul>
        <li>Membership dues are billed through <strong>Stripe</strong> as a subscription for the term you choose at checkout (for example 1, 2, or 3 years, depending on tier), and renew automatically at the end of that term until canceled. Some legacy options may be one-time (lifetime) rather than a subscription.</li>
        <li>You can cancel anytime from the billing portal on your <Link to="/dashboard">dashboard</Link>; cancellation takes effect at the end of the current paid term.</li>
        <li>Membership tiers are based on your career stage and certification status, as described on the <Link to="/join">join page</Link> — please pick the tier that honestly matches your situation.</li>
        <li>For billing questions or refund requests, contact us via the <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">contact form</a>.</li>
      </ul>

      <h2>Member networking directory</h2>
      <p>
        Active members may access a <strong>member networking directory</strong>
        on the site so peers can find one another. The directory is for{' '}
        <strong>professional networking among SAMPA members only</strong>. It is
        not a public people search, not a marketing list, and not a commercial
        lead source.
      </p>
      <p>
        By using the directory, you agree to:
      </p>
      <ul>
        <li>Use contact information you find there only for professional, non-commercial networking related to addiction medicine and SAMPA's mission;</li>
        <li>Respect each member's visibility and contact choices (including people who opt out of listing or do not share email or phone);</li>
        <li>Keep directory information confidential among members — do not publish, sell, rent, or redistribute it;</li>
        <li>Not use the directory for commercial solicitation, recruiting spam, fundraising for unrelated causes, political campaigning, or bulk unsolicited messages.</li>
      </ul>
      <p>
        Listing defaults and contact-sharing controls are described in our{' '}
        <Link to="/privacy">Privacy Policy</Link> and can be changed anytime on
        your dashboard. We may remove directory access or suspend accounts that
        misuse the directory or other members' contact information.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Break the law, or attempt to breach the security of the site or other members' accounts;</li>
        <li>Scrape, harvest, bulk-download, or systematically export site content or member information (including the directory);</li>
        <li>Misrepresent your identity, credentials, or eligibility for a membership tier;</li>
        <li>Use the site or the member directory to send spam, phishing, or unsolicited commercial communications;</li>
        <li>Use another member's email or phone from the directory for purposes outside professional peer networking.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        Site content — articles, summaries, key points, logos, and design — is
        owned by SAMPA or its licensors. You're welcome to read, save, share
        links to, and cite our content with attribution; you may not republish
        it wholesale or use it commercially without permission. Third-party
        research we summarize belongs to its respective publishers.
      </p>

      <h2>Third-party services</h2>
      <p>
        The site links to and relies on third-party services (Stripe for
        payments, Google for sign-in, external research sources). Those services
        have their own terms and privacy policies, and we're not responsible for
        their content or practices.
      </p>

      <h2>Disclaimers and limitation of liability</h2>
      <p>
        The site is provided "as is" without warranties of any kind. To the
        fullest extent permitted by law, SAMPA is not liable for indirect,
        incidental, or consequential damages arising from use of the site,
        its content, or the member directory (including how other members use
        information you choose to share), and our total liability for any claim
        is limited to the membership dues you paid us in the twelve months
        before the claim. Nothing in these terms limits liability that cannot
        be limited by law.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms, and any dispute arising out of them or your use of the
        site, are governed by the laws of the State of Wyoming, without regard
        to its conflict-of-law rules.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms as the organization and site evolve. We'll
        post changes here and update the effective date; material changes
        affecting members will be called out in member communications when
        practical. Continuing to use the site after a change means you accept
        the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Reach us through the{' '}
        <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">SAMPA contact form</a>.
        See also our <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
