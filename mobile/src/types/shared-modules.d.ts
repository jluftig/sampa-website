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

declare module 'sampa-shared/format' {
  export function formatDate(value: string | number | Date | null | undefined): string;
  export function formatDateOnly(value: string | number | Date | null | undefined): string;
}

declare module 'sampa-shared/usStates' {
  export const US_STATES: string[];
}

declare module 'sampa-shared/organizations' {
  export type Organization = {
    name?: string;
    role?: string;
    practice_setting?: string;
    city?: string;
    state?: string;
    website?: string;
  };
  export function displayOrganizations(person: any): Organization[];
  export function formatOrgLocation(org: Organization): string;
  export function normalizeWebsite(raw: string): string;
  export function formatWebsiteLabel(url: string): string;
}

declare module 'sampa-shared/tags' {
  export type SharedTag = { id?: string; name: string; short_label: string | null; slug: string };
  export function collectPostTags(post: any): SharedTag[];
}
