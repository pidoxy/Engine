import AdminClientLayout from './AdminClientLayout.jsx';

export const metadata = {
  title: 'AidCare - Admin Dashboard',
  description: 'Admin dashboard for managing organizations, users, and system settings.',
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminClientLayout>{children}</AdminClientLayout>
    </div>
  );
} 