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
 * Levers SAMPA intends to use to expand buprenorphine / MOUD / MAT access.
 * Examples are grounded in the July 2026 HHS RFI public comment (first published
 * Policy hub material) plus planned follow-on work. Roadmap / intent — not a claim
 * that each lever is already active. Canonical framing: docs/architecture/policy-hub.md.
 */
export const POLICY_LEVERS = [
  {
    lever: 'Federal rulemaking',
    examples:
      'HHS/SAMHSA/DEA/CMS RFIs; permanent SUD telehealth with practitioner-neutral language; 42 CFR Part 8 OTP practitioner implementation',
    artifact: 'Public comments',
  },
  {
    lever: 'State practice law',
    examples:
      'Scope and supervision; stranded DATA-waiver / X-waiver references; MOUD-specific PA barriers; state OTP / methadone alignment with Part 8',
    artifact: 'Positions, board letters, model language, coalitions',
  },
  {
    lever: 'Payment',
    examples:
      'Medicaid MOUD pay parity; prior auth reform; Medicare differentials; PA billing for Collaborative Care / behavioral health integration',
    artifact: 'Letters, positions, payer comments',
  },
  {
    lever: 'Systems / employers',
    examples:
      'Low-barrier / same-day MOUD initiation; clinic protocols; peer recovery integrated with prescribing; rural specialty backup',
    artifact: 'Toolkits, positions, member education',
  },
  {
    lever: 'Workforce & professional voice',
    examples:
      'PA recognition in HRSA/NHSC and HHS workforce projections; MATE Act / clinical stigma education; peer recovery culture; joint society statements',
    artifact: 'Statements, coalitions, comments',
  },
  {
    lever: 'Evidence → standards',
    examples:
      'Outcome measures including prescriber type; near-real-time MOUD access dashboards; workforce-visible claims data',
    artifact: 'Positions + research briefs',
  },
];

/**
 * Access priorities drawn from SAMPA’s July 2026 HHS RFI comment — shown on
 * /policy as the near-term roadmap seeded by that first material.
 */
export const POLICY_COMMENT_PRIORITIES = [
  'Scale accessible MOUD (buprenorphine, methadone, naltrexone), including low-barrier and telehealth delivery',
  'Make SUD telehealth flexibilities permanent with practitioner-neutral language before the telemedicine cliff',
  'Encourage states to retire obsolete MOUD-specific barriers and stranded waiver language, and align OTP rules with Part 8 so PAs can practice',
  'Recognize and recruit PAs in HHS behavioral health workforce programs; align payment so PA-delivered addiction care is sustainable',
  'Reduce clinical stigma (MATE Act education) and expand peer recovery support alongside MOUD',
  'Standardize outcomes—including prescriber type—and build learning systems so policy can follow evidence on access',
];

export const POLICY_HUB = {
  eyebrow: 'Access to evidence-based addiction care',
  title: 'Policy',
  oneLiner:
    'When people with substance use disorders can’t get medications for addiction treatment such as buprenorphine or methadone, the barrier is often policy, not medicine. SAMPA’s policy hub is our nonpartisan public voice for removing those barriers, so patients can reach high-quality care from the PAs who serve them, especially in rural and underserved areas. We are starting with public comments to federal agencies — our first comment to HHS sets the access agenda below — and over time will publish positions, statements, and related materials wherever access is decided — federal and state policy, payment systems, workforce rules, and everyday practice.',
  leversIntro:
    'To expand buprenorphine, MOUD, and MAT access for substance use disorders, SAMPA will work on several fronts—not only federal dockets. These reflect the agenda in our first public comment and the work still ahead:',
  prioritiesIntro:
    'Priorities from our first public comment (HHS RFI, July 2026)—the near-term access roadmap we intend to advance:',
  disclaimer:
    'SAMPA, Inc. is a 501(c)(3) public charity. Our policy materials advance our educational and public-health mission. We do not engage in political campaign activity.',
  memberValue:
    'Members support SAMPA’s policy hub: the society’s emerging public voice for access to care—starting with public comments, and growing into positions and statements drafted on behalf of addiction-medicine PAs, focused on clinical quality and access—not partisan politics.',
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
      'Scale accessible MOUD (buprenorphine, methadone, naltrexone), including low-barrier and telehealth delivery',
      'Make SUD telehealth flexibilities permanent with practitioner-neutral language before the telemedicine cliff',
      'Encourage states to retire obsolete MOUD-specific barriers and stranded waiver language; align OTP / methadone practice with Part 8',
      'Recognize PAs in HHS behavioral health workforce programs and align payment (including CoCM / BHI) for team-based care',
      'Reduce clinical stigma through MATE Act education and expand peer recovery support alongside MOUD',
      'Standardize outcomes—including prescriber type—and build near-real-time MOUD access measurement so policy can follow evidence',
    ],
    agency: 'U.S. Department of Health and Human Services (HHS)',
    docket: 'FR Doc. 2026-11602 · Great American Recovery',
    submittedAt: '2026-07-05',
    publishedAt: '2026-07-05',
    pdfUrl: '/files/policy/hhs-rfi-chronic-disease-addiction-2026.pdf',
    onBehalfOfMembers: true,
    bodyHtml: `
<p>The Society of Addiction Medicine Physician Associates (SAMPA) submitted this response to the HHS Request for Information on the chronic disease of addiction and the Great American Recovery Initiative.</p>
<p>SAMPA’s central message is a workforce message: federal barriers to PA prescribing of buprenorphine have largely fallen, yet patient-level access has not grown in proportion because state scope restrictions, payment differentials, and unfinished telehealth rulemaking continue to sideline this workforce. Each recommendation identifies steps HHS can take under existing authority to close that gap.</p>
<p>The full comment answers all five RFI questions—evidence-based interventions (including MOUD and Collaborative Care), federal program changes (telehealth, federal–state MOUD alignment, Part 8 OTP practitioner implementation), stigma mitigation (MATE Act education and peer recovery), practitioner supply and payment, and evaluation/data modernization—with a consistent focus on quality care and equitable access to MOUD for patients and communities, especially in rural and underserved areas.</p>
<p>Download the PDF for the complete submitted document, including citations and statutory authorities. The policy hub roadmap below draws its near-term priorities from this comment.</p>
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
