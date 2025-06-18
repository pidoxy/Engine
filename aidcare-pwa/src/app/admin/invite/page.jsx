"use client";
import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiClipboard, FiCheck, FiChevronDown, FiPlus } from 'react-icons/fi';
import { Base64 } from 'js-base64';
import { useAuth } from '../../context/AuthContext';

export default function InviteUsersPage() {
  const [formData, setFormData] = useState({
    email: '',
    role: 'consultant',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const { user } = useAuth();

  const generateInviteLink = (data) => {
    const inviteData = {
      ...data,
      organizationId: user.organization,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days expiry
    };
    return `${window.location.origin}/register/${Base64.encode(JSON.stringify(inviteData), true)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const link = generateInviteLink(formData);
      const newInvite = { ...formData, link, date: new Date().toISOString() };
      const updatedInvites = [newInvite, ...pendingInvites];
      setPendingInvites(updatedInvites);
      localStorage.setItem('pendingInvites', JSON.stringify(updatedInvites));
      setFormData({ email: '', role: 'consultant', firstName: '', lastName: '' });
    } catch (err) {
      setError('Failed to generate invitation link');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  useEffect(() => {
    const storedInvites = localStorage.getItem('pendingInvites');
    if (storedInvites) {
      setPendingInvites(JSON.parse(storedInvites));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Invite New Member</h2>
                <p className="text-sm text-gray-500 mb-6">Generate an invitation link to share with a new member.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <FiUser className="text-gray-400" />
                        </div>
                        <input type="text" id="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" required />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <input type="text" id="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" required />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="text-gray-400" />
                      </div>
                      <input type="email" id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md" required />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                    <div className="mt-1 relative">
                      <select id="role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="appearance-none block w-full bg-white border border-gray-300 rounded-md py-2 pl-3 pr-10 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        <option value="consultant">Doctor/Consultant</option>
                        <option value="chw">Community Health Worker</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <FiChevronDown />
                      </div>
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    <FiPlus />
                    {loading ? 'Generating...' : 'Generate Invite'}
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-7 mt-8 lg:mt-0">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Invitations</h2>
                {pendingInvites.length > 0 ? (
                  <ul className="space-y-4">
                    {pendingInvites.map((invite, index) => (
                      <li key={index} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">{invite.firstName} {invite.lastName}</p>
                          <p className="text-sm text-gray-500">{invite.email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Role: <span className="font-medium capitalize bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{invite.role}</span>
                            <span className="mx-2">|</span>
                            Invited: {new Date(invite.date).toLocaleDateString()}
                          </p>
                        </div>
                        <button onClick={() => copyToClipboard(invite.link)} className="flex items-center gap-2 px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          {copiedLink === invite.link ? <FiCheck /> : <FiClipboard />}
                          {copiedLink === invite.link ? 'Copied!' : 'Copy Link'}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No pending invitations.</p>
                    <p className="text-sm text-gray-400 mt-2">Use the form on the left to generate a new invitation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 