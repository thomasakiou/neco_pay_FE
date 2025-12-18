import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Upload, Trash2, Edit, Loader2, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ChevronsLeft, ChevronsRight, ChevronLeft } from 'lucide-react';
import { getDistances, createDistance, uploadDistances, updateDistance, deleteDistance } from '../services/distance';
import { Distance, CreateDistanceDTO } from '../types/distance';
import DistanceModal from '../components/DistanceModal';
import Toast, { ToastType } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function DistancePage() {
    const [allData, setAllData] = useState<Distance[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);

    // Pagination & Sorting
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Distance; direction: 'asc' | 'desc' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // UI State
    const [filterActive, setFilterActive] = useState<string>('All');
    const [filterSource, setFilterSource] = useState<string>('All');
    const [filterTarget, setFilterTarget] = useState<string>('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDistance, setEditingDistance] = useState<Distance | null>(null);
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
            const result = await getDistances(0, 10000);
            setAllData(result);
        } catch (err) {
            showToast('Failed to load distance data.', 'error');
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
            await uploadDistances(file);
            await fetchData();
            showToast('Distances imported successfully!', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to import distances', 'error');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSort = (key: keyof Distance) => {
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
                (item.source?.toLowerCase().includes(lowerQuery)) ||
                (item.target?.toLowerCase().includes(lowerQuery)) ||
                (item.pcode?.toLowerCase().includes(lowerQuery)) ||
                (item.tcode?.toLowerCase().includes(lowerQuery))
            );
        }

        // Filter Active
        if (filterActive !== 'All') {
            const isActive = filterActive === 'Active';
            data = data.filter(item => item.active === isActive);
        }

        // Filter Source
        if (filterSource !== 'All') {
            data = data.filter(item => item.source === filterSource);
        }

        // Filter Target
        if (filterTarget !== 'All') {
            data = data.filter(item => item.target === filterTarget);
        }

        return data;
    }, [allData, searchQuery, filterActive, filterSource, filterTarget]);

    const uniqueSources = React.useMemo(() => {
        const sources = new Set(allData.map(item => item.source).filter(Boolean));
        return Array.from(sources).sort();
    }, [allData]);

    const uniqueTargets = React.useMemo(() => {
        const targets = new Set(allData.map(item => item.target).filter(Boolean));
        return Array.from(targets).sort();
    }, [allData]);

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
        setEditingDistance(null);
        setIsModalOpen(true);
    };

    const openEditModal = (distance: Distance) => {
        setEditingDistance(distance);
        setIsModalOpen(true);
    };

    const handleSubmitDistance = async (formData: CreateDistanceDTO) => {
        try {
            if (editingDistance) {
                await updateDistance(editingDistance.id, formData);
                showToast('Distance updated successfully', 'success');
            } else {
                await createDistance(formData);
                showToast('New distance added successfully', 'success');
            }
            await fetchData();
        } catch (err: any) {
            showToast(err.message || 'Failed to save distance', 'error');
        }
    };

    const handleDeleteClick = (distance: Distance) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Distance',
            message: `Are you sure you want to delete the distance from ${distance.source} to ${distance.target}?`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deleteDistance(distance.id);
                    showToast('Distance deleted successfully', 'success');
                    await fetchData();
                } catch (err: any) {
                    showToast(err.message || 'Failed to delete distance', 'error');
                }
            }
        });
    };

    const renderSortIcon = (key: keyof Distance) => {
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
            <DistanceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitDistance}
                initialData={editingDistance}
                title={editingDistance ? "Edit Distance" : "Add New Distance"}
            />

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-gray-900">Distance Management</h1>
                <p className="text-gray-500">Manage distances between locations.</p>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by source, target, or codes..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 h-12 rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                    />
                </div>

                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    <div className="relative">
                        <select
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value)}
                            className="h-12 pl-3 pr-8 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 text-sm appearance-none bg-white shadow-sm"
                        >
                            <option value="All">All Sources</option>
                            {uniqueSources.map(source => (
                                <option key={source} value={source}>{source}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                        <select
                            value={filterTarget}
                            onChange={(e) => setFilterTarget(e.target.value)}
                            className="h-12 pl-3 pr-8 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 text-sm appearance-none bg-white shadow-sm"
                        >
                            <option value="All">All Targets</option>
                            {uniqueTargets.map(target => (
                                <option key={target} value={target}>{target}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

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
                        Add Distance
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
                                    <th onClick={() => handleSort('pcode')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">PCode {renderSortIcon('pcode')}</th>
                                    <th onClick={() => handleSort('source')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Source {renderSortIcon('source')}</th>
                                    <th onClick={() => handleSort('tcode')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">TCode {renderSortIcon('tcode')}</th>
                                    <th onClick={() => handleSort('target')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Target {renderSortIcon('target')}</th>
                                    <th onClick={() => handleSort('distance')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Dist (km) {renderSortIcon('distance')}</th>
                                    <th onClick={() => handleSort('active')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Active {renderSortIcon('active')}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{row.pcode}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{row.source}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.tcode}</td>
                                        <td className="px-6 py-4 text-gray-600">{row.target}</td>
                                        <td className="px-6 py-4 font-mono font-medium text-primary-700">{row.distance}</td>
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
                        {paginatedData.length === 0 && <div className="p-12 text-center text-gray-500">No distance records found.</div>}
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
