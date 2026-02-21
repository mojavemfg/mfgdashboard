import { useRef } from 'react';
import { Sun, Moon, Upload, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import type { AppSettings, SettingsUpdate } from '@/hooks/useSettings';

interface Props {
  isDark: boolean;
  onThemeToggle: () => void;
  settings: AppSettings;
  update: (p: SettingsUpdate) => void;
}

export function AppearanceSection({ isDark, onThemeToggle, settings, update }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update({ branding: { logoUrl: reader.result as string } });
    };
    reader.readAsDataURL(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  }

  function clearLogo() {
    update({ branding: { logoUrl: '' } });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Branding */}
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">Branding</p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
              Customize the sidebar name and logo
            </p>
          </div>

          <Field label="Company Name">
            <Input
              type="text"
              value={settings.branding.companyName}
              placeholder="MFG Ops"
              onChange={(e) => update({ branding: { companyName: e.target.value } })}
            />
          </Field>

          <Field label="Logo">
            <div className="flex items-center gap-3">
              {settings.branding.logoUrl ? (
                <div className="relative group">
                  <img
                    src={settings.branding.logoUrl}
                    alt="Logo preview"
                    className="w-10 h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] object-contain bg-[var(--color-bg-muted)]"
                  />
                  <button
                    onClick={clearLogo}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-[var(--radius-full)] bg-[var(--color-danger)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove logo"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-tertiary)]">
                  <Upload size={16} />
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className={[
                  'h-8 px-3 text-sm font-medium rounded-[var(--radius-md)]',
                  'border border-[var(--color-border)] bg-[var(--color-bg)]',
                  'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-subtle)]',
                  'transition-colors duration-150',
                ].join(' ')}
              >
                {settings.branding.logoUrl ? 'Change' : 'Upload'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleLogoFile}
                className="hidden"
              />
            </div>
          </Field>
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark
              ? <Moon size={16} className="text-[var(--color-text-tertiary)]" />
              : <Sun size={16} className="text-[var(--color-warning)]" />
            }
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {isDark ? 'Easy on the eyes at night' : 'Better for bright environments'}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            onClick={onThemeToggle}
            aria-label="Toggle theme"
            className={[
              'relative inline-flex h-6 w-11 items-center rounded-[var(--radius-full)]',
              'transition-colors duration-200 focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2',
              isDark ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border-strong)]',
            ].join(' ')}
          >
            <span
              className={[
                'inline-block h-5 w-5 rounded-[var(--radius-full)] bg-white shadow-[var(--shadow-xs)]',
                'transition-transform duration-200',
                isDark ? 'translate-x-5' : 'translate-x-0.5',
              ].join(' ')}
            />
          </button>
        </div>
      </Card>
    </div>
  );
}
