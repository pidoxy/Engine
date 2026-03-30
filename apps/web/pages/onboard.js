import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { IoLockClosedOutline, IoMailOutline, IoPersonOutline, IoEyeOffOutline, IoEyeOutline } from 'react-icons/io5';
import Logo from '@/components/Logo';
import Link from 'next/link';

const OnboardUser = () => {
  const router = useRouter();

  const [fName, setFName] = useState('');
  const [lName, setLName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('consultant'); // Default role is 'consultant'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const orgId = router.query.orgId;

  const registerUser = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: fName,
          lastName: lName,
          email,
          password,
          passwordConfirm: password,
          organization: orgId,
          role,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'User Registration failed');
      }

      const data = await res.json();
      const info = data.data;
      localStorage.setItem('aidcare_user', JSON.stringify(info.user));
      localStorage.setItem('aidcare_token', info.token);
      router.push(`/app`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Complete Registration - AidCare</title>
        <meta name="description" content="Complete your AidCare registration to access AI-powered healthcare support and start improving patient care." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center">
        <div className="max-w-6xl mx-auto w-full px-4 py-12 md:py-20 grid md:grid-cols-2 items-start gap-12">
        {/* Left: brand + value prop */}
        <div className="hidden md:flex flex-col md:pr-8">
          <Logo />
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Join your organization</h1>
          <p className="mt-2 text-gray-600">Get access to AI-powered healthcare support and start improving patient care.</p>
          <ul className="mt-6 text-sm text-gray-600 space-y-2 list-disc list-inside">
            <li>Role‑aware AI guidance for your specific role</li>
            <li>Secure patient management and documentation</li>
            <li>Real-time clinical decision support</li>
          </ul>
        </div>

        {/* Right: form card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 w-full md:max-w-lg md:ml-auto">
          <h2 className="text-xl font-semibold text-gray-900">Complete your registration</h2>
          <p className="text-sm text-gray-600 mt-1">Already have an account? <Link href="/login" className="text-[#6366F1] hover:underline">Log in</Link></p>

          {error && (
            <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
              {error}
            </div>
          )}

          <form
            className="mt-6 space-y-5"
            onSubmit={(e) => { e.preventDefault(); registerUser(); }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">First name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IoPersonOutline className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="fName"
                    type="text"
                    required
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="John"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Last name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IoPersonOutline className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lName"
                    type="text"
                    required
                    value={lName}
                    onChange={(e) => setLName(e.target.value)}
                    placeholder="Doe"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IoMailOutline className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
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
                  id="password"
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

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IoPersonOutline className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] outline-none appearance-none bg-white cursor-pointer"
                >
                  <option value="consultant">Consultant</option>
                  <option value="chw">Community Health Worker</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#6366F1] text-white py-3 font-medium hover:bg-[#5457ea] transition disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Complete registration'}
            </button>
          </form>
        </div>
        </div>
      </div>
    </>
  );
}

export default OnboardUser;