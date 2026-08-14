/**
 * Public SAMPA leadership roster — curated from leadership-form submissions.
 *
 * Add a person: append an object, give it a unique `id` and a `sort` that
 * lands where you want it (gaps of 10). Do not invent name, credentials,
 * roles, location, or bio. Leave `photo` null until a file lives in
 * `public/leadership/` — never hotlink private Google Drive URLs.
 *
 * Public fields only. Do not add form email, preferred internal email,
 * membership-portal yes/no, permission text, or "anything else" notes.
 */

export const LEADERSHIP_PAGE = {
  eyebrow: 'About SAMPA',
  title: 'Leadership',
  oneLiner:
    'The PAs who lead this society — clinicians working so more people can reach addiction care.',
  previewNote:
    'Preview. Nine people have submitted profiles so far; more leadership profiles are still coming.',
};

/**
 * @typedef {object} Leader
 * @property {string} id            URL-safe slug; stable share target
 * @property {number} sort          Lower first; leave gaps for inserts
 * @property {string} name
 * @property {string} credentials
 * @property {string[]} roles       SAMPA role(s) as submitted
 * @property {string|null} location City/state for print, or null
 * @property {boolean} [omitLocation] True when the submitter marked city not for print
 * @property {string} bio
 * @property {string|null} photo    Public path under /leadership/, or null → initials
 * @property {string|null} linkedin Full https URL, or null
 * @property {string} [photoDriveId] Form upload id — for operators, not rendered
 */

