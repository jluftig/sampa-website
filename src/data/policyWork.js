export const POLICY_WORK_OVERLAY_KEY = 'sampa.phpWorkOverlay.v1';

export const POLICY_WORK_STATUSES = [
  { id: 'watching', label: 'Watching' },
  { id: 'screening', label: 'Screening' },
  { id: 'drafting', label: 'Drafting' },
  { id: 'chairs_review', label: 'Chairs review' },
  { id: 'filed', label: 'Filed' },
  { id: 'declined', label: 'Declined' },
];

const STATUS_IDS = new Set(POLICY_WORK_STATUSES.map((row) => row.id));

export const POLICY_WORK_CRITERIA = [
  {
    id: 'addiction_related',
    group: 'hard_screen',
    polarity: 'pass',
    label: 'Addiction-related',
    question: 'Is this about addiction or substance use treatment?',
  },
  {
    id: 'affects_pas',
    group: 'hard_screen',
    polarity: 'pass',
    label: 'Affects PAs generally',
    question: 'Does it affect physician associates generally?',
  },
  {
    id: 'priority_pa_org',
    group: 'hard_screen',
    polarity: 'pass',
    label: 'Priority PA organization',
    question: 'Is this an ask from AAPA, NCCPA, ARC-PA, or PAEA, or required to keep constituent status?',
  },
  {
    id: 'mission_alignment',
    group: 'scorecard',
    polarity: 'pass',
    label: 'Mission alignment',
    question: 'Is this issue directly related to our mission, strategic priorities, or core responsibilities?',
  },
  {
    id: 'impact',
    group: 'scorecard',
    polarity: 'pass',
    label: 'Impact',
    question: 'Does the issue materially affect our patients, clinicians, members, community, or healthcare system?',
  },
  {
    id: 'expertise',
    group: 'scorecard',
    polarity: 'pass',
    label: 'Expertise and authority',
    question: 'Do we have recognized expertise or a legitimate organizational basis for commenting?',
  },
  {
    id: 'organizational_relevance',
    group: 'scorecard',
    polarity: 'pass',
    label: 'Organizational relevance',
    question: 'Does the issue directly affect our operations, workforce, services, or stakeholders?',
  },
  {
    id: 'public_interest',
    group: 'scorecard',
    polarity: 'pass',
    label: 'Public interest',
    question: 'Would an organizational statement meaningfully inform or protect the public?',
  },
  {
    id: 'organizational_voice',
    group: 'scorecard',
    polarity: 'pass',
    label: 'Need for organizational voice',
    question: 'Is there something SAMPA can add that existing statements do not already cover?',
  },
  {
    id: 'potential_benefit',
    group: 'scorecard',
    polarity: 'pass',
    label: 'Potential benefit',
    question: 'Could speaking advance patient care, public health, health equity, safety, or our mission?',
  },
  {
    id: 'potential_harm',
    group: 'scorecard',
    polarity: 'caution',
    label: 'Potential harm or risk',
    question: 'Could commenting create substantial legal, reputational, political, clinical, or stakeholder risk?',
  },
  {
    id: 'timing',
    group: 'scorecard',
    polarity: 'pass',
    label: 'Timing',
    question: 'Is a response needed now, or would silence or delay itself create risk?',
  },
  {
    id: 'existing_position',
    group: 'scorecard',
    polarity: 'pass',
    label: 'Existing position',
    question: 'Do we already have an established policy or position that answers the question?',
  },
];

const CRITERION_IDS = POLICY_WORK_CRITERIA.map((row) => row.id);

const HHS_PACKET = 'https://docs.google.com/document/d/1SQWwYdfgSkxT8VYASlPZ4s4v-yGHdGBa/edit?usp=share_link&ouid=104595662487774707106&rtpof=true&sd=true';
const ASAM_PACKET = 'https://docs.google.com/document/d/1d7vJlcLmm7go7S7WvWhXMbl06qBkejRTlDFk7Ut3B5o/edit?usp=sharing';

