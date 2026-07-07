import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage from '../components/LegalPage';

const CONTACT_FORM_URL = 'https://forms.gle/YqYYRVE9z2nCYdNz5';

export default function Terms() {
  return (
    <LegalPage label="Legal" title="Terms of Service" effectiveDate="July 6, 2026">
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
        <li>Membership dues are billed as an <strong>annual subscription</strong> processed by Stripe, and renew automatically each year until canceled.</li>
        <li>You can cancel anytime from the billing portal on your <Link to="/dashboard">dashboard</Link>; cancellation takes effect at the end of the current membership year.</li>
        <li>Membership tiers are based on your career stage and certification status, as described on the <Link to="/join">join page</Link> — please pick the tier that honestly matches your situation.</li>
        <li>For billing questions or refund requests, contact us via the <a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer">contact form</a>.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Break the law, or attempt to breach the security of the site or other members' accounts;</li>
        <li>Scrape, harvest, or bulk-download site content or member information;</li>
        <li>Misrepresent your identity, credentials, or eligibility for a membership tier;</li>
        <li>Use the site to send spam or unsolicited communications.</li>
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
        incidental, or consequential damages arising from use of the site or
        its content, and our total liability for any claim is limited to the
        membership dues you paid us in the twelve months before the claim.
        Nothing in these terms limits liability that cannot be limited by law.
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
        affecting members will be called out in member communications.
        Continuing to use the site after a change means you accept the updated
        terms.
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
