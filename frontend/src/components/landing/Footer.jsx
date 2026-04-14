export default function Footer() {
  return (
    <footer className="border-t border-slate-200 py-6 sm:py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-slate-900 sm:flex-row sm:px-6 sm:text-sm">
        <p>© {new Date().getFullYear()} TRINETRA AI Proctoring</p>
        <p>Built for secure, privacy-first online examinations.</p>
      </div>
    </footer>
  );
}
