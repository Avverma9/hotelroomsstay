import React, { useState } from 'react';
import baseURL from '../utils/baseURL';

const getInitials = (name = '') => {
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  return trimmed
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'U';
};

export default function DataSecurityPage() {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const handleLookup = async (event) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      setUser(null);
      return;
    }

    setLoading(true);
    setError('');
    setDeleted(false);

    try {
      const response = await fetch(`${baseURL}/account/self-delete/find?email=${encodeURIComponent(trimmedEmail)}`);
      const result = await response.json();

      if (!response.ok || !result?.success) {
        setUser(null);
        setError(result?.message || 'No account found for this email address.');
        return;
      }

      setUser(result.data);
    } catch (fetchError) {
      setUser(null);
      setError('Unable to fetch account details right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.email) {
      return;
    }

    setDeleteLoading(true);
    setError('');

    try {
      const response = await fetch(`${baseURL}/account/self-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email, confirm: true }),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        setError(result?.message || 'Unable to delete the account right now.');
        setDeleteLoading(false);
        return;
      }

      setDeleted(true);
      setUser(null);
      setEmail('');
      setShowConfirm(false);
    } catch (fetchError) {
      setError('Something went wrong while deleting the account. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const detailItems = user
    ? [
        ['Name', user.userName || 'Not available'],
        ['Email', user.email || 'Not available'],
        ['Mobile', user.mobile || 'Not available'],
        ['Address', user.address || 'Not available'],
        ['Account ID', user.userId || 'Not available'],
        ['Joined', user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not available'],
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-8 shadow-2xl shadow-emerald-950/20">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Data Security</p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Delete your account and personal data</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Search your account by email to review the details linked to your profile, then delete your account permanently.
            This action removes your account and associated bookings and related records.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
            <form onSubmit={handleLookup} className="space-y-4">
              <label className="block text-sm font-medium text-slate-200">Email address</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Searching...' : 'Find account'}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            {deleted && (
              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Your account and associated booking records have been deleted successfully.
              </div>
            )}

            {user && (
              <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/60 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-lg font-bold text-emerald-300">
                    {getInitials(user.userName || user.email)}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{user.userName || 'User account'}</p>
                    <p className="text-sm text-slate-400">Account found in our system</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {detailItems.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 border-b border-slate-800 pb-2 text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-right font-medium text-slate-100">{value}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  className="mt-6 w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
                >
                  Delete my account
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/30">
            <h2 className="text-xl font-semibold text-white">What will be deleted</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>• Your personal account profile and login information</li>
              <li>• All hotel, tour and cab bookings linked to your account</li>
              <li>• Coupons, complaints, reviews and related account activity</li>
              <li>• Any data used to manage your reservation history</li>
            </ul>

            <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <strong className="font-semibold">Important:</strong> This action is permanent. Once confirmed, the deleted data cannot be recovered.
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white">Confirm account deletion</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Are you sure you want to delete this account? After confirmation, your profile and all linked hotel booking records will be removed permanently.
            </p>

            <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
              This action will permanently remove your account and all associated hotel bookings and related records.
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, delete my account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
