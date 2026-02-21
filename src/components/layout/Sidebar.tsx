import {
  LayoutDashboard, PackageSearch, ShoppingCart, LayoutList,
  Tag, Map, Calculator, Settings, Factory,
  X,
} from 'lucide-react';
import type { View } from '@/App';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  companyName?: string;
  logoUrl?: string;
}

interface NavItem {
  id: View;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  section?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory',    Icon: PackageSearch,   section: 'Operations' },
  { id: 'orders',    label: 'Order History', Icon: ShoppingCart },
  { id: 'listings',  label: 'Listings',     Icon: LayoutList,      section: 'Etsy Tools' },
  { id: 'seo',       label: 'Etsy SEO',     Icon: Tag },
  { id: 'salesmap',  label: 'Sales Map',    Icon: Map },
  { id: 'margin',    label: 'Margin Calc',  Icon: Calculator,      section: 'Analysis' },
];

function NavButton({
  id,
  label,
  Icon,
  active,
  onClick,
  mobile = false,
}: {
  id: View;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  onClick: () => void;
  mobile?: boolean;
}) {
  if (mobile) {
    // Mobile: taller touch target (h-10), left-border active indicator
    return (
      <button
        key={id}
        onClick={onClick}
        className={[
          'flex items-center gap-3 w-full h-10 text-sm font-medium',
          'transition-colors duration-150 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
          active
            ? 'border-l-[3px] border-[var(--color-brand)] text-[var(--color-text-primary)] px-[13px]'
            : 'border-l-[3px] border-transparent text-[var(--color-text-secondary)] px-4 hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]',
        ].join(' ')}
      >
        <Icon
          size={16}
          className={active ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-tertiary)]'}
        />
        {label}
      </button>
    );
  }

  // Desktop: compact 30px height with rounded background
  return (
    <button
      key={id}
      onClick={onClick}
      className={[
        'flex items-center gap-2.5 w-full px-3 h-[30px] text-sm font-medium',
        'rounded-[var(--radius-md)] transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
        'cursor-pointer',
        active
          ? 'bg-[var(--color-bg-muted)] text-[var(--color-text-primary)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)]',
      ].join(' ')}
    >
      <Icon
        size={16}
        className={active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'}
      />
      {label}
    </button>
  );
}

function SectionLabel({ label, mobile }: { label: string; mobile?: boolean }) {
  if (mobile) {
    return (
      <div className="px-4 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
        {label}
      </div>
    );
  }
  return (
    <div className="px-3 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
      {label}
    </div>
  );
}

function buildSections(items: NavItem[]) {
  const sections: { label?: string; items: NavItem[] }[] = [];
  let current: { label?: string; items: NavItem[] } | null = null;

  for (const item of items) {
    if (item.section && (!current || current.label !== item.section)) {
      current = { label: item.section, items: [item] };
      sections.push(current);
    } else if (current && item.section === current.label) {
      current.items.push(item);
    } else {
      if (!current || current.label !== undefined) {
        current = { label: undefined, items: [item] };
        sections.push(current);
      } else {
        current.items.push(item);
      }
    }
  }
  return sections;
}

function SidebarContent({
  activeView,
  onViewChange,
  mobile = false,
  companyName,
  logoUrl,
}: {
  activeView: View;
  onViewChange: (view: View) => void;
  mobile?: boolean;
  companyName?: string;
  logoUrl?: string;
}) {
  const sections = buildSections(navItems);

  return (
    <div className="flex flex-col h-full">
      {/* Brand header — static, non-interactive */}
      <div className="px-3 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 px-2 py-1.5">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="w-6 h-6 rounded-sm object-contain shrink-0" />
          ) : (
            <div className="w-6 h-6 rounded-sm bg-[var(--color-brand)] flex items-center justify-center shrink-0">
              <Factory size={14} className="text-white" />
            </div>
          )}
          <span className="text-sm font-semibold text-[var(--color-text-primary)] flex-1 text-left truncate">
            {companyName || 'MFG Ops'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-3 overflow-y-auto ${mobile ? '' : 'px-2'}`}>
        {sections.map((section, i) => (
          <div key={i}>
            {section.label && <SectionLabel label={section.label} mobile={mobile} />}
            {section.items.map((item) => (
              <NavButton
                key={item.id}
                {...item}
                active={activeView === item.id}
                onClick={() => onViewChange(item.id)}
                mobile={mobile}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: settings + user */}
      <div className={`border-t border-[var(--color-border)] pt-3 pb-3 space-y-1 ${mobile ? '' : 'px-2'}`}>
        <NavButton
          id="settings"
          label="Settings"
          Icon={Settings}
          active={activeView === 'settings'}
          onClick={() => onViewChange('settings')}
          mobile={mobile}
        />
        <div className={`flex items-center gap-2 py-2 mt-1 ${mobile ? 'px-4' : 'px-3'}`}>
          <div className="w-6 h-6 rounded-[var(--radius-full)] bg-[var(--color-bg-muted)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-[var(--color-text-secondary)]">MO</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate leading-none">MFG Owner</p>
            <p className="text-xs text-[var(--color-text-tertiary)] truncate mt-0.5">admin@mfgops.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ activeView, onViewChange, mobileOpen = false, onMobileClose, companyName, logoUrl }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible at lg+ */}
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)]">
        <SidebarContent activeView={activeView} onViewChange={onViewChange} companyName={companyName} logoUrl={logoUrl} />
      </aside>

      {/* Mobile/tablet drawer — slides in from left */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={onMobileClose}
          />
          {/* Drawer panel */}
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] bg-[var(--color-bg)] border-r border-[var(--color-border)] flex flex-col z-50 shadow-[var(--shadow-md)] animate-sidebar-in">
            <button
              onClick={onMobileClose}
              className="absolute top-3 right-3 p-1.5 rounded-[var(--radius-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            <SidebarContent
              activeView={activeView}
              onViewChange={(v) => { onViewChange(v); onMobileClose?.(); }}
              mobile
              companyName={companyName}
              logoUrl={logoUrl}
            />
          </aside>
        </div>
      )}
    </>
  );
}
