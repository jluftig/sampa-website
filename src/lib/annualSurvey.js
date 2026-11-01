// Tier B annual survey. Wording lives here so a copy edit does not touch the page.
// Answers are one jsonb row per member per year, never columns on profiles.
// Culture-pulse items and funding notes are not in this survey.

export const SURVEY_TIME_ZONE = 'America/Los_Angeles';

export function pacificCalendarYear(date) {
  const year = new Intl.DateTimeFormat('en-US', {
    timeZone: SURVEY_TIME_ZONE,
    year: 'numeric',
  }).format(date);
  return Number(year);
}

export function surveyIsOpen(year, now = new Date()) {
  return Number(year) === pacificCalendarYear(now);
}

const BENEFITS = [
  'Member directory',
  'Advocacy for patient access and MOUD',
  'Education and the Addiction Medicine CAQ',
  'A community of addiction-medicine PAs',
  'Student and pre-PA pathways',
  'News: weekly, daily, and the monthly topic brief',
];

const EDUCATION_TOPICS = [
  'MOUD and alcohol medications',
  'Stimulant use disorder',
  'Co-occurring mental health',
  'Pregnancy and postpartum',
  'Adolescents',
  'Harm reduction and overdose prevention',
  'Practice management and billing',
  'The Addiction Medicine CAQ',
];

const EDUCATION_FORMATS = [
  'Live webinar',
  'Conference session',
  'Case discussion',
  'Short recorded lesson',
  'Written brief in the newsletter',
];

const ADVOCACY = [
  'MOUD access and coverage',
  'PA practice authority',
  'Harm reduction',
  'Payment for addiction care',
  'Workforce and training',
];

export const ANNUAL_SURVEY = {
  year: 2026,
  title: '2026 member survey',
  minutes: 2,
  sections: [
    {
      id: 'aim',
      title: 'Aim the work',
      questions: [
        {
          id: 'top_benefits',
          label: 'Which SAMPA benefits matter most to you? Pick up to 3.',
          type: 'multi',
          max: 3,
          options: BENEFITS,
        },
        {
          id: 'top_priorities',
          label: 'What should SAMPA prioritize this year? Pick up to 3.',
          type: 'multi',
          max: 3,
          options: [
            'Advocacy',
            'Education',
            'Member community and the directory',
            'Students and precepting',
            'Practice resources',
            'Public communications',
          ],
        },
        {
          id: 'education_topics',
          label: 'Which education topics do you want?',
          type: 'multi',
          options: EDUCATION_TOPICS,
        },
        {
          id: 'education_formats',
          label: 'Which education formats work for you?',
          type: 'multi',
          options: EDUCATION_FORMATS,
        },
        {
          id: 'education_next',
          label: 'What should education prioritize next year? Pick up to 3.',
          type: 'multi',
          max: 3,
          options: EDUCATION_TOPICS,
        },
        {
          id: 'advocacy_priorities',
          label: 'Which advocacy priorities matter most? Pick up to 3.',
          type: 'multi',
          max: 3,
          options: ADVOCACY,
        },
        {
          id: 'most_valuable',
          label: 'What is the single most valuable support SAMPA can offer you?',
          type: 'single',
          options: BENEFITS,
        },
        {
          id: 'feedback',
          label: 'Anything else we should know, including barriers to taking part?',
          type: 'text',
        },
      ],
    },
    {
      id: 'helpers',
      title: 'Find the helpers',
      questions: [
        {
          id: 'speak_settings',
          label: 'Would you speak about your practice? Which settings?',
          type: 'multi',
          options: [
            'Clinic or OTP',
            'Hospital or ED',
            'Street medicine or outreach',
            'Telehealth',
            'Corrections',
            'Not this year',
          ],
        },
        {
          id: 'speak_topics',
          label: 'Topics you would speak on',
          type: 'multi',
          options: EDUCATION_TOPICS,
        },
        {
          id: 'testing_materials',
          label: 'Would you help develop testing or CAQ materials?',
          type: 'yesno',
        },
        {
          id: 'finance_committee',
          label: 'Interested in the finance or fundraising committee?',
          type: 'yesno',
        },
        {
          id: 'advocacy_willingness',
          label: 'How would you help with advocacy?',
          type: 'multi',
          options: [
            'Meet with officials',
            'Write or sign letters',
            'Educate organizations about PA practice',
            'Not this year',
          ],
        },
        {
          id: 'engagement',
          label: 'Where do you want to show up?',
          type: 'multi',
          options: ['Social media', 'Events', 'Website', 'Newsletter'],
        },
        {
          id: 'greater_involvement',
          label: 'Open to a larger role?',
          type: 'multi',
          options: ['Leadership', 'Speaking', 'Research', 'Advocacy'],
        },
        {
          id: 'committee_interest',
          label: 'Committees you would consider',
          type: 'multi',
          options: [
            'Education',
            'Advocacy / policy',
            'Membership',
            'Finance',
            'Students',
            'Not this year',
          ],
        },
        {
          id: 'networking',
          label: 'Want more chances to meet other members?',
          type: 'yesno',
        },
        {
          id: 'student_engagement',
          label: 'How would you help students?',
          type: 'multi',
          options: [
            'Shadowing',
            'Give a talk',
            'Review a personal statement',
            'Mock interview',
            'Precept',
            'Not this year',
          ],
        },
      ],
    },
  ],
};

export function surveyQuestions(survey = ANNUAL_SURVEY) {
  return survey.sections.flatMap((section) => section.questions);
}

export function emptySurveyAnswers(survey = ANNUAL_SURVEY) {
  const answers = {};
  for (const question of surveyQuestions(survey)) {
    if (question.type === 'text') answers[question.id] = '';
    else if (question.type === 'yesno' || question.type === 'single') answers[question.id] = null;
    else answers[question.id] = [];
  }
  return answers;
}

export function sanitizeSurveyAnswers(raw, survey = ANNUAL_SURVEY) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const clean = {};
  for (const question of surveyQuestions(survey)) {
    const value = source[question.id];
    if (question.type === 'text') {
      clean[question.id] = typeof value === 'string' ? value.trim().slice(0, 4000) : '';
    } else if (question.type === 'yesno') {
      clean[question.id] = value === true || value === false ? value : null;
    } else if (question.type === 'single') {
      clean[question.id] = question.options.includes(value) ? value : null;
    } else {
      const picked = Array.isArray(value)
        ? value.filter((item) => question.options.includes(item))
        : [];
      const unique = [];
      for (const item of picked) {
        if (!unique.includes(item)) unique.push(item);
      }
      clean[question.id] = question.max ? unique.slice(0, question.max) : unique;
    }
  }
  return clean;
}

export function surveyHasAnswer(answers) {
  if (!answers) return false;
  return Object.values(answers).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return value === true || value === false;
  });
}
