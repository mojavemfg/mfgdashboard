export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-[var(--color-border)]" />
      <span className="text-xs text-[var(--color-text-tertiary)]">or</span>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  );
}
