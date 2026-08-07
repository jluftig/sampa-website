// Ambient types for the pure-JS modules shared from the web app's `src/lib`,
// exposed as the `sampa-shared` symlinked package (see metro.config.js and
// scripts/link-shared.js). These files live outside this project's tsconfig
// `include`, so we declare their surface here.

declare module 'sampa-shared/membership' {
  export type MembershipTier = {
    key: string;
    name: string;
    desc: string;
    highlight?: boolean;
    prices: Record<number, number>;
    lifetime?: number;
  };
  export const MEMBERSHIP_TIERS: MembershipTier[];
  export function tierByKey(key: string): MembershipTier | null;
  export function savingsPercent(tier: MembershipTier, years: number): number;
  export function durationsForTier(tier: MembershipTier): (number | 'lifetime')[];
  export function durationLabel(duration: number | 'lifetime'): string;
}

declare module 'sampa-shared/comments' {
  export type ReactionKey = 'thumbs_up' | 'celebrate' | 'insight' | 'heart' | 'clap';
  export const MAX_COMMENT_LENGTH: number;
  export const REACTIONS: { key: ReactionKey; glyph: string; label: string }[];
  export function isReactionKey(key: string): boolean;
  export function reactionGlyph(key: string): string;
  export function reactionLabel(key: string): string;
  export function summarizeReactions(
    rows: { user_id: string; emoji: string }[],
    userId: string | null | undefined,
  ): { counts: Record<string, number>; mine: string | null };
  export function normalizeCommentBody(raw: string): {
    ok: boolean;
    body: string;
    error: string | null;
  };
}

declare module 'sampa-shared/usStates' {
  export const US_STATES: string[];
}

declare module 'sampa-shared/organizations' {
  export type Organization = {
    name?: string;
    role?: string;
    practice_setting?: string;
    practice_settings?: string[];
    practice_setting_other?: string | null;
    city?: string;
    state?: string;
    website?: string;
  };
  export function displayOrganizations(person: any): Organization[];
  export function formatOrgLocation(org: Organization): string;
  export function normalizeWebsite(raw: string): string;
  export function formatWebsiteLabel(url: string): string;
  export function legacyPracticeSettingText(person: any): string;
}

declare module 'sampa-shared/practiceSettings' {
  export const PRACTICE_SETTINGS: { slug: string; label: string; chipClass: string }[];
  export function formatPracticeSettingLabel(slug: string): string;
  export function sanitizePracticeSettingSlugs(raw: unknown): string[];
  export function collectPracticeSettings(personOrOrgs: any): string[];
  export function practiceSettingMobileColors(slug: string): { bg: string; text: string };
}

declare module 'sampa-shared/tags' {
  export type SharedTag = { id?: string; name: string; short_label: string | null; slug: string };
  export function collectPostTags(post: any): SharedTag[];
}
