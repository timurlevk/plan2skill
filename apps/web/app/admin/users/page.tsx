'use client';

import { AdminPageStub } from '../_components/AdminPageStub';

export default function AdminUsersPage() {
  return (
    <AdminPageStub
      title="User Management"
      description="View, search, and manage user accounts. Ban/unban users, change roles, override progression."
      icon="users"
      priority="P0"
      features={[
        'Searchable user table (name, publicId, role, level, tier, status)',
        'Filters by role, subscription tier, level range, status',
        'User detail view with full progression timeline',
        'Ban / unban actions with audit logging',
        'Role assignment (moderator / admin / superadmin)',
        'Manual XP / level / streak override',
        'Trigger DSAR export from user detail',
        'Export user list to CSV',
      ]}
    />
  );
}
