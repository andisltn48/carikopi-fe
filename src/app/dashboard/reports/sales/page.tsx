'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface SaleRecord {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  items: string;
  total_price: number;
  payment_method: string;
  status: string;
}

const dummySales: SaleRecord[] = [
  { id: '1', order_number: 'ORD-1712826480001', created_at: '2026-04-11T10:30:00Z', customer_name: 'Andi', items: '1x Espresso, 1x Croissant', total_price: 45000, payment_method: 'QRIS', status: 'DONE' },
  { id: '2', order_number: 'ORD-1712826480002', created_at: '2026-04-11T11:15:00Z', customer_name: 'Budi', items: '2x Latte', total_price: 60000, payment_method: 'CASH', status: 'DONE' },
  { id: '3', order_number: 'ORD-1712826480003', created_at: '2026-04-11T13:45:00Z', customer_name: 'Citra', items: '1x Matcha Latte', total_price: 35000, payment_method: 'QRIS', status: 'DONE' },
  { id: '4', order_number: 'ORD-1712826480004', created_at: '2026-04-10T09:20:00Z', customer_name: 'Dedi', items: '1x Americano', total_price: 25000, payment_method: 'CASH', status: 'DONE' },
  { id: '5', order_number: 'ORD-1712826480005', created_at: '2026-04-10T15:10:00Z', customer_name: 'Eka', items: '1x Cappuccino, 1x Brownie', total_price: 55000, payment_method: 'QRIS', status: 'DONE' },
  { id: '6', order_number: 'ORD-1712826480006', created_at: '2026-04-09T14:30:00Z', customer_name: 'Fani', items: '1x Cold Brew', total_price: 30000, payment_method: 'QRIS', status: 'DONE' },
  { id: '7', order_number: 'ORD-1712826480007', created_at: '2026-04-09T16:00:00Z', customer_name: 'Gani', items: '2x Flat White', total_price: 70000, payment_method: 'CASH', status: 'DONE' },
  { id: '8', order_number: 'ORD-1712826480008', created_at: '2026-04-08T08:45:00Z', customer_name: 'Hani', items: '1x V60 Manual Brew', total_price: 38000, payment_method: 'QRIS', status: 'DONE' },
  { id: '9', order_number: 'ORD-1712826480009', created_at: '2026-04-08T12:00:00Z', customer_name: 'Indra', items: '1x Iced Chocolate', total_price: 32000, payment_method: 'CASH', status: 'DONE' },
  { id: '10', order_number: 'ORD-1712826480010', created_at: '2026-04-07T10:00:00Z', customer_name: 'Joko', items: '1x Espresso', total_price: 22000, payment_method: 'QRIS', status: 'DONE' },
];

export default function SalesReportPage() {
  const { role, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Filters and state
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof SaleRecord; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (authLoading) return null;
  if (isAuthenticated && role !== 2) {
    redirect('/dashboard/menu');
  }

  // Handle sorting
  const requestSort = (key: keyof SaleRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Process data (Filter -> Search -> Sort -> Paginate)
  const filteredData = useMemo(() => {
    let result = [...dummySales];

    // Filter by payment method
    if (paymentFilter) {
      result = result.filter(s => s.payment_method === paymentFilter);
    }

    // Filter by date range
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter(s => new Date(s.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      result = result.filter(s => new Date(s.created_at) <= end);
    }

    // Global Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.order_number.toLowerCase().includes(q) ||
        s.customer_name.toLowerCase().includes(q) ||
        s.items.toLowerCase().includes(q) ||
        s.payment_method.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [paymentFilter, startDate, endDate, searchQuery, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const getSortIcon = (key: keyof SaleRecord) => {
    if (sortConfig?.key !== key) return (
      <svg className="w-3 h-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 15l5 5 5-5M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
    );
    return sortConfig.direction === 'asc' ? (
      <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
    ) : (
      <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 14l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan Penjualan</h1>
          <p className="text-muted-foreground text-sm">Analisis data penjualan tokomu secara mendalam.</p>
        </div>
        <button 
          onClick={() => alert('Fitur Export Excel akan segera hadir!')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-900/10 hover:bg-green-700 transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Excel
        </button>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-card border border-border rounded-2xl shadow-sm">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground px-1">Cari Sesuatu</label>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Order no, nama..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground px-1">Metode Pembayaran</label>
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
          >
            <option value="">Semua Metode</option>
            <option value="QRIS">QRIS</option>
            <option value="CASH">Tunai (Cash)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground px-1">Dari Tanggal</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground px-1">Sampai Tanggal</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                {[
                  { key: 'order_number', label: 'Order No' },
                  { key: 'created_at', label: 'Waktu' },
                  { key: 'customer_name', label: 'Pelanggan' },
                  { key: 'items', label: 'Pesanan' },
                  { key: 'total_price', label: 'Total' },
                  { key: 'payment_method', label: 'Payment' },
                  { key: 'status', label: 'Status' },
                  { key: 'actions', label: 'Aksi' },
                ].map((col) => (
                  <th 
                    key={col.key} 
                    onClick={() => col.key !== 'actions' && requestSort(col.key as keyof SaleRecord)}
                    className={`px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider ${col.key === 'actions' ? 'text-right' : 'cursor-pointer hover:text-foreground transition-colors group'}`}
                  >
                    <div className={`flex items-center gap-2 ${col.key === 'actions' ? 'justify-end' : ''}`}>
                      {col.label}
                      {col.key !== 'actions' && getSortIcon(col.key as keyof SaleRecord)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((sale) => (
                <tr key={sale.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono font-medium">{sale.order_number}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {new Date(sale.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{sale.customer_name}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground max-w-[200px] truncate">{sale.items}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary whitespace-nowrap">Rp {sale.total_price.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sale.payment_method === 'QRIS' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                      {sale.payment_method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-green-100 text-green-700 border-green-200">
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/orders/${sale.id}`}
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
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground text-sm italic">
                    Tidak ada data penjualan yang cocok dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-secondary/10">
          <p className="text-xs text-muted-foreground">
            Menampilkan <span className="font-bold text-foreground">{paginatedData.length}</span> dari <span className="font-bold text-foreground">{filteredData.length}</span> data
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 transition-all font-bold text-xs"
            >
              Prev
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-primary text-white shadow-md shadow-brown-700/20' : 'hover:bg-secondary text-muted-foreground'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-1.5 rounded-lg border border-border hover:bg-secondary disabled:opacity-30 transition-all font-bold text-xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
