import { useState } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import type { UserAccount } from '../types/dms';
import { BrandMark } from './BrandMark';

interface SignInScreenProps {
  users: UserAccount[];
  onSignIn: (userId: string) => void;
}

export function SignInScreen({ users, onSignIn }: SignInScreenProps) {
  const activeUsers = users.filter((u) => u.status === 'Active');
  const [email, setEmail] = useState(activeUsers[0]?.email ?? '');
  const [password, setPassword] = useState('••••••••••••');
  const [error, setError] = useState('');

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const matched = activeUsers.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!matched) {
      setError('No active authorized account matches that work email address.');
      return;
    }
    setError('');
    onSignIn(matched.id);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Left Institutional Panel */}
      <div className="lg:w-[46%] bg-[#062152] text-white px-8 py-12 lg:px-14 lg:py-16 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <BrandMark className="w-8 h-8" />
          <span className="font-display text-lg font-bold tracking-tight">PaperlessLink</span>
        </div>

        <div className="my-12 lg:my-0 max-w-md space-y-5">
          <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight leading-tight [text-wrap:balance]">
            Centralized Document Management for Authorized Personnel
          </h1>
          <p className="text-sm lg:text-[15px] text-slate-300 leading-relaxed">
            Upload, organize, search, share, and retrieve digital records across office
            workstations from a single central repository.
          </p>

          <dl className="pt-6 border-t border-white/15 grid grid-cols-2 gap-6 text-xs">
            <div>
              <dt className="text-slate-400">Repository Host</dt>
              <dd className="mt-1 font-mono text-white">10.24.0.10 (Central LAN)</dd>
            </div>
            <div>
              <dt className="text-slate-400">Access Policy</dt>
              <dd className="mt-1 text-white">Role-Based Workstation Auth</dd>
            </div>
          </dl>
        </div>

        <p className="text-xs text-slate-400">
          PaperlessLink Central Repository · Internal Digital Storage & Retrieval
        </p>
      </div>

      {/* Right Sign-In Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">
              Sign in to Central Repository
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Authenticate with your authorized workstation credentials to access shared records.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Authorized Work Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full h-11 px-3.5 rounded-md bg-white border border-slate-200 text-sm text-slate-900 focus:border-[#0B3D91] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-md bg-white border border-slate-200 text-sm text-slate-900 focus:border-[#0B3D91] focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-red-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full h-11 rounded-md bg-[#0B3D91] hover:bg-[#093074] text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
            >
              <span>Connect to Repository</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Workstation Demo Accounts */}
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-[#0B3D91]" aria-hidden="true" />
              <span>Quick Sign-In (Frontend Preview Accounts)</span>
            </div>
            <div className="divide-y divide-slate-200 border border-slate-200 rounded-md bg-white overflow-hidden">
              {activeUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onSignIn(user.id)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 text-left transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {user.fullName}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {user.role} · {user.department}
                    </div>
                  </div>
                  <span className="font-mono text-[11.5px] text-[#0B3D91] shrink-0">
                    {user.workstationId}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
