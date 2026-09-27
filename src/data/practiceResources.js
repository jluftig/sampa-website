export const RESOURCES_HUB = {
  eyebrow: 'Practice resources',
  oneLiner:
    'A first set of links you can open today — SAMPA’s own news, Key Points, and public comments, plus public clinical and public-health sources a PA treating addiction would actually use. This is not a protocol, not a dosing tool, and not CME. Links checked September 2026; open the source for the current text.',
  settingsIntro:
    'Addiction care is not only an OTP or specialty-clinic job. You may be starting treatment in an emergency department, continuing it on a hospital service, seeing someone in primary care or an FQHC, meeting people on the street, connecting by telehealth, staffing a bridge clinic, or practicing inside an opioid treatment program. The list below is written for that mix — so people can reach MOUD and quality treatment from the door they already walk through.',
  stillBuilding:
    'Point-of-care practice tools are in clinical review and are not on this page yet. CME and a job board remain in development.',
  disclaimer:
    'This page collects public materials. It is not medical advice, not a treatment protocol, and does not offer CME credit. Read the source, check the date, and confirm FDA labeling plus your state practice rules before you prescribe. External sites are not SAMPA publications. SAMPA, Inc. is a 501(c)(3) public charity (EIN 42-2288772).',
};

export const SAMPA_RESOURCES = [
  {
    id: 'news',
    origin: 'sampa',
    title: 'Daily news for PAs',
    blurb:
      'Original coverage of research, regulation, and what changed in practice this week — written so you can take it into the next visit, not file it away.',
    href: '/news',
    cta: 'Read the news',
  },
  {
    id: 'keywords',
    origin: 'sampa',
    title: 'Key Points by keyword',
    blurb:
      'Each news item is broken into citable claims you can browse and intersect — useful when you need the finding, not the whole article.',
    href: '/keywords',
    cta: 'Browse Key Points',
  },
  {
    id: 'policy-cms-pfs',
    origin: 'sampa',
    title: 'CMS comment on the CY 2027 fee schedule',
    blurb:
      'Our September 2026 comment on the CY 2027 Medicare Physician Fee Schedule. It supports the proposed SBIRT and tobacco-cessation work values and PA-led shared medical appointments, asks CMS to keep those appointments open to tobacco, alcohol, and other substance use disorders, and asks CMS not to drop Quality ID 305.',
    href: '/policy/cms-pfs-cy-2027-1848-p',
    asOf: 'Submitted September 2026',
    cta: 'Read the comment',
  },
  {
    id: 'policy-asam-correctional',
    origin: 'sampa',
    title: 'ASAM comment on correctional and reentry standards',
    blurb:
      'Our August 2026 line-cited comments on ASAM’s draft correctional and reentry standards. They ask for uninterrupted MOUD at intake and release, practitioner-neutral telehealth and staffing language, and peer supports alongside medication.',
    href: '/policy/asam-correctional-settings-2026',
    asOf: 'Submitted August 2026',
    cta: 'Read the comment',
  },
  {
    id: 'policy-hrsa',
    origin: 'sampa',
    title: 'HRSA comment on psychedelic therapies',
    blurb:
      'Our August 2026 comment to HRSA on training and care-delivery models for potential FDA-approved psychedelic therapies. It asks that PAs be named as licensed medical providers for eligibility evaluation, session oversight, and follow-up.',
    href: '/policy/hrsa-rfi-psychedelic-therapies-2026',
    asOf: 'Submitted August 2026',
    cta: 'Read the comment',
  },
  {
    id: 'policy-hhs',
    origin: 'sampa',
    title: 'HHS comment on access to MOUD',
    blurb:
      'Our July 2026 public comment to HHS on why patients still cannot reach buprenorphine, methadone, and naltrexone even after federal waiver rules fell — and what would change that.',
    href: '/policy/hhs-rfi-chronic-disease-addiction-2026',
    asOf: 'Submitted July 2026',
    cta: 'Read the comment',
  },
  {
    id: 'policy-hub',
    origin: 'sampa',
    title: 'Policy hub',
    blurb:
      'Where SAMPA publishes that public voice. Four comments are live: CMS on the CY 2027 fee schedule, ASAM on correctional and reentry standards, HRSA on emerging psychedelic therapies, and HHS on access to MOUD. Positions and statements are still ahead.',
    href: '/policy',
    cta: 'Open the policy hub',
  },
  {
    id: 'join',
    origin: 'sampa',
    title: 'Peers who already do this work',
    blurb:
      'Membership opens a private directory of PAs in addiction medicine — so you can ask how someone else started, not invent the path alone. You control listing and contact.',
    href: '/join',
    cta: 'Join SAMPA',
  },
  {
    id: 'updates',
    origin: 'sampa',
    title: 'SAMPA Updates',
    blurb:
      'A weekly email — practice news, society notes, and policy changes that affect your patients. No membership required.',
    href: '/#updates-signup',
    cta: 'Get the weekly email',
  },
];

