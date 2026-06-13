export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:ring-offset-2 focus:ring-offset-[var(--theme-background)] disabled:cursor-not-allowed disabled:opacity-60';
  const variants = {
    primary: 'bg-[var(--theme-primary)] text-white hover:bg-[var(--theme-primary-hover)]',
    secondary: 'border border-[var(--theme-border)] bg-[var(--theme-surface)] text-[var(--theme-text)] hover:border-[var(--theme-border-strong)] hover:bg-[var(--theme-surface-alt)]',
    ghost: 'text-[var(--theme-secondary-text)] hover:bg-[var(--theme-surface-alt)] hover:text-[var(--theme-text)]',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
