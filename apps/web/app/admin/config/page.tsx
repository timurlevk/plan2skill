'use client';

import { AdminPageStub } from '../_components/AdminPageStub';

export default function AdminConfigPage() {
  return (
    <AdminPageStub
      title="Reference Data Management"
      description="Manage reference data with SCD Type 2 versioning. Subscription tiers, XP values, skill domains, rarities."
      icon="gear"
      priority="P0"
      features={[
        'Subscription tiers: name, price, limits, XP caps',
        'XP values: source, baseAmount, rarity multiplier',
        'Skill domains: name, icon, category',
        'Rarity tiers: name, color, icon, dropRate',
        'Streak milestones: day thresholds, rewards, multipliers',
        'Version history per entity with rollback',
        'Preview impact of changes before saving',
      ]}
    />
  );
}
