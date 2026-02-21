import { useState } from 'react';
import {
  LayoutDashboard, PackageSearch, ShoppingCart, LayoutList,
  Tag, Map, Calculator, Settings, Factory, ChevronDown,
  LogOut, X,
} from 'lucide-react';
import type { View } from '@/App';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
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
}: {
  id: View;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
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

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-tertiary)]">
      {label}
    </div>
  );
}

function SidebarContent({
  activeView,
  onViewChange,
}: {
  activeView: View;
  onViewChange: (view: View) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Group items by section
  const sections: { label?: string; items: NavItem[] }[] = [];
  let currentSection: { label?: string; items: NavItem[] } | null = null;

  for (const item of navItems) {
    if (item.section && (!currentSection || currentSection.label !== item.section)) {
      currentSection = { label: item.section, items: [item] };
      sections.push(currentSection);
    } else if (currentSection && item.section === currentSection.label) {
      currentSection.items.push(item);
    } else {
      if (!currentSection || currentSection.label !== undefined) {
        currentSection = { label: undefined, items: [item] };
        sections.push(currentSection);
      } else {
        currentSection.items.push(item);
      }
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Brand / workspace header */}
      <div className="px-3 py-4 border-b border-[var(--color-border)]">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={[
            'flex items-center gap-2 w-full px-2 py-1.5 rounded-[var(--radius-md)]',
            'hover:bg-[var(--color-bg-subtle)] transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]',
          ].join(' ')}
        >
          <div className="w-6 h-6 rounded-sm bg-[var(--color-brand)] flex items-center justify-center shrink-0">
            <Factory size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-primary)] flex-1 text-left">
            MFG Ops
          </span>
          <ChevronDown
            size={14}
            className={`text-[var(--color-text-tertiary)] transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {dropdownOpen && (
          <div className="mt-1 mx-2 border border-[var(--color-border)] rounded-[var(--radius-md)] bg-[var(--color-bg)] shadow-[var(--shadow-sm)] overflow-hidden">
            <button
              onClick={() => { onViewChange('settings'); setDropdownOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <Settings size={14} />
              Settings
            </button>
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {sections.map((section, i) => (
          <div key={i}>
            {section.label && <SectionLabel label={section.label} />}
            {section.items.map((item) => (
              <NavButton
                key={item.id}
                {...item}
                active={activeView === item.id}
                onClick={() => onViewChange(item.id)}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: settings + user */}
      <div className="px-2 pb-3 border-t border-[var(--color-border)] pt-3 space-y-1">
        <NavButton
          id="settings"
          label="Settings"
          Icon={Settings}
          active={activeView === 'settings'}
          onClick={() => onViewChange('settings')}
        />
        {/* User row */}
        <div className="flex items-center gap-2 px-3 py-2 mt-1">
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

export function Sidebar({ activeView, onViewChange, mobileOpen = false, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)]">
        <SidebarContent activeView={activeView} onViewChange={onViewChange} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={onMobileClose}
          />
          {/* Panel */}
          <aside className="relative w-[220px] bg-[var(--color-bg)] border-r border-[var(--color-border)] flex flex-col animate-slideover-in">
            <button
              onClick={onMobileClose}
              className="absolute top-3 right-3 p-1 rounded-[var(--radius-md)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
            <SidebarContent
              activeView={activeView}
              onViewChange={(v) => { onViewChange(v); onMobileClose?.(); }}
            />
          </aside>
        </div>
      )}
    </>
  );
}
