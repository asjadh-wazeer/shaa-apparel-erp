import React from 'react';
import { PageHeader } from '../../../shared/components/layout';
import { Button } from '../../../shared/components/ui';
import { EmptyState } from '../../../shared/components/feedback';

export function InventoryPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Manage fabrics, accessories, and raw materials"
        actions={<Button size="sm">+ Add Item</Button>}
      />
      <div className="card">
        <EmptyState title="No inventory items" description="Inventory module coming in Phase 2." />
      </div>
    </div>
  );
}
