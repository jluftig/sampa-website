import React from 'react';
import { QUICK_START } from '../../../lib/bup/protocols/quickStart';
import ProtocolShell from '../../../components/bup/ProtocolShell';
import ProtocolFlow from '../../../components/bup/ProtocolFlow';

export default function QuickStartPage() {
  return (
    <ProtocolShell protocol={QUICK_START}>
      <ProtocolFlow flow={QUICK_START.flow} />
    </ProtocolShell>
  );
}
