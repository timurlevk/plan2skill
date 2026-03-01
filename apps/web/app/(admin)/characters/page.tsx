'use client';

import { AdminPageStub } from '../_components/AdminPageStub';

export default function AdminCharactersPage() {
  return (
    <AdminPageStub
      title="Character Templates"
      description="Manage character templates for the character constructor. Review user-submitted templates."
      icon="star"
      priority="P0"
      features={[
        'List of character templates (8 built-in + user-created)',
        'Template editor: 16×16 pixel art grid with palette picker',
        'Layer management: base body, hair, skin, expression, accessories',
        'Approval queue for user-submitted characters',
        'Diversity guidelines enforcement checker',
        'Template enable/disable toggle',
        'Bulk import templates from JSON',
      ]}
    />
  );
}
