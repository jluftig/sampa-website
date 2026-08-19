/**
 * Public SAMPA leadership roster for the About page — first-pass preview.
 *
 * Roles: Josh’s 2026–2027 working org-structure doc (13 Aug 2026).
 * Bios: leadership-form submissions when present; otherwise the researched
 * directory copy supplied for this preview. Do not invent a clinical bio.
 *
 * Danielle Schmeling is not joining — do not add her.
 * ASIO, Immediate Past President, and Student DAL are vacant this year —
 * do not add unnamed or vacant cards.
 *
 * Add a person: append an object, give it a unique `id` and a `sort` that
 * lands where you want it (gaps of 10). Drop a headshot in
 * `public/leadership/` and set `photo`. Never hotlink private Drive URLs.
 */

export const LEADERSHIP_PAGE = {
  eyebrow: '2026–2027',
  title: 'Leadership',
  oneLiner:
    'The people leading this working year — officers, directors, chairs, and advisors.',
  previewNote:
    'First-pass preview for review — not a production ship. Eleven people submitted a Leadership Profile with website permission; those cards use the submitted bio and the submitted photo. Other cards use public-source photos Josh provided for this preview.',
};

/**
 * @typedef {object} Leader
 * @property {string} id
 * @property {number} sort
 * @property {'board'|'committees'} group
 * @property {string} name
 * @property {string} credentials
 * @property {string} role            Highest / primary SAMPA role
 * @property {string[]} [also]        Other SAMPA roles, shown on the same card
 * @property {string|null} [location]
 * @property {boolean} [omitLocation]
 * @property {string} [bio]           Directory / card bio. Empty = name + role only.
 * @property {string} [bioLong]       Longer website bio, behind Read more
 * @property {string|null} photo
 * @property {string|null} [linkedin]
 */

