import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useAppSelector, useAppDispatch } from '../../../../store';
import { logout } from '../../../../features/auth/store/auth.slice';

interface NavItem {
  label: string;
  path: string;
  emoji: string;
  roles?: string[];
}

interface NavSection {
  section: string;
  roles?: string[];
  items: NavItem[];
}

// Roles that have full admin access
const ADMIN_ROLES = ['TENANT_ADMIN', 'ADMIN', 'SUPER_ADMIN'];

// Role aliases used in the seed / backend
const ROLE_ACCESS: Record<string, string[]> = {
  TENANT_ADMIN:       ['*'],
  ADMIN:              ['*'],
  SUPER_ADMIN:        ['*'],
  FASHION_DESIGNER:   ['design_module', 'product_tracker'],
  PATTERN_MAKER:      ['pattern_making', 'product_tracker', 'design_module'],
  CUTTING_SUPERVISOR: ['cutting_dept', 'product_tracker', 'warehouse'],
  SEWING_SUPERVISOR:  ['sewing_dept', 'product_tracker'],
  QC_INSPECTOR:       ['quality_control', 'finished_goods', 'product_tracker'],
  PRODUCTION_MANAGER: ['product_tracker', 'design_module', 'pattern_making', 'sample_making', 'cutting_dept', 'sewing_dept', 'quality_control', 'finished_goods', 'kpi_incentives', 'reports'],
  STOREKEEPER:        ['warehouse', 'inventory', 'purchasing', 'suppliers', 'recipe_management'],
  HR_EXECUTIVE:       ['attendance', 'kpi_incentives', 'user_roles', 'reports'],
  GENERAL_MANAGER:    ['*'],
};

const navSections: NavSection[] = [
  {
    section: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: ROUTES.DASHBOARD, emoji: '🏠' },
    ],
  },
  {
    section: 'PRODUCTION',
    items: [
      { label: 'Product Tracker',  path: ROUTES.PRODUCT_TRACKER, emoji: '🎯', roles: ['product_tracker'] },
      { label: 'Design Module',    path: ROUTES.DESIGN_MODULE,   emoji: '🎨', roles: ['design_module'] },
      { label: 'Pattern Making',   path: ROUTES.PATTERN_MAKING,  emoji: '📐', roles: ['pattern_making'] },
      { label: 'Sample Making',    path: ROUTES.SAMPLE_MAKING,   emoji: '🧶', roles: ['sample_making'] },
      { label: 'Cutting Dept',     path: ROUTES.CUTTING_DEPT,    emoji: '✂️', roles: ['cutting_dept'] },
      { label: 'Sewing Dept',      path: ROUTES.SEWING_DEPT,     emoji: '🧵', roles: ['sewing_dept'] },
      { label: 'Quality Control',  path: ROUTES.QUALITY_CONTROL, emoji: '✅', roles: ['quality_control'] },
      { label: 'Finished Goods',   path: ROUTES.FINISHED_GOODS,  emoji: '📦', roles: ['finished_goods'] },
    ],
  },
  {
    section: 'INVENTORY',
    items: [
      { label: 'Warehouse',         path: ROUTES.WAREHOUSE,          emoji: '🏢', roles: ['warehouse'] },
      { label: 'Recipe Management', path: ROUTES.RECIPE_MANAGEMENT,  emoji: '📋', roles: ['recipe_management'] },
      { label: 'Purchasing',        path: ROUTES.PURCHASING,         emoji: '🛒', roles: ['purchasing'] },
      { label: 'Suppliers',         path: ROUTES.SUPPLIERS,          emoji: '👥', roles: ['suppliers'] },
    ],
  },
  {
    section: 'COSTING',
    items: [
      { label: 'Cost Calculation', path: ROUTES.COST_CALCULATION, emoji: '💲', roles: ['costing'] },
    ],
  },
  {
    section: 'SALES',
    items: [
      { label: 'POS & Sales',          path: ROUTES.POS_SALES,           emoji: '💳', roles: ['pos_sales'] },
      { label: 'Photo & Distribution', path: ROUTES.PHOTO_DISTRIBUTION,  emoji: '📸', roles: ['photo_distribution'] },
    ],
  },
  {
    section: 'ADMIN & HR',
    items: [
      { label: 'Attendance',  path: ROUTES.ATTENDANCE,    emoji: '👥', roles: ['attendance'] },
      { label: 'KPI & Incentives', path: ROUTES.KPI_INCENTIVES, emoji: '📈', roles: ['kpi_incentives'] },
      { label: 'Reports',     path: ROUTES.REPORTS,       emoji: '📄', roles: ['reports'] },
      { label: 'User & Roles', path: ROUTES.USER_ROLES,   emoji: '👤', roles: ['user_roles'] },
    ],
  },
];

function canAccessItem(userRoles: string[], itemRoles?: string[]): boolean {
  if (!itemRoles || itemRoles.length === 0) return true;

  for (const role of userRoles) {
    const normalizedRole = role.toUpperCase().replace(/\s+/g, '_');
    const allowed = ROLE_ACCESS[normalizedRole] ?? ROLE_ACCESS[role];
    if (!allowed) continue;
    if (allowed.includes('*')) return true;
    if (itemRoles.some((r) => allowed.includes(r))) return true;
  }

  // If no roles matched, admins see everything
  const isAdmin = userRoles.some((r: string) =>
    ADMIN_ROLES.includes(r) || ADMIN_ROLES.includes(r.toUpperCase().replace(/\s+/g, '_')),
  );
  return isAdmin;
}

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() ?? '';
  const last = lastName?.[0]?.toUpperCase() ?? '';
  return first + last || 'U';
}

export function Sidebar(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  const userRoles = user?.roles ?? [];
  const noRoles = userRoles.length === 0;

  const handleSignOut = (): void => {
    dispatch(logout());
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <aside
      className="flex flex-col h-full text-white flex-shrink-0 overflow-y-auto"
      style={{ width: '220px', minWidth: '220px', backgroundColor: '#111111' }}
    >
      {/* Logo area */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-1 font-medium">ERP SYSTEM</p>
        <p className="text-lg font-bold leading-tight">
          <span className="text-white">SHAA </span>
          <span style={{ color: '#F97316' }}>Apparel</span>
        </p>
      </div>

      {/* User profile */}
      <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ backgroundColor: '#1D4ED8' }}
          >
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
            </p>
            <p className="text-gray-400 text-xs truncate leading-tight">
              {userRoles[0] ?? 'No role assigned'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section) => {
          const visibleItems = section.items.filter((item) =>
            noRoles || canAccessItem(userRoles, item.roles),
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.section}>
              <p
                className="px-2 text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: '#F97316' }}
              >
                {section.section}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === ROUTES.DASHBOARD}
                    className={({ isActive }) =>
                      [
                        'flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors',
                        isActive
                          ? 'bg-[#1a2744] text-white font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-white/5',
                      ].join(' ')
                    }
                  >
                    <span className="text-base leading-none w-5 flex-shrink-0 text-center">
                      {item.emoji}
                    </span>
                    <span className="truncate leading-tight">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-white/10 flex-shrink-0">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors w-full text-left"
        >
          <span className="text-base leading-none w-5 flex-shrink-0 text-center">→</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
