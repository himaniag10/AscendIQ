import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-[var(--theme-border)] bg-[var(--theme-surface)] py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--theme-primary)] text-xs font-black text-white">AI</span>
            <p className="text-lg font-semibold text-[var(--theme-text)]">AscendIQ</p>
          </div>
          <p className="mt-3 max-w-md text-sm text-[var(--theme-secondary-text)]">
            AI-powered interview preparation for students and professionals building real-world readiness.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {[
            ['Home', '/'],
            ['Features', '/#features'],
            ['Login', '/login'],
            ['Register', '/register'],
          ].map(([label, href]) => (
            <Link key={href} to={href} className="text-sm font-medium text-[var(--theme-secondary-text)] hover:text-[var(--theme-text)]">
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-[var(--theme-border)] px-4 pt-6 text-sm text-[var(--theme-muted-text)] sm:px-6 lg:px-8">
        &copy; {new Date().getFullYear()} AscendIQ. All rights reserved.
      </div>
    </footer>
  );
}
