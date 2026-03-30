import { useState } from 'react';
import { useRouter } from 'next/router';
import { IoLockClosedOutline, IoMailOutline, IoPersonOutline, IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import Link from 'next/link';
import Logo from '@/components/Logo';
import { trackUserEngagement } from '@/lib/gtag';

export default function SignupPage() {
  const router = useRouter();

  const [orgName, setOrgName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setLoading(true);
    
    try {
      setError('');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/organization/with-root-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          firstName: "Admin",
          lastName: orgName,
          email,
          password,
          passwordConfirm: password,
        }),
      });
    
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Signup failed');
      }
    
      const data = await res.json();
      const info = data.data
      localStorage.setItem('aidcare_user', JSON.stringify(info.user));
      localStorage.setItem('aidcare_token', info.token);
      
      // Track successful signup
      trackUserEngagement.signup('email');
      
      router.push(`/signup/success?orgId=${info.user.organization}&orgName=${info.organization.name}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
    
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center">
      <div className="max-w-6xl mx-auto w-full px-4 py-12 md:py-20 grid md:grid-cols-2 items-start gap-12">
        {/* Left: brand + value prop */}
        <div className="hidden md:flex flex-col md:pr-8">
          <Logo />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Create your organization</h1>
          <p className="mt-2 text-gray-600">Set up your workspace and invite your team when you're ready.</p>
          <ul className="mt-6 text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>Organization‑level access</li>
            <li>Role‑aware guidance for CHWs and Consultants</li>
            <li>Secure patient management</li>
          </ul>
        </div>

        {/* Right: form card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 w-full md:max-w-lg md:ml-auto">
          <h2 className="text-xl font-semibold text-gray-900">Create your account</h2>
          <p className="text-sm text-gray-600 mt-1">Already have an account? <Link href="/login" className="text-[#6366F1] hover:underline">Log in</Link></p>

          {error && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => { e.preventDefault(); handleSignup(); }}
          >
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Organization name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IoPersonOutline className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="orgName"
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Sunrise Health"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Organization email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IoMailOutline className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="orgEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@org.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] outline-none placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IoLockClosedOutline className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="orgPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] outline-none placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IoEyeOffOutline className="h-5 w-5" /> : <IoEyeOutline className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#6366F1] text-white py-3 font-medium hover:bg-[#5457ea] transition disabled:opacity-50"
            >
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}