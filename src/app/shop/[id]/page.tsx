'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
  order_number: string;
  status: string;
  total_price: number;
  created_at: string;
  order_menus: OrderMenu[];
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

// ── Photo Lightbox ──

function Lightbox({ items, startIndex, onClose }: { items: { url: string; caption?: string }[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <img src={items[current].url} alt={items[current].caption || ''} className="w-full max-h-[80vh] object-contain rounded-2xl" />

        {/* Caption */}
        {items[current].caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12 rounded-b-2xl">
            <h3 className="text-white text-lg font-semibold text-center">{items[current].caption}</h3>
          </div>
        )}

        {/* Controls */}
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10 font-bold backdrop-blur-md">
          ✕
        </button>

        {items.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + items.length) % items.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all z-10 backdrop-blur-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % items.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all z-10 backdrop-blur-md"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <div className="absolute top-4 left-4 bg-black/50 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
              {current + 1} / {items.length}
            </div>
          </>
        )}
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
  const [lightboxItems, setLightboxItems] = useState<{ url: string; caption?: string }[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Cart & Order
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuSearchQuery, setMenuSearchQuery] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<'menu' | 'gallery'>('menu');
  const [galleries, setGalleries] = useState<GalleryItemPublic[]>([]);

  // Past Orders
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

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
      if (res.ok && data.status === 'OK') {
        alert('Pesanan berhasil dibuat!');
        setCart([]);
        setIsCartOpen(false);
        setCustomerForm({ name: '', phone: '' });
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
    
    // Safety Force-Stop Loading Spinner after 12 seconds
    const globalTimeout = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 12000);

    const initialize = async () => {
      setHasMounted(true);
      setIsLoading(true);
      setError('');

      try {
        // 1. Resolve Shop ID
        let id = '';
        
        // A. From Props (Handle potential Promise in Next.js 15)
        if (params) {
          if (typeof params.then === 'function') {
            const resolved = await params;
            id = resolved?.id;
          } else {
            id = params.id;
          }
        }

        // B. From Hook fallback
        if (!id && nextParams?.id) {
          id = nextParams.id as string;
        }

        // C. From URL hard fallback (Regex search for UUID or ID after /shop/)
        if (!id || id === '[id]') {
          if (typeof window !== 'undefined') {
            const match = window.location.pathname.match(/\/shop\/([^\s\/]+)/);
            if (match && match[1]) id = match[1];
          }
        }

        if (!id || id === '[id]') return; // Wait for next cycle

        // 2. Data Fetching helper
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

        // Fetch past orders in background
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

  const openLightbox = (items: { url: string; caption?: string }[], index: number) => {
    setLightboxItems(items);
    setLightboxIndex(index);
  };

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
        <Link href="/" className="text-primary font-medium hover:underline">← Kembali ke Beranda</Link>
      </div>
    );
  }

  const tags = shop.tags ? shop.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  const filteredMenus = menus.filter((menu) => 
    menu.nama.toLowerCase().includes(menuSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-brown-900/20">
              <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight">CariKopi</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Kembali
          </Link>
        </div>
      </nav>

      {/* Hero / Cover */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-brown-200 to-brown-300 overflow-hidden">
        {shop.fotoProfil ? (
          <img
            src={shop.fotoProfil.url}
            alt={shop.nama_toko}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-24 h-24 text-brown-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Shop Info */}
      <div className="max-w-5xl mx-auto px-6 -mt-16 relative z-10">
        <div className="bg-card rounded-2xl shadow-lg border border-border/60 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            {/* Profile Image */}
            <div className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-brown-100 border-4 border-card shadow-md overflow-hidden -mt-16 md:-mt-20">
              {shop.fotoProfil ? (
                <img src={shop.fotoProfil.url} alt={shop.nama_toko} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-brown-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{shop.nama_toko}</h1>

              <div className="flex items-start gap-2 text-muted-foreground text-sm">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span>{shop.alamat}{shop.city ? `, ${shop.city}` : ''}</span>
              </div>

              {shop.deskripsi && shop.deskripsi !== '-' && (
                <p className="text-muted-foreground text-sm leading-relaxed">{shop.deskripsi}</p>
              )}

              {/* Social Media Links */}
              <div className="flex flex-wrap gap-3 pt-1">
                {shop.whatsapp && (
                  <a href={shop.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-green-600 font-medium hover:underline">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                    WhatsApp
                  </a>
                )}
                {shop.instagram && (
                  <a href={shop.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-pink-600 font-medium hover:underline">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                    Instagram
                  </a>
                )}
                {shop.tiktok && (
                  <a href={shop.tiktok} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-black font-medium hover:underline">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg>
                    TikTok
                  </a>
                )}
                {shop.facebook && (
                  <a href={shop.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                    Facebook
                  </a>
                )}
                {shop.twitter && (
                  <a href={shop.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-400 font-medium hover:underline">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" /></svg>
                    Twitter
                  </a>
                )}
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-brown-100 text-brown-700 text-xs rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Map Link */}
              {shop.latitude && shop.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${shop.latitude},${shop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary font-medium hover:underline"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  Lihat di Google Maps
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="max-w-5xl mx-auto px-6 mt-8">
        <div className="flex border-b border-border/40 gap-8">
          <button
            onClick={() => setActiveTab('menu')}
            className={`pb-4 text-lg font-bold transition-all relative ${
              activeTab === 'menu' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Menu
            {activeTab === 'menu' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
            {menus.length > 0 && (
              <span className="ml-2 text-xs font-normal opacity-60">({menus.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`pb-4 text-lg font-bold transition-all relative ${
              activeTab === 'gallery' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Galeri
            {activeTab === 'gallery' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
            )}
            {galleries.length > 0 && (
              <span className="ml-2 text-xs font-normal opacity-60">({galleries.length})</span>
            )}
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'menu' ? (
          <div className="space-y-6">
            {/* Menu Search Field */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                placeholder="Cari nama menu..."
                value={menuSearchQuery}
                onChange={(e) => setMenuSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border/60 rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm text-foreground transition-all"
              />
            </div>

            {filteredMenus.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border/60 p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-brown-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-brown-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                    <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
                  </svg>
                </div>
                <p className="text-muted-foreground text-sm">
                  {menuSearchQuery ? 'Menu tidak ditemukan.' : 'Belum ada menu yang tersedia.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMenus.map((menu) => {
                  const thumb = menu.foto?.[0];
                  return (
                    <div key={menu.id} className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden hover:shadow-md transition-all duration-200">
                      {/* Image */}
                      <div
                        className={`aspect-[4/3] bg-brown-100 relative overflow-hidden ${thumb ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (menu.foto?.length > 0) {
                            openLightbox(menu.foto.map(f => ({ url: f.url, caption: menu.nama })), 0);
                          }
                        }}
                      >
                        {thumb ? (
                          <img src={thumb.url} alt={menu.nama} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-brown-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3 space-y-1.5">
                        <h3 className="font-semibold text-foreground text-sm line-clamp-1">{menu.nama}</h3>
                        <p className="text-primary font-bold text-base">{formatRupiah(menu.harga)}</p>
                        
                        <div className="pt-2">
                           <button
                             onClick={() => addToCart(menu)}
                             className="w-full py-1.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-xs flex items-center justify-center gap-1.5"
                           >
                             <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                             Tambah
                           </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Gallery Content */
          <div className="space-y-6">
            {galleries.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border/60 p-12 text-center">
                <p className="text-muted-foreground">Belum ada foto galeri.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {galleries.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() => openLightbox(galleries.map(g => ({ url: g.foto.url, caption: g.nama })), index)}
                    className="aspect-square bg-brown-100 rounded-2xl overflow-hidden border border-border/60 cursor-pointer group"
                  >
                    <img
                      src={item.foto.url}
                      alt={item.nama}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-8 bg-brown-950 text-brown-400 border-t border-brown-900 mt-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brown-800 flex items-center justify-center">
              <svg className="w-4 h-4 text-brown-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              </svg>
            </div>
            <span className="text-brown-300 font-semibold">CariKopi</span>
          </div>
          <p className="text-sm text-brown-500">© {new Date().getFullYear()} carikopi-api. All rights reserved.</p>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxItems && (
        <Lightbox items={lightboxItems} startIndex={lightboxIndex} onClose={() => setLightboxItems(null)} />
      )}

      {/* Floating Buttons: Cart & Past Orders */}
      {(totalItems > 0 || pastOrders.length > 0) && !isCartOpen && !isOrdersOpen && (
        <div className="fixed bottom-6 inset-x-0 mx-auto w-fit z-40 animate-in slide-in-from-bottom-5 flex items-center gap-3">
          {totalItems > 0 && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-3 px-6 py-3.5 bg-primary text-primary-foreground rounded-full font-medium shadow-2xl hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all w-fit"
            >
              <div className="relative">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                  {totalItems}
                </span>
              </div>
              <span>{formatRupiah(totalPrice)}</span>
            </button>
          )}

          {pastOrders.length > 0 && (
            <button
              onClick={() => setIsOrdersOpen(true)}
              className="flex items-center gap-2 px-6 py-3.5 bg-yellow-600 text-white rounded-full font-medium shadow-2xl hover:bg-yellow-700 hover:scale-105 active:scale-95 transition-all w-fit"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span>Pesanan Saya ({pastOrders.length})</span>
            </button>
          )}
        </div>
      )}

      {/* Past Orders Modal */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setIsOrdersOpen(false)}>
          <div className="w-full max-w-md h-full bg-background shadow-2xl flex flex-col animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-card text-foreground">
              <h2 className="text-lg font-bold">Riwayat Pesanan</h2>
              <button onClick={() => setIsOrdersOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 bg-muted/20">
              {isLoadingOrders ? (
                <div className="flex justify-center p-10">
                  <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                </div>
              ) : pastOrders.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">Belum ada riwayat pesanan.</p>
              ) : (
                pastOrders.map((order) => (
                  <div key={order.id} className="bg-card border border-border/60 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-border/60 bg-muted/30 flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                           {new Date(order.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="p-4 space-y-3">
                      <div className="space-y-2">
                        {order.order_menus?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                               <p className="text-sm font-medium text-foreground line-clamp-1">{item.quantity}x {item.menu?.nama}</p>
                               {item.notes && <p className="text-xs text-muted-foreground mt-0.5">Catatan: {item.notes}</p>}
                            </div>
                            <p className="text-sm font-medium shrink-0">{formatRupiah(item.total_price)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="px-4 py-3 bg-muted/10 flex justify-between items-center border-t border-border/60">
                       <span className="text-sm font-semibold text-foreground">Total</span>
                       <span className="text-sm font-bold text-primary">{formatRupiah(order.total_price)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}>
          <div className="w-full max-w-md h-full bg-background shadow-2xl flex flex-col animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-card text-foreground">
              <h2 className="text-lg font-bold">Keranjang Pesanan ({totalItems})</h2>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Cart Items */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.menu.id} className="flex gap-4 p-3 bg-muted/50 rounded-xl border border-border/40">
                    <div className="w-16 h-16 rounded-lg bg-border flex-shrink-0 overflow-hidden">
                      {item.menu.foto?.[0] ? (
                        <img src={item.menu.foto[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-brown-100 text-lg">☕</div>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm line-clamp-1 pr-2 text-foreground">{item.menu.nama}</h4>
                        <button onClick={() => removeFromCart(item.menu.id)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                      <p className="text-primary font-medium text-sm">{formatRupiah(item.menu.harga)}</p>
                      <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center border rounded-lg overflow-hidden bg-background w-fit">
                          <button
                            onClick={() => updateCartItem(item.menu.id, { quantity: Math.max(1, item.quantity - 1) })}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted font-medium text-foreground"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(item.menu.id, { quantity: item.quantity + 1 })}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted font-medium text-foreground"
                          >
                            +
                          </button>
                        </div>
                        <input 
                          type="text" 
                          placeholder="Catatan (opsional)..."
                          value={item.notes}
                          onChange={(e) => updateCartItem(item.menu.id, { notes: e.target.value })}
                          className="w-full text-xs px-2.5 py-2 rounded-md border border-border/60 bg-background focus:outline-none focus:border-primary/50 text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Form */}
              <div className="space-y-3 pt-4 border-t border-border/60 bg-transparent">
                <h3 className="font-semibold text-sm text-foreground">Informasi Pemesan</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Nama Pemesan</label>
                  <input 
                    type="text" 
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                    placeholder="Contoh: Budi"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">No. WhatsApp/HP</label>
                  <input 
                    type="tel" 
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-foreground bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border/60 bg-muted/30">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-foreground">Total Tagihan</span>
                <span className="text-xl font-bold text-primary">{formatRupiah(totalPrice)}</span>
              </div>
              <button 
                onClick={submitOrder}
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-all"
              >
                {isSubmitting ? (
                   <>
                     <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                     Memproses...
                   </>
                ) : (
                  'Konfirmasi Pesanan'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
