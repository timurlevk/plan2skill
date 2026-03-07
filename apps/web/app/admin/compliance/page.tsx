'use client';

import { AdminPageStub } from '../_components/AdminPageStub';

export default function AdminCompliancePage() {
  return (
    <AdminPageStub
      title="Compliance & GDPR"
      description="GDPR compliance dashboard. Data export requests, anonymization pipeline, consent audit, social kill switches."
      icon="shield"
      priority="P0"
      features={[
        'DSAR request queue with 30-day deadline tracking',
        'One-click data export generation (JSON + CSV)',
        'Account anonymization pipeline trigger',
        'Consent audit log (searchable, 5-year retention)',
        'Social feature kill switches (leaderboards, parties, feed, reactions)',
        'Emergency disable: turn ALL social features off',
        'Admin audit log viewer',
      ]}
    />
  );
}
