"use client";
import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import LoadingSpinner from "../../../components/LoadingSpinner";
import { Base64 } from 'js-base64';

const roles = [
  { value: "consultant", label: "Doctor/Consultant" },
  { value: "chw", label: "Community Health Worker" },
];

function generateTempPassword() {
  return (
    Math.random().toString(36).slice(-8) + "!A1"
  );
}

export default function InviteUserPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roles[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [organization, setOrganization] = useState(user?.organization || "");

  // Only allow admin/organization users
  if (user && user.role !== "admin" && user.role !== "organization") {
    if (typeof window !== "undefined") router.replace("/dashboard");
    return null;
  }

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    setInviteLink("");
    setCopied(false);

    // Validate email
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    const tempPassword = generateTempPassword() || "TempPass123!";
    const requestBody = {
      firstName,
      lastName,
      email,
      role,
      organization,
      password: tempPassword,
      passwordConfirm: tempPassword,
    };

    try {
      const res = await fetch("https://aidcare-qrzkj.ondigitalocean.app/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await res.json();
      
      if (res.ok && data.success && data.data?.token) {
        setSuccess("Invitation sent successfully! Copy the link below and send it to the user. The link will expire in 24 hours.");
        
        // Create invite data with expiration
        const inviteData = {
          firstName,
          lastName,
          email,
          role,
          organization,
          token: data.data.token,
          exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours expiry
        };

        // Encode the data
        const encodedData = Base64.encode(JSON.stringify(inviteData), true);
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        const link = `${baseUrl}/invitation/${encodedData}`;
        
        setInviteLink(link);
        setFirstName("");
        setLastName("");
        setEmail("");
        setRole(roles[0].value);
      } else {
        setError(data.message || "Failed to send invite. Please try again.");
      }
    } catch (err) {
      console.error("Invite error:", err);
      setError("An error occurred while sending the invite. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 text-center">Invite a New User</h1>
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
          <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            disabled={isSubmitting}
          >
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Organization ID</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-400"
            value={organization}
            disabled
            readOnly
          />
        </div>
        {error && <div className="text-red-600 text-sm font-medium text-center">{error}</div>}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center text-lg shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? <LoadingSpinner size={22} /> : "Send Invite"}
        </button>
      </form>
      {success && (
        <div className="mt-8">
          <div className="text-green-600 text-base font-semibold mb-3 text-center">{success}</div>
          {inviteLink && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-100 font-mono"
              />
              <button
                onClick={handleCopy}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg relative"
                type="button"
              >
                {copied ? (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs rounded px-2 py-1 shadow">Copied!</span>
                ) : null}
                Copy Link
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 