import React from 'react';
import { PageHeader } from '../../../shared/components/layout';
import { Button } from '../../../shared/components/ui';
import { EmptyState } from '../../../shared/components/feedback';

export function ProductionPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader
        title="Production"
        subtitle="Manage production orders, batches, and workflow stages"
        actions={<Button size="sm">+ New Order</Button>}
      />
      <div className="card">
        <EmptyState
          title="No production orders"
          description="Production workflow engine coming in Phase 3."
        />
      </div>
    </div>
  );
}