const ITEMS = [
  {
    id: 'php-2026-1',
    responseNumber: 1,
    title: 'Comment on Chronic Disease of Addiction',
    organization: 'HHS',
    status: 'filed',
    dueDate: null,
    submittedAt: '2026-07-05',
    submittedTo: 'Brian Dautch of AAPA',
    owner: '',
    packetUrl: HHS_PACKET,
    publicPath: '/policy/hhs-rfi-chronic-disease-addiction-2026',
    criteria: {
      addiction_related: true,
      affects_pas: true,
      priority_pa_org: true,
      mission_alignment: true,
      impact: true,
      expertise: false,
      organizational_relevance: false,
      public_interest: false,
      organizational_voice: false,
      potential_benefit: false,
      potential_harm: false,
      timing: false,
      existing_position: false,
    },
    punchList: [
      {
        id: 'match-published',
        text: 'Confirm the Google Doc matches the published HHS comment.',
        done: false,
      },
    ],
  },
  {
    id: 'php-2026-2',
    responseNumber: 2,
    title: 'Clinical Consensus Statement on Drug Testing in Substance Use Disorder Treatment',
    organization: 'ASAM',
    status: 'filed',
    dueDate: null,
    submittedAt: '2026-06-29',
    submittedTo: 'Jennifer Kolb of AAPA',
    owner: '',
    packetUrl: ASAM_PACKET,
    publicPath: null,
    criteria: {
      addiction_related: true,
      affects_pas: true,
      priority_pa_org: true,
      mission_alignment: true,
      impact: true,
      expertise: false,
      organizational_relevance: false,
      public_interest: false,
      organizational_voice: false,
      potential_benefit: false,
      potential_harm: false,
      timing: false,
      existing_position: false,
    },
    punchList: [
      {
        id: 'separate-correctional',
        text: 'Keep this drug-testing statement separate from the correctional-settings comment on /policy.',
        done: false,
      },
    ],
  },
  {
    id: 'php-2026-3',
    responseNumber: 3,
    title: 'Request for Information, Training and Care Delivery Models for Safe Administration of Potential FDA-Approved Psychedelic Therapies in Ambulatory Clinical Settings',
    organization: 'HRSA',
    status: 'screening',
    dueDate: null,
    submittedAt: null,
    submittedTo: '',
    owner: '',
    packetUrl: null,
    publicPath: '/policy/hrsa-rfi-psychedelic-therapies-2026',
    criteria: {
      addiction_related: true,
      affects_pas: true,
      priority_pa_org: false,
      mission_alignment: false,
      impact: false,
      expertise: false,
      organizational_relevance: false,
      public_interest: false,
      organizational_voice: false,
      potential_benefit: false,
      potential_harm: false,
      timing: false,
      existing_position: false,
    },
    punchList: [
      {
        id: 'fill-sheet',
        text: 'Record the submission date and who received it. The sheet left both blank.',
        done: false,
      },
      {
        id: 'match-published',
        text: 'Confirm whether this row is the published HRSA psychedelic RFI comment.',
        done: false,
      },
    ],
  },
];

function cloneItem(item) {
  return {
    ...item,
    criteria: { ...item.criteria },
    punchList: item.punchList.map((row) => ({ ...row })),
  };
}

export function listPolicyWorkItems() {
  return ITEMS.map(cloneItem);
}

export function policyWorkStatusLabel(status) {
  return POLICY_WORK_STATUSES.find((row) => row.id === status)?.label || status;
}

export function hardScreenPasses(criteria) {
  const checks = criteria || {};
  const addictionAndPa = !!checks.addiction_related && !!checks.affects_pas;
  return addictionAndPa || !!checks.priority_pa_org;
}

function isIsoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parsePolicyWorkOverlay(raw) {
  if (typeof raw !== 'string' || !raw) return {};
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    return data;
  } catch {
    return {};
  }
}

