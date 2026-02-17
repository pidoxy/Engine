'use client';
// components/BrandingHeader.tsx
// Timbuktu Initiative × UNDP Nigeria IC branding header

export default function BrandingHeader() {
  return (
    <header className="w-full px-6 py-4 flex items-center justify-between border-b border-white/10">
      {/* Left: Timbuktu Initiative */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center flex-shrink-0">
          <span className="text-black font-black text-xs">T</span>
        </div>
        <span className="text-white/70 text-sm font-medium tracking-wide">
          Timbuktu Initiative
        </span>
      </div>

      {/* Center: Event tagline */}
      <div className="hidden sm:block text-center">
        <p className="text-white/40 text-xs tracking-widest uppercase">
          International Mother Language Day · 21 February
        </p>
      </div>

      {/* Right: UNDP Nigeria IC */}
      <div className="flex items-center gap-2">
        <span className="text-white/70 text-sm font-medium tracking-wide">
          UNDP Nigeria IC
        </span>
        <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-xs">UN</span>
        </div>
      </div>
    </header>
  );
}
