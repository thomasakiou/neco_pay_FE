import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Search, Upload, Loader2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { getPostings, uploadPostings, generatePayments, deletePosting } from '../services/posting';
import { Posting, GeneratePaymentDTO } from '../types/posting';
import Toast, { ToastType } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { getStaffList } from '../services/staff';
import { getParameters } from '../services/parameter';
import { getDistances } from '../services/distance';

export default function PostingPage() {
    const [allData, setAllData] = useState<Posting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Staging State
    const [stagedFile, setStagedFile] = useState<File | null>(null);
    const [isStaged, setIsStaged] = useState(false);

    // Form state
    const [paymentTitle, setPaymentTitle] = useState('');
    const [localRuns, setLocalRuns] = useState<number>(0);
    const [numbOfNights, setNumbOfNights] = useState<number>(0);

    // Pagination & Sorting
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Posting; direction: 'asc' | 'desc' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // UI State
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
            const result = await getPostings(0, 10000);
            setAllData(result);
        } catch (err) {
            showToast('Failed to load posting data.', 'error');
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

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                // Map keys
                const mappedData: Posting[] = jsonData.map((row, index) => ({
                    id: index + 1, // Temp ID
                    file_no: row['FILE NO'] || row['File No'] || '',
                    name: row['NAME'] || row['Name'] || '',
                    conraiss: row['CONRAISS'] || row['Conraiss'] || '',
                    station: row['STATION'] || row['Station'] || '',
                    posting: row['Posted To'] || row['Posting'] || '',
                    active: true
                }));

                setAllData(mappedData);
                setStagedFile(file);
                setIsStaged(true);
                setSearchQuery('');
                setCurrentPage(1);
                showToast(`Staged ${mappedData.length} records. Click "Confirm Upload" to save.`, 'success');

            } catch (err: any) {
                showToast('Failed to parse CSV file', 'error');
            }
        };
        reader.readAsArrayBuffer(file);

        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleConfirmUpload = async () => {
        if (!stagedFile) return;

        try {
            setIsUploading(true);
            await uploadPostings(stagedFile);
            setStagedFile(null);
            setIsStaged(false);
            await fetchData();
            showToast('Postings uploaded successfully!', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to upload postings', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleProcess = async () => {
        if (!paymentTitle || numbOfNights <= 0 || localRuns < 0) {
            showToast('Please fill in all fields with valid values', 'error');
            return;
        }

        if (allData.length === 0) {
            showToast('No posting data to process. Please upload a CSV first.', 'error');
            return;
        }

        try {
            setIsProcessing(true);

            // Fetch all required data
            const [staffList, parameters, distances] = await Promise.all([
                getStaffList(0, 10000),
                getParameters(0, 10000),
                getDistances(0, 10000)
            ]);

            // Generate payment records
            const paymentRecords = allData.map((posting) => {
                // Find staff by file_no (case-insensitive and trimmed)
                const fileNo = posting.file_no?.toString().trim().toLowerCase();
                const staff = staffList.find(s =>
                    s.staff_id?.toString().trim().toLowerCase() === fileNo
                );

                // Debug logging
                if (!staff && fileNo) {
                    console.log(`No staff found for file_no: "${posting.file_no}" (normalized: "${fileNo}")`);
                }

                const bank = staff?.bank_name || '';
                const accountNo = staff?.account_no || '';

                // Extract distance.distance where distance.source = posting.station AND distance.target = posting.posting
                const stationNorm = posting.station?.toString().trim().toLowerCase();
                const postingNorm = posting.posting?.toString().trim().toLowerCase();
                const distanceRecord = distances.find(
                    d => d.source?.toString().trim().toLowerCase() === stationNorm &&
                        d.target?.toString().trim().toLowerCase() === postingNorm
                );
                const dist = distanceRecord?.distance || 0;

                // Extract parameter.kilometer where last two digits of parameter.contiss = posting.conraiss
                const parameterRecord = parameters.find(p => {
                    if (!p.contiss || !posting.conraiss) return false;
                    const lastTwoDigits = p.contiss.slice(-2);
                    return lastTwoDigits === posting.conraiss;
                });
                const kilometer = parameterRecord?.kilometer || 0;

                // Calculate Transport = distance.distance * parameter.kilometer
                const transport = dist * kilometer;

                // Calculate Amt_per_night from parameter.pernight
                const amtPerNight = parameterRecord?.pernight || 0;

                // Calculate DTA = Amt_per_night * Numb_of_nights
                const dta = amtPerNight * numbOfNights;

                // Calculate Netpay = Transport + DTA + Local_Runs
                const netpay = transport + dta + localRuns;

                return {
                    File_No: posting.file_no || '',
                    Name: posting.name || '',
                    Conraiss: posting.conraiss || '',
                    Station: posting.station || '',
                    Posting: posting.posting || '',
                    Bank: bank,
                    Account_No: accountNo,
                    Transport: transport,
                    Local_Runs: localRuns,
                    Numb_of_nights: numbOfNights,
                    Amt_per_night: amtPerNight,
                    DTA: dta,
                    Netpay: netpay,
                    Payment_Title: paymentTitle
                };
            });

            // Generate CSV using XLSX
            const worksheet = XLSX.utils.json_to_sheet(paymentRecords);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `Payment_${paymentTitle.replace(/\s+/g, '_')}_${timestamp}.csv`;

            // Trigger download
            XLSX.writeFile(workbook, filename, { bookType: 'csv' });

            showToast(`CSV generated successfully! ${paymentRecords.length} records exported.`, 'success');

            // Clear form inputs
            setPaymentTitle('');
            setLocalRuns(0);
            setNumbOfNights(0);
        } catch (err: any) {
            console.error('CSV generation error:', err);
            showToast(err.message || 'Failed to generate CSV', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSort = (key: keyof Posting) => {
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
                (item.file_no?.toLowerCase().includes(lowerQuery)) ||
                (item.station?.toLowerCase().includes(lowerQuery)) ||
                (item.rank?.toLowerCase().includes(lowerQuery)) ||
                (item.mandate?.toLowerCase().includes(lowerQuery))
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

    const handleDeleteClick = (posting: Posting) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Posting',
            message: `Are you sure you want to delete posting for ${posting.name}?`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    await deletePosting(posting.id);
                    showToast('Posting deleted successfully', 'success');
                    await fetchData();
                } catch (err: any) {
                    showToast(err.message || 'Failed to delete posting', 'error');
                }
            }
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const newSelected = new Set(selectedIds);
            paginatedData.forEach(row => newSelected.add(row.id));
            setSelectedIds(newSelected);
        } else {
            const newSelected = new Set(selectedIds);
            paginatedData.forEach(row => newSelected.delete(row.id));
            setSelectedIds(newSelected);
        }
    };

    const handleSelectRow = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        setConfirmModal({
            isOpen: true,
            title: 'Delete Selected Postings',
            message: `Are you sure you want to delete ${selectedIds.size} selected posting(s)?`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    setLoading(true);
                    // Iterate and delete - suboptimal but works without backend bulk endpoint
                    const promises = Array.from(selectedIds).map((id: number) => deletePosting(id));
                    await Promise.all(promises);

                    showToast(`Successfully deleted ${selectedIds.size} postings`, 'success');
                    setSelectedIds(new Set());
                    // refresh data
                    await fetchData();
                } catch (err: any) {
                    showToast(err.message || 'Failed to delete some postings', 'error');
                    await fetchData();
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleClear = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Clear All Data',
            message: 'Are you sure you want to clear all loaded posting data? This action cannot be undone.',
            onConfirm: () => {
                setAllData([]);
                setStagedFile(null);
                setIsStaged(false);
                setSearchQuery('');
                setCurrentPage(1);
                setConfirmModal(null);
                showToast('All data cleared', 'success');
            }
        });
    };

    const renderSortIcon = (key: keyof Posting) => {
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
                <h1 className="text-3xl font-black text-gray-900">Posting Management</h1>
                <p className="text-gray-500">Upload posting data and generate payments.</p>
            </div>

            {/* Process Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Generate Payments</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Title</label>
                        <input
                            type="text"
                            value={paymentTitle}
                            onChange={(e) => setPaymentTitle(e.target.value)}
                            className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm"
                            placeholder="Enter payment title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Local Runs</label>
                        <input
                            type="number"
                            value={localRuns}
                            onChange={(e) => setLocalRuns(Number(e.target.value))}
                            className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Nights</label>
                        <input
                            type="number"
                            value={numbOfNights}
                            onChange={(e) => setNumbOfNights(Number(e.target.value))}
                            className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm"
                            placeholder="0"
                        />
                    </div>
                </div>
                <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="h-12 px-6 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {isProcessing ? 'Processing...' : 'Process'}
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, file no, station..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-10 h-12 rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                    />
                </div>

                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="h-12 px-4 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
                    {allData.length > 0 && (
                        <button
                            onClick={handleClear}
                            className="h-12 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                            <Trash2 className="w-5 h-5 text-gray-500" />
                            Clear
                        </button>
                    )}
                    {isStaged && (
                        <button
                            onClick={handleConfirmUpload}
                            disabled={true} // Disabled as per user request
                            className="h-12 px-4 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                            {isUploading ? 'Uploading...' : 'Confirm Upload'}
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
                    {!isStaged && (
                        <button
                            onClick={handleUploadClick}
                            disabled={isUploading}
                            className="flex-1 sm:flex-none h-12 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-5 h-5" />
                            Select CSV
                        </button>
                    )}
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
                                    <th className="w-12 px-6 py-4">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            checked={paginatedData.length > 0 && paginatedData.every(row => selectedIds.has(row.id))}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th onClick={() => handleSort('file_no')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">File No {renderSortIcon('file_no')}</th>
                                    <th onClick={() => handleSort('name')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Name {renderSortIcon('name')}</th>
                                    <th onClick={() => handleSort('conraiss')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Conraiss {renderSortIcon('conraiss')}</th>
                                    <th onClick={() => handleSort('station')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Station {renderSortIcon('station')}</th>
                                    <th onClick={() => handleSort('posting')} className="px-6 py-4 font-semibold text-gray-600 cursor-pointer hover:bg-gray-100">Posted To {renderSortIcon('posting')}</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedData.map((row) => {
                                    const isSelected = selectedIds.has(row.id);
                                    return (
                                        <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-6 py-4 relative">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectRow(row.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{row.file_no}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.conraiss}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.station}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.posting}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleDeleteClick(row)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {paginatedData.length === 0 && <div className="p-12 text-center text-gray-500">No posting records found.</div>}
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
