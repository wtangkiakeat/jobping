'use client';

import { useState } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [keywords, setKeywords] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!email || !keywords) {
      setStatus('error');
      setMessage('Please fill in both email and keywords');
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, keywords }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message);
        setEmail('');
        setKeywords('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error, please try again');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-6xl font-bold mb-4">JobPing 🎯</h1>
        <p className="text-2xl text-gray-300 mb-2">Never miss a job again</p>
        <p className="text-lg text-gray-500 mb-12">
          Enter the keywords you want, and get notified the moment a matching job appears
        </p>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
            />
            <input
              type="text"
              placeholder="Keywords (e.g. react, remote, python)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-white/50"
            />
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              className="w-full px-4 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition disabled:opacity-50"
            >
              {status === 'loading' ? 'Subscribing...' : 'Subscribe Free'}
            </button>
          </div>

          {message && (
            <p className={`mt-4 text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white/5 rounded-xl p-6">
            <div className="text-3xl mb-2">1️⃣</div>
            <h3 className="font-semibold mb-1">Enter keywords</h3>
            <p className="text-gray-400 text-sm">Tell us what jobs you want</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6">
            <div className="text-3xl mb-2">2️⃣</div>
            <h3 className="font-semibold mb-1">We find them</h3>
            <p className="text-gray-400 text-sm">We scan new jobs daily</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6">
            <div className="text-3xl mb-2">3️⃣</div>
            <h3 className="font-semibold mb-1">Get notified</h3>
            <p className="text-gray-400 text-sm">Instant email on a match</p>
          </div>
        </div>
      </div>
    </main>
  );
}