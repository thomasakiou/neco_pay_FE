import React, { useEffect, useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Search, Upload, Loader2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, ChevronDown, Pencil, Check, X } from 'lucide-react';
import { getPostings, uploadPostings, generatePayments, deletePosting, updatePosting, getPostingBatches } from '../services/posting';
import { Posting, GeneratePaymentDTO } from '../types/posting';
import Toast, { ToastType } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { getStaffList } from '../services/staff';
import { getParameters } from '../services/parameter';
import { getDistances } from '../services/distance';
import { getStates } from '../services/states';
import { resolveLocation } from '../utils/resolveLocation';

export default function PostingPage() {
    const [allData, setAllData] = useState<Posting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Staging & batch
    const [stagedFile, setStagedFile] = useState<File | null>(null);
    const [batchNameInput, setBatchNameInput] = useState('');
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batches, setBatches] = useState<string[]>([]);
    const [selectedBatch, setSelectedBatch] = useState<string>('');

    // Form state
    const [paymentTitle, setPaymentTitle] = useState('');
    const [fuel, setFuel] = useState<number>(0);
    const [localRunsInput, setLocalRunsInput] = useState<number>(0);
    const [includeParameterLocal, setIncludeParameterLocal] = useState(true);
    const [localDistanceThreshold, setLocalDistanceThreshold] = useState<number>(40);
    const [applyTransportThreshold, setApplyTransportThreshold] = useState(false);
    const [transportDistanceThreshold, setTransportDistanceThreshold] = useState<number>(40);
    const [useParameterTable, setUseParameterTable] = useState(true);
    const [numbOfNights, setNumbOfNights] = useState<number>(0);
    const [localNightsDeduction, setLocalNightsDeduction] = useState<number>(1);
    const [tax, setTax] = useState<number>(0);

    // Pagination & Sorting
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Posting; direction: 'asc' | 'desc' } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Inline edit state
    const [editingRow, setEditingRow] = useState<{ id: number; station: string; posting: string } | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // UI State
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchData(); }, []);

    const showToast = (message: string, type: ToastType) => setToast({ message, type });

    const normalizeKey = (key: string): string => {
        const lower = key.trim().toLowerCase();
        if (lower === 'file no' || lower === 'file_no' || lower === 'per no' || lower === 'per_no' || lower === 'staff_per_no' || lower === 'staff per no') return 'file_no';
        if (lower === 'name' || lower === 'fullname' || lower === 'full name') return 'name';
        if (lower === 'conraiss' || lower === 'level' || lower === 'grade') return 'conraiss';
        if (lower === 'station' || lower === 'location' || lower === 'current station') return 'station';
        if (lower === 'posting' || lower === 'posted to' || lower === 'state posted') return 'posting';
        if (lower === 'no_of_nights' || lower === 'number of nights' || lower === 'nights') return 'no_of_nights';
        if (lower === 'category') return 'category';
        if (lower === 'rank') return 'rank';
        if (lower === 'mandate') return 'mandate';
        return lower;
    };

    const fetchData = async (batch?: string) => {
        try {
            setLoading(true);
            const [result, batchList] = await Promise.all([
                getPostings(0, 10000, batch),
                getPostingBatches()
            ]);
            setAllData(result);
            setBatches(batchList);
        } catch (err) {
            showToast('Failed to load posting data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBatchChange = (batch: string) => {
        setSelectedBatch(batch);
        setCurrentPage(1);
        fetchData(batch || undefined);
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setStagedFile(file);
        setBatchNameInput(file.name.replace(/\.[^.]+$/, ''));
        setShowBatchModal(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleConfirmUpload = async () => {
        if (!stagedFile || !batchNameInput.trim()) return;
        try {
            setIsUploading(true);
            setShowBatchModal(false);
            const batchName = batchNameInput.trim();
            await uploadPostings(stagedFile, batchName);
            setStagedFile(null);
            setBatchNameInput('');
            await fetchData(batchName);
            setSelectedBatch(batchName);
            showToast('Postings uploaded successfully!', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to upload postings', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleProcess = async () => {
        if (!paymentTitle || numbOfNights < 0 || !Number.isInteger(numbOfNights) || fuel < 0 || localRunsInput < 0 || tax < 0) {
            showToast('Please fill in all fields with valid values', 'error');
            return;
        }
        if (allData.length === 0) {
            showToast('No posting data to process. Please upload a CSV first.', 'error');
            return;
        }
        try {
            setIsProcessing(true);
            const [staffList, parameters, distances, states] = await Promise.all([
                getStaffList(0, 10000),
                getParameters(0, 10000),
                getDistances(0, 10000),
                getStates(0, 10000)
            ]);

            const paymentRecords = allData.map((posting) => {
                let fileNo = posting.file_no?.toString().trim() || '';
                if (fileNo && /^\d{2,3}$/.test(fileNo)) fileNo = fileNo.padStart(4, '0');
                const fileNoNormalized = fileNo.toLowerCase();

                const staff = staffList.find(s => {
                    let staffId = s.staff_id?.toString().trim() || '';
                    if (staffId && /^\d{2,3}$/.test(staffId)) staffId = staffId.padStart(4, '0');
                    return staffId.toLowerCase() === fileNoNormalized;
                });

                const bank = staff?.bank_name || '';
                const accountNo = staff?.account_no || '';
                const stationRaw = posting.station?.trim() || '';
                const postingRaw = posting.posting?.trim() || '';
                const stationResolved = resolveLocation(stationRaw, states, distances, 'source').toLowerCase();
                const postingResolved = resolveLocation(postingRaw, states, distances, 'target').toLowerCase();
                const distanceRecord = distances.find(
                    d => d.source?.toString().trim().toLowerCase() === stationResolved &&
                        d.target?.toString().trim().toLowerCase() === postingResolved
                );
                const distKm = distanceRecord != null ? (distanceRecord.distance ?? 0) : null;
                const dist = distKm ?? 0;

                const parameterRecord = parameters.find(p => {
                    if (!p.contiss || !posting.conraiss) return false;
                    const parameterGrade = p.contiss.trim().toLowerCase();
                    const postingGrade = String(posting.conraiss).trim().toLowerCase();
                    const contissDigits = parameterGrade.match(/\d+/)?.[0];
                    const postingDigits = postingGrade.match(/\d+/)?.[0];
                    if (contissDigits && postingDigits) return Number(contissDigits) === Number(postingDigits);
                    return parameterGrade === postingGrade;
                });
                const kilometer = useParameterTable ? (parameterRecord?.kilometer || 0) : 0;
                const transportEligible = !applyTransportThreshold || distKm == null || distKm > transportDistanceThreshold;
                const transport = transportEligible ? dist * kilometer * 2 : 0;
                const amtPerNight = parameterRecord?.pernight || 0;
                const parameterLocal = useParameterTable && includeParameterLocal && distKm != null && distKm <= localDistanceThreshold ? parameterRecord?.local || 0 : 0;
                const localRuns = localRunsInput + parameterLocal;
                const hasLocalRuns = localRuns > 0;
                const csvNights = posting.no_of_nights != null && posting.no_of_nights > 0 ? posting.no_of_nights : null;
                const staffNights = csvNights != null
                    ? csvNights
                    : hasLocalRuns
                        ? Math.max(0, numbOfNights - localNightsDeduction)
                        : numbOfNights;
                const dta = amtPerNight * staffNights;
                const grossPay = transport + dta + fuel + localRuns;
                const taxDeduction = (grossPay * tax) / 100;
                const netpay = grossPay - taxDeduction;

                return {
                    'File No': posting.file_no || '',
                    'Name': posting.name || '',
                    'Conraiss': posting.conraiss || '',
                    'Station': posting.station || '',
                    'Posting': posting.posting || '',
                    'Bank': bank,
                    'Account No': accountNo,
                    'Transport': transport,
                    'Fuel': fuel,
                    'Local Runs': localRuns,
                    'Number of Nights': staffNights,
                    'Amount per Night': amtPerNight,
                    'DTA': dta,
                    'Gross Total': grossPay,
                    'Tax': tax,
                    'Netpay': netpay,
                    'Payment Title': paymentTitle
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(paymentRecords);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const filename = `Payment_${paymentTitle.replace(/\s+/g, '_')}_${timestamp}.csv`;
            XLSX.writeFile(workbook, filename, { bookType: 'csv' });
            showToast(`CSV generated successfully! ${paymentRecords.length} records exported.`, 'success');
            setPaymentTitle('');
            setFuel(0);
            setLocalRunsInput(0);
            setNumbOfNights(0);
            setTax(0);
        } catch (err: any) {
            showToast(err.message || 'Failed to generate CSV', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSort = (key: keyof Posting) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const filteredData = React.useMemo(() => {
        if (!searchQuery) return allData;
        const lowerQuery = searchQuery.toLowerCase();
        return allData.filter(item =>
            (item.name?.toLowerCase().includes(lowerQuery)) ||
            (item.file_no?.toLowerCase().includes(lowerQuery)) ||
            (item.station?.toLowerCase().includes(lowerQuery)) ||
            (item.rank?.toLowerCase().includes(lowerQuery)) ||
            (item.mandate?.toLowerCase().includes(lowerQuery))
        );
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
                    await fetchData(selectedBatch || undefined);
                } catch (err: any) {
                    showToast(err.message || 'Failed to delete posting', 'error');
                }
            }
        });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSelected = new Set(selectedIds);
        if (e.target.checked) sortedData.forEach(row => newSelected.add(row.id));
        else sortedData.forEach(row => newSelected.delete(row.id));
        setSelectedIds(newSelected);
    };

    const handleSelectRow = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
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
                    await Promise.all(Array.from(selectedIds).map((id: number) => deletePosting(id)));
                    showToast(`Successfully deleted ${selectedIds.size} postings`, 'success');
                    setSelectedIds(new Set());
                    await fetchData(selectedBatch || undefined);
                } catch (err: any) {
                    showToast(err.message || 'Failed to delete some postings', 'error');
                    await fetchData(selectedBatch || undefined);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleEditStart = (row: Posting) => {
        setEditingRow({ id: row.id, station: row.station || '', posting: row.posting || '' });
    };

    const handleEditSave = async () => {
        if (!editingRow) return;
        try {
            setIsSavingEdit(true);
            await updatePosting(editingRow.id, { station: editingRow.station, posting: editingRow.posting });
            setAllData(prev => prev.map(r => r.id === editingRow.id ? { ...r, station: editingRow.station, posting: editingRow.posting } : r));
            setEditingRow(null);
            showToast('Row updated successfully', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to update row', 'error');
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleClear = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Clear All Data',
            message: 'Are you sure you want to clear all loaded posting data? This action cannot be undone.',
            onConfirm: () => {
                setAllData([]);
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

            {/* Batch Name Modal */}
            {showBatchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">Name this Batch</h2>
                        <p className="text-sm text-gray-500 mb-4">Give this upload a name so you can filter and process it later. Defaults to the filename.</p>
                        <input
                            autoFocus
                            type="text"
                            value={batchNameInput}
                            onChange={e => setBatchNameInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleConfirmUpload()}
                            className="w-full h-11 px-4 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm mb-4"
                            placeholder="e.g. SSCE External 2025 Batch A"
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setShowBatchModal(false); setStagedFile(null); setBatchNameInput(''); }}
                                className="h-10 px-4 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmUpload}
                                disabled={!batchNameInput.trim() || isUploading}
                                className="h-10 px-5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60 flex items-center gap-2"
                            >
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                Upload
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-gray-900">Posting Management</h1>
                <p className="text-gray-500">Upload posting data and generate payments.</p>
                <p className="max-w-4xl rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                    For payment calculations, include <strong>Conraiss</strong>, <strong>Station</strong>, and <strong>Posted To</strong> in the posting CSV. Transport is calculated using the matched Distance record and Kilometer parameter. Use the <strong>edit (pencil) button</strong> on any row to correct Station or Posted To values before processing. To add staff-specific nights, include the optional <code className="font-semibold">No_of_nights</code> column.
                </p>
            </div>

            {/* Process Form */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Generate Payments</h2>
                <div className="mb-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={useParameterTable}
                            onChange={e => setUseParameterTable(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>Use Payment Parameter table for <strong>Kilometer</strong> (transport) and <strong>Local</strong></span>
                    </label>
                    {!useParameterTable && (
                        <p className="mt-1 ml-6 text-xs text-amber-600">Parameter table ignored — transport uses 0 km rate, local runs use textbox value only.</p>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Title</label>
                        <input type="text" value={paymentTitle} onChange={(e) => setPaymentTitle(e.target.value)} className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm" placeholder="Enter payment title" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fuel</label>
                        <input type="number" min="0" step="1" value={fuel} onChange={(e) => setFuel(Number(e.target.value))} className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm" placeholder="0.00" />
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                            <input type="checkbox" checked={applyTransportThreshold} onChange={(e) => setApplyTransportThreshold(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            <span>Skip transport if dist &le;</span>
                            <input
                                type="number"
                                min="0"
                                value={transportDistanceThreshold}
                                onChange={(e) => setTransportDistanceThreshold(Number(e.target.value))}
                                disabled={!applyTransportThreshold}
                                className="w-16 h-6 px-1.5 rounded border border-gray-300 text-xs focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-100"
                            />
                            <span>km</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Local Runs</label>
                        <input type="number" value={localRunsInput} onChange={(e) => setLocalRunsInput(Number(e.target.value))} className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm" placeholder="0.00" />
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                            <input type="checkbox" checked={includeParameterLocal} onChange={(e) => setIncludeParameterLocal(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            <span>Add Parameter Local if dist &le;</span>
                            <input
                                type="number"
                                min="0"
                                value={localDistanceThreshold}
                                onChange={(e) => setLocalDistanceThreshold(Number(e.target.value))}
                                disabled={!includeParameterLocal}
                                className="w-16 h-6 px-1.5 rounded border border-gray-300 text-xs focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:bg-gray-100"
                            />
                            <span>km</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Nights</label>
                        <input type="number" min="0" step="1" value={numbOfNights} onChange={(e) => setNumbOfNights(Number(e.target.value))} className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm" placeholder="0" />
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                            <span>Deduct</span>
                            <input
                                type="number"
                                min="0"
                                value={localNightsDeduction}
                                onChange={(e) => setLocalNightsDeduction(Number(e.target.value))}
                                className="w-12 h-6 px-1.5 rounded border border-gray-300 text-xs focus:border-primary-500 focus:ring-primary-500"
                            />
                            <span>night(s) if local runs apply</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                        <input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} className="w-full h-11 px-4 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-all text-sm" placeholder="0.00" />
                    </div>
                </div>
                <button onClick={handleProcess} disabled={isProcessing} className="h-12 px-6 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                    {isProcessing ? 'Processing...' : 'Process'}
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:max-w-2xl">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, file no, station..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 h-12 rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
                        />
                    </div>
                    <div className="relative shrink-0">
                        <select
                            value={selectedBatch}
                            onChange={(e) => handleBatchChange(e.target.value)}
                            className="h-12 pl-3 pr-8 rounded-lg border-gray-200 focus:border-primary-500 focus:ring-primary-500 text-sm appearance-none bg-white shadow-sm w-full min-w-[180px]"
                        >
                            <option value="">All Batches</option>
                            {batches.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                    {selectedIds.size > 0 && (
                        <button onClick={handleBulkDelete} className="h-12 px-4 bg-red-50 text-red-600 border border-red-200 rounded-lg font-medium hover:bg-red-100 flex items-center justify-center gap-2 shadow-sm transition-all">
                            <Trash2 className="w-5 h-5" />
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
                    {allData.length > 0 && (
                        <button onClick={handleClear} className="h-12 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-all">
                            <Trash2 className="w-5 h-5 text-gray-500" />
                            Clear
                        </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileChange} />
                    <button onClick={handleUploadClick} disabled={isUploading} className="flex-1 sm:flex-none h-12 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                        <Upload className="w-5 h-5" />
                        Upload CSV
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Rows per page:</span>
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="border border-gray-300 rounded-md px-2 py-1 text-sm outline-none bg-white">
                            {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                    </div>
                    {selectedBatch && <span className="text-sm text-primary-700 font-medium bg-primary-50 px-3 py-1 rounded-full">Batch: {selectedBatch}</span>}
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
                                        <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={sortedData.length > 0 && sortedData.every(row => selectedIds.has(row.id))} onChange={handleSelectAll} />
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
                                            <td className="px-6 py-4">
                                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={isSelected} onChange={() => handleSelectRow(row.id)} />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{row.file_no}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{row.conraiss}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {editingRow?.id === row.id
                                                    ? <input autoFocus value={editingRow.station} onChange={e => setEditingRow(prev => prev && ({ ...prev, station: e.target.value }))} className="w-full px-2 py-1 border border-primary-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
                                                    : row.station}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {editingRow?.id === row.id
                                                    ? <input value={editingRow.posting} onChange={e => setEditingRow(prev => prev && ({ ...prev, posting: e.target.value }))} className="w-full px-2 py-1 border border-primary-400 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
                                                    : row.posting}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {editingRow?.id === row.id ? (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={handleEditSave} disabled={isSavingEdit} className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-md transition-colors disabled:opacity-50">{isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}</button>
                                                        <button onClick={() => setEditingRow(null)} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => handleEditStart(row)} className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"><Pencil className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDeleteClick(row)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                )}
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