export function mergePolicyWorkOverlay(items, overlay) {
  const source = Array.isArray(items) ? items : [];
  if (!overlay || typeof overlay !== 'object' || Array.isArray(overlay)) {
    return source.map(cloneItem);
  }
  return source.map((item) => {
    const next = cloneItem(item);
    const patch = overlay[item.id];
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return next;
    if (STATUS_IDS.has(patch.status)) next.status = patch.status;
    if (typeof patch.owner === 'string') next.owner = patch.owner.trim().slice(0, 120);
    if (patch.dueDate === null || patch.dueDate === '') next.dueDate = null;
    else if (isIsoDate(patch.dueDate)) next.dueDate = patch.dueDate;
    if (patch.criteria && typeof patch.criteria === 'object' && !Array.isArray(patch.criteria)) {
      for (const id of CRITERION_IDS) {
        if (typeof patch.criteria[id] === 'boolean') next.criteria[id] = patch.criteria[id];
      }
    }
    if (patch.punchDone && typeof patch.punchDone === 'object' && !Array.isArray(patch.punchDone)) {
      next.punchList = next.punchList.map((row) => (
        typeof patch.punchDone[row.id] === 'boolean'
          ? { ...row, done: patch.punchDone[row.id] }
          : row
      ));
    }
    return next;
  });
}

export function policyWorkOverlayFromEdits(seed, edited) {
  const overlay = {};
  const baseById = new Map((seed || []).map((item) => [item.id, item]));
  for (const item of edited || []) {
    const base = baseById.get(item.id);
    if (!base) continue;
    const patch = {};
    if (item.status !== base.status && STATUS_IDS.has(item.status)) patch.status = item.status;
    if (item.owner !== base.owner && typeof item.owner === 'string') {
      patch.owner = item.owner.trim().slice(0, 120);
    }
    if (item.dueDate !== base.dueDate) {
      if (item.dueDate === null || item.dueDate === '') patch.dueDate = null;
      else if (isIsoDate(item.dueDate)) patch.dueDate = item.dueDate;
    }
    const criteria = {};
    for (const id of CRITERION_IDS) {
      if (!!item.criteria?.[id] !== !!base.criteria?.[id]) criteria[id] = !!item.criteria[id];
    }
    if (Object.keys(criteria).length) patch.criteria = criteria;
    const punchDone = {};
    for (const row of base.punchList) {
      const next = (item.punchList || []).find((punch) => punch.id === row.id);
      if (next && !!next.done !== !!row.done) punchDone[row.id] = !!next.done;
    }
    if (Object.keys(punchDone).length) patch.punchDone = punchDone;
    if (Object.keys(patch).length) overlay[item.id] = patch;
  }
  return overlay;
}

export function upcomingPolicyWorkDeadlines(items, today) {
  const day = isIsoDate(today) ? today : '0000-00-00';
  return (items || [])
    .filter((item) => (
      item.dueDate
      && item.dueDate >= day
      && item.status !== 'filed'
      && item.status !== 'declined'
    ))
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.responseNumber - b.responseNumber);
}

export function policyWorkTimeline(items) {
  return (items || [])
    .map((item) => {
      if (item.dueDate) {
        return {
          itemId: item.id,
          responseNumber: item.responseNumber,
          title: item.title,
          organization: item.organization,
          kind: 'due',
          date: item.dueDate,
        };
      }
      if (item.submittedAt) {
        return {
          itemId: item.id,
          responseNumber: item.responseNumber,
          title: item.title,
          organization: item.organization,
          kind: 'submitted',
          date: item.submittedAt,
        };
      }
      return {
        itemId: item.id,
        responseNumber: item.responseNumber,
        title: item.title,
        organization: item.organization,
        kind: 'undated',
        date: null,
      };
    })
    .sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date) || a.responseNumber - b.responseNumber;
      if (a.date) return -1;
      if (b.date) return 1;
      return a.responseNumber - b.responseNumber;
    });
}
