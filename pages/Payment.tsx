import React, { useEffect, useState } from 'react';
import { Search, Loader2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getPayments, deletePayment, deleteAllPayments } from '../services/payment';
import { Payment } from '../types/payment';
import Toast, { ToastType } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function PaymentPage() {
    const [allData, setAllData] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Sorting
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Payment; direction: 'asc' | 'desc' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

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

    const filteredData = React.useMemo(() => {
        let data = allData;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(item =>
                (item.name?.toLowerCase().includes(lowerQuery)) ||
                (item.per_no?.toLowerCase().includes(lowerQuery)) ||
                (item.station?.toLowerCase().includes(lowerQuery)) ||
                (item.payment_title?.toLowerCase().includes(lowerQuery))
            );
        }

        return data;
    }, [allData, searchQuery]);

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

    const handleDeleteClick = (payment: Payment) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Payment',
            message: `Are you sure you want to delete payment for ${payment.name}?`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deletePayment(payment.id);
                    showToast('Payment deleted successfully', 'success');
                    await fetchData();
                } catch (err: any) {
                    showToast(err.message || 'Failed to delete payment', 'error');
                }
            }
        });
    };

    const handleDeleteAll = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete All Payments',
            message: 'Are you sure you want to delete ALL payments? This action cannot be undone.',
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deleteAllPayments();
                    showToast('All payments deleted successfully', 'success');
                    await fetchData();
                } catch (err: any) {
                    showToast(err.message || 'Failed to delete all payments', 'error');
                }
            }
        });
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
            <ConfirmModal
                isOpen={!!confirmModal}
                title={confirmModal?.title || ''}
                message={confirmModal?.message || ''}
                onConfirm={() => confirmModal?.onConfirm()}
                onCancel={() => setConfirmModal(null)}
                isDestructive={true}
            />

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-gray-900">Payment Records</h1>
                <p className="text-gray-500">View and manage generated payment records.</p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, per no, station, title..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 h-12 rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                    />
                </div>

                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    <button
                        onClick={handleDeleteAll}
                        className="flex-1 sm:flex-none h-12 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                        <Trash2 className="w-5 h-5" />
                        Delete All
                    </button>
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
                                    <th onClick={() => handleSort('netpay')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Net Pay {renderSortIcon('netpay')}</th>
                                    <th onClick={() => handleSort('payment_title')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Payment Title {renderSortIcon('payment_title')}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-right">Action</th>
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
                                        <td className="px-6 py-4 text-gray-600 font-semibold">{row.netpay?.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.payment_title}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDeleteClick(row)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </td>
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
