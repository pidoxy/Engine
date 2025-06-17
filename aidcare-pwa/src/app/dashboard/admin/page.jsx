// src/app/dashboard/admin/page.jsx
"use client";
import React from 'react';
import { useAuth } from '../../context/AuthContext'; // Assuming this path is correct
import { FiUsers, FiUserPlus } from 'react-icons/fi'; // Keep these
import { MdBusiness } from 'react-icons/md';         // Import the new icon
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth(); // Assuming logout is handled in a layout/header

  const adminCards = [
    {
      title: 'Organizations',
      description: 'Manage healthcare organizations',
      icon: <MdBusiness className="h-6 w-6" />, // Use the new icon
      href: '/admin/organizations',
      color: 'bg-blue-500' // Tailwind CSS class for background
    },
    {
      title: 'Users',
      description: 'Manage system users (Doctors, CHWs)',
      icon: <FiUsers className="h-6 w-6" />,
      href: '/admin/users',
      color: 'bg-green-500'
    },
    {
      title: 'Invite Users',
      description: 'Send invitations to new doctors or CHWs',
      icon: <FiUserPlus className="h-6 w-6" />,
      href: '/admin/invite',
      color: 'bg-purple-500'
    }
  ];

  // Placeholder for stats - these would come from an API call
  const quickStats = {
    totalOrganizations: 0, // Fetch from backend
    totalUsers: 0,         // Fetch from backend
    activeUsers: 0,        // Fetch from backend
    pendingInvites: 0      // Fetch from backend
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-50 min-h-screen"> {/* Added background and min-height */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Welcome back, {user?.fullName || user?.email || 'Admin'}! {/* Using user.fullName or user.email */}
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {adminCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group block p-6 bg-white rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-200 ease-in-out transform hover:-translate-y-1"
          >
            <div className="flex items-start">
              <div className={`flex-shrink-0 p-3 rounded-lg ${card.color} text-white`}>
                {React.cloneElement(card.icon, { className: "h-7 w-7" })} {/* Ensure icon size */}
              </div>
              <div className="ml-5 flex-1">
                <h2 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{card.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <p className="text-sm font-medium text-gray-500">Total Organizations</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{quickStats.totalOrganizations}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <p className="text-sm font-medium text-gray-500">Total Users</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{quickStats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <p className="text-sm font-medium text-gray-500">Active Users</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{quickStats.activeUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <p className="text-sm font-medium text-gray-500">Pending Invites</p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">{quickStats.pendingInvites}</p>
          </div>
        </div>
      </div>
    </div>
  );
}