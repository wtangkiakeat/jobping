'use client';

import { useEffect, useState } from 'react';

export default function UnsubscribePage() {
  const [id, setId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Read ?id=... from the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setId(params.get('id'));
  }, []);

  const handleUnsubscribe = async () => {
    if (!id) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setStatus(data.success ? 'done' : 'error');
      setMessage(data.success ? data.message : data.error);
    } catch {
      setStatus('error');
      setMessage('Network error. Try again.');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FBFBF9] text-[#111311] px-6">
      <div className="max-w-md w-full bg-white border border-[#E8E6DF] rounded-2xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-3">JobPing 🎯</h1>

        {status === 'done' ? (
          <p className="text-[#1D5C3F]">{message}</p>
        ) : (
          <>
            <p className="text-[#5B6152] mb-6">
              Stop receiving job alert emails from JobPing?
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={!id || status === 'loading'}
              className="w-full py-3 rounded-xl bg-[#1D5C3F] text-white font-semibold disabled:opacity-50"
            >
              {status === 'loading' ? 'Unsubscribing…' : 'Unsubscribe'}
            </button>
            {!id && (
              <p className="mt-4 text-sm text-red-600">This link is missing information.</p>
            )}
            {status === 'error' && (
              <p className="mt-4 text-sm text-red-600">{message}</p>
            )}
          </>
        )}

        <a href="/" className="block mt-6 text-sm text-[#5B6152] underline">
          Back to JobPing
        </a>
      </div>
    </main>
  );
}