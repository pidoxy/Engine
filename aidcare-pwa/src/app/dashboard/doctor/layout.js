import DashboardLayout from '../../layout';

export const metadata = {
  title: 'AidCare - Doctor Dashboard',
  description: 'Dashboard for medical professionals to manage patients and access clinical tools.',
};

export default function DoctorLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 