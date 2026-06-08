'use client';
// components/BrandingFooter.tsx

export default function BrandingFooter() {
  return (
    <footer className="w-full py-4 px-6 flex items-center justify-center border-t border-white/10">
      <p className="text-white/30 text-xs text-center tracking-wide">
        Powered by{' '}
        <span className="text-white/50 font-semibold">AidCare</span>
        {' '}·{' '}
        A{' '}
        <span className="text-amber-400/70 font-semibold">Timbuktu Initiative</span>
        {' '}×{' '}
        <span className="text-blue-400/70 font-semibold">UNDP Nigeria Innovation Centre</span>
      </p>
    </footer>
  );
}
