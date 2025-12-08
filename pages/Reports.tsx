import React, { useEffect, useState } from 'react';
import { FileText, FileSpreadsheet, Building2, List, ChevronDown, Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPayments } from '../services/payment';
import { Payment } from '../types/payment';
import Toast, { ToastType } from '../components/Toast';

export default function Reports() {
  const [allData, setAllData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPaymentTitle, setFilterPaymentTitle] = useState<string>('All');

  // Pagination & Sorting
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Payment; direction: 'asc' | 'desc' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // UI State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await getPayments(0, 10000);
      setAllData(result);
    } catch (err) {
      showToast('Failed to load payment data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: keyof Payment) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get unique payment titles for filter
  const uniquePaymentTitles = React.useMemo(() => {
    const titles = allData
      .map(item => item.payment_title)
      .filter((title): title is string => title != null && title !== '');
    return Array.from(new Set(titles)).sort();
  }, [allData]);

  const filteredData = React.useMemo(() => {
    let data = allData;

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(item =>
        (item.name?.toLowerCase().includes(lowerQuery)) ||
        (item.per_no?.toLowerCase().includes(lowerQuery)) ||
        (item.station?.toLowerCase().includes(lowerQuery)) ||
        (item.payment_title?.toLowerCase().includes(lowerQuery))
      );
    }

    // Filter by Payment Title
    if (filterPaymentTitle !== 'All') {
      data = data.filter(item => item.payment_title === filterPaymentTitle);
    }

    return data;
  }, [allData, searchQuery, filterPaymentTitle]);

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key] ?? '';
      const bValue = b[sortConfig.key] ?? '';
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleGenerateReport = (reportType: string) => {
    showToast(`Generating ${reportType} report...`, 'info');
    // TODO: Implement actual report generation logic
    setTimeout(() => {
      showToast(`${reportType} report generated successfully!`, 'success');
    }, 1500);
  };

  const renderSortIcon = (key: keyof Payment) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-4 h-4 text-gray-400 ml-1" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4 text-primary-600 ml-1" />
      : <ArrowDown className="w-4 h-4 text-primary-600 ml-1" />;
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-900">Payment Reports</h1>
        <p className="text-gray-500">Generate and view payment reports.</p>
      </div>

      {/* Report Generation Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => handleGenerateReport('Payment Details')}
          className="flex items-center justify-center gap-3 h-14 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-all"
        >
          <FileText className="w-5 h-5" />
          Payment Details
        </button>
        <button
          onClick={() => handleGenerateReport('Payment Summary')}
          className="flex items-center justify-center gap-3 h-14 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm transition-all"
        >
          <List className="w-5 h-5" />
          Payment Summary
        </button>
        <button
          onClick={() => handleGenerateReport('Payment Bank')}
          className="flex items-center justify-center gap-3 h-14 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 shadow-sm transition-all"
        >
          <Building2 className="w-5 h-5" />
          Payment Bank
        </button>
        <button
          onClick={() => handleGenerateReport('Payment Excel')}
          className="flex items-center justify-center gap-3 h-14 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow-sm transition-all"
        >
          <FileSpreadsheet className="w-5 h-5" />
          Payment Excel
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 h-12 rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <div className="relative min-w-[300px]">
            <select
              value={filterPaymentTitle}
              onChange={(e) => setFilterPaymentTitle(e.target.value)}
              className="w-full h-12 pl-3 pr-8 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 text-sm appearance-none bg-white shadow-sm"
            >
              <option value="All">All Payment Titles</option>
              {uniquePaymentTitles.map(title => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm outline-none bg-white"
            >
              {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
        </div>

        {loading && allData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th onClick={() => handleSort('per_no')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Per No {renderSortIcon('per_no')}</th>
                  <th onClick={() => handleSort('name')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Name {renderSortIcon('name')}</th>
                  <th onClick={() => handleSort('station')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Station {renderSortIcon('station')}</th>
                  <th onClick={() => handleSort('posting')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Posting {renderSortIcon('posting')}</th>
                  <th onClick={() => handleSort('transport')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Transport {renderSortIcon('transport')}</th>
                  <th onClick={() => handleSort('local_runs')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Local Runs {renderSortIcon('local_runs')}</th>
                  <th onClick={() => handleSort('netpay')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Net Pay {renderSortIcon('netpay')}</th>
                  <th onClick={() => handleSort('payment_title')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Payment Title {renderSortIcon('payment_title')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{row.per_no}</td>
                    <td className="px-6 py-4 text-gray-600">{row.name}</td>
                    <td className="px-6 py-4 text-gray-600">{row.station}</td>
                    <td className="px-6 py-4 text-gray-600">{row.posting}</td>
                    <td className="px-6 py-4 text-gray-600">{row.transport?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-600">{row.local_runs?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-600 font-semibold">{row.netpay?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-600">{row.payment_title}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginatedData.length === 0 && <div className="p-12 text-center text-gray-500">No payment records found.</div>}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-wrap gap-4 bg-gray-50">
          <div className="text-sm text-gray-500">Total Records: <span className="font-semibold text-gray-900">{sortedData.length}</span></div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50"><ChevronsLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm text-gray-600 px-2">Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{Math.max(1, totalPages)}</span></span>
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50"><ChevronsRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}