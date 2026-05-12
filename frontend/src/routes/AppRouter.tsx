import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../shared/components/layout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoadingState } from '../shared/components/feedback';
import { ROUTES } from '../shared/constants';

// Auth
const LoginPage = lazy(() =>
  import('../features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);

// Dashboard
const DashboardPage = lazy(() =>
  import('../features/dashboard/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);

// Production
const ProductTrackerPage = lazy(() =>
  import('../features/product-tracker/pages/ProductTrackerPage').then((m) => ({ default: m.ProductTrackerPage })),
);
const DesignModulePage = lazy(() =>
  import('../features/design-module/pages/DesignModulePage').then((m) => ({ default: m.DesignModulePage })),
);
const PatternMakingPage = lazy(() =>
  import('../features/pattern-making/pages/PatternMakingPage').then((m) => ({ default: m.PatternMakingPage })),
);
const SampleMakingPage = lazy(() =>
  import('../features/sample-making/pages/SampleMakingPage').then((m) => ({ default: m.SampleMakingPage })),
);
const CuttingDeptPage = lazy(() =>
  import('../features/cutting-dept/pages/CuttingDeptPage').then((m) => ({ default: m.CuttingDeptPage })),
);
const SewingDeptPage = lazy(() =>
  import('../features/sewing-dept/pages/SewingDeptPage').then((m) => ({ default: m.SewingDeptPage })),
);
const QualityControlPage = lazy(() =>
  import('../features/quality-control/pages/QualityControlPage').then((m) => ({ default: m.QualityControlPage })),
);
const FinishedGoodsPage = lazy(() =>
  import('../features/finished-goods/pages/FinishedGoodsPage').then((m) => ({ default: m.FinishedGoodsPage })),
);

// Inventory
const WarehousePage = lazy(() =>
  import('../features/warehouse/pages/WarehousePage').then((m) => ({ default: m.WarehousePage })),
);
const RecipeManagementPage = lazy(() =>
  import('../features/recipe-management/pages/RecipeManagementPage').then((m) => ({ default: m.RecipeManagementPage })),
);
const PurchasingPage = lazy(() =>
  import('../features/purchasing/pages/PurchasingPage').then((m) => ({ default: m.PurchasingPage })),
);
const SuppliersPage = lazy(() =>
  import('../features/suppliers/pages/SuppliersPage').then((m) => ({ default: m.SuppliersPage })),
);

// Costing
const CostCalculationPage = lazy(() =>
  import('../features/cost-calculation/pages/CostCalculationPage').then((m) => ({ default: m.CostCalculationPage })),
);

// Sales
const PosSalesPage = lazy(() =>
  import('../features/pos-sales/pages/PosSalesPage').then((m) => ({ default: m.PosSalesPage })),
);
const PhotoDistributionPage = lazy(() =>
  import('../features/photo-distribution/pages/PhotoDistributionPage').then((m) => ({ default: m.PhotoDistributionPage })),
);

// HR & Admin
const AttendancePage = lazy(() =>
  import('../features/attendance/pages/AttendancePage').then((m) => ({ default: m.AttendancePage })),
);
const KPIIncentivesPage = lazy(() =>
  import('../features/kpi-incentives/pages/KPIIncentivesPage').then((m) => ({ default: m.KPIIncentivesPage })),
);
const ReportsPage = lazy(() =>
  import('../features/reports/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })),
);
const UserRolesPage = lazy(() =>
  import('../features/user-roles/pages/UserRolesPage').then((m) => ({ default: m.UserRolesPage })),
);

const SuspenseFallback = (): React.JSX.Element => (
  <LoadingState message="Loading page..." />
);

export function AppRouter(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Suspense fallback={<SuspenseFallback />}>
        <Routes>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              {/* Dashboard */}
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />

              {/* Production */}
              <Route path={ROUTES.PRODUCT_TRACKER} element={<ProductTrackerPage />} />
              <Route path={ROUTES.DESIGN_MODULE} element={<DesignModulePage />} />
              <Route path={ROUTES.PATTERN_MAKING} element={<PatternMakingPage />} />
              <Route path={ROUTES.SAMPLE_MAKING} element={<SampleMakingPage />} />
              <Route path={ROUTES.CUTTING_DEPT} element={<CuttingDeptPage />} />
              <Route path={ROUTES.SEWING_DEPT} element={<SewingDeptPage />} />
              <Route path={ROUTES.QUALITY_CONTROL} element={<QualityControlPage />} />
              <Route path={ROUTES.FINISHED_GOODS} element={<FinishedGoodsPage />} />

              {/* Inventory */}
              <Route path={ROUTES.WAREHOUSE} element={<WarehousePage />} />
              <Route path={ROUTES.RECIPE_MANAGEMENT} element={<RecipeManagementPage />} />
              <Route path={ROUTES.PURCHASING} element={<PurchasingPage />} />
              <Route path={ROUTES.SUPPLIERS} element={<SuppliersPage />} />

              {/* Costing */}
              <Route path={ROUTES.COST_CALCULATION} element={<CostCalculationPage />} />

              {/* Sales */}
              <Route path={ROUTES.POS_SALES} element={<PosSalesPage />} />
              <Route path={ROUTES.PHOTO_DISTRIBUTION} element={<PhotoDistributionPage />} />

              {/* HR & Admin */}
              <Route path={ROUTES.ATTENDANCE} element={<AttendancePage />} />
              <Route path={ROUTES.KPI_INCENTIVES} element={<KPIIncentivesPage />} />
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
              <Route path={ROUTES.USER_ROLES} element={<UserRolesPage />} />

              {/* Legacy redirects for old routes */}
              <Route path="/production" element={<Navigate to={ROUTES.PRODUCT_TRACKER} replace />} />
              <Route path="/inventory" element={<Navigate to={ROUTES.WAREHOUSE} replace />} />
              <Route path="/users" element={<Navigate to={ROUTES.USER_ROLES} replace />} />
              <Route path="/roles" element={<Navigate to={ROUTES.USER_ROLES} replace />} />
              <Route path="/costing" element={<Navigate to={ROUTES.COST_CALCULATION} replace />} />
              <Route path="/reporting" element={<Navigate to={ROUTES.REPORTS} replace />} />
              <Route path="/settings" element={<Navigate to={ROUTES.USER_ROLES} replace />} />
              <Route path="/profile" element={<Navigate to={ROUTES.USER_ROLES} replace />} />
              <Route path="/purchase-orders" element={<Navigate to={ROUTES.PURCHASING} replace />} />
              <Route path="/warehouses" element={<Navigate to={ROUTES.WAREHOUSE} replace />} />
              <Route path="/pos-integration" element={<Navigate to={ROUTES.POS_SALES} replace />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
