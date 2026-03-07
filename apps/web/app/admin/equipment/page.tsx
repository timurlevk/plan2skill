'use client';

import { AdminPageStub } from '../_components/AdminPageStub';

export default function AdminEquipmentPage() {
  return (
    <AdminPageStub
      title="Equipment Catalog"
      description="Manage the equipment catalog. Create, edit, and version equipment items with SCD Type 2 history."
      icon="shield"
      priority="P0"
      features={[
        'CRUD table for EquipmentCatalog items',
        'Inline editing: name, description, rarity, slot, attributeBonus',
        'SCD Type 2 versioning (edit creates new version)',
        'Bulk import from JSON',
        'Attribute bonus visualization preview',
        'Filter by slot, rarity, active status',
        'Soft-delete (isActive = false)',
      ]}
    />
  );
}
