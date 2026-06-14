export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--theme-border-strong)] bg-[var(--theme-surface-alt)] p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--theme-primary-soft)] text-lg font-bold text-[var(--theme-primary)]">
        0
      </div>
      <h3 className="mt-4 text-base font-semibold text-[var(--theme-text)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--theme-secondary-text)]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
