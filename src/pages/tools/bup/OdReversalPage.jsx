import React from 'react';
import { OD_REVERSAL } from '../../../lib/bup/protocols/odReversal';
import ProtocolShell from '../../../components/bup/ProtocolShell';
import ProtocolFlow from '../../../components/bup/ProtocolFlow';
import StepRenderer from '../../../components/bup/StepRenderer';

export default function OdReversalPage() {
  return (
    <ProtocolShell protocol={OD_REVERSAL}>
      <ProtocolFlow flow={OD_REVERSAL.flow} protocol={OD_REVERSAL} />
      <div className="mt-10">
        <StepRenderer
          step={{
            kind: 'alert',
            title: OD_REVERSAL.bePrepared.title,
            intro: OD_REVERSAL.bePrepared.intro,
            items: OD_REVERSAL.bePrepared.items,
          }}
        />
      </div>
    </ProtocolShell>
  );
}
