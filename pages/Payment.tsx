import React, { useEffect, useState } from 'react';
import { getPayments, uploadPayment, deletePayment } from '../services/payment';
import { PaymentDTO } from '../types/payment';
import PaymentTable from '../components/PaymentTable';
import { Loader2, Trash2, RefreshCw, Upload } from 'lucide-react';
import Toast, { ToastType } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

export default function PaymentPage() {
    const [payments, setPayments] = useState<PaymentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getPayments();
            setPayments(data);
        } catch (err) {
            setToast({ message: 'Failed to load payments.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleClear = () => {
        setPayments([]);
        setToast({ message: 'Payment view cleared (Client-side only).', type: 'success' });
    };

    const handleBulkDelete = () => {
        if (selectedIds.size === 0) return;

        setConfirmModal({
            isOpen: true,
            title: 'Delete Selected Payments',
            message: `Are you sure you want to delete ${selectedIds.size} selected record(s)? This action cannot be undone.`,
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    setLoading(true);
                    // Standard approach: delete one by one if no bulk endpoint
                    const promises = Array.from(selectedIds).map((id: number) => deletePayment(id));
                    await Promise.all(promises);

                    setToast({ message: `Successfully deleted ${selectedIds.size} payments`, type: 'success' });
                    setSelectedIds(new Set());
                    await fetchData();
                } catch (err) {
                    setToast({ message: 'Failed to delete some payments', type: 'error' });
                    await fetchData();
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            await uploadPayment(file);
            setToast({ message: 'Payment file uploaded successfully', type: 'success' });
            await fetchData();
        } catch (error) {
            setToast({ message: 'Failed to upload payment file', type: 'error' });
        } finally {
            setLoading(false);
            // Reset input
            if (event.target) event.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {confirmModal && (
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(null)}
                    isDestructive={true}
                />
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Payment Management</h1>
                    <p className="text-gray-500">View and manage generated payment records.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected ({selectedIds.size})
                        </button>
                    )}
                    <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-all cursor-pointer">
                        <Upload className="w-4 h-4" />
                        Upload Payment
                        <input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </label>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Reload Data
                    </button>
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 bg-white border border-gray-200 text-red-600 rounded-lg font-medium hover:bg-red-50 flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        Clear View
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
            ) : (
                <PaymentTable
                    data={payments}
                    showSelection={true}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                />
            )}
        </div>
    );
}
