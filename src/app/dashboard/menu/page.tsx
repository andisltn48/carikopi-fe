'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  coffeeshopApi,
  menuApi,
  type MenuItem,
  type MenuSubmitRequest,
  type MenuFoto,
} from '@/lib/api';

// ── Helpers ──

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

// ── Sub-Components ──

function MenuCard({
  menu,
  onEdit,
  onFoto,
  onDelete,
}: {
  menu: MenuItem;
  onEdit: () => void;
  onFoto: () => void;
  onDelete: () => void;
}) {
  const thumb = menu.foto?.[0];

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden group hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="aspect-[4/3] bg-brown-100 relative overflow-hidden">
        {thumb ? (
          <img src={thumb.url} alt={menu.nama} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-brown-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
          </div>
        )}
        {/* Photo count badge */}
        {menu.foto?.length > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
            {menu.foto.length} foto
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground text-base truncate">{menu.nama}</h3>
        <p className="text-primary font-bold text-lg">{formatRupiah(menu.harga)}</p>
        <p className="text-muted-foreground text-sm line-clamp-2">{menu.deskripsi || '-'}</p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-brown-200 transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
          <button
            onClick={onFoto}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-xl hover:bg-brown-200 transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Foto
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 text-red-600 bg-red-50 text-sm font-medium rounded-xl hover:bg-red-100 transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function MenuPage() {
  const { token } = useAuth();
  const [shopId, setShopId] = useState<string | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const menuFileInputRef = useRef<HTMLInputElement>(null);

  // Photo state
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoMenu, setFotoMenu] = useState<MenuItem | null>(null);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Load Shop & Menus ──

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setIsLoading(true);
      // Get shop first
      const shopResult = await coffeeshopApi.getMine(token);
      if (shopResult.success && shopResult.data) {
        setShopId(shopResult.data.id);
        // Then get menus
        const menuResult = await menuApi.getByShop(token, shopResult.data.id);
        if (menuResult.success && menuResult.data) {
          setMenus(menuResult.data);
        }
      }
      setIsLoading(false);
    };

    load();
  }, [token]);

  const refreshMenus = async () => {
    if (!token || !shopId) return;
    const result = await menuApi.getByShop(token, shopId);
    if (result.success && result.data) {
      setMenus(result.data);
    }
  };

  // ── Add / Edit Modal ──

  const openAddModal = () => {
    setEditingMenu(null);
    setNama('');
    setHarga('');
    setDeskripsi('');
    setSelectedFiles([]);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (menu: MenuItem) => {
    setEditingMenu(menu);
    setNama(menu.nama);
    setHarga(menu.harga.toString());
    setDeskripsi(menu.deskripsi || '');
    setSelectedFiles([]);
    setError('');
    setShowModal(true);
  };

  const handleSubmitMenu = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !shopId) return;

    setError('');
    setIsSubmitting(true);

    const body: MenuSubmitRequest = {
      nama,
      harga: parseInt(harga) || 0,
      deskripsi,
    };

    let result;
    if (editingMenu) {
      result = await menuApi.update(token, editingMenu.id, body, selectedFiles.length > 0 ? selectedFiles : undefined);
    } else {
      result = await menuApi.submit(token, shopId, body, selectedFiles.length > 0 ? selectedFiles : undefined);
    }

    if (result.success) {
      setShowModal(false);
      await refreshMenus();
      setSuccess(editingMenu ? 'Menu berhasil diperbarui!' : 'Menu berhasil ditambahkan!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Gagal menyimpan menu.');
    }

    setIsSubmitting(false);
  };

  // ── Delete ──

  const handleDeleteMenu = async () => {
    if (!token || !deleteTarget) return;

    setIsDeleting(true);
    const result = await menuApi.deleteMenu(token, deleteTarget.id);

    if (result.success) {
      setDeleteTarget(null);
      await refreshMenus();
      setSuccess('Menu berhasil dihapus!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Gagal menghapus menu.');
      setDeleteTarget(null);
    }

    setIsDeleting(false);
  };

  // ── Foto Management ──

  const openFotoModal = (menu: MenuItem) => {
    setFotoMenu(menu);
    setShowFotoModal(true);
    setError('');
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !token || !fotoMenu) return;

    setIsUploadingFoto(true);
    const result = await menuApi.uploadFoto(token, fotoMenu.id, Array.from(files));

    if (result.success) {
      // Re-fetch menu detail to get complete updated foto list
      const refreshed = await menuApi.getDetail(token, fotoMenu.id);
      if (refreshed.success && refreshed.data) {
        setFotoMenu(refreshed.data);
        setEditingMenu(refreshed.data);
      }
      await refreshMenus();
      setSuccess('Foto berhasil diupload!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Gagal upload foto.');
    }

    setIsUploadingFoto(false);
    if (fotoInputRef.current) fotoInputRef.current.value = '';
  };

  const handleDeleteFoto = async (fotoId: string) => {
    if (!token || !fotoMenu) return;

    const result = await menuApi.deleteFoto(token, fotoMenu.id, fotoId);

    if (result.success) {
      // Refresh menu detail
      const refreshed = await menuApi.getDetail(token, fotoMenu.id);
      if (refreshed.success && refreshed.data) {
        setFotoMenu(refreshed.data);
        setEditingMenu(refreshed.data);
      }
      await refreshMenus();
      setSuccess('Foto berhasil dihapus!')
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message || 'Gagal menghapus foto.');
    }
  };

  // ── Loading ──

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-muted-foreground text-sm">Memuat menu...</p>
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
            Buat profil toko terlebih dahulu di halaman <a href="/dashboard/profile" className="text-primary hover:underline font-medium">Profil Toko</a> sebelum menambahkan menu.
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
          <h1 className="text-2xl font-bold text-foreground">Manajemen Menu</h1>
          <p className="text-muted-foreground text-sm mt-1">{menus.length} menu tersedia</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-brown-800 transition-all duration-200 shadow-md shadow-brown-900/10 active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Menu
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

      {/* Menu Grid */}
      {menus.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brown-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-brown-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" y1="2" x2="6" y2="4" />
              <line x1="10" y1="2" x2="10" y2="4" />
              <line x1="14" y1="2" x2="14" y2="4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Belum Ada Menu</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-4">
            Tambahkan menu kopi pertama Anda untuk ditampilkan kepada pelanggan.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl hover:bg-brown-800 transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Menu Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {menus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              onEdit={() => openEditModal(menu)}
              onFoto={() => openFotoModal(menu)}
              onDelete={() => setDeleteTarget(menu)}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-xl border border-border/60 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-5">
              {editingMenu ? 'Edit Menu' : 'Tambah Menu Baru'}
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm mb-4">{error}</div>
            )}

            <form onSubmit={handleSubmitMenu} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="menu-nama" className="block text-sm font-medium text-foreground">Nama Menu</label>
                <input
                  id="menu-nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  placeholder="Contoh: Espresso, Cappuccino"
                  className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="menu-harga" className="block text-sm font-medium text-foreground">Harga (Rp)</label>
                <input
                  id="menu-harga"
                  type="number"
                  value={harga}
                  onChange={(e) => setHarga(e.target.value)}
                  required
                  min="0"
                  placeholder="15000"
                  className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="menu-deskripsi" className="block text-sm font-medium text-foreground">Deskripsi</label>
                <textarea
                  id="menu-deskripsi"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  rows={3}
                  placeholder="Deskripsi singkat menu..."
                  className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              {/* Foto Upload (only for new menu) */}
              {!editingMenu && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Foto Menu</label>
                <input
                  type="file"
                  ref={menuFileInputRef}
                  onChange={(e) => {
                    if (e.target.files) {
                      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                  accept="image/jpeg,image/png,image/jpg"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => menuFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brown-50 border border-dashed border-brown-300 text-sm text-muted-foreground rounded-xl hover:bg-brown-100 hover:border-brown-400 transition-all duration-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  Pilih Foto
                </button>
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="relative group">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-border/60">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Bisa pilih beberapa foto sekaligus</p>
              </div>
              )}

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
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-brown-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? 'Menyimpan...' : editingMenu ? 'Simpan Perubahan' : 'Tambah Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Foto Management Modal ── */}
      {showFotoModal && fotoMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFotoModal(false)} />
          <div className="relative bg-card rounded-2xl shadow-xl border border-border/60 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-foreground mb-1">Foto Menu</h2>
            <p className="text-sm text-muted-foreground mb-5">{fotoMenu.nama}</p>

            {/* Upload */}
            <div className="mb-5">
              <input
                type="file"
                ref={fotoInputRef}
                onChange={handleUploadFoto}
                accept="image/jpeg,image/png,image/jpg"
                multiple
                className="hidden"
                id="menu-foto-input"
              />
              <button
                type="button"
                onClick={() => fotoInputRef.current?.click()}
                disabled={isUploadingFoto}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-medium text-sm rounded-xl hover:bg-brown-200 transition-all duration-200 disabled:opacity-50"
              >
                {isUploadingFoto ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mengupload...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload Foto
                  </>
                )}
              </button>
            </div>

            {/* Photo Grid */}
            {fotoMenu.foto?.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {fotoMenu.foto.map((foto: MenuFoto) => (
                  <div key={foto.id} className="relative group rounded-xl overflow-hidden border border-border/60">
                    <img src={foto.url} alt="" className="w-full aspect-square object-cover" />
                    <button
                      onClick={() => handleDeleteFoto(foto.id)}
                      className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                      title="Hapus foto"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">Belum ada foto untuk menu ini.</div>
            )}

            <div className="mt-5 pt-4 border-t border-border/60">
              <button
                type="button"
                onClick={() => setShowFotoModal(false)}
                className="w-full px-4 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-brown-200 transition-all duration-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
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
            <h3 className="text-lg font-bold text-foreground mb-1">Hapus Menu?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Menu <strong>&quot;{deleteTarget.nama}&quot;</strong> akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-brown-200 transition-all duration-200"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteMenu}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all duration-200"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
