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

    let url = `/api/public/coffeeshop/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
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
    <div className="min-h-screen bg-background text-on-surface font-['Plus_Jakarta_Sans']">

      {/* ── TopNavBar ── */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-primary/5 shadow-sm h-16 flex items-center">
        <div className="flex justify-between items-center w-full px-6 md:px-12 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-primary tracking-tighter">
            CariKopi
          </Link>
          <div className="hidden md:flex items-center gap-8">
            
          </div>
          <button 
            onClick={handleFindNearby}
            className="hidden md:block bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-semibold text-sm premium-gradient"
          >
            Find Nearby
          </button>
        </div>
      </nav>

      <main className="pt-24">
        {/* ── Hero Section ── */}
        <section className="relative lg:px-8 py-8 lg:py-28 max-w-7xl mx-auto overflow-hidden">
          {/* Mobile Hero (Stacked with Background Image) */}
          <div className="lg:hidden relative h-[420px] mx-6 rounded-3xl overflow-hidden mb-8 bg-surface-container-high shadow-lg">
            <img 
              alt="Artisan coffee" 
              className="absolute inset-0 w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDb0YnRbUkkwm0Cdwviy7hq1EV7uAHZychZ6YoJZOLgazEU2Q3efgFzVfNF-mI7L2tmj5yJGODANqfA0LKqyk4FA4_im8IcmlYvA-X-bbgHmMMDFoEptISLkPfo-jKDH6I7-zqFaAhggQcB2n4tYGo1oFmA8kmfahSTmgn1AGPadVKx5eIbc3M96BOb2NnQs8vuaxnBM1Ln0JhOtmgrSTh1d_Anxh04Lfqvam4SBBHwt4lK3xdPSk92OwfWp3Qb_bGcqr_-oOwVHg" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-6">
                Find Your <br />Perfect Brew
              </h1>
              <div className="flex flex-col gap-3">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">search</span>
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="w-full h-14 pl-12 pr-4 rounded-xl border-none bg-white text-on-surface placeholder:text-on-surface-variant/60 shadow-lg" 
                    placeholder="Search coffee shops..." 
                  />
                </div>
                <button 
                  onClick={handleFindNearby}
                  className="w-full h-14 bg-white text-primary rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <span className="material-symbols-outlined">near_me</span>
                  Cari Sekitarku
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Hero (Current Side-by-Side) */}
          <div className="hidden lg:grid grid-cols-2 gap-12 items-center">
            <div className="z-10">
              <h1 className="text-5xl lg:text-7xl font-extrabold text-primary leading-[1.1] tracking-tighter mb-8">
                Temukan <br />Kopi Terbaikmu
              </h1>
              <p className="text-on-surface-variant text-lg lg:text-xl mb-12 max-w-lg leading-relaxed">
                Jelajahi coffee shop artisanal yang sesuai dengan mood-mu. Mulai dari tempat kerja yang tenang hingga spot estetik akhir pekan.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-xl">
                <div className="flex-grow relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40">search</span>
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="w-full pl-12 pr-4 py-5 rounded-xl bg-white border-2 border-primary/5 focus:ring-1 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 shadow-sm"
                    placeholder="Cari berdasarkan nama coffee shop" 
                  />
                </div>
                <button 
                  onClick={handleFindNearby}
                  className="flex items-center justify-center gap-2 px-8 py-5 bg-white text-primary border-2 border-primary/5 rounded-xl font-bold shadow-sm"
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>near_me</span>
                  Cari Sekitarku
                </button>
              </div>

              {locationError && (
                <p className="text-sm mt-4 text-destructive font-medium">{locationError}</p>
              )}
            </div>

            <div className="relative h-[500px]">
              <div className="absolute inset-0 bg-secondary-container/20 rounded-[2rem] rotate-3 -z-10"></div>
              <img 
                className="w-full h-full object-cover rounded-xl ambient-shadow -rotate-2" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDb0YnRbUkkwm0Cdwviy7hq1EV7uAHZychZ6YoJZOLgazEU2Q3efgFzVfNF-mI7L2tmj5yJGODANqfA0LKqyk4FA4_im8IcmlYvA-X-bbgHmMMDFoEptISLkPfo-jKDH6I7-zqFaAhggQcB2n4tYGo1oFmA8kmfahSTmgn1AGPadVKx5eIbc3M96BOb2NnQs8vuaxnBM1Ln0JhOtmgrSTh1d_Anxh04Lfqvam4SBBHwt4lK3xdPSk92OwfWp3Qb_bGcqr_-oOwVHg" 
                alt="Premium Coffee"
              />
            </div>
          </div>
        </section>

        {/* ── Nearby Coffee Shops Section ── */}
        <section ref={shopsSectionRef} className="py-24 px-6 md:px-8 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
            <div>
              <span className="text-sm uppercase tracking-[0.1em] text-tertiary font-bold mb-4 block">Locally Loved</span>
              <h2 className="text-3xl md:text-4xl font-bold text-on-surface tracking-tight">Nearby Roasts</h2>
              
              {hasSearched && !isLoadingNearby && (
                <p className="text-on-surface-variant mt-2 text-sm md:text-base">
                  {nearbyShops.length > 0
                    ? `${nearbyShops.length} coffee shop ditemukan dalam radius ${searchRadius} km.`
                    : 'Tidak ada hasil. Coba perbesar radius.'}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between w-full md:w-auto gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-on-surface-variant">Radius:</span>
                <select 
                  value={searchRadius}
                  onChange={(e) => {
                    const r = Number(e.target.value);
                    setSearchRadius(r);
                    if (userCoords) searchNearby(userCoords.lat, userCoords.lng, r, searchQuery);
                  }}
                  className="bg-surface-container-low border-none rounded-lg text-sm font-bold focus:ring-1 focus:ring-primary/20 px-3 py-2"
                >
                  {[1, 3, 5, 10, 25, 50].map(r => (
                    <option key={r} value={r}>{r} km</option>
                  ))}
                </select>
              </div>
              <button className="text-primary font-bold flex items-center gap-2 text-sm">
                See All<span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </div>

          {isLoadingNearby ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-primary font-medium">Mencari roaster terbaik di sekitarmu...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-12">
              {nearbyShops.length > 0 ? (
                nearbyShops.map((shop, idx) => (
                  <Link 
                    key={shop.id}
                    href={`/shop/${shop.id}`}
                    className={`flex flex-col gap-4 md:gap-6 ${idx % 2 === 1 && !isLoadingNearby ? 'lg:mt-12' : ''}`}
                  >
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/5] md:aspect-[4/5] bg-surface-container shadow-sm">
                      {shop.fotoProfil ? (
                        <img className="w-full h-full object-cover" src={shop.fotoProfil.url} alt={shop.nama_toko} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl md:text-6xl opacity-20">☕</div>
                      )}
                      
                    </div>
                    
                    <div className="flex flex-col gap-1 md:gap-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-base md:text-2xl font-bold text-primary underline-offset-4 decoration-2 decoration-primary/30 leading-tight">{shop.nama_toko}</h3>
                      </div>
                      
                      {shop.tags && (
                        <div className="flex flex-wrap gap-1.5 md:gap-2">
                          {shop.tags.split(',').slice(0, 2).map((tag, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded-sm text-[8px] md:text-[10px] font-bold uppercase tracking-tight ${i === 0 ? 'bg-surface-variant text-on-surface-variant' : 'bg-tertiary/10 text-tertiary'}`}>
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-on-surface-variant/70 text-[10px] md:text-sm font-medium mt-1 md:mt-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] md:text-[18px]">location_on</span>
                        {formatDistance(shop.distance)}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                !isLoadingNearby && hasSearched && (
                  <div className="col-span-full py-20 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant">
                    <p className="text-on-surface-variant font-medium">Tidak ada coffee shop ditemukan. Coba perbesar radius pencarian.</p>
                  </div>
                )
              )}
            </div>
          )}

          {!hasSearched && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto py-12">
              {[
                { value: 100, suffix: '+', label: 'Coffee Shop' },
                { value: 500, suffix: '+', label: 'Menu Tersedia' },
                { value: 50, suffix: '+', label: 'Kota' },
                { value: 1000, suffix: '+', label: 'Pengguna' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold text-primary mb-1">
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── How it Works Section ── */}
        <section className="bg-surface-container-low/50 py-24 px-6 md:px-8">
          <div className="max-w-7xl mx-auto md:px-8 bg-surface-container-low md:bg-transparent rounded-[2rem] p-8 md:p-0">
            <div className="text-center mb-12 md:mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-primary tracking-tight mb-4">The Perfect Ritual</h2>
              <p className="text-on-surface-variant max-w-lg mx-auto text-sm md:text-base">Beri tahu kami di mana kamu berada, dan kami akan mencarikan panggangan terbaik di sekitarmu.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-10 md:gap-16 relative">
              {[
                { icon: 'map', title: 'Setel Lokasi', desc: 'Beri tahu kami di mana kamu berada untuk menemukan pemanggang di sekitarmu.', color: 'bg-secondary-container text-on-secondary-container' },
                { icon: 'psychology', title: 'Pilih Vibe', desc: 'Filter berdasarkan pencahayaan, kecepatan Wi-Fi, jenis tempat duduk, atau asal kopi.', color: 'bg-secondary-container text-on-secondary-container' },
                { icon: 'coffee', title: 'Nikmati Seduhan', desc: 'Kunjungi tempat pilihanmu dan nikmati kopi buatan barista yang sempurna.', color: 'bg-secondary-container text-on-secondary-container' },
              ].map((step, i) => (
                <div key={i} className="flex flex-row md:flex-col items-center md:text-center gap-6 md:gap-0">
                  <div className={`w-14 h-14 md:w-20 md:h-20 shrink-0 rounded-2xl md:rounded-full ${step.color} flex items-center justify-center mb-0 md:mb-8 ambient-shadow`}>
                    <span className="material-symbols-outlined text-2xl md:text-4xl">{step.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-lg md:text-xl font-bold mb-2 md:mb-4 text-primary leading-none md:leading-normal">{step.title}</h4>
                    <p className="text-on-surface-variant/80 leading-relaxed text-xs md:text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Partner Section ── */}
        <section className="py-24 px-8 max-w-7xl mx-auto">
          <div className="bg-primary rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden premium-gradient shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="text-secondary-container font-bold tracking-[0.2em] uppercase text-xs mb-6 block">Business</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 leading-tight">Punya Coffee Shop Sendiri?</h2>
              <p className="text-white/80 text-lg mb-12 leading-relaxed">
                Daftarkan toko Anda dan jangkau komunitas pecinta kopi terbesar. Kelola menu, terima pesanan, dan bangun brand Anda bersama kami.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register" className="w-full sm:w-auto px-10 py-5 bg-white text-primary rounded-xl font-bold text-lg shadow-lg">
                  Daftar Sekarang
                </Link>
                <Link href="/login" className="text-white/70 font-medium underline underline-offset-8">
                  Sudah punya akun? Masuk
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full bg-surface-container-low font-['Plus_Jakarta_Sans']">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-12 py-16 max-w-7xl mx-auto gap-8">
          <div className="flex flex-col gap-4 items-center md:items-start">
            <div className="text-2xl font-bold text-primary tracking-tighter">CariKopi</div>
            <p className="text-on-surface-variant/70 text-sm leading-relaxed text-center md:text-left">
              © {new Date().getFullYear()} CariKopi. Brewed with care.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="#" className="text-on-surface-variant/70 underline decoration-primary/30 decoration-2 underline-offset-8 text-sm font-medium">Privacy Policy</Link>
            <Link href="#" className="text-on-surface-variant/70 underline decoration-primary/30 decoration-2 underline-offset-8 text-sm font-medium">Terms of Service</Link>
            <Link href="#" className="text-on-surface-variant/70 underline decoration-primary/30 decoration-2 underline-offset-8 text-sm font-medium">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