export const EXTERNAL_RESOURCES = [
  {
    id: 'tip-63',
    origin: 'external',
    source: 'SAMHSA',
    title: 'TIP 63 — Medications for Opioid Use Disorder',
    blurb:
      'The federal Treatment Improvement Protocol on methadone, buprenorphine, and naltrexone, plus the recovery supports that go with them. The document clinicians still open first for MOUD.',
    href: 'https://www.samhsa.gov/resource/ebp/tip-63-medications-opioid-use-disorder',
    external: true,
    asOf: 'Revised 2021 · page checked September 2026',
    cta: 'Open TIP 63',
  },
  {
    id: 'asam-npg',
    origin: 'external',
    source: 'ASAM',
    title: 'National Practice Guideline for the Treatment of Opioid Use Disorder',
    blurb:
      'ASAM’s 2020 focused update — assessment, medications, special populations, and setting-specific recommendations. Society guideline, not a SAMPA protocol.',
    href: 'https://www.asam.org/quality-care/clinical-guidelines/national-practice-guideline',
    external: true,
    asOf: '2020 focused update · page checked September 2026',
    cta: 'Open the ASAM guideline',
  },
  {
    id: 'mat-act',
    origin: 'external',
    source: 'SAMHSA',
    title: 'Waiver elimination (MAT Act)',
    blurb:
      'Federal DATA-waiver / X-waiver requirements are gone. A DEA registration with Schedule III authority is the federal prescribing baseline — then your state practice act. Confirm both before you write a first prescription.',
    href: 'https://www.samhsa.gov/substance-use/treatment/resources/mat-act',
    external: true,
    asOf: 'Effective December 2022 · page checked September 2026',
    cta: 'Read the SAMHSA summary',
  },
  {
    id: 'mate-act',
    origin: 'external',
    source: 'SAMHSA',
    title: 'DEA training requirement (MATE Act)',
    blurb:
      'What new or renewing DEA registrants must complete. This is a federal training attestation, not SAMPA CME, and it does not by itself authorize practice in your state.',
    href: 'https://www.samhsa.gov/substance-use/treatment/resources/mat-act/training-requirements',
    external: true,
    asOf: 'In effect June 2023 · page checked September 2026',
    cta: 'See training requirements',
  },
  {
    id: 'fda-moud',
    origin: 'external',
    source: 'FDA',
    title: 'Medications for opioid use disorder',
    blurb:
      'FDA’s overview of approved buprenorphine, methadone, and naltrexone products. Use it to reach current labeling — do not treat this page as a dosing guide.',
    href: 'https://www.fda.gov/drugs/food-and-drug-administration-overdose-prevention-framework/information-about-medications-opioid-use-disorder-moud',
    external: true,
    asOf: 'Page checked September 2026',
    cta: 'Open the FDA MOUD page',
  },
  {
    id: 'dailymed',
    origin: 'external',
    source: 'NIH DailyMed',
    title: 'Current FDA labeling (DailyMed)',
    blurb:
      'Search the product you prescribe for the official Prescribing Information. Labeling changes; this is the lookup, not a standing SAMPA recommendation.',
    href: 'https://dailymed.nlm.nih.gov/dailymed/',
    external: true,
    asOf: 'Page checked September 2026',
    cta: 'Search DailyMed',
  },
  {
    id: 'cdc-opioid-guideline',
    origin: 'external',
    source: 'CDC',
    title: '2022 Clinical Practice Guideline for Prescribing Opioids for Pain',
    blurb:
      'CDC’s clinician-facing summary of the 2022 pain-prescribing guideline — useful when you are treating pain and watching for opioid-related harm. It is not an OUD treatment guideline.',
    href: 'https://www.cdc.gov/overdose-prevention/hcp/clinical-guidance/index.html',
    external: true,
    asOf: 'Guideline 2022 · page checked September 2026',
    cta: 'Open the CDC summary',
  },
  {
    id: 'cdc-naloxone',
    origin: 'external',
    source: 'CDC',
    title: 'Naloxone and overdose response',
    blurb:
      'CDC materials on naloxone for patients, families, and the people around them. Pair with your local standing-order or pharmacy-access rules.',
    href: 'https://www.cdc.gov/stopoverdose/naloxone/index.html',
    external: true,
    asOf: 'Page checked September 2026',
    cta: 'Open CDC naloxone',
  },
  {
    id: 'findtreatment',
    origin: 'external',
    source: 'SAMHSA',
    title: 'FindTreatment.gov',
    blurb:
      'The federal locator for treatment programs when you need a next door — OTP, residential, outpatient, or a program closer to where the patient lives.',
    href: 'https://findtreatment.gov/',
    external: true,
    asOf: 'Page checked September 2026',
    cta: 'Search FindTreatment.gov',
  },
  {
    id: 'nida-moud',
    origin: 'external',
    source: 'NIDA',
    title: 'Medications to treat opioid use disorder',
    blurb:
      'NIDA’s research-to-practice overview of why these medications work and what they do not replace. Good orientation if you are new to the field.',
    href: 'https://nida.nih.gov/research-topics/medications-opioid-use-disorder',
    external: true,
    asOf: 'Page checked September 2026',
    cta: 'Open the NIDA overview',
  },
  {
    id: 'pcss',
    origin: 'external',
    source: 'PCSS-MOUD',
    title: 'Providers Clinical Support System',
    blurb:
      'National mentoring and clinician education on medications for opioid use disorder. External training — not SAMPA CME, and not a substitute for your own credentialing.',
    href: 'https://pcssnow.org/',
    external: true,
    asOf: 'Page checked September 2026',
    cta: 'Visit PCSS-MOUD',
  },
];