/** @type {Leader[]} */
export const LEADERSHIP = [
  {
    id: 'shani-wilson',
    sort: 10,
    group: 'board',
    name: 'Shani Wilson',
    credentials: 'PA-C',
    role: 'President',
    also: ['Education chair', 'AAPA HOD Chief Delegate', 'Bylaws and Policy member'],
    location: 'Chicago, IL',
    bio: 'Shani Wilson, PA-C, practices addiction medicine, specializing in the treatment of substance use disorders with a particular focus on opioid use disorder and MOUD. Her clinical background also includes primary care, LGBTQ+ health, HIV prevention and treatment, and hepatitis C care. Her involvement with SAMPA reflects a broader commitment to advancing PA practice and leadership in addiction medicine. Shani has served in leadership roles across several PA and community organizations and brings a strong interest in organizational leadership and health equity to her work. A recent professional highlight has been contributing to SAMPA’s advocacy efforts to expand recognition of addiction medicine as an area of advanced PA practice.',
    photo: '/leadership/shani-wilson.jpg',
  },
  {
    id: 'josh-luftig',
    sort: 20,
    group: 'board',
    name: 'Josh Luftig',
    credentials: 'PA-C',
    role: 'President-Elect',
    also: [
      'Membership chair',
      'Finance chair',
      'AAPA HOD Alternate',
      'Bylaws and Policy member',
      'Public health / public policy statements',
      'Membership news & newsletter',
    ],
    location: 'Oakland, CA',
    bio: 'Josh Luftig, PA-C, is co-founder of The Bridge Center at the Public Health Institute, where he serves as Director of Clinical Innovation, and president-elect of SAMPA. He has practiced emergency medicine for over 25 years at Highland Hospital, an urban Level 1 trauma center in Oakland. He co-created the CA Bridge Model, pairing rapid initiation of medication for addiction treatment with peer navigation in emergency departments, now in nearly all California hospitals and 45 other states. He co-developed a high-dose buprenorphine induction protocol published in JAMA that is widely used in EDs, and led California\'s statewide ED naloxone distribution, which has provided more than 600,000 doses at no cost. He is involved with SAMPA to advance PA leadership in addiction medicine and patient access to treatment.',
    photo: '/leadership/josh-luftig.jpg',
    linkedin: 'https://www.linkedin.com/in/joshluftig',
  },
  {
    id: 'kala-klug',
    sort: 30,
    group: 'board',
    name: 'Kala Klug',
    credentials: 'PA-C, MSHS',
    role: 'Secretary',
    also: ['Education member'],
    location: 'Pittsburgh, PA',
    bio: 'Kala Klug is a senior PA specializing in addiction medicine with the UPMC Internal Medicine Recovery Engagement Program. She provides compassionate, evidence-based treatment to patients with substance use disorders. Her clinical leadership includes initiatives in harm reduction, contingency management, buprenorphine induction, direct admission, and xylazine-associated wound care. Driven by a commitment to training the next generation of PAs, Kala developed and implemented UPMC’s first addiction medicine elective rotation for PA students. She also serves as Board Secretary and Education Committee Member for the Society of Addiction Medicine PAs. She holds a Master of Science in Health Sciences from George Washington University and a Bachelor of Science in Emergency Medicine from University of Pittsburgh.',
    photo: '/leadership/kala-klug.jpg',
  },
  {
    id: 'jonathan-s-cohen',
    sort: 40,
    group: 'board',
    name: 'Jonathan S. Cohen',
    credentials: 'PA-C',
    role: 'Treasurer',
    also: ['Finance chair', 'Bylaws and Policy member'],
    bio: 'Jonathan S. Cohen, PA-C, is an emergency-medicine PA at Johns Hopkins Bayview Medical Center. He trained at the Yale PA program (2004) and holds an MBA from Johns Hopkins (2010). He is SAMPA’s treasurer and serves on the finance and bylaws-and-policy committees.',
    photo: '/leadership/jonathan-s-cohen.jpg',
  },
  {
    id: 'arianna-campbell',
    sort: 50,
    group: 'board',
    name: 'Arianna Campbell',
    credentials: 'DMSc, MPH, PA-C, CAQ-EM, DFAAPA',
    role: 'Director at large',
    also: [
      'Certification ad hoc co-chair',
      'Public health / public policy statements co-lead',
      'ASAM liaison',
      'Newsletter',
    ],
    location: 'Placerville, CA',
    bio: 'Arianna is an Emergency and Addiction Medicine PA with more than 26 years of clinical experience. She works in Emergency and Addiction Psychiatry with an administrative role in buprenorphine access for the VA Northern California Healthcare System. She serves as Senior Director and Multiple Principal Investigator for The Bridge Center at PHI and CA Bridge, a program for which she is a cofounder. She is President-elect for the California Academy of PAs and is a CE committee member and Presidential Taskforce member for ASAM. She also serves on the Board of Directors for the Society of Addiction Medicine PAs (SAMPA) and the Medical Education Research Foundation. She has authored and co-authored multiple publications, the most recent detailing rural substance use navigation in her local rural hospital.',
    photo: '/leadership/arianna-campbell.jpg',
  },
  {
    id: 'tasha-seliski',
    sort: 60,
    group: 'board',
    name: 'Natasha “Tasha” Seliski',
    credentials: 'MPAS, PA-C',
    role: 'Director at large',
    also: [
      'Public health / public policy statements co-lead',
      'AMERSA liaison',
      'Education member',
    ],
    bio: 'Natasha “Tasha” Seliski, MPAS, PA-C, is University of Utah PA faculty and a general internal medicine clinician at Sugar House Health Center. She is a SAMPA director at large, AMERSA liaison, and co-lead of the public health / public policy statements workgroup.',
    photo: '/leadership/tasha-seliski.jpg',
  },
  {
    id: 'eric-bergersen',
    sort: 70,
    group: 'board',
    name: 'Eric Bergersen',
    credentials: 'PA-C, MHA',
    role: 'Director at large',
    location: 'Los Angeles, CA',
    // Submitted wording “physician assistant” and “California Physician Assistant Board” kept.
    bio: 'Eric Bergersen, PA-C, MHA, is a board-certified physician assistant specializing in emergency medicine and addiction medicine. He earned his bachelor’s degree from Northeastern University in Boston before moving to Washington, D.C., to complete a master’s degree at The George Washington University. He later earned a master\'s degree in healthcare administration from Oklahoma State University and is currently pursuing a doctorate in AI applications at Northeastern University. Throughout his work in emergency medicine, Eric has found it deeply rewarding to serve as the first point of contact for individuals living with substance use disorders. This firsthand clinical experience drives his mission to eliminate barriers to accessible, equitable treatment for opioid use disorder within acute care environments. In his current role, Eric focuses on bridging the gaps between emergency care, the criminal justice system, and addiction recovery. He also serves as a member of the California Physician Assistant Board.',
    photo: '/leadership/eric-bergersen.jpg',
    linkedin: 'https://www.linkedin.com/in/ericbergersen/',
  },
  {
    id: 'harrison-keyes',
    sort: 80,
    group: 'board',
    name: 'Harrison Paul Keyes',
    credentials: 'MPAS, PA-C',
    role: 'Director at large',
    location: 'Boston, MA',
    // Form bio dropped the leading H ("arrison Keyes…"); restored here.
    bio: 'Harrison Keyes currently practices in primary care at Boston Health Care for the Homeless Program. He started in the respite program following his graduation from the MGH Institute of Health Professions in 2018. During the COVID-19 pandemic, Harrison conducted the program’s COVID testing and screening endeavors across Boston’s shelter system. He now works as the medical director of the JYP clinic, overseeing the program’s largest outpatient site, offering primary care, psychiatry, Hep C and HIV care as well as addiction and recovery support. Harrison also volunteers as the Chief Delegate for the Massachusetts Association of PAs.',
    photo: '/leadership/harrison-keyes.jpg',
  },
  {
    id: 'edward-traverso',
    sort: 90,
    group: 'board',
    name: 'Edward Traverso',
    credentials: 'PA-C, CAQ-Psychiatry',
    role: 'Director at large',
    location: 'Richland, WA',
    // Dropped submitter note "Feel free to trim it down!" First person → third person only.
    bio: 'His background of working as a mental health counselor in inpatient psychiatry and eventually training in addiction during psychiatry residency led to his passion for bringing addiction treatment to the forefront of his practice. During his time as a provider he has worked in community care where he has helped integrate dual-diagnosis care from Yakima, to the Tri-Cities, and beyond. Currently he practices outpatient at the VA in Boise. Additionally he leads an addiction treatment program at Benton County Corrections where he is working to implement a grant-funded program to expand access to addiction and detoxification treatment for at-risk individuals during incarceration and support their transition to ongoing care. One of his professional highlights has been helping implement new advancements in addiction care, including rapid-access injection policies, to make effective treatment more accessible. Outside of medicine, he is passionate about music and travel.',
    photo: '/leadership/edward-traverso.jpg',
  },
  {
    id: 'clarissa-peterson',
    sort: 100,
    group: 'committees',
    name: 'Clarissa Peterson',
    credentials: 'MPAS, PA-C',
    role: 'Membership chair',
    location: 'Provo, Utah',
    bio: 'Clarissa Peterson, MPAS, PA-C graduated from the University of Utah Physician Assistant Program in 2009 and has dedicated her career to community health, providing care for underserved populations. Her clinical interests include addiction medicine, women\'s health, global health, mental health, and hepatitis C, with a particular focus on caring for unhoused individuals and immigrant communities. In addition to her clinical practice, Clarissa serves as clinical faculty for several physician assistant programs, precepts PA students, and frequently presents continuing medical education lectures on addiction medicine and related topics. She has served as Chair of the SAMPA Membership Committee since 2025 and is committed to advancing the PA profession through education, mentorship, and professional service.',
    photo: '/leadership/clarissa-peterson.jpg',
  },
  {
    id: 'deanna-bridge-najera',
    sort: 110,
    group: 'committees',
    name: 'Deanna Bridge Najera',
    credentials: 'PA-C, DFAAPA, FCPP',
    role: 'Bylaws and Policy chair',
    location: 'Maryland',
    bio: 'PA Najera splits her time between a suburban emergency department, a county health department, and a community mental health agency. She holds CAQs in Psychiatry and Emergency Medicine, as well as a Master’s degree in Clinical Mental Health Counseling. She previously served on the ASAM Clinical Guideline Committee for Benzodiazepine Tapering. Regardless of the role she is serving in, PA Najera strives to care for each individual while remaining mindful of the social drivers of health at play and addressing population-level challenges whenever possible.',
    photo: '/leadership/deanna-bridge-najera.jpg',
    linkedin: 'https://www.linkedin.com/in/deanna-bridge-najera-417a944/',
  },
  {
    id: 'jordan-vold',
    sort: 120,
    group: 'committees',
    name: 'Jordan Vold',
    credentials: 'PA-C, CAQ-PSY',
    role: 'Bylaws and Policy co-chair',
    bio: 'Jordan Vold, PA-C, CAQ-PSY, is a psychiatric and addiction PA at UI Health Mile Square Health Center in Rockford, Illinois, and an associate board member of the Illinois Society of Addiction Medicine. He led on-site low-barrier MOUD there and is site PI for an OTP launch.',
    photo: '/leadership/jordan-vold.jpg',
  },
  {
    id: 'cheryl-vanderford',
    sort: 130,
    group: 'committees',
    name: 'Cheryl Vanderford',
    credentials: 'MSPAS, PA-C',
    role: 'Education member',
    location: 'Lexington, KY',
    bio: 'Cheryl Vanderford, MSPAS, PA-C, is an Associate Professor at the University of Kentucky in the Department of Physician Assistant Studies (UKPA). She currently practices clinically in the Student Behavioral Health Clinic at UK. Prior to joining UK as faculty, she served as a PA in the Mental Health Service at the Lexington Veterans Affairs HealthCare System where she provided care to Veterans in a variety of settings including an outpatient walk-in/crisis clinic, emergency department, and residential PTSD/Substance Use Treatment program. Cheryl completed a fellowship with the VA National Center for Patient Safety with specific training on quality improvement, research, and teaching. Her research focuses on substance use disorders, on topics related to mental health, and on topics related to pedagogy in higher education. She served as a principal investigator for a SAMHSA funded grant, implementing medication for opioid use disorder (MOUD) training in UKPA curricula, and developing and coordinating continuing medical education conferences to reach interprofessional providers on a national scale. Cheryl’s involvement in SAMPA reflects her passion for advancing PA education related to substance use disorders and equipping students to become transformative leaders who provide evidence based, compassionate care in their communities.',
    photo: '/leadership/cheryl-vanderford.jpg',
  },
  {
    id: 'diane-bruessow',
    sort: 140,
    group: 'committees',
    name: 'Diane Bruessow',
    credentials: 'DMSc, PA-C, CPXP, DFAAPA, FCPP',
    role: 'Finance advisor',
    location: null,
    omitLocation: true,
    bio: 'Dr. Diane Bruessow, DMSc, PA-C, CPXP, DFAAPA, FCPP, earned her Doctor of Medical Science degree from Shenandoah University and is an alumna of the Long Island University/Brooklyn Hospital PA Program. She is an academic clinician serving as principal faculty in Touro University’s Hybrid PA Program (MT) and practicing clinically with an affiliate of Mass General Brigham (MA). Her professional work centers on healthcare distribution, access, and quality, with a focus on improving systems of care. Dr. Bruessow previously served as assistant professor adjunct in the Department of Internal Medicine at Yale School of Medicine and director of justice, equity, diversity, and inclusion for the PA Online Program. She has served on elected and appointed boards and on finance and audit committees for multiple national medical associations, including the AAPA, and serves on SAMPA’s Finance Committee. Beyond medicine, Dr. Bruessow’s interests include the performing arts and the occasional full night’s sleep.',
    photo: '/leadership/diane-bruessow.jpg',
    linkedin: 'https://www.linkedin.com/in/dianebruessow',
  },
  {
    id: 'jonathan-baker',
    sort: 150,
    group: 'committees',
    name: 'Jonathan Baker',
    credentials: 'PA-C, MPAS, DFAAPA',
    role: 'Membership advisor',
    bio: 'Jonathan Baker, PA-C, MPAS, DFAAPA, practices at NYU Langone Health and is SAMPA’s membership advisor.',
    photo: '/leadership/jonathan-baker.jpg',
  },
  {
    id: 'james-anderson',
    sort: 160,
    group: 'committees',
    name: 'James E. Anderson',
    credentials: 'PA-C, MPAS, DFAAPA',
    role: 'General advisor',
    bio: 'James E. Anderson, PA-C, MPAS, DFAAPA, is a Seattle addiction-medicine PA and a former president of the AAPA Society of PAs in Addiction Medicine. He is a SAMPA general advisor.',
    photo: '/leadership/jim-anderson.jpg',
  },
  {
    id: 'kelsy-babbitt-ruggiero',
    sort: 170,
    group: 'committees',
    name: 'Kelsy Babbitt Ruggiero',
    credentials: 'PA-C',
    role: 'Membership committee',
    bio: 'Kelsy Babbitt Ruggiero, PA-C, is a street-medicine PA at Akido Labs in Bakersfield, California, and serves on SAMPA’s membership committee. She trained at the Duke PA program (2023).',
    photo: '/leadership/kelsy-babbitt-ruggiero.jpg',
  },
  {
    id: 'megan-zawacki',
    sort: 180,
    group: 'committees',
    name: 'Megan Zawacki',
    credentials: 'PA-C',
    role: 'Membership committee',
    bio: 'Megan Zawacki, PA-C, is an addiction-medicine PA at St. Peter’s Health in Helena, Montana. She trained at the Rocky Mountain College MPAS program and serves on SAMPA’s membership committee.',
    photo: '/leadership/megan-zawacki.jpg',
  },
  {
    id: 'lamont-scott',
    sort: 190,
    group: 'committees',
    name: 'Lamont Andante Scott',
    credentials: 'PA-C',
    role: 'Membership committee',
    bio: 'Lamont Andante Scott, PA-C, is a Washington PA at the didgʷálič Wellness Center in Anacortes. He trained at MEDEX Northwest (Seattle Class 49) and serves on SAMPA’s membership committee.',
    photo: '/leadership/lamont-scott.jpg',
  },
  {
    id: 'kerith-hartmann',
    sort: 200,
    group: 'committees',
    name: 'Kerith Hartmann',
    credentials: 'PA-C',
    role: 'Certification ad-hoc workgroup',
    also: ['Membership news'],
    bio: 'Kerith Hartmann, PA-C, practices primary care and addiction medicine at OHSU. She was named the 2025 Oregon Society of Physician Associates PA of the Year. She serves on SAMPA’s certification workgroup and membership news.',
    photo: '/leadership/kerith-hartmann.jpg',
  },
  {
    id: 'debra-newman',
    sort: 210,
    group: 'committees',
    name: 'Debra Newman',
    credentials: 'PA-C, MSPAS, MPH',
    role: 'Certification ad-hoc workgroup',
    bio: 'Debra Newman, PA-C, MSPAS, MPH, leads outpatient SUD services at Encompass Community Services in Santa Cruz County, California, and is a PCSS-MOUD lead mentor. She previously practiced in New Mexico treatment courts and served as a co-editor of ASAM Weekly.',
    bioLong: 'Debra R. Newman, PA-C, MSPAS, MPH, is lead provider for outpatient substance use disorder services at Encompass Community Services in Santa Cruz County, California. She is a lead mentor for the Providers Clinical Support System and the only PA listed in that lead-mentor cohort. Newman previously served as medical practitioner for adult drug and mental health treatment courts in Santa Fe County, New Mexico, and as a co-editor of ASAM Weekly. She helped develop ASAM courses on treating opioid use disorder and on integrating addiction medicine with treatment courts. She trained at the University of St. Francis and holds an MPH. She received a 2017–2018 PA Foundation/NIDA-CTN Mentored Outreach Award.',
    photo: '/leadership/debra-newman.jpg',
  },
];

export const LEADERSHIP_GROUPS = [
  {
    id: 'board',
    title: 'Board and officers',
    intro: 'Voting officers and directors at large for 2026–2027.',
  },
  {
    id: 'committees',
    title: 'Committees, workgroups, and advisors',
    intro: 'Standing-committee chairs and members, ad-hoc work, and non-voting advisors. People who also sit on the board are listed once, above.',
  },
];

export function listLeadership() {
  return LEADERSHIP.slice().sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}

export function listLeadershipByGroup(groupId) {
  return listLeadership().filter((person) => person.group === groupId);
}

export function formatLocation(person) {
  if (person.omitLocation) return null;
  return person.location || null;
}

/** First + last initial (Deanna Bridge Najera → DN). */
export function initials(name) {
  const parts = String(name || '')
    .split(/\s+/)
    .filter((part) => part && !part.startsWith('“') && !part.startsWith('"'));
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
