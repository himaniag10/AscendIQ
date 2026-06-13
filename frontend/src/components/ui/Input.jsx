export function Input({ label, error, rightElement, className = '', ...props }) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-medium text-[var(--theme-secondary-text)]">{label}</span>
      <span className="relative block">
        <input
          className={`w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3 text-[var(--theme-text)] placeholder:text-[var(--theme-muted-text)] focus:border-[var(--theme-primary)] focus:outline-none focus:ring-4 focus:ring-[var(--theme-primary-soft)] ${rightElement ? 'pr-12' : ''} ${className}`}
          {...props}
        />
        {rightElement && <span className="absolute inset-y-0 right-2 flex items-center">{rightElement}</span>}
      </span>
      {error && <p className="mt-2 text-xs font-medium text-[var(--theme-danger)]">{error}</p>}
    </label>
  );
}
