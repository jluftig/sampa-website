/**
 * SAMPA Policy hub — public voice for access to addiction care.
 * Instruments: positions, public comments, statements (and later campaigns /
 * toolkits / coalition letters). Comments are one tactic, not the whole function.
 * MVP: curated module (not the news/posts stack). Graduate to a
 * policy_documents table when volume warrants a CMS.
 * Framing: docs/architecture/policy-hub.md
 */

export const POLICY_TYPES = {
  position: {
    key: 'position',
    label: 'Position',
    description:
      'Standing SAMPA stance on clinical quality, workforce, payment, or access to care.',
  },
  comment: {
    key: 'comment',
    label: 'Public comment',
    description:
      'Response to a federal or state agency request for information or rulemaking.',
  },
  statement: {
    key: 'statement',
    label: 'Statement',
    description: 'Time-bound public statement from SAMPA leadership.',
  },
};

/**
 * Levers SAMPA uses to expand buprenorphine / MOUD / MAT access.
 * Shown on /policy; canonical product framing in docs/architecture/policy-hub.md.
 */
export const POLICY_LEVERS = [
  {
    lever: 'Federal rulemaking',
    examples: 'HHS/SAMHSA/DEA/CMS RFIs, telehealth, OTP rules',
    artifact: 'Public comments',
  },
  {
    lever: 'State practice law',
    examples: 'Scope, supervision, PA OTP authority',
    artifact: 'Positions, board letters, model language, coalitions',
  },
  {
    lever: 'Payment',
    examples: 'Medicaid, prior auth, team-based billing',
    artifact: 'Letters, positions, payer comments',
  },
  {
    lever: 'Systems / employers',
    examples: 'Credentialing, formulary, clinic protocols',
    artifact: 'Toolkits, positions, member education',
  },
  {
    lever: 'Professional voice',
    examples: 'Joint ASAM/AAPA letters, stigma, workforce programs',
    artifact: 'Statements, coalitions',
  },
  {
    lever: 'Evidence → standards',
    examples: 'Outcomes by prescriber type, quality measures',
    artifact: 'Positions + research briefs',
  },
];

export const POLICY_HUB = {
  eyebrow: 'Access to evidence-based addiction care',
  title: 'Policy',
  oneLiner:
    'SAMPA’s public voice for expanding access to medications for addiction treatment—including buprenorphine and other medications for opioid use disorder (MOUD)—so physician associates can deliver high-quality care to the patients and communities we serve. Public comments are one instrument; we also develop positions, statements, and related materials across federal, state, payment, and practice levers.',
  leversIntro:
    'To expand buprenorphine, MOUD, and MAT access for substance use disorders, SAMPA works across several levers—not only federal dockets:',
  disclaimer:
    'SAMPA, Inc. is a 501(c)(3) public charity. Our policy materials advance our educational and public-health mission. We do not engage in political campaign activity.',
  memberValue:
    'Members support SAMPA’s policy work: the society’s public voice for access to care—positions, comments, and statements drafted on behalf of addiction-medicine PAs, focused on clinical quality and access—not partisan politics.',
};

/** @typedef {'position' | 'comment' | 'statement'} PolicyType */

/**
 * @typedef {object} PolicyDocument
 * @property {string} slug
 * @property {PolicyType} type
 * @property {string} title
 * @property {string} summary
 * @property {string[]} themes
 * @property {string} [agency]
 * @property {string} [docket]
 * @property {string} [submittedAt] ISO date (YYYY-MM-DD)
 * @property {string} publishedAt ISO date
 * @property {string} pdfUrl public path to PDF
 * @property {boolean} onBehalfOfMembers
 * @property {string} [bodyHtml] optional readable HTML summary
 */

/** @type {PolicyDocument[]} */
const DOCUMENTS = [
  {
    slug: 'hhs-rfi-chronic-disease-addiction-2026',
    type: 'comment',
    title:
      'Response to the HHS Request for Information on the Chronic Disease of Addiction',
    summary:
      'SAMPA’s July 2026 public comment to HHS on the Great American Recovery Initiative. The comment centers the PA workforce as essential to expanding evidence-based addiction care—especially access to medications for opioid use disorder (MOUD)—in rural and underserved communities.',
    themes: [
      'Scale accessible MOUD (buprenorphine, methadone, naltrexone) as the core of recovery policy',
      'Make SUD telehealth flexibilities permanent with practitioner-neutral language',
      'Encourage states to retire obsolete barriers to PA buprenorphine and OTP practice',
      'Recognize PAs in HHS behavioral health workforce programs and align payment for team-based care',
      'Reduce clinical stigma through MATE Act education and expand peer recovery support',
      'Standardize outcomes—including prescriber type—so policy can follow evidence on access',
    ],
    agency: 'U.S. Department of Health and Human Services (HHS)',
    docket: 'FR Doc. 2026-11602 · Great American Recovery',
    submittedAt: '2026-07-05',
    publishedAt: '2026-07-05',
    pdfUrl: '/files/policy/hhs-rfi-chronic-disease-addiction-2026.pdf',
    onBehalfOfMembers: true,
    bodyHtml: `
<p>The Society of Addiction Medicine Physician Associates (SAMPA) submitted this response to the HHS Request for Information on the chronic disease of addiction and the Great American Recovery Initiative.</p>
<p>SAMPA’s central message is a workforce message: federal barriers to PA prescribing of buprenorphine have largely fallen, yet patient-level access has not grown in proportion because state scope restrictions, payment differentials, and unfinished telehealth rulemaking continue to sideline this workforce. Each recommendation identifies levers HHS can use under existing authority to close that gap.</p>
<p>The full comment answers all five RFI questions—evidence-based interventions, federal program changes, stigma mitigation, practitioner supply, and evaluation/data modernization—with a consistent focus on quality care and equitable access to MOUD for patients and communities.</p>
<p>Download the PDF for the complete submitted document, including citations and statutory authorities.</p>
`.trim(),
  },
];

/** Published documents, newest first. */
export function listPolicyDocuments() {
  return [...DOCUMENTS].sort((a, b) =>
    (b.publishedAt || '').localeCompare(a.publishedAt || '')
  );
}

/** @param {string} slug */
export function getPolicyDocument(slug) {
  return DOCUMENTS.find((d) => d.slug === slug) || null;
}

/** @param {PolicyType | string} type */
export function typeLabel(type) {
  return POLICY_TYPES[type]?.label || type;
}

/** Count published docs per type (for empty-slot UI). */
export function policyTypeCounts() {
  const counts = Object.fromEntries(
    Object.keys(POLICY_TYPES).map((k) => [k, 0])
  );
  for (const d of DOCUMENTS) {
    if (counts[d.type] != null) counts[d.type] += 1;
  }
  return counts;
}
