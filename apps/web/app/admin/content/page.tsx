'use client';

import { AdminPageStub } from '../_components/AdminPageStub';

export default function AdminContentPage() {
  return (
    <AdminPageStub
      title="Quest Moderation"
      description="Review and moderate quests, AI-generated content, notifications, and challenge configurations."
      icon="book"
      priority="P1"
      features={[
        'Queue of flagged quests (auto-flagged + user reports)',
        'Review actions: approve, edit, reject with reason',
        'Bulk moderation actions',
        'Notification / message template editor',
        'Achievement / challenge configuration',
        'AI content quality review queue',
      ]}
    />
  );
}
