import React, { useEffect, useState } from 'react';
import { getPayments } from '../services/payment';
import { PaymentDTO } from '../types/payment';
import PaymentTable from '../components/PaymentTable';
import { Loader2, RefreshCw } from 'lucide-react';
import Toast, { ToastType } from '../components/Toast';
import { generateBankReport, generateDetailsReport, generateSummaryReport } from '../utils/pdfGenerator';
import { generateExcelReport } from '../utils/excelGenerator';

export default function ReportPage() {
    const [payments, setPayments] = useState<PaymentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [selectedTitle, setSelectedTitle] = useState<string>('');
    const [reportHeader, setReportHeader] = useState<string>('NECO POSTING - SSCE 2024 (EXTERNAL) MONITORING EXERCISE');
    const [generating, setGenerating] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getPayments();
            setPayments(data);
        } catch (err) {
            setToast({ message: 'Failed to load report data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleGenerateBankReport = async () => {
        if (!selectedTitle) {
            setToast({ message: 'Please select a Payment Title first.', type: 'error' });
            return;
        }

        setGenerating('bank');
        // Give UI a moment to update
        setTimeout(() => {
            try {
                const filtered = payments.filter(p => p.payment_title === selectedTitle);
                if (filtered.length === 0) {
                    setToast({ message: 'No records found for this title.', type: 'error' });
                    setGenerating(null);
                    return;
                }
                generateBankReport(filtered, selectedTitle);
                setToast({ message: 'Bank Report generated.', type: 'success' });
            } catch (error) {
                console.error(error);
                setToast({ message: 'Failed to generate report.', type: 'error' });
            } finally {
                setGenerating(null);
            }
        }, 100);
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Payment Reports</h1>
                    <p className="text-gray-500">Comprehensive breakdown of all payment records.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
                >
                    Refresh
                </button>
            </div>

            {/* Report Actions */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Main Header</label>
                    <input
                        type="text"
                        value={reportHeader}
                        onChange={(e) => setReportHeader(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={handleGenerateBankReport}
                        disabled={!!generating}
                        className="flex justify-center items-center px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold shadow-sm transition-all gap-2"
                    >
                        {generating === 'bank' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {generating === 'bank' ? 'Processing...' : 'Bank Report'}
                    </button>
                    <button
                        onClick={() => {
                            if (!selectedTitle) {
                                setToast({ message: 'Please select a Payment Title first.', type: 'error' });
                                return;
                            }
                            setGenerating('details');
                            setTimeout(() => {
                                try {
                                    const filtered = payments.filter(p => p.payment_title === selectedTitle);
                                    if (filtered.length === 0) {
                                        setToast({ message: 'No records found for this title.', type: 'error' });
                                        setGenerating(null);
                                        return;
                                    }
                                    generateDetailsReport(filtered, selectedTitle, reportHeader);
                                    setToast({ message: 'Details Report generated.', type: 'success' });
                                } catch (error) {
                                    console.error(error);
                                    setToast({ message: 'Failed to generate report.', type: 'error' });
                                } finally {
                                    setGenerating(null);
                                }
                            }, 100);
                        }}
                        disabled={!!generating}
                        className="flex justify-center items-center px-4 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-lg font-semibold shadow-sm transition-all gap-2"
                    >
                        {generating === 'details' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {generating === 'details' ? 'Processing...' : 'Details Report'}
                    </button>
                    <button
                        onClick={() => {
                            if (!selectedTitle) {
                                setToast({ message: 'Please select a Payment Title first.', type: 'error' });
                                return;
                            }
                            setGenerating('summary');
                            setTimeout(() => {
                                try {
                                    const filtered = payments.filter(p => p.payment_title === selectedTitle);
                                    if (filtered.length === 0) {
                                        setToast({ message: 'No records found for this title.', type: 'error' });
                                        setGenerating(null);
                                        return;
                                    }
                                    generateSummaryReport(filtered, selectedTitle, reportHeader);
                                    setToast({ message: 'Summary Report generated.', type: 'success' });
                                } catch (error) {
                                    console.error(error);
                                    setToast({ message: 'Failed to generate report.', type: 'error' });
                                } finally {
                                    setGenerating(null);
                                }
                            }, 100);
                        }}
                        disabled={!!generating}
                        className="flex justify-center items-center px-4 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg font-semibold shadow-sm transition-all gap-2"
                    >
                        {generating === 'summary' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {generating === 'summary' ? 'Processing...' : 'Summary Report'}
                    </button>
                    <button
                        onClick={() => {
                            if (!selectedTitle) {
                                setToast({ message: 'Please select a Payment Title first.', type: 'error' });
                                return;
                            }
                            setGenerating('excel');
                            setTimeout(() => {
                                try {
                                    const filtered = payments.filter(p => p.payment_title === selectedTitle);
                                    if (filtered.length === 0) {
                                        setToast({ message: 'No records found for this title.', type: 'error' });
                                        setGenerating(null);
                                        return;
                                    }
                                    generateExcelReport(filtered, selectedTitle);
                                    setToast({ message: 'Excel Report generated.', type: 'success' });
                                } catch (error) {
                                    console.error(error);
                                    setToast({ message: 'Failed to generate report.', type: 'error' });
                                } finally {
                                    setGenerating(null);
                                }
                            }, 100);
                        }}
                        disabled={!!generating}
                        className="flex justify-center items-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-semibold shadow-sm transition-all gap-2"
                    >
                        {generating === 'excel' && <Loader2 className="w-4 h-4 animate-spin" />}
                        {generating === 'excel' ? 'Processing...' : 'Excel Report'}
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                ) : (
                    <PaymentTable
                        data={payments}
                        requireSelection={true}
                        selectedTitle={selectedTitle}
                        onTitleChange={setSelectedTitle}
                    />
                )}
            </div>
        </div>
    );
}