export const START_STEPS = [
  {
    n: '01',
    title: 'Read what changed this week',
    body: 'SAMPA news is written for PAs. Start there when you want the field, not a textbook.',
    href: '/news',
    cta: 'News archive',
  },
  {
    n: '02',
    title: 'Pull the claim, not the whole issue',
    body: 'Key Points let you browse by keyword when a patient question is specific — a medication, a rule, a setting.',
    href: '/keywords',
    cta: 'Browse keywords',
  },
  {
    n: '03',
    title: 'See what still blocks access',
    body: 'Federal waiver rules fell. Patients still wait. Our HHS comment is the short map of the remaining MOUD barriers. The CMS, ASAM, and HRSA comments are on the policy hub.',
    href: '/policy/hhs-rfi-chronic-disease-addiction-2026',
    cta: 'HHS comment',
  },
  {
    n: '04',
    title: 'Ask a peer who has done it',
    body: 'The member directory is for that conversation — how someone in primary care, an ED, or a street-medicine team actually started.',
    href: '/join',
    cta: 'Join for the directory',
  },
  {
    n: '05',
    title: 'Open a national guideline — do not invent one',
    body: 'TIP 63 and the ASAM National Practice Guideline are the public clinical starting points. SAMPA is not publishing its own protocol on this page.',
    href: 'https://www.samhsa.gov/resource/ebp/tip-63-medications-opioid-use-disorder',
    external: true,
    cta: 'TIP 63 (SAMHSA)',
  },
];
