/**
 * SAMPA Policy hub — positions, public comments, and statements.
 * MVP: curated module (not the news/posts stack). Graduate to a
 * policy_documents table when volume warrants a CMS.
 */

export const POLICY_TYPES = {
  position: {
    key: 'position',
    label: 'Position',
    description: 'Standing SAMPA stance on clinical quality, workforce, or access to care.',
  },
  comment: {
    key: 'comment',
    label: 'Public comment',
    description: 'Response to a federal or state agency request for information or rulemaking.',
  },
  statement: {
    key: 'statement',
    label: 'Statement',
    description: 'Time-bound public statement from SAMPA leadership.',
  },
};

export const POLICY_HUB = {
  eyebrow: 'Positions, public comments, and statements',
  title: 'Policy',
  oneLiner:
    'SAMPA develops evidence-informed positions and submits public comments to federal agencies so physician associates can deliver high-quality, accessible addiction care—including medications for opioid use disorder (MOUD)—to the patients and communities we serve.',
  disclaimer:
    'SAMPA, Inc. is a 501(c)(3) public charity. Our policy materials advance our educational and public-health mission. We do not engage in political campaign activity.',
  memberValue:
    'Members support SAMPA’s policy work: comments and positions drafted on behalf of addiction-medicine PAs, focused on clinical quality and access to care—not partisan politics.',
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
    pdfUrl: '/policy/hhs-rfi-chronic-disease-addiction-2026.pdf',
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
