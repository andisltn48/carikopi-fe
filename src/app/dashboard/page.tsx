'use client';

import { useAuth } from '@/context/AuthContext';
import { dashboardApi, type DashboardData } from '@/lib/api';
import { redirect } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export default function DashboardPage() {
  const { role, token, shopId, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!token || !shopId) return;
    
    setApiLoading(true);
    const result = await dashboardApi.getData(token, shopId);
    if (result.success && result.data) {
      setDashboardData(result.data);
    } else {
      setError(result.message || 'Gagal memuat data dashboard');
    }
    setApiLoading(false);
  }, [token, shopId]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !authLoading && isAuthenticated && role === 2) {
      fetchDashboard();
    }
  }, [isClient, authLoading, isAuthenticated, role, fetchDashboard]);

  if (!isClient || authLoading) return null;

  if (isAuthenticated && role !== 2) {
    redirect('/dashboard/menu');
  }

  if (apiLoading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Penjualan Hari Ini',
      value: `Rp ${dashboardData?.penjualan_hari_ini?.value.toLocaleString('id-ID') || '0'}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Jumlah Transaksi (Hari Ini)',
      value: `${dashboardData?.jumlah_transaksi_hari_ini?.value || '0'}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: 'Pendapatan (Bulan Ini)',
      value: `Rp ${dashboardData?.pendapatan_bulan_ini?.value.toLocaleString('id-ID') || '0'}`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: 'Produk Terlaris',
      value: dashboardData?.menu_terlaris?.name || '-',
      subValue: dashboardData?.menu_terlaris?.total ? `${dashboardData.menu_terlaris.total} Terjual` : '',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  const salesData = dashboardData?.grafik_penjualan || [];
  
  // Chart calculation logic
  const maxValue = Math.max(...(salesData.length > 0 ? salesData.map(d => d.value) : [100000]));
  const height = 200;
  const width = 600;
  const padding = 40;
  
  const points = salesData.map((d, i) => {
    const x = padding + (i * (width - 2 * padding) / Math.max(1, salesData.length - 1));
    const y = (height - padding) - (d.value / maxValue * (height - 2 * padding));
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = salesData.length > 0 ? `
    ${padding},${height - padding} 
    ${points} 
    ${width - padding},${height - padding}
  ` : '';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ringkasan Dashboard</h1>
          <p className="text-muted-foreground">Pantau performa tokomu secara real-time.</p>
        </div>
        <button 
          onClick={fetchDashboard}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
          title="Refresh Data"
        >
          <svg className={`w-5 h-5 ${apiLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m0 0H15" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              <h3 className="text-xl font-bold text-foreground mt-1">{stat.value}</h3>
              {stat.subValue && <p className="text-xs text-muted-foreground mt-1">{stat.subValue}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 p-6 bg-card border border-border rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground">Grafik Penjualan</h3>
              <p className="text-xs text-muted-foreground">Historis 7 hari terakhir</p>
            </div>
          </div>
          
          <div className="relative w-full overflow-hidden min-h-[220px]">
            <style jsx>{`
              @keyframes drawLine {
                from { stroke-dashoffset: 600; }
                to { stroke-dashoffset: 0; }
              }
              .chart-line {
                stroke-dasharray: 600;
                stroke-dashoffset: 600;
                animation: drawLine 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
              }
            `}</style>
            
            {salesData.length > 0 ? (
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary, #7c2d12)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="var(--color-primary, #7c2d12)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 1, 2, 3, 4].map((i) => {
                  const y = padding + (i * (height - 2 * padding) / 4);
                  return (
                    <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeOpacity="0.05" />
                  );
                })}

                <polygon points={areaPoints} fill="url(#chartGradient)" />

                <polyline
                  points={points}
                  fill="none"
                  stroke="var(--color-primary, #7c2d12)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="chart-line"
                />

                {salesData.map((d, i) => {
                  const x = padding + (i * (width - 2 * padding) / Math.max(1, salesData.length - 1));
                  const y = (height - padding) - (d.value / maxValue * (height - 2 * padding));
                  const isHovered = hoveredPoint === i;

                  return (
                    <g 
                      key={i} 
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      {isHovered && (
                        <g>
                          {/* Tooltip background */}
                          <rect 
                            x={x - 45} 
                            y={y - 45} 
                            width="90" 
                            height="35" 
                            rx="8" 
                            fill="var(--color-card, white)" 
                            className="shadow-xl"
                            stroke="var(--color-border)"
                          />
                          {/* Tooltip arrow */}
                          <path 
                            d={`M ${x-5} ${y-10} L ${x} ${y-5} L ${x+5} ${y-10} Z`} 
                            fill="var(--color-card, white)" 
                            stroke="var(--color-border)"
                          />
                          {/* Tooltip text */}
                          <text 
                            x={x} 
                            y={y - 23} 
                            textAnchor="middle" 
                            fontSize="11" 
                            fontWeight="bold"
                            className="fill-foreground"
                          >
                            Rp {d.value.toLocaleString('id-ID')}
                          </text>
                        </g>
                      )}
                      
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={isHovered ? "6" : "4"} 
                        fill="var(--color-card, white)" 
                        stroke="var(--color-primary, #7c2d12)" 
                        strokeWidth={isHovered ? "3" : "2"}
                        className="transition-all duration-200"
                      />
                      <text x={x} y={height - 5} textAnchor="middle" fontSize="10" className="fill-muted-foreground">{d.label}</text>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm italic">
                Data grafik belum tersedia
              </div>
            )}
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">Produk Terlaris</h3>
          <div className="space-y-4">
            {dashboardData?.list_menu_terlaris && dashboardData.list_menu_terlaris.length > 0 ? (
              dashboardData.list_menu_terlaris.map((product: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-2 hover:bg-secondary/30 rounded-xl transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl">
                    ☕
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.total} Terjual</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm italic">
                Belum ada data penjualan produk
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
