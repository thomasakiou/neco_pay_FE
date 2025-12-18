import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Upload, Trash2, Edit, Loader2, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ChevronsLeft, ChevronsRight, ChevronLeft } from 'lucide-react';
import { getBanks, createBank, uploadBanks, updateBank, deleteBank } from '../services/banks';
import { Bank, CreateBankDTO } from '../types/banks';
import BankModal from '../components/BankModal';
import Toast, { ToastType } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function Banks() {
    const [allData, setAllData] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Pagination & Sorting
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Bank; direction: 'asc' | 'desc' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [filterActive, setFilterActive] = useState<string>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBank, setEditingBank] = useState<Bank | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const result = await getBanks(0, 10000);
            setAllData(result);
        } catch (err) {
            showToast('Failed to load banks data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            await uploadBanks(file);
            await fetchData();
            showToast('Banks imported successfully!', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to import banks', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSort = (key: keyof Bank) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Filter & Sort
    const filteredData = React.useMemo(() => {
        let data = allData;

        // Search
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(item =>
                (item.name?.toLowerCase().includes(lowerQuery)) ||
                (item.code?.toLowerCase().includes(lowerQuery)) ||
                (item.branch?.toLowerCase().includes(lowerQuery))
            );
        }

        // Filter Active
        if (filterActive !== 'All') {
            const isActive = filterActive === 'Active';
            data = data.filter(item => item.active === isActive);
        }

        return data;
    }, [allData, searchQuery, filterActive]);

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

    const openAddModal = () => {
        setEditingBank(null);
        setIsModalOpen(true);
    };

    const openEditModal = (bank: Bank) => {
        setEditingBank(bank);
        setIsModalOpen(true);
    };

    const handleSubmitBank = async (formData: CreateBankDTO) => {
        try {
            if (editingBank) {
                await updateBank(editingBank.id, formData);
                showToast('Bank updated successfully', 'success');
            } else {
                await createBank(formData);
                showToast('New bank added successfully', 'success');
            }
            await fetchData();
        } catch (err: any) {
            showToast(err.message || 'Failed to save bank', 'error');
        }
    };

    const handleDeleteClick = (bank: Bank) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Bank',
            message: `Are you sure you want to delete ${bank.name}? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deleteBank(bank.id);
                    showToast('Bank deleted successfully', 'success');
                    await fetchData();
                } catch (err: any) {
                    showToast(err.message || 'Failed to delete bank', 'error');
                }
            }
        });
    };

    const renderSortIcon = (key: keyof Bank) => {
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
            <BankModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitBank}
                initialData={editingBank}
                title={editingBank ? "Edit Bank" : "Add New Bank"}
            />

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-gray-900">Bank Management</h1>
                <p className="text-gray-500">Manage bank records and branches.</p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, code, or branch..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 h-12 rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                    />
                </div>

                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    <div className="relative">
                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value)}
                            className="h-12 pl-3 pr-8 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 text-sm appearance-none bg-white shadow-sm"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    <button onClick={openAddModal} className="flex-1 sm:flex-none h-12 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2 shadow-sm transition-all">
                        <Plus className="w-5 h-5" />
                        Add Bank
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="flex-1 sm:flex-none h-12 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary-600" /> : <Upload className="w-5 h-5" />}
                        {isUploading ? 'Uploading...' : 'Upload DBF'}
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
                                    <th onClick={() => handleSort('code')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Code {renderSortIcon('code')}</th>
                                    <th onClick={() => handleSort('name')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Name {renderSortIcon('name')}</th>
                                    <th onClick={() => handleSort('sort_code')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Sort Code {renderSortIcon('sort_code')}</th>
                                    <th onClick={() => handleSort('branch')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Branch {renderSortIcon('branch')}</th>
                                    <th onClick={() => handleSort('location')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Location {renderSortIcon('location')}</th>
                                    <th onClick={() => handleSort('active')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Active {renderSortIcon('active')}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{row.code}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.sort_code}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.branch}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.location}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex w-fit items-center gap-1 ${row.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                                {row.active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEditModal(row)} className="p-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteClick(row)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {paginatedData.length === 0 && <div className="p-12 text-center text-gray-500">No bank records found.</div>}
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
