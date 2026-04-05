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

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

// ── Photo Lightbox ──

function Lightbox({ fotos, startIndex, onClose }: { fotos: FotoItem[]; startIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(startIndex);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <img src={fotos[current].url} alt="" className="w-full max-h-[80vh] object-contain rounded-2xl" />

        {/* Controls */}
        <button onClick={onClose} className="absolute top-3 right-3 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        {fotos.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((c) => (c - 1 + fotos.length) % fotos.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % fotos.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              {current + 1} / {fotos.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──

export default function ShopDetailPage() {
  const params = useParams();
  const shopId = params.id as string;

  const [shop, setShop] = useState<ShopDetail | null>(null);
  const [menus, setMenus] = useState<MenuItemPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Lightbox
  const [lightboxFotos, setLightboxFotos] = useState<FotoItem[] | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!shopId) return;

    const load = async () => {
      setIsLoading(true);
      try {
        // Fetch shop detail
        const shopRes = await fetch(`/api/public/coffeeshop/${shopId}/detail-shop`);
        const shopBody = await shopRes.json();

        if (shopBody.status === 'OK' && shopBody.data) {
          setShop(shopBody.data);
        } else {
          setError('Coffee shop tidak ditemukan.');
          setIsLoading(false);
          return;
        }

        // Fetch menu
        const menuRes = await fetch(`/api/public/coffeeshop/${shopId}/menu`);
        const menuBody = await menuRes.json();
        if (menuBody.status === 'OK' && menuBody.data) {
          setMenus(menuBody.data);
        }
      } catch {
        setError('Gagal memuat data coffee shop.');
      }
      setIsLoading(false);
    };

    load();
  }, [shopId]);

  const openLightbox = (fotos: FotoItem[], index: number) => {
    setLightboxFotos(fotos);
    setLightboxIndex(index);
  };

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

      {/* Menu Section */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            Menu
            {menus.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({menus.length} item)</span>
            )}
          </h2>
        </div>

        {menus.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brown-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-brown-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm">Belum ada menu yang tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {menus.map((menu) => {
              const thumb = menu.foto?.[0];
              return (
                <div key={menu.id} className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden hover:shadow-md transition-shadow duration-200">
                  {/* Image */}
                  <div
                    className={`aspect-[4/3] bg-brown-100 relative overflow-hidden ${thumb ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (menu.foto?.length > 0) openLightbox(menu.foto, 0);
                    }}
                  >
                    {thumb ? (
                      <img src={thumb.url} alt={menu.nama} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-brown-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                          <line x1="6" y1="2" x2="6" y2="4" /><line x1="10" y1="2" x2="10" y2="4" /><line x1="14" y1="2" x2="14" y2="4" />
                        </svg>
                      </div>
                    )}
                    {menu.foto?.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {menu.foto.length} foto
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-foreground text-base">{menu.nama}</h3>
                    <p className="text-primary font-bold text-lg">{formatRupiah(menu.harga)}</p>
                    {menu.deskripsi && (
                      <p className="text-muted-foreground text-sm line-clamp-2">{menu.deskripsi}</p>
                    )}

                    {/* Photo thumbnails */}
                    {menu.foto?.length > 1 && (
                      <div className="flex gap-1.5 pt-1">
                        {menu.foto.slice(0, 4).map((foto, i) => (
                          <button
                            key={foto.id}
                            onClick={() => openLightbox(menu.foto, i)}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-border/60 hover:opacity-80 transition-opacity relative"
                          >
                            <img src={foto.url} alt="" className="w-full h-full object-cover" />
                            {i === 3 && menu.foto.length > 4 && (
                              <div className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center font-medium">
                                +{menu.foto.length - 4}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
      {lightboxFotos && (
        <Lightbox fotos={lightboxFotos} startIndex={lightboxIndex} onClose={() => setLightboxFotos(null)} />
      )}
    </div>
  );
}
