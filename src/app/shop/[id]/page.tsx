'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { orderApi } from '@/lib/api';

// ── Types ──

interface FotoItem {
  id: string;
  filename: string;
  url: string;
}

interface ShopDetail {
  id: string;
  nama_toko: string;
  alamat: string;
  deskripsi: string;
  tags: string;
  latitude: number | null;
  longitude: number | null;
  fotoProfil: FotoItem | null;
  city?: string;
  instagram?: string;
  tiktok?: string;
  whatsapp?: string;
  facebook?: string;
  twitter?: string;
}

interface MenuItemPublic {
  id: string;
  nama: string;
  harga: number;
  deskripsi: string;
  foto: FotoItem[];
  category: string;
  isFavorite: boolean;
}

interface CartItem {
  menu: MenuItemPublic;
  quantity: number;
  notes: string;
}

interface OrderMenu {
  id: string;
  menu: {
    nama: string;
    harga: number;
  };
  quantity: number;
  total_price: number;
  notes: string;
}

interface PastOrder {
  id: string;
  name: string;
  phone: string;
  order_number: string;
  status: string;
  total_price: number;
  created_at: string;
  order_menus: OrderMenu[];
  queue_number: string | null;
  order_type: string | null;
  payment_status: string | null;
  payment_method: string | null;
  payment_url: string | null;
  qr_string: string | null;
  qr_id: string | null;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function getOrderStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'ON PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'COMPLETED':
    case 'DONE': return 'bg-green-100 text-green-700 border-green-200';
    case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-primary/10 text-primary border-primary/5';
  }
}

// ── Photo Lightbox ──

