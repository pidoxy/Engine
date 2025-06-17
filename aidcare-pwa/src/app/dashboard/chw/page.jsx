"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { patientService } from '../../lib/services';
import { useRouter } from 'next/navigation';
import { FiUsers, FiPlus, FiUserPlus, FiClipboard, FiLogOut } from 'react-icons/fi';

export default function CHWDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getOrganizationPatients();
      setPatients(response.data || response || []);
    } catch (err) {
      setError('Failed to fetch patients. Please try again.');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePatient = () => router.push('/patients/create');
  const handleStartTriage = () => router.push('/triage');
  const handleViewPatient = (patientId) => router.push(`/patients/${patientId}`);
  
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
    return age > 0 ? age : '<1';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            CHW Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user?.firstName || 'User'}</span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" onClick={handleStartTriage}>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FiClipboard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Start Triage Session</h3>
                <p className="text-sm text-gray-500">Begin a new patient assessment.</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" onClick={handleCreatePatient}>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FiUserPlus className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Register New Patient</h3>
                <p className="text-sm text-gray-500">Add a new patient to the system.</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-100 p-3 rounded-full">
                <FiUsers className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Total Patients</h3>
                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : patients.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Patient List</h2>
            <p className="text-sm text-gray-500 mt-1">
              A list of all patients in your organization.
            </p>
          </div>
          
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading patients...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600 bg-red-50">{error}</div>
          ) : patients.length === 0 ? (
            <div className="p-12 text-center">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No patients found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by registering your first patient.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCreatePatient}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                  New Patient
                </button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {patients.map((patient) => (
                <li key={patient.id} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => handleViewPatient(patient.id)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-indigo-600">{patient.firstName} {patient.lastName}</p>
                      <p className="text-sm text-gray-600">{patient.phoneNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Age: {calculateAge(patient.dateOfBirth)}</p>
                      <p className="text-sm text-gray-500 capitalize">{patient.gender}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
} 