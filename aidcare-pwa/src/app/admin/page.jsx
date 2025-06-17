"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { organizationService, userService, patientService } from '../../lib/services';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orgsResponse, usersResponse, patientsResponse] = await Promise.allSettled([
        organizationService.getAllOrganizations(),
        userService.getAllUsers(),
        patientService.getOrganizationPatients()
      ]);

      if (orgsResponse.status === 'fulfilled') {
        setOrganizations(orgsResponse.value.data || orgsResponse.value || []);
      }
      if (usersResponse.status === 'fulfilled') {
        setUsers(usersResponse.value.data || usersResponse.value || []);
      }
      if (patientsResponse.status === 'fulfilled') {
        setPatients(patientsResponse.value.data || patientsResponse.value || []);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateOrganization = () => {
    router.push('/dashboard/admin/create-organization');
  };

  const handleCreateUser = () => {
    router.push('/dashboard/admin/create-user');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">System Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-blue-600">Organizations</h3>
            <p className="text-3xl font-bold mt-2">{organizations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-green-600">Users</h3>
            <p className="text-3xl font-bold mt-2">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-yellow-600">Patients</h3>
            <p className="text-3xl font-bold mt-2">{patients.length}</p>
          </div>
        </div>
      </div>

      {/* Users Table for Admins */}
      {user?.role === 'admin' && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Users</h2>
          {loading ? (
            <div className="p-8">Loading users...</div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">{error}</div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 