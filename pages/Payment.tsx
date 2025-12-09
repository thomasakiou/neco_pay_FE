import React, { useEffect, useState } from 'react';
import { getPayments, uploadPayment } from '../services/payment';
import { PaymentDTO } from '../types/payment';
import PaymentTable from '../components/PaymentTable';
import { Loader2, Trash2, RefreshCw, Upload } from 'lucide-react';
import Toast, { ToastType } from '../components/Toast';

export default function PaymentPage() {
    const [payments, setPayments] = useState<PaymentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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
            event.target.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Payment Management</h1>
                    <p className="text-gray-500">View and manage generated payment records.</p>
                </div>
                <div className="flex gap-2">
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
                <PaymentTable data={payments} />
            )}
        </div>
    );
}
