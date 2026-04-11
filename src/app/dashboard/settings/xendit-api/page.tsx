'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { coffeeshopApi, type XenditApiRequest } from '@/lib/api';

export default function XenditApiPage() {
  const { token } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [callbackToken, setCallbackToken] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showCallbackToken, setShowCallbackToken] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      setIsLoading(true);
      // First get shop ID
      const shopResult = await coffeeshopApi.getMine(token);
      if (shopResult.success && shopResult.data) {
        const id = shopResult.data.id;
        setShopId(id);

        // Then get Xendit API data
        const xenditResult = await coffeeshopApi.getXenditApi(token, id);
        if (xenditResult.success && xenditResult.data) {
          setApiKey(xenditResult.data.xendit_api_key || '');
          setCallbackToken(xenditResult.data.xendit_callback_token || '');
        }
      } else {
        setError(shopResult.message || 'Gagal memuat profil toko.');
      }
      setIsLoading(false);
    };

    loadData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !shopId) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const body: XenditApiRequest = {
      xendit_api_key: apiKey,
      xendit_callback_token: callbackToken,
    };

    const result = await coffeeshopApi.updateXenditApi(token, shopId, body);

    if (result.success) {
      setSuccess('Konfigurasi Xendit berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Gagal menyimpan konfigurasi.');
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-4 border-brown-200 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Xendit API</h1>
        <p className="text-muted-foreground text-sm mt-1">Konfigurasikan kunci API Xendit untuk menerima pembayaran otomatis.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>{success}</span>
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="api-key" className="block text-sm font-medium text-foreground">
                Xendit API Key (Secret Key)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                   <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="api-key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="xnd_production_..."
                  className="w-full pl-10 pr-10 py-3 bg-brown-50 border border-input rounded-xl text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                >
                  {showApiKey ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Gunakan Secret Key dari dashboard Xendit Anda.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="callback-token" className="block text-sm font-medium text-foreground">
                Xendit Callback Token
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </span>
                <input
                  id="callback-token"
                  type={showCallbackToken ? 'text' : 'password'}
                  value={callbackToken}
                  onChange={(e) => setCallbackToken(e.target.value)}
                  placeholder="Token callback..."
                  className="w-full pl-10 pr-10 py-3 bg-brown-50 border border-input rounded-xl text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowCallbackToken(!showCallbackToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground"
                >
                  {showCallbackToken ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Token verifikasi callback yang dapat diatur di dashboard Xendit.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-brown-900/10 hover:shadow-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
