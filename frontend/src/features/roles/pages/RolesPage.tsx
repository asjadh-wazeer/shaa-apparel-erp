import React from 'react';
import { PageHeader } from '../../../shared/components/layout';
import { EmptyState } from '../../../shared/components/feedback';

export function RolesPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="Configure role-based access control" />
      <div className="card">
        <EmptyState title="No roles found" description="Roles module coming in Phase 2." />
      </div>
    </div>
  );
}
