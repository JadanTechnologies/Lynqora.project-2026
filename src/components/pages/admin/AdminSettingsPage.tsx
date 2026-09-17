import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { useRoute } from '../../../context/RouteContext.tsx';
import { Settings as SettingsIcon, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { token } = useAuth();
  const { navigate } = useRoute();

  const [settings, setSettings] = useState<{ key: string; value: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const fetchSettings = () => {
    if (!token) return;
    setLoading(true);
    fetch('/api/admin/settings', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data?.settings) setSettings(data.settings);
      })
      .catch(err => setError('Failed to load settings.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const handleUpdate = async (key: string, value: string) => {
    setSuccessMessage('');
    setError('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ key, value })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update setting.');

      setSuccessMessage(`Updated setting: ${key}`);
      fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Update failed.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-medium transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Console
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
              System Settings
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure global platform behavior, submission ingestion, and default policies
            </p>
          </div>
          <button
            onClick={fetchSettings}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm divide-y divide-slate-100">
        {settings.map((s) => (
          <div key={s.key} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="font-mono font-bold text-xs text-slate-900">{s.key}</div>
              <p className="text-xs text-slate-500">{s.description}</p>
            </div>

            <div className="shrink-0">
              {s.key === 'allow_new_submissions' ? (
                <button
                  onClick={() => handleUpdate(s.key, s.value === 'true' ? 'false' : 'true')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    s.value === 'true'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {s.value === 'true' ? 'Enabled (Accepting Submissions)' : 'Paused (Submissions Blocked)'}
                </button>
              ) : s.key === 'default_verification_status' ? (
                <select
                  value={s.value}
                  onChange={(e) => handleUpdate(s.key, e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="PENDING">PENDING</option>
                  <option value="UNVERIFIED">UNVERIFIED</option>
                </select>
              ) : (
                <span className="font-mono text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  {s.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
