'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── Types ──

interface CoffeeShopPublic {
  id: string;
  nama_toko: string;
  alamat: string;
  deskripsi: string;
  tags: string;
  latitude: number | null;
  longitude: number | null;
  fotoProfil: { id: string; filename: string; url: string } | null;
  distance?: number;
}

// ── Animated Counter ──

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const step = target / (duration / 16);
          let current = 0;
          const timer = setInterval(() => {
            current += step;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} className="tabular-nums" style={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
      {count}{suffix}
    </div>
  );
}

// ── Main Landing Page ──

export default function LandingPage() {
  const [nearbyShops, setNearbyShops] = useState<CoffeeShopPublic[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const shopsSectionRef = useRef<HTMLDivElement>(null);

  const searchNearby = (lat: number, lng: number, radius: number, query?: string) => {
    setIsLoadingNearby(true);
    setLocationError('');
    setHasSearched(true);

    let url = `/api/public/coffeeshop/nearby?lat=${lat}&lng=${lng}&radiusKm=${radius}`;
    if (query && query.trim()) {
      url += `&query=${encodeURIComponent(query.trim())}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((body) => {
        if (body.status === 'OK' && body.data) {
          setNearbyShops(body.data);
        } else {
          setNearbyShops([]);
        }
      })
      .catch(() => {
        setLocationError('Gagal memuat data coffee shop.');
      })
      .finally(() => {
        setIsLoadingNearby(false);
        setTimeout(() => {
          shopsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      });
  };

  const handleFindNearby = () => {
    if (!navigator.geolocation) {
      setLocationError('Browser tidak mendukung geolokasi.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserCoords(coords);
        searchNearby(coords.lat, coords.lng, searchRadius, searchQuery);
      },
      () => {
        setLocationError('Tidak bisa mengakses lokasi. Silakan izinkan akses lokasi di browser Anda.');
      }
    );
  };

  useEffect(() => {
    // Generate unique session for public users
    const sessionKey = 'unique_session';
    const expirationKey = 'unique_session_expiry';
    const now = new Date().getTime();
    
    const currentSession = localStorage.getItem(sessionKey);
    const expiryDate = localStorage.getItem(expirationKey);

    if (!currentSession || !expiryDate || now > parseInt(expiryDate, 10)) {
      const newSession = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const newExpiry = now + 24 * 60 * 60 * 1000; // 24 hours
      
      localStorage.setItem(sessionKey, newSession);
      localStorage.setItem(expirationKey, newExpiry.toString());
    }
  }, []);

  useEffect(() => {
    handleFindNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    if (userCoords) {
      searchNearby(userCoords.lat, userCoords.lng, searchRadius, searchQuery);
    } else {
      handleFindNearby();
    }
  };

  const formatDistance = (d?: number) => {
    if (d == null) return '';
    if (d < 1) return `${Math.round(d * 1000)} m`;
    return `${d.toFixed(1)} km`;
  };

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(55,53,47,0.09)' }}>
        <div className="max-w-[1080px] mx-auto px-6 h-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-lg">☕</span>
            <span className="font-semibold text-sm tracking-tight" style={{ color: '#37352f' }}>CariKopi</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm rounded-md transition-colors duration-100"
              style={{ color: '#37352f99' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(55,53,47,0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-100"
              style={{ color: '#fff', background: '#37352f' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#5a3e28')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#37352f')}
            >
              Daftar
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-[1080px] mx-auto px-6">
          <div className="max-w-[720px] mx-auto text-center">
            {/* Emoji icon */}
            <div className="mb-6">
              <span className="text-6xl md:text-7xl inline-block" style={{ lineHeight: 1 }}>☕</span>
            </div>

            <h1
              className="text-4xl md:text-5xl font-bold leading-tight mb-4"
              style={{ color: '#37352f', letterSpacing: '-0.03em' }}
            >
              Temukan Coffee Shop{' '}
              <span style={{ color: '#8B5E3C' }}>Terbaik</span>{' '}
              di Sekitarmu
            </h1>

            <p
              className="text-lg md:text-xl mb-10 leading-relaxed"
              style={{ color: '#37352f80', maxWidth: 520, margin: '0 auto' }}
            >
              Jelajahi berbagai coffee shop terdekat, lihat menu & harga, dan temukan tempat ngopi favorit barumu.
            </p>

            {/* Search CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleFindNearby}
                className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-medium rounded-lg transition-all duration-150 shadow-sm"
                style={{ background: '#37352f', color: '#fff' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#5a3e28')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#37352f')}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Cari Coffee Shop Terdekat
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: '#37352f80' }}>Radius</span>
                <select
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  className="px-2.5 py-2 text-sm rounded-lg border focus:outline-none"
                  style={{ borderColor: 'rgba(55,53,47,0.16)', color: '#37352f', background: '#fff' }}
                >
                  <option value={1}>1 km</option>
                  <option value={3}>3 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
              </div>
            </div>

            {locationError && (
              <p className="text-sm mt-4" style={{ color: '#e03e3e' }}>{locationError}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-[1080px] mx-auto px-6">
        <hr style={{ borderColor: 'rgba(55,53,47,0.09)' }} />
      </div>

      {/* ── Features Section ── */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1080px] mx-auto px-6">
          <div className="max-w-[720px] mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#37352f', letterSpacing: '-0.02em' }}>
              Kenapa CariKopi?
            </h2>
            <p className="text-base" style={{ color: '#37352f80' }}>
              Platform terlengkap untuk pengalaman kopi terbaikmu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            {[
              {
                emoji: '📍',
                title: 'Cari Berdasarkan Lokasi',
                desc: 'Temukan coffee shop terdekat dari posisi kamu secara real-time dengan GPS.',
              },
              {
                emoji: '📋',
                title: 'Lihat Menu & Harga',
                desc: 'Cek menu lengkap beserta harga sebelum kamu berkunjung. Transparan!',
              },
              {
                emoji: '📸',
                title: 'Foto & Detail Lengkap',
                desc: 'Lihat foto suasana, profil toko, dan informasi detail setiap coffee shop.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-lg p-6 transition-colors duration-100"
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(55,53,47,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div className="text-3xl mb-3">{feature.emoji}</div>
                <h3 className="text-[15px] font-semibold mb-1.5" style={{ color: '#37352f' }}>{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#37352f80' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-[1080px] mx-auto px-6">
        <hr style={{ borderColor: 'rgba(55,53,47,0.09)' }} />
      </div>

      {/* ── Nearby Results Section ── */}
      <section ref={shopsSectionRef} className="py-16 md:py-20">
        <div className="max-w-[1080px] mx-auto px-6">
          {isLoadingNearby && (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(55,53,47,0.16)', borderTopColor: '#8B5E3C' }} />
              <p className="text-sm" style={{ color: '#37352f80' }}>Mencari coffee shop di sekitarmu…</p>
            </div>
          )}

          {hasSearched && !isLoadingNearby && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#37352f', letterSpacing: '-0.02em' }}>
                  Coffee Shop Terdekat
                </h2>
                <p className="text-sm" style={{ color: '#37352f80' }}>
                  {nearbyShops.length > 0
                    ? `${nearbyShops.length} coffee shop ditemukan dalam radius ${searchRadius} km.`
                    : `Tidak ada hasil dalam radius ${searchRadius} km. Coba perbesar radius.`}
                </p>
              </div>

              {/* Search Bar — Notion callout style */}
              <div
                className="rounded-lg p-3 mb-8 flex flex-col sm:flex-row gap-2"
                style={{ background: '#f6f5f4' }}
              >
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#37352f80' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    placeholder="Cari nama coffee shop…"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-md border focus:outline-none focus:ring-2"
                    style={{ background: '#fff', borderColor: 'rgba(55,53,47,0.16)', color: '#37352f', ['--tw-ring-color' as string]: '#8B5E3C40' }}
                  />
                </div>
                <select
                  value={searchRadius}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    setSearchRadius(r);
                    if (userCoords) searchNearby(userCoords.lat, userCoords.lng, r, searchQuery);
                  }}
                  className="px-3 py-2 text-sm rounded-md border focus:outline-none"
                  style={{ background: '#fff', borderColor: 'rgba(55,53,47,0.16)', color: '#37352f' }}
                >
                  <option value={1}>1 km</option>
                  <option value={3}>3 km</option>
                  <option value={5}>5 km</option>
                  <option value={10}>10 km</option>
                  <option value={25}>25 km</option>
                  <option value={50}>50 km</option>
                </select>
                <button
                  onClick={handleSearch}
                  disabled={isLoadingNearby}
                  className="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-100 disabled:opacity-50"
                  style={{ background: '#37352f', color: '#fff' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#5a3e28')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#37352f')}
                >
                  Cari
                </button>
              </div>

              {/* Results — table-like Notion cards */}
              {nearbyShops.length > 0 && (
                <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(55,53,47,0.09)' }}>
                  {nearbyShops.map((shop, idx) => (
                    <Link
                      key={shop.id}
                      href={`/shop/${shop.id}`}
                      className="flex items-center gap-4 px-4 py-3.5 transition-colors duration-75"
                      style={{
                        borderBottom: idx < nearbyShops.length - 1 ? '1px solid rgba(55,53,47,0.09)' : 'none',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(55,53,47,0.03)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: '#f6f5f4' }}>
                        {shop.fotoProfil ? (
                          <img src={shop.fotoProfil.url} alt={shop.nama_toko} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">☕</div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium truncate" style={{ color: '#37352f' }}>
                            {shop.nama_toko}
                          </h3>
                          {shop.tags && (
                            <div className="hidden sm:flex gap-1">
                              {shop.tags.split(',').slice(0, 2).map((tag, i) => (
                                <span key={i} className="px-1.5 py-0.5 text-[11px] rounded" style={{ background: 'rgba(140,100,60,0.1)', color: '#8B5E3C' }}>
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs truncate mt-0.5" style={{ color: '#37352f80' }}>
                          {shop.alamat}
                        </p>
                      </div>

                      {/* Distance */}
                      {shop.distance != null && (
                        <div className="flex-shrink-0 text-right">
                          <span className="text-xs font-medium" style={{ color: '#8B5E3C' }}>
                            {formatDistance(shop.distance)}
                          </span>
                        </div>
                      )}

                      {/* Arrow */}
                      <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#37352f40' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Stats — only when no search yet */}
          {!hasSearched && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-[600px] mx-auto">
              {[
                { value: 100, suffix: '+', label: 'Coffee Shop' },
                { value: 500, suffix: '+', label: 'Menu Tersedia' },
                { value: 50, suffix: '+', label: 'Kota' },
                { value: 1000, suffix: '+', label: 'Pengguna' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold" style={{ color: '#8B5E3C' }}>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-xs mt-1" style={{ color: '#37352f80' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="max-w-[1080px] mx-auto px-6">
        <hr style={{ borderColor: 'rgba(55,53,47,0.09)' }} />
      </div>

      {/* ── CTA Section ── */}
      <section className="py-16 md:py-20">
        <div className="max-w-[1080px] mx-auto px-6">
          <div
            className="rounded-xl p-8 md:p-12"
            style={{ background: '#f6f5f4' }}
          >
            <div className="max-w-lg mx-auto text-center">
              <div className="text-4xl mb-4">🏪</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: '#37352f', letterSpacing: '-0.02em' }}>
                Punya Coffee Shop?
              </h2>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: '#37352f80' }}>
                Daftarkan coffee shop kamu dan jangkau lebih banyak pelanggan. Kelola profil, menu, dan foto — semuanya gratis.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors duration-100"
                  style={{ background: '#37352f', color: '#fff' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#5a3e28')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#37352f')}
                >
                  Daftar Sekarang
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-sm transition-colors duration-100"
                  style={{ color: '#37352f80' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#37352f')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#37352f80')}
                >
                  Sudah punya akun? Masuk →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-6 border-t" style={{ borderColor: 'rgba(55,53,47,0.09)' }}>
        <div className="max-w-[1080px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">☕</span>
            <span className="text-xs font-medium" style={{ color: '#37352f' }}>CariKopi</span>
          </div>
          <p className="text-xs" style={{ color: '#37352f80' }}>
            © {new Date().getFullYear()} CariKopi
          </p>
        </div>
      </footer>
    </div>
  );
}
