"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import LoadingSpinner from "../../components/LoadingSpinner";
import { Base64 } from 'js-base64';

export default function InvitationRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const [inviteData, setInviteData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [organization, setOrganization] = useState("");

  useEffect(() => {
    const decodeInviteData = () => {
      try {
        const encodedData = params?.token;
        if (!encodedData) {
          setError("Invalid invitation link: No data provided.");
          setIsLoading(false);
          return;
        }

        const decodedString = Base64.decode(encodedData);
        const data = JSON.parse(decodedString);

        // Check if the invite has expired
        if (data.exp < Date.now()) {
          setError("This invitation link has expired.");
          setIsLoading(false);
          return;
        }

        // Set the form data
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setEmail(data.email || "");
        setOrganization(data.organization || "");
        setInviteData(data);
      } catch (err) {
        console.error("Error decoding invitation:", err);
        setError("Invalid invitation link: Could not decode data.");
      } finally {
        setIsLoading(false);
      }
    };

    decodeInviteData();
  }, [params]);

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto mt-20 bg-white p-8 rounded-xl shadow text-center">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-gray-600">Loading invitation details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-20 bg-white p-8 rounded-xl shadow text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Invalid Invitation Link</h1>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => router.push("/login")}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("https://aidcare-qrzkj.ondigitalocean.app/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          organization,
          password,
          passwordConfirm,
          token: inviteData.token,
          role: inviteData.role
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("Registration successful! You can now log in.");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.message || "Failed to complete registration.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 text-center">Complete Your Registration</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="First Name"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Last Name"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="user@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Organization ID</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-400"
            value={organization}
            readOnly
            disabled
            placeholder="Organization ID"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Password"
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Confirm Password"
            minLength={8}
          />
        </div>
        {error && <div className="text-red-600 text-sm font-medium text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center text-lg shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? <LoadingSpinner size={22} /> : "Complete Registration"}
        </button>
      </form>
      {success && (
        <div className="mt-8 text-green-600 text-base font-semibold text-center">{success}</div>
      )}
    </div>
  );
} 