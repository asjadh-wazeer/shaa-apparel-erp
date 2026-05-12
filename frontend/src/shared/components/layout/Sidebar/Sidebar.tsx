import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../constants';
import { useAppSelector, useAppDispatch } from '../../../../store';
import { logout } from '../../../../features/auth/store/auth.slice';

interface NavItem {
  label: string;
  path: string;
  emoji: string;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

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
      { label: 'Product Tracker', path: ROUTES.PRODUCT_TRACKER, emoji: '🎯' },
      { label: 'Design Module', path: ROUTES.DESIGN_MODULE, emoji: '🎨' },
      { label: 'Pattern Making', path: ROUTES.PATTERN_MAKING, emoji: '📐' },
      { label: 'Sample Making', path: ROUTES.SAMPLE_MAKING, emoji: '🧶' },
      { label: 'Cutting Dept', path: ROUTES.CUTTING_DEPT, emoji: '✂️' },
      { label: 'Sewing Dept', path: ROUTES.SEWING_DEPT, emoji: '🧵' },
      { label: 'Quality Control', path: ROUTES.QUALITY_CONTROL, emoji: '✅' },
      { label: 'Finished Goods', path: ROUTES.FINISHED_GOODS, emoji: '📦' },
    ],
  },
  {
    section: 'INVENTORY',
    items: [
      { label: 'Warehouse', path: ROUTES.WAREHOUSE, emoji: '🏢' },
      { label: 'Recipe Management', path: ROUTES.RECIPE_MANAGEMENT, emoji: '📋' },
      { label: 'Purchasing', path: ROUTES.PURCHASING, emoji: '🛒' },
      { label: 'Suppliers', path: ROUTES.SUPPLIERS, emoji: '👥' },
    ],
  },
  {
    section: 'COSTING',
    items: [
      { label: 'Cost Calculation', path: ROUTES.COST_CALCULATION, emoji: '💲' },
    ],
  },
  {
    section: 'SALES',
    items: [
      { label: 'POS & Sales', path: ROUTES.POS_SALES, emoji: '💳' },
      { label: 'Photo & Distribution', path: ROUTES.PHOTO_DISTRIBUTION, emoji: '📸' },
    ],
  },
  {
    section: 'ADMIN & HR',
    items: [
      { label: 'Attendance', path: ROUTES.ATTENDANCE, emoji: '👥' },
      { label: 'KPI & Incentives', path: ROUTES.KPI_INCENTIVES, emoji: '📈' },
      { label: 'Reports', path: ROUTES.REPORTS, emoji: '📄' },
      { label: 'User & Roles', path: ROUTES.USER_ROLES, emoji: '👤' },
    ],
  },
];

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() ?? '';
  const last = lastName?.[0]?.toUpperCase() ?? '';
  return first + last || 'U';
}

export function Sidebar(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

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
              {user ? `${user.firstName} ${user.lastName}` : 'Athithan K.'}
            </p>
            <p className="text-gray-400 text-xs truncate leading-tight">
              {user?.roles?.[0] ?? 'CEO & Founder'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.section}>
            <p
              className="px-2 text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: '#F97316' }}
            >
              {section.section}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
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
        ))}
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
