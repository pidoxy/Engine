// src/app/dashboard/admin/page.jsx
"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { organizationService, userService, patientService } from '../../lib/services';
import { FiUsers, FiUserPlus, FiUser, FiFileText } from 'react-icons/fi';
import { MdBusiness } from 'react-icons/md';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'organization') {
      fetchData();
    } else {
      fetchNonAdminData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orgsResponse, orgUsersResponse, patientsResponse] = await Promise.allSettled([
        organizationService.getAllOrganizations(),
        userService.getOrganizationUsers(),
        patientService.getOrganizationPatients()
      ]);

      if (orgsResponse.status === 'fulfilled') {
        setOrganizations(orgsResponse.value.data || orgsResponse.value || []);
      }
      if (orgUsersResponse.status === 'fulfilled') {
        setUsers(orgUsersResponse.value.data || orgUsersResponse.value || []);
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

  const fetchNonAdminData = async () => {
    try {
      setLoading(true);
      const [orgUsersResponse, patientsResponse] = await Promise.allSettled([
        userService.getOrganizationUsers(),
        patientService.getOrganizationPatients()
      ]);
      if (orgUsersResponse.status === 'fulfilled') {
        setUsers(orgUsersResponse.value.data || orgUsersResponse.value || []);
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <MdBusiness className="h-5 w-5" /> },
    { id: 'patients', label: 'Patients', icon: <FiUser className="h-5 w-5" /> },
    { id: 'users', label: 'Users', icon: <FiUsers className="h-5 w-5" /> },
    { id: 'invite', label: 'Invite Users', icon: <FiUserPlus className="h-5 w-5" /> },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="mb-8 flex items-center gap-4">
        <Image
          src="/icons/icon-96x96.png"
          alt="AidCare Logo"
          width={48}
          height={48}
          className="rounded-lg"
        />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back, {user?.fullName || user?.email || 'Admin'}!
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Stats Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{patients.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{users.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{users.filter(u => u.isActive).length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="text-sm font-medium text-gray-500">Pending Invites</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'patients' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Patients</h2>
            <Link
              href="/patients/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add New Patient
            </Link>
          </div>
          {loading ? (
            <div className="p-8">Loading patients...</div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">{error}</div>
          ) : (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient._id || patient.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.age || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.gender || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'No visits'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          patient.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link
                          href={`/patients/${patient._id || patient.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          href={`/patients/${patient._id || patient.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Users</h2>
            <Link
              href="/admin/users/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add New User
            </Link>
          </div>
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u._id || u.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link
                          href={`/admin/users/${u._id || u.id}`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/users/${u._id || u.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'invite' && (
        <div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Invite New Users</h2>
            <p className="text-gray-600 mb-6">
              Send invitations to new doctors or community health workers to join your organization.
            </p>
            <Link
              href="/admin/invite"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiUserPlus className="mr-2 h-5 w-5" />
              Send Invitation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}