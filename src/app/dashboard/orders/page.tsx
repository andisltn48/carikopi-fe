'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { coffeeshopApi, orderApi, type Order, type Paging } from '@/lib/api';
import Link from 'next/link';

export default function OrdersPage() {
  const { token, shopId } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [paging, setPaging] = useState<Paging | null>(null);
  const pageSize = 10;

  const fetchOrders = useCallback(async (sid: string, query?: string, page: number = 0, status?: string) => {
    if (!token) return;
    setIsLoading(true);
    const result = await orderApi.getByShopId(token, sid, {
      orderNumber: query,
      status: status || undefined,
      page: page,
      size: pageSize
    });

    if (result.success && result.data) {
      setOrders(result.data);
      if (result.paging) {
        setPaging(result.paging);
      }
    } else {
      setError(result.message || 'Gagal memuat data pesanan.');
    }
    setIsLoading(false);
  }, [token]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(0); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!token && !shopId) {
      if (!shopId && !token) setIsLoading(false);
      return;
    }
  }, [token, shopId]);

  // Fetch orders when shopId, debouncedQuery, currentPage, or statusFilter changes
  useEffect(() => {
    if (shopId) {
      fetchOrders(shopId, debouncedQuery, currentPage, statusFilter);
    }
  }, [shopId, debouncedQuery, currentPage, statusFilter, fetchOrders]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ON PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  const getPaymentStatusColor = (status: string | null) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'UNPAID': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handlePageChange = (newPage: number) => {
    if (paging && newPage >= 0 && newPage < paging.totalPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading && !orders.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-muted-foreground text-sm">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daftar Pesanan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola dan pantau pesanan yang masuk ke toko Anda
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Cari Order Number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: 'Semua', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'On Progress', value: 'ON PROGRESS' },
          { label: 'Done', value: 'DONE' },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setStatusFilter(filter.value);
              setCurrentPage(0);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              statusFilter === filter.value
                ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-brown-700/20'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/50 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order No</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Queue</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pelanggan</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-foreground">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">
                        #{order.queue_number || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{order.name}</span>
                        <span className="text-xs text-muted-foreground">{order.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5 max-w-[200px]">
                        {order.order_menus.map((item, idx) => (
                          <div key={idx} className="text-xs text-foreground truncate">
                            {item.quantity}x {item.menu.nama}
                          </div>
                        ))}
                        {order.order_menus.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">+{order.order_menus.length - 2} menu lainnya</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-primary">
                        Rp {order.total_price.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      <span className={`px-2 py-0.5 rounded-full border ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status || 'UNPAID'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      <span className={`px-2 py-0.5 rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground text-xs font-bold rounded-lg transition-all duration-200"
                      >
                        Detail
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14"></path>
                          <path d="m12 5 7 7-7 7"></path>
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground text-sm italic">
                    {isLoading ? 'Sedang memuat...' : 'Tidak ada pesanan ditemukan.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {paging && paging.totalPage > 1 && (
          <div className="px-6 py-4 bg-secondary/20 border-t border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Halaman <span className="font-medium text-foreground">{paging.currentPage + 1}</span> dari <span className="font-medium text-foreground">{paging.totalPage}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0 || isLoading}
                className="p-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Halaman Sebelumnya"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, paging.totalPage) }, (_, i) => {
                  // Show pages around current page
                  let pageNum = i;
                  if (paging.totalPage > 5) {
                    if (currentPage > 2) {
                      pageNum = currentPage - 2 + i;
                      if (pageNum >= paging.totalPage) pageNum = paging.totalPage - 5 + i;
                    }
                  }
                  
                  if (pageNum < 0 || pageNum >= paging.totalPage) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-brown-700/20'
                          : 'hover:bg-secondary text-muted-foreground'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === paging.totalPage - 1 || isLoading}
                className="p-2 rounded-lg border border-border bg-card hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Halaman Selanjutnya"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