function Lightbox({ items, startIndex, onClose }: { items: { foto: FotoItem; title: string }[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-w-5xl w-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full">
          <img src={items[current].foto.url} alt={items[current].title} className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl" />
          
          {/* Controls */}
          <button onClick={onClose} className="absolute top-4 right-4 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>

          {items.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((c) => (c - 1 + items.length) % items.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % items.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </>
          )}
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{items[current].title}</h3>
          <div className="inline-block bg-white/10 backdrop-blur-md text-white/80 text-xs px-4 py-1.5 rounded-full border border-white/10">
            {current + 1} / {items.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function ShopDetailPage({ params }: { params: any }) {
  const nextParams = useParams();

  // Robust Shop ID detection for usage in all functions
  const shopId = (nextParams?.id as string) ||
    (typeof window !== 'undefined' ? window.location.pathname.match(/\/shop\/([^\s\/]+)/)?.[1] : '') ||
    '';
  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [menus, setMenus] = useState<MenuItemPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMounted, setHasMounted] = useState(false);

  // Lightbox
  const [lightboxItems, setLightboxItems] = useState<{ foto: FotoItem; title: string }[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Cart & Order
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });
  const [orderType, setOrderType] = useState<'dinein' | 'takeaway'>('dinein');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [activeMenuCategory, setActiveMenuCategory] = useState('Semua');

  // Tabs
  const [activeTab, setActiveTab] = useState<'menu' | 'gallery'>('menu');
  const [galleries, setGalleries] = useState<any[]>([]);

  // Past Orders
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [lastOrder, setLastOrder] = useState<PastOrder | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);

  const fetchPastOrders = async () => {
    const session = localStorage.getItem('unique_session');
    if (!session || !shopId) return;

    setIsLoadingOrders(true);
    try {
      const res = await fetch(`/api/public/orders/get-by-unique-session/${session}/${shopId}`);
      const data = await res.json();
      if (res.ok && data.code === 200 && data.data) {
        setPastOrders(data.data);
      }
    } catch (e) {
      console.error('Failed to fetch past orders', e);
    }
    setIsLoadingOrders(false);
  };

  const handleCheckStatus = async () => {
    if (!lastOrder) return;
    setIsCheckingStatus(true);
    try {
      const res = await orderApi.getByOrderNumberPublic(lastOrder.order_number);
      if (res.success && res.data?.payment_status === 'PAID') {
        setLastOrder(null);
        fetchPastOrders();
        setShowPaymentSuccessModal(true);
      }
    } catch (err) {
      console.error('Failed to check status:', err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + (item.quantity * item.menu.harga), 0);

  const addToCart = (menu: MenuItemPublic) => {
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
    if (cart.length === 0) return;

    setIsSubmitting(true);
    let session = localStorage.getItem('unique_session');
    if (!session) {
      session = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('unique_session', session);
      localStorage.setItem('unique_session_expiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
    }

    const payload = {
      name: customerForm.name,
      phone: customerForm.phone,
      total_price: totalPrice,
      shop_id: shopId,
      unique_session: session,
      order_type: orderType,
      order_menus: cart.map((item) => ({
        menu_id: item.menu.id,
        quantity: item.quantity,
        total_price: item.quantity * item.menu.harga,
        notes: item.notes
      }))
    };

    try {
      const res = await fetch('/api/public/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.status === 'OK' && data.data) {
        setLastOrder(data.data);
        setCart([]);
        setIsCartOpen(false);
        setCustomerForm({ name: '', phone: '' });
        setOrderType('dinein');
        fetchPastOrders();
      } else {
        alert('Gagal membuat pesanan: ' + (data.message || 'Error tidak diketahui'));
      }
    } catch {
      alert('Terjadi kesalahan jaringan saat membuat pesanan.');
    }
    setIsSubmitting(false);
  };

  // Unified Loading and ID Detection Effect
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const globalTimeout = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 12000);

    const initialize = async () => {
      setHasMounted(true);
      setIsLoading(true);
      setError('');

      try {
        let id = '';
        if (params) {
          if (typeof params.then === 'function') {
            const resolved = await params;
            id = resolved?.id;
          } else {
            id = params.id;
          }
        }

        if (!id && nextParams?.id) {
          id = nextParams.id as string;
        }

        if (!id || id === '[id]') {
          if (typeof window !== 'undefined') {
            const match = window.location.pathname.match(/\/shop\/([^\s\/]+)/);
            if (match && match[1]) id = match[1];
          }
        }

        if (!id || id === '[id]') return;

        const fetchData = async (url: string) => {
          try {
            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) return null;
            return await res.json();
          } catch { return null; }
        };

        const [shopData, menuData, galleryData] = await Promise.all([
          fetchData(`/api/public/coffeeshop/${id}/detail-shop`),
          fetchData(`/api/public/coffeeshop/${id}/menu`),
          fetchData(`/api/public/galleries/${id}`)
        ]);

        if (!isMounted) return;

        if (shopData && shopData.status === 'OK') {
          setShop(shopData.data);
        } else {
          setError('Toko tidak ditemukan.');
        }

        if (menuData && menuData.data) setMenus(menuData.data);
        if (galleryData && galleryData.data) setGalleries(galleryData.data);

        const session = localStorage.getItem('unique_session');
        if (session) {
          fetchData(`/api/public/orders/get-by-unique-session/${session}/${id}`).then(data => {
            if (isMounted && data?.data) setPastOrders(data.data);
          });
        }

      } catch (err: any) {
        if (isMounted && err.name !== 'AbortError') {
          console.error('Loading failed:', err);
          setError('Gagal memuat data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          clearTimeout(globalTimeout);
        }
      }
    };

    initialize();
    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(globalTimeout);
    };
  }, [params, nextParams]);



  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-brown-200 border-t-primary animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-brown-200 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Memuat detail coffee shop...</p>
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-2xl bg-brown-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-brown-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">{error || 'Toko tidak ditemukan'}</h2>
        <Link href="/" className="text-primary font-medium">← Kembali ke Beranda</Link>
      </div>
    );
  }

  const tags = shop.tags ? shop.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const filteredMenus = menus.filter((menu) => {
    const matchesSearch = menu.nama.toLowerCase().includes(menuSearchQuery.toLowerCase());
    const normalizedCategory = activeMenuCategory === 'Non Kopi' ? 'non-kopi' : activeMenuCategory.toLowerCase();
    const matchesCategory = activeMenuCategory === 'Semua' || menu.category === normalizedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-primary/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg text-white shadow-md">
              <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" x2="6" y1="2" y2="4"></line><line x1="10" x2="10" y1="2" y2="4"></line><line x1="14" x2="14" y1="2" y2="4"></line></svg>
            </div>
            <span className="text-xl font-bold tracking-tighter text-primary">CariKopi</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-primary">
            ← Kembali
          </Link>
        </div>
      </nav>

      <section className="relative h-[65vh] md:h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        {shop.fotoProfil ? (
          <img
            src={shop.fotoProfil.url}
            alt={shop.nama_toko}
            className="absolute inset-0 w-full h-full object-cover brightness-50"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-brown-300 to-brown-400 flex items-center justify-center">
            <svg className="w-24 h-24 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
            </svg>
          </div>
        )}
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="inline-block px-4 py-1 rounded-full bg-primary/20 text-white backdrop-blur-md mb-6 border border-white/20 text-xs md:text-sm tracking-widest uppercase">
            Est. Artisanal Experience
          </div>
          <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
            {shop.nama_toko}
          </h1>
          {shop.deskripsi && shop.deskripsi !== '-' && (
            <p className="text-base md:text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed line-clamp-3">
              {shop.deskripsi}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => {
                const menuSection = document.getElementById('menu-section');
                menuSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-3.5 bg-primary text-white font-bold rounded-xl shadow-xl"
            >
              Order Online
            </button>
          </div>
        </div>
      </section>

      <section className="relative -mt-32 md:-mt-24 z-20 px-4 max-w-5xl mx-auto mb-16">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col md:flex-row gap-8 items-center border border-primary/5">
          <div className="w-40 h-40 rounded-xl overflow-hidden shadow-lg flex-shrink-0 border-4 border-white -mt-20 md:mt-0">
            {shop.fotoProfil ? (
              <img src={shop.fotoProfil.url} alt={shop.nama_toko} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                <svg className="w-16 h-16 text-primary/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-grow text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-on-surface-variant mb-2">
              <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span className="text-sm font-medium">{shop.alamat}{shop.city ? `, ${shop.city}` : ''}</span>
            </div>
            <h2 className="text-3xl font-bold text-primary mb-4">{shop.nama_toko}</h2>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                {tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-surface-container-low text-primary rounded-full text-xs font-bold uppercase">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap justify-center md:justify-start gap-6">
              {shop.latitude && shop.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary font-bold"
                >
                  Lihat di Google Maps
                  <svg fill="none" height="16" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                </a>
              )}
              
              <div className="flex items-center gap-4">
                {shop.whatsapp && (
                  <a href={shop.whatsapp} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  </a>
                )}
                {shop.instagram && (
                  <a href={shop.instagram} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant">
                     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-8 mb-8" id="menu-section">
        <div className="flex border-b border-primary/5 gap-12">
          <button
            onClick={() => setActiveTab('menu')}
            className={`pb-4 text-lg font-bold relative ${activeTab === 'menu' ? 'text-primary' : 'text-on-surface-variant'
              }`}
          >
            Pilihan Menu
            {activeTab === 'menu' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`pb-4 text-lg font-bold relative ${activeTab === 'gallery' ? 'text-primary' : 'text-on-surface-variant'
              }`}
          >
            Galeri Foto
            {activeTab === 'gallery' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'menu' ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-surface-container-low/30 p-4 rounded-2xl border border-primary/5">
              <div className="relative flex-grow w-full md:max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                <input
                  type="text"
                  placeholder="Cari nama menu..."
                  value={menuSearchQuery}
                  onChange={(e) => setMenuSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border/60 rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-foreground transition-all"
                />
              </div>

              {/* Category Sub-tabs */}
              <div className="flex flex-wrap gap-2">
                {['Semua', 'Kopi', 'Non Kopi', 'Makanan'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveMenuCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${activeMenuCategory === cat
                        ? 'bg-primary text-white'
                        : 'bg-white text-primary border border-primary/10'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredMenus.length === 0 ? (
              <div className="bg-white rounded-2xl border border-primary/5 p-12 text-center shadow-sm">
                <p className="text-on-surface-variant font-medium">Menu tidak ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-8">
                {filteredMenus.map((menu) => {
                  const thumb = menu.foto?.[0];
                  return (
                    <div key={menu.id} className="bg-white p-3 md:p-4 rounded-2xl border border-primary/5 shadow-sm flex flex-col h-full">
                      <div
                        className={`relative h-28 md:h-56 rounded-xl overflow-hidden mb-3 md:mb-4 flex-shrink-0 ${thumb ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (menu.foto?.length > 0) {
                            setLightboxItems(menu.foto.map(f => ({ foto: f, title: menu.nama })));
                            setLightboxIndex(0);
                          }
                        }}
                      >
                        {thumb ? (
                          <img src={thumb.url} alt={menu.nama} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                            <svg className="w-12 h-12 text-primary/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                            </svg>
                          </div>
                        )}
                        {menu.isFavorite && (
                          <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                            <span className="hidden sm:inline">FAVORITE</span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-primary shadow-sm tracking-wider uppercase">
                          {menu.category}
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row justify-between items-start mb-2 px-1 gap-1">
                        <h3 className="text-sm md:text-lg font-bold line-clamp-2 md:line-clamp-1 h-10 md:h-auto">{menu.nama}</h3>
                        <span className="text-sm md:text-base font-bold text-primary shrink-0">{formatRupiah(menu.harga)}</span>
                      </div>
                      <button
                        onClick={() => addToCart(menu)}
                        className="w-full py-2.5 md:py-3.5 bg-primary/10 text-primary font-bold rounded-xl shadow-sm mt-auto flex items-center justify-center gap-1.5 text-xs md:text-base"
                      >
                        <span className="md:hidden flex items-center gap-1">
                          <span className="text-lg">+</span>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                          </svg>
                        </span>
                        <span className="hidden md:inline">Tambah ke Keranjang</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {galleries.map((item, index) => (
              <div
                key={item.id}
                onClick={() => {
                  setLightboxItems(galleries.map(g => ({ foto: g.foto, title: g.nama })));
                  setLightboxIndex(index);
                }}
                className="aspect-square bg-brown-100 rounded-2xl overflow-hidden border border-border/60 cursor-pointer group"
              >
                <img
                  src={item.foto.url}
                  alt={item.nama}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Buttons */}
      {(totalItems > 0 || (pastOrders && pastOrders.length > 0)) && !isCartOpen && !isOrdersOpen && (
        <div className="fixed bottom-6 inset-x-0 mx-auto w-fit z-40 flex items-center gap-3 px-4">
          {totalItems > 0 && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-3.5 bg-primary text-white rounded-full font-bold shadow-2xl"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="hidden md:inline">Keranjang</span>
              <span className="bg-white text-primary px-2 py-0.5 rounded-full text-xs md:text-sm">
                {totalItems}
              </span>
              <span className="hidden md:inline">- {formatRupiah(totalPrice)}</span>
            </button>
          )}
          {pastOrders && pastOrders.length > 0 && (
            <button
              onClick={() => setIsOrdersOpen(true)}
              className="flex items-center gap-2 px-4 md:px-6 py-3.5 bg-yellow-600 text-white rounded-full font-bold shadow-2xl text-sm md:text-base"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="hidden md:inline">Riwayat</span>
            </button>
          )}
        </div>
      )}

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-primary/5">
            <div className="p-6 border-b border-primary/5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">Pesanan Anda</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 rounded-full text-primary">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-primary/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                  </div>
                  <p className="text-on-surface-variant font-medium">Keranjang masih kosong</p>
                  <button onClick={() => setIsCartOpen(false)} className="mt-4 text-primary font-bold">Mulai Belanja</button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.menu.id} className="flex gap-4 p-4 rounded-xl border border-primary/5 bg-surface-container-low/50">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shrink-0 shadow-sm">
                          {item.menu.foto?.[0] ? (
                            <img src={item.menu.foto[0].url} alt={item.menu.nama} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                               <svg className="w-8 h-8 text-primary/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-primary line-clamp-1">{item.menu.nama}</h4>
                            <button onClick={() => removeFromCart(item.menu.id)} className="text-on-surface-variant">
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                            </button>
                          </div>
                          <p className="text-sm font-bold text-primary mb-3">{formatRupiah(item.menu.harga)}</p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateCartItem(item.menu.id, { quantity: Math.max(1, item.quantity - 1) })}
                              className="w-8 h-8 rounded-lg border border-primary/10 flex items-center justify-center bg-white text-primary font-bold transition-all shadow-sm"
                            >
                              -
                            </button>
                            <span className="font-bold text-primary w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartItem(item.menu.id, { quantity: item.quantity + 1 })}
                              className="w-8 h-8 rounded-lg border border-primary/10 flex items-center justify-center bg-white text-primary font-bold transition-all shadow-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer Information Form */}
                  <div className="pt-6 border-t border-primary/5 space-y-4">
                    <h3 className="font-bold text-primary">Informasi Pengiriman</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-primary/60 uppercase tracking-widest block mb-2">Nama Penerima</label>
                        <input
                          type="text"
                          value={customerForm.name}
                          onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                          className="w-full px-4 py-3 bg-surface-container-low border border-primary/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary font-medium"
                          placeholder="Masukkan nama Anda..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-primary/60 uppercase tracking-widest block mb-2">No. WhatsApp/HP</label>
                        <input
                          type="tel"
                          value={customerForm.phone}
                          onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-surface-container-low border border-primary/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary font-medium"
                          placeholder="Contoh: 081234567..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-primary/60 uppercase tracking-widest block mb-2">Tipe Order</label>
                        <select
                          value={orderType}
                          onChange={(e) => setOrderType(e.target.value as 'dinein' | 'takeaway')}
                          className="w-full px-4 py-3 bg-surface-container-low border border-primary/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-primary font-medium appearance-none cursor-pointer"
                        >
                          <option value="dinein">Dine-in</option>
                          <option value="takeaway">Take-away</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-8 border-t border-primary/5 bg-surface-container-low/30 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-medium text-lg">Total Bayar</span>
                <span className="text-3xl font-bold text-primary">{formatRupiah(totalPrice)}</span>
              </div>
              <button
                disabled={isSubmitting || cart.length === 0}
                onClick={submitOrder}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                ) : (
                  'Konfirmasi & Pesan Sekarang'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Past Orders Sidebar */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setIsOrdersOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-primary/5">
            <div className="p-6 border-b border-primary/5 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">Riwayat Pesanan</h2>
              <button onClick={() => setIsOrdersOpen(false)} className="p-2 rounded-full text-primary">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingOrders ? (
                <div className="flex justify-center py-20">
                  <div className="w-10 h-10 border-4 border-primary/10 border-t-primary animate-spin rounded-full" />
                </div>
              ) : pastOrders.length === 0 ? (
                <div className="text-center py-20">
                   <div className="w-20 h-20 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-primary/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  </div>
                  <p className="text-on-surface-variant font-medium">Belum ada riwayat pesanan</p>
                </div>
              ) : (
                pastOrders.map((order) => (
                  <div key={order.id} className="p-5 rounded-2xl border border-primary/5 bg-surface-container-low/50 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">PESANAN #{order.queue_number || '-'}</p>
                        <p className="text-sm font-medium text-on-surface-variant">
                          {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-[11px] font-mono text-on-surface-variant/70 mt-0.5">{order.order_number}</p>
                      </div>
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase border ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-primary/5">
                      {order.order_menus?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-on-surface-variant font-medium">
                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded mr-2">{item.quantity}x</span>
                            {item.menu?.nama}
                          </span>
                          <span className="text-primary font-bold">{formatRupiah(item.total_price)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-primary/5">
                      <span className="font-bold text-primary">Total Bayar</span>
                      <span className="text-xl font-bold text-primary">{formatRupiah(order.total_price)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxItems && (
        <Lightbox items={lightboxItems} startIndex={lightboxIndex} onClose={() => setLightboxItems(null)} />
      )}

      {/* Order Success Modal */}
      {lastOrder && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setLastOrder(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-primary/5 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="m22 4-10 10-3-3" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-primary">Pesanan Berhasil!</h2>
              {lastOrder.queue_number && (
                <p className="text-2xl font-black text-primary mt-1">PESANAN #{lastOrder.queue_number}</p>
              )}
              <p className="text-xs text-on-surface-variant font-mono mt-1">#{lastOrder.order_number}</p>
            </div>

            {/* QRIS Display */}
            {lastOrder.qr_string && lastOrder.payment_status === 'UNPAID' && (
              <div className="mb-6 p-4 bg-white border-2 border-primary/10 rounded-2xl flex flex-col items-center justify-center shadow-inner">
                <p className="text-[10px] font-bold text-primary mb-2 uppercase tracking-widest">Scan QRIS untuk Membayar</p>
                <div className="bg-white p-2 rounded-lg shadow-sm border border-primary/5">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(lastOrder.qr_string)}`}
                    alt="QRIS Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-[9px] text-on-surface-variant mt-2 text-center leading-tight">
                  Berlaku untuk semua aplikasi pembayaran (Bank, OVO, GoPay, Dana, dll)
                </p>
              </div>
            )}

            {/* Order Info */}
            <div className="bg-surface-container-low/50 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Pelanggan</span>
                <span className="font-semibold text-primary">{lastOrder.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">No. HP</span>
                <span className="font-semibold text-primary">{lastOrder.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Tipe Order</span>
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
                <span className="text-on-surface-variant">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  lastOrder.status === 'DONE' ? 'bg-green-50 text-green-700 border-green-200'
                    : lastOrder.status === 'ON PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                }`}>
                  {lastOrder.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Pembayaran</span>
                <span className="font-semibold text-primary uppercase">{lastOrder.payment_method || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Status Bayar</span>
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
            <div className="border border-primary/5 rounded-xl overflow-hidden mb-4">
              <div className="px-4 py-2.5 bg-surface-container-low/30 border-b border-primary/5">
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Rincian Menu</h3>
              </div>
              <div className="divide-y divide-primary/5">
                {lastOrder.order_menus.map((item, idx) => (
                  <div key={idx} className="px-4 py-3 flex justify-between items-center text-sm">
                    <div>
                      <span className="font-semibold text-primary">{item.menu?.nama}</span>
                      <span className="text-on-surface-variant ml-2">{item.quantity}x {formatRupiah(item.menu?.harga || 0)}</span>
                    </div>
                    <span className="font-bold text-primary">{formatRupiah(item.total_price)}</span>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 bg-surface-container-low/20 border-t border-primary/5 flex justify-between items-center">
                <span className="font-bold text-primary">Total</span>
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
                onClick={handleCheckStatus}
                disabled={isCheckingStatus}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md disabled:bg-blue-300 flex items-center justify-center gap-2"
              >
                {isCheckingStatus ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengecek...
                  </>
                ) : (
                  'Cek Status Pembayaran'
                )}
              </button>

              <button
                onClick={() => setLastOrder(null)}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Success Confirmation Modal */}
      {showPaymentSuccessModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowPaymentSuccessModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl border border-primary/10 w-full max-w-sm p-8 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6 shadow-sm border-4 border-white">
              <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary mb-3">Pembayaran Berhasil!</h2>
            <p className="text-on-surface-variant leading-relaxed mb-8">
              Terima kasih! Pembayaran Anda telah kami terima. Silakan tunggu pesanan Anda diproses.
            </p>
            <button
              onClick={() => setShowPaymentSuccessModal(false)}
              className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg hover:bg-primary-dark transition-all active:scale-[0.98]"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-primary py-20 mt-20">
        <div className="max-w-5xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-white">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <div className="bg-white p-2 rounded-lg text-primary shadow-lg">
                  <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M17 8h1a4 4 0 1 1 0 8h-1"></path><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path><line x1="6" x2="6" y1="2" y2="4"></line><line x1="10" x2="10" y1="2" y2="4"></line><line x1="14" x2="14" y1="2" y2="4"></line></svg>
                </div>
                <span className="text-2xl font-bold tracking-tighter">CariKopi</span>
              </div>
              <p className="text-white/70 max-w-sm leading-relaxed">
                Platform kurasi coffee shop terbaik di Indonesia. Menemukan ruang kerja, tempat kumpul, dan kopi berkualitas hanya dalam satu klik.
              </p>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-lg font-bold">Layanan Kami</h4>
              <ul className="space-y-4 text-white/70 text-sm">
                <li><Link href="/" className="">Cari Kedai Terdekat</Link></li>
                <li><button onClick={() => setIsCartOpen(true)} className="">Pesan Online</button></li>
                <li><Link href="#" className="">Daftarkan Toko</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-bold">Tentang Kami</h4>
              <p className="text-white/70 text-sm leading-relaxed">
                © 2026 CariKopi Indonesia. Dibuat dengan cinta untuk pecinta kopi Nusantara.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
