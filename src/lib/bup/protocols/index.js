// Registry of the five protocol content modules. Order here is the display
// order in the chooser's "Know which protocol you need?" grid.
import { QUICK_START } from './quickStart';
import { LOW_DOSE } from './lowDose';
import { DTI } from './dti';
import { OD_REVERSAL } from './odReversal';
import { SELF_START } from './selfStart';

export const PROTOCOLS = [QUICK_START, LOW_DOSE, DTI, OD_REVERSAL, SELF_START];

export function protocolBySlug(slug) {
  return PROTOCOLS.find((p) => p.slug === slug) || null;
}
