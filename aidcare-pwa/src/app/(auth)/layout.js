"use client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { FiLoader, FiCheckCircle } from 'react-icons/fi';

export default function AuthLayout({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  console.log("AuthLayout user:", user);
  const router = useRouter();

  // Compute dashboard URL based on user role
  let dashboardUrl = '/dashboard';
  if (user?.role === 'admin' || user?.role === 'organization') dashboardUrl = '/dashboard/admin';
  else if (user?.role === 'consultant') dashboardUrl = '/dashboard/doctor';
  else if (user?.role === 'chw') dashboardUrl = '/dashboard/chw';

  // Show a loader while checking auth status
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center">
          <FiLoader className="animate-spin text-blue-600 text-4xl mx-auto" />
          <p className="mt-4 text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated, show a message instead of redirecting
  if (isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <FiCheckCircle className="text-green-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">You are already logged in.</h2>
          <p className="text-gray-600 mb-6">You can now proceed to your dashboard.</p>
          <Link href={dashboardUrl} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // If not authenticated, show the login/signup form
  return <>{children}</>;
} 