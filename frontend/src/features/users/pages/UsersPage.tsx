import React from 'react';
import { PageHeader } from '../../../shared/components/layout';
import { Button } from '../../../shared/components/ui';
import { EmptyState } from '../../../shared/components/feedback';

export function UsersPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage user accounts and role assignments"
        actions={
          <Button size="sm">+ Add User</Button>
        }
      />
      <div className="card">
        <EmptyState
          title="No users found"
          description="User management coming in Phase 2 implementation."
        />
      </div>
    </div>
  );
}
