import DashboardClientLayout from './DashboardClientLayout';
import ProtectedRoute from '../components/ProtectedRoute';

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute>
      <DashboardClientLayout>{children}</DashboardClientLayout>
    </ProtectedRoute>
  );
} 