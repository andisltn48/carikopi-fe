'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { coffeeshopApi } from '@/lib/api';

export default function QRCodePage() {
  const { token } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setIsLoading(true);
      const result = await coffeeshopApi.getMine(token);
      if (result.success && result.data) {
        setShopId(result.data.id);
      } else {
        setError(result.message || 'Gagal memuat profil toko.');
      }
      setIsLoading(false);
    };

    load();
  }, [token]);

  const publicUrl = shopId ? `${window.location.origin}/shop/${shopId}` : '';
  const qrUrl = publicUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}` : '';

  const handleDownload = async () => {
    if (!qrUrl) return;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_Code_${shopId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download QR code', err);
    }
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
        <h1 className="text-2xl font-bold text-foreground">QR Code Toko</h1>
        <p className="text-muted-foreground text-sm mt-1">Gunakan QR code ini untuk memudahkan pelanggan memesan di tempat.</p>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
        <div className="p-8 flex flex-col items-center">
          {error ? (
            <div className="text-red-600 font-medium">{error}</div>
          ) : (
            <>
              <div className="bg-white p-6 rounded-3xl shadow-lg border border-border/30 mb-8 premium-border">
                <img 
                  src={qrUrl} 
                  alt="QR Code Toko" 
                  className="w-64 h-64"
                />
              </div>

              <div className="text-center space-y-4 max-w-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 mb-1">Public URL</p>
                  <p className="text-sm font-mono bg-secondary/30 px-3 py-1.5 rounded-lg text-primary break-all">
                    {publicUrl}
                  </p>
                </div>

                <div className="pt-4 space-y-3">
                  <button 
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg shadow-brown-900/10"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download QR Code
                  </button>
                  <p className="text-xs text-muted-foreground">
                    Tip: Cetak QR code ini dan tempelkan di meja kasir atau meja pelanggan.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
