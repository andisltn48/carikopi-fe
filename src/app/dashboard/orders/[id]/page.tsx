'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { orderApi, type Order } from '@/lib/api';
import Link from 'next/link';

export default function OrderDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!token || !id) return;

    const fetchOrderDetail = async () => {
      setIsLoading(true);
      const result = await orderApi.getByOrderId(token, id as string);
      if (result.success && result.data) {
        setOrder(result.data);
      } else {
        setError(result.message || 'Gagal memuat detail pesanan.');
      }
      setIsLoading(false);
    };

    fetchOrderDetail();
  }, [token, id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!token || !id || !order) return;
    
    setIsUpdatingStatus(true);
    setError('');
    setSuccessMsg('');

    const result = await orderApi.updateStatus(token, id as string, newStatus);
    
    if (result.success) {
      // Manual update of status locally since the API returns a success string, not the order object
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      setSuccessMsg(`Status pesanan berhasil diubah menjadi ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } else {
      setError(result.message || 'Gagal mengubah status pesanan.');
    }
    
    setIsUpdatingStatus(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'ON PROGRESS': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DONE': 
      case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-muted-foreground text-sm">Memuat detail pesanan...</p>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="max-w-2xl mx-auto py-10 text-center">
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl inline-block">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2 className="text-lg font-bold text-red-800 mb-2">Terjadi Kesalahan</h2>
          <p className="text-red-600 mb-6">{error || 'Data pesanan tidak ditemukan.'}</p>
          <Link
            href="/dashboard/orders"
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
          >
            Kembali ke Daftar Pesanan
          </Link>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl border border-border bg-card hover:bg-secondary transition-all"
            title="Kembali"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Detail Pesanan
              <span className="text-sm font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
                #{order.order_number}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Dipesan pada {new Date(order.created_at).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={order.status}
              onChange={(e) => handleUpdateStatus(e.target.value)}
              disabled={isUpdatingStatus}
              className={`appearance-none pl-4 pr-10 py-2 rounded-full border text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer disabled:opacity-50 ${getStatusColor(order.status)}`}
            >
              <option value="PENDING">PENDING</option>
              <option value="ON PROGRESS">ON PROGRESS</option>
              <option value="DONE">DONE</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {isUpdatingStatus ? (
                <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Message alerts */}
      {successMsg && (
        <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m22 4-10 10-3-3" />
          </svg>
          {successMsg}
        </div>
      )}
      
      {error && order && (
         <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
          <svg className="w-5 h-5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-secondary/20">
              <h2 className="font-semibold text-foreground">Rincian Menu</h2>
            </div>
            <div className="divide-y divide-border">
              {order.order_menus.map((item, idx) => (
                <div key={idx} className="p-6 flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-brown-100 border border-brown-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.menu.foto && item.menu.foto.length > 0 ? (
                      <img src={item.menu.foto[0].url} alt={item.menu.nama} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-brown-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-foreground">{item.menu.nama}</h3>
                      <span className="text-sm font-bold text-foreground">
                        Rp {item.total_price.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                       <span>{item.quantity} x Rp {item.menu.harga.toLocaleString('id-ID')}</span>
                    </div>
                    {item.notes && (
                      <div className="bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-xs italic border border-amber-100">
                        \" {item.notes} \"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-secondary/10 border-t border-border space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal ({order.order_menus.length} item)</span>
                <span>Rp {order.total_price.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border/40">
                <span>Total Pembayaran</span>
                <span className="text-primary font-black">
                  Rp {order.total_price.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Info */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl shadow-sm border border-border/60 p-6 space-y-6">
            <div>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Informasi Pelanggan</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nama Pemesan</p>
                    <p className="font-bold text-foreground">{order.name}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor Telepon</p>
                    <p className="font-bold text-foreground">{order.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-border/60" />

            <div>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Status Pembayaran</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="font-medium text-foreground">{order.payment_method || '-'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    order.payment_status === 'PAID' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {order.payment_status || 'UNPAID'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <button
             onClick={() => window.print()}
             className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-foreground font-bold rounded-2xl hover:bg-brown-200 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v8H6z" />
            </svg>
            Cetak Pesanan
          </button>
        </div>
      </div>
    </div>
  );
}
