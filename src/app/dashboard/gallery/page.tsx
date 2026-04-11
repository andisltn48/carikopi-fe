'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  coffeeshopApi,
  galleryApi,
  type GalleryItem,
} from '@/lib/api';

export default function GalleryPage() {
  const { token, shopId } = useAuth();
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nama, setNama] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Zoom preview
  const [zoomTarget, setZoomTarget] = useState<GalleryItem | null>(null);

  useEffect(() => {
    if (!token || !shopId) {
      if (!shopId && !token) setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const galleryResult = await galleryApi.getByShop(token, shopId);
        if (galleryResult.success && galleryResult.data) {
          setGalleries(galleryResult.data);
        }
      } catch (err) {
        console.error('Failed to load gallery:', err);
        setError('Gagal memuat data galeri');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [token, shopId]);

  const refreshGalleries = async () => {
    if (!token || !shopId) return;
    const result = await galleryApi.getByShop(token, shopId);
    if (result.success && result.data) {
      setGalleries(result.data);
    }
  };

  const openAddModal = () => {
    setNama('');
    setSelectedFile(null);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !shopId || !selectedFile) {
      setError('Pilih foto terlebih dahulu');
      return;
    }

    setError('');
    setIsSubmitting(true);

    const result = await galleryApi.submit(token, shopId, nama, selectedFile);

    if (result.success) {
      setShowModal(false);
      await refreshGalleries();
      setSuccess('Foto berhasil ditambahkan ke galeri!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Gagal menambahkan foto.');
    }

    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!token || !deleteTarget || !shopId) return;

    setIsDeleting(true);
    const result = await galleryApi.delete(token, deleteTarget.id, shopId);

    if (result.success) {
      setDeleteTarget(null);
      await refreshGalleries();
      setSuccess('Foto berhasil dihapus!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Gagal menghapus foto.');
      setDeleteTarget(null);
    }

    setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-muted-foreground text-sm">Memuat galeri...</p>
        </div>
      </div>
    );
  }

  if (!shopId) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brown-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-brown-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Belum Ada Profil Toko</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Buat profil toko terlebih dahulu sebelum menambahkan galeri.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Galeri Foto</h1>
          <p className="text-muted-foreground text-sm mt-1">{galleries.length} foto tersedia</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-brown-800 transition-all duration-200 shadow-md shadow-brown-900/10 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Foto
        </button>
      </div>

      {/* Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2" role="status">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      {error && !showModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2" role="alert">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Gallery Grid */}
      {galleries.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brown-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-brown-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Belum Ada Foto</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Tambahkan foto suasana cafe atau momen seru di kedai Anda.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-brown-800 transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Foto Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {galleries.map((item) => (
            <div key={item.id} className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden group hover:shadow-md transition-all duration-200">
              <div className="aspect-square bg-brown-100 relative overflow-hidden">
                <img src={item.foto.url} alt={item.nama} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Delete button (top right) */}
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-600/90 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg z-10"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>

                  {/* Zoom button (center) */}
                  <button
                    onClick={() => setZoomTarget(item)}
                    className="absolute inset-0 w-full h-full flex items-center justify-center text-white/90 hover:text-white transition-colors"
                    title="Perbesar"
                  >
                    <svg className="w-10 h-10 transform scale-75 group-hover:scale-100 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="11" y1="8" x2="11" y2="14" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-2">
                <p className="font-medium text-foreground text-xs truncate">{item.nama || 'Tanpa Nama'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-xl border border-border/60 w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-foreground mb-5">Tambah Foto Galeri</h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="galeri-nama" className="block text-sm font-medium text-foreground">Nama / Keterangan</label>
                <input
                  id="galeri-nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Suasana Sore, Event Musik"
                  className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Foto</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                />
                {!selectedFile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-3 py-8 bg-brown-50 border border-dashed border-brown-300 text-sm text-muted-foreground rounded-2xl hover:bg-brown-100 hover:border-brown-400 transition-all duration-200"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brown-200/50 flex items-center justify-center text-brown-500">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <span>Pilih Foto dari Perangkat</span>
                  </button>
                ) : (
                  <div className="relative group rounded-2xl overflow-hidden border border-border/60">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full aspect-video object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-brown-200 transition-all duration-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-brown-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? 'Mengupload...' : 'Simpan Foto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-card rounded-2xl shadow-xl border border-border/60 w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Hapus Foto?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Foto ini akan dihapus permanen dari galeri.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-brown-200 transition-all duration-200"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all duration-200"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {zoomTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setZoomTarget(null)} />
          <div className="relative max-w-5xl w-full flex flex-col items-center gap-4">
            <button
              onClick={() => setZoomTarget(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <img
              src={zoomTarget.foto.url}
              alt={zoomTarget.nama}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            {zoomTarget.nama && (
              <p className="text-white text-lg font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                {zoomTarget.nama}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
