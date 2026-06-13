export function Card({ title, value, description, icon, className = '' }) {
  return (
    <div className={`hover-lift rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--theme-muted-text)]">{title}</p>
          <p className="mt-3 text-3xl font-semibold text-[var(--theme-text)]">{value}</p>
        </div>
        {icon && <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--theme-primary-soft)] text-xl text-[var(--theme-primary)]">{icon}</div>}
      </div>
      {description && <p className="mt-4 text-sm text-[var(--theme-secondary-text)]">{description}</p>}
    </div>
  );
}
