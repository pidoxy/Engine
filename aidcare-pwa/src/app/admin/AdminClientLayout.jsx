"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex justify-between items-center px-8 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Welcome back, {user?.name || 'Admin'}</p>
        </div>
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Overview' },
    { href: '/admin/invite', label: 'Invite Users' },
    { href: '/admin/organizations', label: 'Organizations' },
    { href: '/admin/users', label: 'Users' },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex gap-4 px-8">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-4 text-sm font-medium ${
              pathname === item.href
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminClientLayout({ children }) {
  return (
    <>
      <AdminHeader />
      <AdminNav />
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {children}
        </div>
      </main>
    </>
  );
} 