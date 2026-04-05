'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { coffeeshopApi, type CoffeeShop, type CoffeeShopSubmitRequest } from '@/lib/api';

// Dynamic import to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

export default function ProfilePage() {
  const { token } = useAuth();
  const [shop, setShop] = useState<CoffeeShop | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasShop, setHasShop] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [namaToko, setNamaToko] = useState('');
  const [alamat, setAlamat] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [tags, setTags] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [city, setCity] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  const [twitter, setTwitter] = useState('');

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      setIsLoadingData(true);
      const result = await coffeeshopApi.getMine(token);

      if (result.success && result.data) {
        setShop(result.data);
        setNamaToko(result.data.nama_toko || '');
        setAlamat(result.data.alamat || '');
        setDeskripsi(result.data.deskripsi || '');
        setTags(result.data.tags || '');
        setLatitude(result.data.latitude);
        setLongitude(result.data.longitude);
        setCity(result.data.city || '');
        setInstagram(result.data.instagram || '');
        setTiktok(result.data.tiktok || '');
        setWhatsapp(result.data.whatsapp || '');
        setFacebook(result.data.facebook || '');
        setTwitter(result.data.twitter || '');
        setHasShop(true);
      } else {
        setHasShop(false);
      }
      setIsLoadingData(false);
    };

    fetchProfile();
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    const body: CoffeeShopSubmitRequest = {
      nama_toko: namaToko,
      alamat,
      deskripsi,
      tags,
      latitude,
      longitude,
      city,
      instagram,
      tiktok,
      whatsapp,
      facebook,
      twitter,
    };

    const result = await coffeeshopApi.submit(token, body, shop?.id);

    if (result.success && result.data) {
      setShop(result.data);
      setHasShop(true);
      setSuccess('Profil toko berhasil disimpan!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Gagal menyimpan profil.');
    }

    setIsSubmitting(false);
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !shop) return;

    setIsUploading(true);
    setError('');

    const result = await coffeeshopApi.uploadFotoProfil(token, shop.id, file);

    if (result.success) {
      // Re-fetch profile to get updated photo data
      const refreshed = await coffeeshopApi.getMine(token);
      if (refreshed.success && refreshed.data) {
        setShop(refreshed.data);
      }
      setSuccess('Foto profil berhasil diupload!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Gagal mengupload foto.');
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-muted-foreground text-sm">Memuat profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil Toko</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {hasShop ? 'Kelola informasi coffee shop Anda' : 'Buat profil coffee shop Anda'}
        </p>
      </div>

      {/* Alert messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2" role="alert">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2" role="status">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {/* Foto Profil Card */}
      {hasShop && shop && (
        <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Foto Profil</h2>
          <div className="flex items-center gap-6">
            {/* Preview */}
            <div className="w-24 h-24 rounded-2xl bg-brown-100 border-2 border-dashed border-brown-300 flex items-center justify-center overflow-hidden flex-shrink-0">
              {shop.fotoProfil ? (
                <img
                  src={shop.fotoProfil.url}
                  alt={shop.nama_toko}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <svg className="w-10 h-10 text-brown-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              )}
            </div>

            {/* Upload */}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-3">
                Upload foto profil untuk toko Anda. Gunakan gambar berformat JPG atau PNG.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadFoto}
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                id="foto-profil-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-medium text-sm rounded-xl hover:bg-brown-200 transition-all duration-200 disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mengupload...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload Foto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Informasi Toko</h2>
        <form onSubmit={handleSubmit} className="space-y-5" id="profile-form">
          {/* Nama Toko */}
          <div className="space-y-2">
            <label htmlFor="nama-toko" className="block text-sm font-medium text-foreground">
              Nama Toko
            </label>
            <input
              id="nama-toko"
              type="text"
              value={namaToko}
              onChange={(e) => setNamaToko(e.target.value)}
              required
              placeholder="Nama coffee shop Anda"
              className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Alamat & Kota */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="alamat" className="block text-sm font-medium text-foreground">
                Alamat
              </label>
              <input
                id="alamat"
                type="text"
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                required
                placeholder="Alamat lengkap toko"
                className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="city" className="block text-sm font-medium text-foreground">
                Kota
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Contoh: Jakarta Selatan"
                className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <label htmlFor="deskripsi" className="block text-sm font-medium text-foreground">
              Deskripsi
            </label>
            <textarea
              id="deskripsi"
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              required
              rows={4}
              placeholder="Ceritakan tentang coffee shop Anda..."
              className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label htmlFor="tags" className="block text-sm font-medium text-foreground">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="kopi,espresso,latte (pisahkan dengan koma)"
              className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground">Pisahkan tag dengan koma</p>
          </div>

          {/* Sosial Media */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">Sosial Media & Kontak</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="whatsapp" className="block text-xs font-medium text-muted-foreground">WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </span>
                  <input id="whatsapp" type="url" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="https://wa.me/62812xxx" className="w-full pl-9 pr-4 py-2.5 bg-brown-50 border border-input rounded-xl text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="instagram" className="block text-xs font-medium text-muted-foreground">Instagram</label>
                <input id="instagram" type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="w-full px-4 py-2.5 bg-brown-50 border border-input rounded-xl text-sm" />
              </div>
              <div className="space-y-1">
                <label htmlFor="tiktok" className="block text-xs font-medium text-muted-foreground">TikTok</label>
                <input id="tiktok" type="url" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/..." className="w-full px-4 py-2.5 bg-brown-50 border border-input rounded-xl text-sm" />
              </div>
              <div className="space-y-1">
                <label htmlFor="facebook" className="block text-xs font-medium text-muted-foreground">Facebook</label>
                <input id="facebook" type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className="w-full px-4 py-2.5 bg-brown-50 border border-input rounded-xl text-sm" />
              </div>
              <div className="space-y-1">
                <label htmlFor="twitter" className="block text-xs font-medium text-muted-foreground">Twitter</label>
                <input id="twitter" type="url" value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://twitter.com/..." className="w-full px-4 py-2.5 bg-brown-50 border border-input rounded-xl text-sm" />
              </div>
            </div>
          </div>

          {/* Lokasi Toko */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Lokasi Toko</label>
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs text-muted-foreground">Latitude</label>
                <input
                  type="text"
                  value={latitude ?? '-'}
                  readOnly
                  className="w-full px-3 py-2 bg-brown-100/50 border border-input rounded-lg text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-muted-foreground">Longitude</label>
                <input
                  type="text"
                  value={longitude ?? '-'}
                  readOnly
                  className="w-full px-3 py-2 bg-brown-100/50 border border-input rounded-lg text-sm text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              id="profile-submit"
              className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-brown-800 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md shadow-brown-900/10 hover:shadow-lg hover:shadow-brown-900/20 active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Menyimpan...
                </span>
              ) : hasShop ? (
                'Simpan Perubahan'
              ) : (
                'Buat Profil Toko'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
