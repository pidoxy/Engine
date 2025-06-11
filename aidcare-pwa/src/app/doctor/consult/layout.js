import ProtectedRoute from "@/app/(auth)/ProtectedRoute";

export const metadata = {
  title: 'AidCare - Clinical Support Session', // Changed slightly to reflect "Session"
  description: 'AI powered clinical decision support for medical professionals.',
};

export default function DoctorConsultLayout({ children }) {

  return <ProtectedRoute allowedRoles={['doctor', 'org_admin']}>{children}</ProtectedRoute>;
}