// src/app/(auth)/signup/page.js
"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUser, FiMail, FiLock, FiBriefcase, FiPlusCircle } from 'react-icons/fi';
import { userService } from '../../lib/services/userService';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    organizationName: '',
    organizationDescription: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    if (formData.password !== formData.passwordConfirm) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        name: formData.organizationName,
        description: formData.organizationDescription,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
      };
      await userService.createOrganizationWithAdmin(payload);
      router.push('/login?message=Organization created successfully! Please log in.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new Organization
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Admin Information</h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First name</label>
                  <div className="mt-1">
                    <input type="text" name="firstName" id="firstName" autoComplete="given-name" required value={formData.firstName} onChange={handleChange} className={inputStyle} />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last name</label>
                  <div className="mt-1">
                    <input type="text" name="lastName" id="lastName" autoComplete="family-name" required value={formData.lastName} onChange={handleChange} className={inputStyle} />
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input id="email" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className={inputStyle} />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1">
                  <input id="password" name="password" type="password" required value={formData.password} onChange={handleChange} className={inputStyle} />
                </div>
              </div>
              <div>
                <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="mt-1">
                  <input id="passwordConfirm" name="passwordConfirm" type="password" required value={formData.passwordConfirm} onChange={handleChange} className={inputStyle} />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Organization Information</h3>
              <div>
                <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">Organization Name</label>
                <div className="mt-1">
                  <input type="text" name="organizationName" id="organizationName" required value={formData.organizationName} onChange={handleChange} className={inputStyle} />
          </div>
          </div>
              <div>
                <label htmlFor="organizationDescription" className="block text-sm font-medium text-gray-700">Description</label>
                <div className="mt-1">
                  <textarea id="organizationDescription" name="organizationDescription" rows={3} value={formData.organizationDescription} onChange={handleChange} className={inputStyle} />
          </div>
          </div>
          </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <FiPlusCircle className="mr-2" />
                {isSubmitting ? 'Creating Organization...' : 'Create Organization'}
          </button>
            </div>
        </form>
        </div>
      </div>
    </div>
  );
}