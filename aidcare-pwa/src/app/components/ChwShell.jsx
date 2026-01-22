"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function ChwShell({ children }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', icon: 'grid_view', label: 'Dashboard' },
    { href: '/history', icon: 'history', label: 'History' },
    { href: '/guidelines', icon: 'menu_book', label: 'Guidelines' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
  ];

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-brand-900">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col fixed h-full z-20">

        {/* Logo Area */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-brand-900 rounded-lg p-1.5 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">savings</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-brand-900">AidCare</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 mt-2">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${active
                    ? 'bg-slate-100 text-brand-900' // Matches the light gray active state in screenshot
                    : 'text-slate-500 hover:bg-slate-50 hover:text-brand-900'
                  }`}
              >
                <span className={`material-symbols-outlined text-xl ${active ? 'text-brand-900' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User Section - Matches "Sarah Jenkins" card */}
        <div className="p-4 border-t border-slate-50 mt-auto">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full border-2 border-orange-100 overflow-hidden">
              <img
                src={`https://ui-avatars.com/api/?name=Sarah+Jenkins&background=fb923c&color=fff&size=40`}
                alt="Sarah Jenkins"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-900">Sarah Jenkins</p>
              <p className="text-xs text-slate-400 font-medium">CHW-Level 2</p>
            </div>
          </div>

          <button className="w-full bg-brand-900 hover:bg-slate-800 text-white text-sm font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-lg">logout</span>
            Emergency Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-w-0">

        {/* Top Header - Detached and clean */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 h-20 flex items-center justify-between px-8">

          {/* Search Bar - Matches the light gray rounded input */}
          <div className="max-w-md w-full">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-brand-500 transition-colors text-lg">search</span>
              <input
                type="text"
                placeholder="Search patient ID or assessment type..."
                className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm text-brand-900 focus:ring-2 focus:ring-brand-100 placeholder:text-slate-400 font-medium transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-brand-900 transition-colors relative">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-600 rounded-full border-2 border-white"></span>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-brand-900 transition-colors">
              <span className="material-symbols-outlined text-xl">chat_bubble</span>
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="p-8 pb-12 bg-slate-50 min-h-[calc(100vh-80px)]">
          {children}
        </main>
      </div>

    </div>
  );
}
