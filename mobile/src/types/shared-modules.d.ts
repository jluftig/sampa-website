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
