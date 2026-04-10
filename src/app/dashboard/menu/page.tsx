'use client';

import { useEffect, useState, useRef, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  coffeeshopApi,
  menuApi,
  orderApi,
  type MenuItem,
  type MenuSubmitRequest,
  type MenuFoto,
  type Order,
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
  onAddToCart,
}: {
  menu: MenuItem;
  onEdit: () => void;
  onFoto: () => void;
  onDelete: () => void;
  onAddToCart: () => void;
}) {
  const thumb = menu.foto?.[0];

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden relative">
      {/* Favorite Badge */}
      {menu.isFavorite && (
        <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          FAVORITE
        </div>
      )}
      {/* Category Badge */}
      {menu.category && (
        <div className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-primary shadow-sm tracking-wider uppercase">
          {menu.category}
        </div>
      )}
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
      <div className="p-3 space-y-1.5">
        <h3 className="font-semibold text-foreground text-sm truncate">{menu.nama}</h3>
        <p className="text-primary font-bold text-base">{formatRupiah(menu.harga)}</p>
        <p className="text-muted-foreground text-xs line-clamp-1">{menu.deskripsi || '-'}</p>
 
        {/* Actions */}
        <div className="flex gap-1.5 pt-1.5">
          <button
            onClick={onEdit}
            title="Edit"
            className="flex-1 flex items-center justify-center p-2 bg-secondary text-secondary-foreground rounded-xl"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={onFoto}
            title="Kelola Foto"
            className="flex-1 flex items-center justify-center p-2 bg-secondary text-secondary-foreground rounded-xl"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            title="Hapus"
            className="p-2 text-red-600 bg-red-50 rounded-xl"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
          <button
            onClick={onAddToCart}
            title="Tambah ke Pesanan"
            className="p-2 text-green-700 bg-green-50 rounded-xl"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
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
  const [category, setCategory] = useState('kopi');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const menuFileInputRef = useRef<HTMLInputElement>(null);

  // Photo state
  const [showFotoModal, setShowFotoModal] = useState(false);
  const [fotoMenu, setFotoMenu] = useState<MenuItem | null>(null);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [activeMenuCategory, setActiveMenuCategory] = useState('Semua');
  const fotoInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Cart & Order (POS) ──
  interface CartItem { menu: MenuItem; quantity: number; notes: string; }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });
  const [orderType, setOrderType] = useState<'dinein' | 'takeaway'>('dinein');
  const [orderStatus, setOrderStatus] = useState('PENDING');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState('');
  const [lastOrder, setLastOrder] = useState<Order | null>(null);

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
    setCategory('kopi');
    setIsFavorite(false);
    setSelectedFiles([]);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (menu: MenuItem) => {
    setEditingMenu(menu);
    setNama(menu.nama);
    setHarga(menu.harga.toString());
    setDeskripsi(menu.deskripsi || '');
    setCategory(menu.category || 'kopi');
    setIsFavorite(menu.isFavorite || false);
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
      category,
      isFavorite,
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

  // ── Cart & Order Logic ──

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cart.reduce((acc, item) => acc + (item.quantity * item.menu.harga), 0);

  const addToCart = (menu: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menu.id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.menu.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { menu, quantity: 1, notes: '' }];
    });
  };

  const updateCartItem = (menuId: string, updates: Partial<CartItem>) => {
    setCart((prev) =>
      prev.map((item) =>
        item.menu.id === menuId ? { ...item, ...updates } : item
      )
    );
  };

  const removeFromCart = (menuId: string) => {
    setCart((prev) => prev.filter((item) => item.menu.id !== menuId));
  };

  const submitOrder = async () => {
    if (!customerForm.name || !customerForm.phone) {
      alert('Nama dan Nomor HP wajib diisi!');
      return;
    }
    if (cart.length === 0 || !shopId) return;

    setIsSubmittingOrder(true);
    const session = 'admin-' + Math.random().toString(36).substring(2) + Date.now().toString(36);

    const payload = {
      name: customerForm.name,
      phone: customerForm.phone,
      total_price: totalCartPrice,
      shop_id: shopId,
      unique_session: session,
      order_type: orderType,
      status: orderStatus,
      payment_method: paymentMethod,
      order_menus: cart.map((item) => ({
        menu_id: item.menu.id,
        quantity: item.quantity,
        total_price: item.quantity * item.menu.harga,
        notes: item.notes
      }))
    };

    try {
      const result = await orderApi.createOrder(token!, payload);
      if (result.success && result.data) {
        setLastOrder(result.data);
        setCart([]);
        setIsCartOpen(false);
        setCustomerForm({ name: '', phone: '' });
        setOrderType('dinein');
        setOrderStatus('PENDING');
        setPaymentMethod('cash');
      } else {
        alert('Gagal membuat pesanan: ' + (result.message || 'Error tidak diketahui'));
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat membuat pesanan.');
    }
    setIsSubmittingOrder(false);
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
            Buat profil toko terlebih dahulu di halaman <a href="/dashboard/profile" className="text-primary font-medium">Profil Toko</a> sebelum menambahkan menu.
          </p>
        </div>
      </div>
    );
  }

  const filteredMenus = menus.filter((m) => {
    const matchesSearch = m.nama.toLowerCase().includes(menuSearchQuery.toLowerCase());
    const normalizedCategory = activeMenuCategory === 'Non Kopi' ? 'non-kopi' : activeMenuCategory.toLowerCase();
    const matchesCategory = activeMenuCategory === 'Semua' || m.category === normalizedCategory;
    return matchesSearch && matchesCategory;
  });

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
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl shadow-md shadow-brown-900/10"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Tambah Menu
        </button>
      </div>

      {/* Search & Categories */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-card p-4 rounded-2xl border border-border/60">
        <div className="relative flex-grow w-full md:max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            type="text"
            placeholder="Cari nama menu..."
            value={menuSearchQuery}
            onChange={(e) => setMenuSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-input rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm text-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['Semua', 'Kopi', 'Non Kopi', 'Makanan'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveMenuCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${activeMenuCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-primary border border-input'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Alert */}
      {(success || orderSuccess) && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2" role="status">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>{success || orderSuccess}</span>
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
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-xl"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tambah Menu Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMenus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              onEdit={() => openEditModal(menu)}
              onFoto={() => openFotoModal(menu)}
              onDelete={() => setDeleteTarget(menu)}
              onAddToCart={() => addToCart(menu)}
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
                  className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-brown-50 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-brown-100 border border-input rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="menu-category" className="block text-sm font-medium text-foreground">Kategori</label>
                  <select
                    id="menu-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-brown-100 border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  >
                    <option value="kopi">Kopi</option>
                    <option value="non-kopi">Non Kopi</option>
                    <option value="makanan">Makanan</option>
                  </select>
                </div>

                <div className="space-y-2 flex flex-col justify-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-brown-50 border border-input rounded-xl">
                    <input
                      type="checkbox"
                      checked={isFavorite}
                      onChange={(e) => setIsFavorite(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Favorit</span>
                  </label>
                </div>
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brown-50 border border-dashed border-brown-300 text-sm text-muted-foreground rounded-xl"
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
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
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
                  className="flex-1 px-4 py-3 bg-secondary text-secondary-foreground font-medium rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground font-medium text-sm rounded-xl disabled:opacity-50"
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
                      className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center"
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
                className="w-full px-4 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl"
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
                className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteMenu}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Cart Button ── */}
      {totalCartItems > 0 && !isCartOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-primary text-white rounded-full font-bold shadow-2xl shadow-brown-900/30"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Buat Pesanan
            <span className="bg-white text-primary px-2 py-0.5 rounded-full text-xs font-bold">
              {totalCartItems}
            </span>
            <span className="hidden md:inline">- {formatRupiah(totalCartPrice)}</span>
          </button>
        </div>
      )}

      {/* ── Cart / POS Sidebar ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-card h-full shadow-2xl flex flex-col border-l border-border/60">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Buat Pesanan</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-brown-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-brown-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                  </div>
                  <p className="text-muted-foreground text-sm">Keranjang kosong</p>
                  <button onClick={() => setIsCartOpen(false)} className="mt-3 text-primary font-semibold text-sm">Pilih Menu</button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.menu.id} className="flex gap-3 p-3 rounded-xl border border-border/60 bg-secondary/20">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-brown-100 shrink-0">
                          {item.menu.foto?.[0] ? (
                            <img src={item.menu.foto[0].url} alt={item.menu.nama} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-brown-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-semibold text-foreground text-sm truncate">{item.menu.nama}</h4>
                            <button onClick={() => removeFromCart(item.menu.id)} className="text-muted-foreground hover:text-red-500 ml-1 shrink-0">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                          </div>
                          <p className="text-xs text-primary font-semibold mb-2">{formatRupiah(item.menu.harga)}</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartItem(item.menu.id, { quantity: Math.max(1, item.quantity - 1) })}
                              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center bg-card text-foreground font-bold text-xs"
                            >-</button>
                            <span className="font-bold text-foreground text-sm w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartItem(item.menu.id, { quantity: item.quantity + 1 })}
                              className="w-7 h-7 rounded-lg border border-border flex items-center justify-center bg-card text-foreground font-bold text-xs"
                            >+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Form */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <h3 className="font-semibold text-foreground text-sm">Informasi Pelanggan</h3>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">Nama</label>
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Nama pelanggan..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">No. HP</label>
                      <input
                        type="tel"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                        className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">Tipe Order</label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as 'dinein' | 'takeaway')}
                        className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                      >
                        <option value="dinein">Dine-in</option>
                        <option value="takeaway">Take-away</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">Status Pesanan</label>
                      <select
                        value={orderStatus}
                        onChange={(e) => setOrderStatus(e.target.value)}
                        className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="ON PROGRESS">ON PROGRESS</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-widest block mb-1.5">Metode Pembayaran</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2.5 bg-background border border-input rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
                      >
                        <option value="qris">QRIS</option>
                        <option value="cash">CASH</option>
                        <option value="transfer">TRANSFER</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-border bg-secondary/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatRupiah(totalCartPrice)}</span>
                </div>
                <button
                  disabled={isSubmittingOrder || cart.length === 0}
                  onClick={submitOrder}
                  className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmittingOrder ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses...
                    </>
                  ) : (
                    'Konfirmasi Pesanan'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Order Success Modal ── */}
      {lastOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setLastOrder(null)} />
          <div className="relative bg-card rounded-2xl shadow-xl border border-border/60 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m22 4-10 10-3-3" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground">Pesanan Berhasil!</h2>
              {lastOrder.queue_number && (
                <p className="text-2xl font-black text-primary mt-1">PESANAN #{lastOrder.queue_number}</p>
              )}
              <p className="text-xs text-muted-foreground font-mono mt-1">#{lastOrder.order_number}</p>
            </div>

            {/* Order Info */}
            <div className="bg-secondary/30 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pelanggan</span>
                <span className="font-semibold text-foreground">{lastOrder.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">No. HP</span>
                <span className="font-semibold text-foreground">{lastOrder.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tipe Order</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  lastOrder.order_type === 'dinein'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : lastOrder.order_type === 'takeaway'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {lastOrder.order_type === 'dinein' ? 'DINE-IN' : lastOrder.order_type === 'takeaway' ? 'TAKE-AWAY' : '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  lastOrder.status === 'DONE' ? 'bg-green-50 text-green-700 border-green-200'
                    : lastOrder.status === 'ON PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  {lastOrder.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pembayaran</span>
                <span className="font-semibold text-foreground uppercase">{lastOrder.payment_method || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status Bayar</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  lastOrder.payment_status === 'PAID'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {lastOrder.payment_status || 'UNPAID'}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="border border-border/60 rounded-xl overflow-hidden mb-4">
              <div className="px-4 py-2.5 bg-secondary/20 border-b border-border/60">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Rincian Menu</h3>
              </div>
              <div className="divide-y divide-border/40">
                {lastOrder.order_menus.map((item, idx) => (
                  <div key={idx} className="px-4 py-3 flex justify-between items-center text-sm">
                    <div>
                      <span className="font-semibold text-foreground">{item.menu.nama}</span>
                      <span className="text-muted-foreground ml-2">{item.quantity}x {formatRupiah(item.menu.harga)}</span>
                    </div>
                    <span className="font-bold text-foreground">{formatRupiah(item.total_price)}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-secondary/10 border-t border-border/60 flex justify-between items-center">
                <span className="font-bold text-foreground">Total</span>
                <span className="text-xl font-black text-primary">{formatRupiah(lastOrder.total_price)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {lastOrder.payment_url && lastOrder.payment_status === 'UNPAID' && (
                <a
                  href={lastOrder.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <rect x="7" y="7" width="3" height="3"/>
                    <rect x="14" y="7" width="3" height="3"/>
                    <rect x="7" y="14" width="3" height="3"/>
                    <path d="M14 14h3v3h-3z"/>
                  </svg>
                  BAYAR SEKARANG (QRIS / Bank)
                </a>
              )}
              
              <button
                onClick={() => setLastOrder(null)}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