/** @type {Leader[]} */
export const LEADERSHIP = [
  {
    id: 'josh-luftig',
    sort: 10,
    name: 'Josh Luftig',
    credentials: 'PA-C',
    roles: ['President-Elect'],
    location: 'Oakland, CA',
    bio: 'Josh Luftig, PA-C, is co-founder of The Bridge Center at the Public Health Institute, where he serves as Director of Clinical Innovation, and president-elect of SAMPA. He has practiced emergency medicine for over 25 years at Highland Hospital, an urban Level 1 trauma center in Oakland. He co-created the CA Bridge Model, pairing rapid initiation of medication for addiction treatment with peer navigation in emergency departments, now in nearly all California hospitals and 45 other states. He co-developed a high-dose buprenorphine induction protocol published in JAMA that is widely used in EDs, and led California\'s statewide ED naloxone distribution, which has provided more than 600,000 doses at no cost. He is involved with SAMPA to advance PA leadership in addiction medicine and patient access to treatment.',
    photo: null,
    linkedin: 'https://www.linkedin.com/in/joshluftig',
    photoDriveId: '1flxWCKBfimgn-AJQe5KztkXz_5_RcvKO',
  },
  {
    id: 'arianna-campbell',
    sort: 20,
    name: 'Arianna Campbell',
    credentials: 'DMSc, MPH, PA-C, CAQ-EM, DFAAPA',
    roles: [
      'Director at Large',
      'Certification Committee Co-Chair / Ad Hoc Workgroup Chair',
      'News and Newsletter Sub-Committee Member',
      'Public Health Policy Committee Member',
      'Liaison: ASAM',
    ],
    location: 'Placerville, CA',
    bio: 'Arianna is an Emergency and Addiction Medicine PA with more than 26 years of clinical experience. She works in Emergency and Addiction Psychiatry with an administrative role in buprenorphine access for the VA Northern California Healthcare System. She serves as Senior Director and Multiple Principal Investigator for The Bridge Center at PHI and CA Bridge, a program for which she is a cofounder. She is President-elect for the California Academy of PAs and is a CE committee member and Presidential Taskforce member for ASAM. She also serves on the Board of Directors for the Society of Addiction Medicine PAs (SAMPA) and the Medical Education Research Foundation. She has authored and co-authored multiple publications, the most recent detailing rural substance use navigation in her local rural hospital.',
    photo: null,
    linkedin: null,
    photoDriveId: '1gV6jYCWM_E46g9vMne9k3pD6INVsKRVZ',
  },
  {
    id: 'eric-bergersen',
    sort: 30,
    name: 'Eric Bergersen',
    credentials: 'PA-C, MHA',
    roles: ['Director at Large'],
    location: 'Los Angeles, CA',
    bio: 'Eric Bergersen, PA-C, MHA, is a board-certified physician assistant specializing in emergency medicine and addiction medicine. He earned his bachelor’s degree from Northeastern University in Boston before moving to Washington, D.C., to complete a master’s degree at The George Washington University. He later earned a master\'s degree in healthcare administration from Oklahoma State University and is currently pursuing a doctorate in AI applications at Northeastern University. Throughout his work in emergency medicine, Eric has found it deeply rewarding to serve as the first point of contact for individuals living with substance use disorders. This firsthand clinical experience drives his mission to eliminate barriers to accessible, equitable treatment for opioid use disorder within acute care environments. In his current role, Eric focuses on bridging the gaps between emergency care, the criminal justice system, and addiction recovery. He also serves as a member of the California Physician Assistant Board.',
    photo: null,
    linkedin: 'https://www.linkedin.com/in/ericbergersen/',
    photoDriveId: '1WOwglUAfwbP8jX9hY1GMuQDxYRQGlTsQ',
  },
  {
    id: 'harrison-keyes',
    sort: 40,
    name: 'Harrison Paul Keyes',
    credentials: 'MPAS, PA-C',
    roles: ['Director at Large'],
    location: 'Boston, MA',
    // Form bio dropped the leading H ("arrison Keyes…"); restored here.
    bio: 'Harrison Keyes currently practices in primary care at Boston Health Care for the Homeless Program. He started in the respite program following his graduation from the MGH Institute of Health Professions in 2018. During the COVID-19 pandemic, Harrison conducted the program’s COVID testing and screening endeavors across Boston’s shelter system. He now works as the medical director of the JYP clinic, overseeing the program’s largest outpatient site, offering primary care, psychiatry, Hep C and HIV care as well as addiction and recovery support. Harrison also volunteers as the Chief Delegate for the Massachusetts Association of PAs.',
    photo: null,
    linkedin: null,
    photoDriveId: '1PFh-VO29K4CH9aWIZAeFiaKjOFrzBd7P',
  },
  {
    id: 'edward-traverso',
    sort: 50,
    name: 'Edward Traverso',
    credentials: 'PA-C, CAQ-Psychiatry',
    roles: ['Director at Large'],
    location: 'Richland, WA',
    // Dropped submitter note "Feel free to trim it down!" Light grammar only
    // (lead→led, helped integrated→helped integrate, "to forefront"→"to the forefront").
    bio: 'My background of working as a mental health counselor in inpatient psychiatry and eventually training in addiction during psychiatry residency led to my passion for bringing addiction treatment to the forefront of my practice. During my time as a provider I have worked in community care where I have helped integrate dual-diagnosis care from Yakima, to the Tri-Cities, and beyond. Currently I practice outpatient at the VA in Boise. Additionally I lead an addiction treatment program at Benton County Corrections where I am working to implement a grant-funded program to expand access to addiction and detoxification treatment for at-risk individuals during incarceration and support their transition to ongoing care. One of my professional highlights has been helping implement new advancements in addiction care, including rapid-access injection policies, to make effective treatment more accessible. Outside of medicine, I am passionate about music and travel.',
    photo: null,
    linkedin: null,
    photoDriveId: '1ReEINn2NyJt3UmqJYg2ihfBiMfosFaJL',
  },
  {
    id: 'clarissa-peterson',
    sort: 60,
    name: 'Clarissa Peterson',
    credentials: 'MPAS, PA-C',
    roles: ['Membership Committee Chair'],
    location: 'Provo, Utah',
    bio: 'Clarissa Peterson, MPAS, PA-C graduated from the University of Utah Physician Assistant Program in 2009 and has dedicated her career to community health, providing care for underserved populations. Her clinical interests include addiction medicine, women\'s health, global health, mental health, and hepatitis C, with a particular focus on caring for unhoused individuals and immigrant communities. In addition to her clinical practice, Clarissa serves as clinical faculty for several physician assistant programs, precepts PA students, and frequently presents continuing medical education lectures on addiction medicine and related topics. She has served as Chair of the SAMPA Membership Committee since 2025 and is committed to advancing the PA profession through education, mentorship, and professional service.',
    photo: null,
    linkedin: null,
    photoDriveId: '1TDO7yjY1BPadrYBQx4zWM1cCEKk-dLuv',
  },
  {
    id: 'deanna-bridge-najera',
    sort: 70,
    name: 'Deanna Bridge Najera',
    credentials: 'PA-C, DFAAPA, FCPP',
    roles: [
      'Bylaws and Policy Committee Chair',
      'Public Health Policy Committee Member',
    ],
    location: 'Maryland',
    bio: 'PA Najera splits her time between a suburban emergency department, a county health department, and a community mental health agency. She holds CAQs in Psychiatry and Emergency Medicine, as well as a Master’s degree in Clinical Mental Health Counseling. She previously served on the ASAM Clinical Guideline Committee for Benzodiazepine Tapering. Regardless of the role she is serving in, PA Najera strives to care for each individual while remaining mindful of the social drivers of health at play and addressing population-level challenges whenever possible.',
    photo: null,
    linkedin: 'https://www.linkedin.com/in/deanna-bridge-najera-417a944/',
    photoDriveId: '1kTM6MUfmXBKrajwdmevP9ZQOEt6wOc38',
  },
  {
    id: 'diane-bruessow',
    sort: 80,
    name: 'Diane Bruessow',
    credentials: 'DMSc, PA-C, CPXP, DFAAPA, FCPP',
    roles: ['Finance Committee Member'],
    location: null,
    omitLocation: true,
    bio: 'Dr. Diane Bruessow, DMSc, PA-C, CPXP, DFAAPA, FCPP, earned her Doctor of Medical Science degree from Shenandoah University and is an alumna of the Long Island University/Brooklyn Hospital PA Program. She is an academic clinician serving as principal faculty in Touro University’s Hybrid PA Program (MT) and practicing clinically with an affiliate of Mass General Brigham (MA). Her professional work centers on healthcare distribution, access, and quality, with a focus on improving systems of care. Dr. Bruessow previously served as assistant professor adjunct in the Department of Internal Medicine at Yale School of Medicine and director of justice, equity, diversity, and inclusion for the PA Online Program. She has served on elected and appointed boards and on finance and audit committees for multiple national medical associations, including the AAPA, and serves on SAMPA’s Finance Committee. Beyond medicine, Dr. Bruessow’s interests include the performing arts and the occasional full night’s sleep.',
    photo: null,
    linkedin: 'https://www.linkedin.com/in/dianebruessow',
    photoDriveId: '1KmJKPs64ouOwidqXbmr4AYkGY2iTaiyM',
  },
  {
    id: 'cheryl-vanderford',
    sort: 90,
    name: 'Cheryl Vanderford',
    credentials: 'MSPAS, PA-C',
    roles: ['Education Committee Member'],
    location: 'Lexington, KY',
    bio: 'Cheryl Vanderford, MSPAS, PA-C, is an Associate Professor at the University of Kentucky in the Department of Physician Assistant Studies (UKPA). She currently practices clinically in the Student Behavioral Health Clinic at UK. Prior to joining UK as faculty, she served as a PA in the Mental Health Service at the Lexington Veterans Affairs HealthCare System where she provided care to Veterans in a variety of settings including an outpatient walk-in/crisis clinic, emergency department, and residential PTSD/Substance Use Treatment program. Cheryl completed a fellowship with the VA National Center for Patient Safety with specific training on quality improvement, research, and teaching. Her research focuses on substance use disorders, on topics related to mental health, and on topics related to pedagogy in higher education. She served as a principal investigator for a SAMHSA funded grant, implementing medication for opioid use disorder (MOUD) training in UKPA curricula, and developing and coordinating continuing medical education conferences to reach interprofessional providers on a national scale. Cheryl’s involvement in SAMPA reflects her passion for advancing PA education related to substance use disorders and equipping students to become transformative leaders who provide evidence based, compassionate care in their communities.',
    photo: null,
    linkedin: null,
    photoDriveId: '1J10HpLLh7JrtZHmQ2H4wkPAi1Au_UBwz',
  },
];

export function listLeadership() {
  return LEADERSHIP.slice().sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}

export function formatLocation(person) {
  if (person.omitLocation) return null;
  return person.location || null;
}

/** First + last initial (Deanna Bridge Najera → DN). */
export function initials(name) {
  const parts = String(name || '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
