import React, { useEffect, useState } from 'react';
import { getPayments } from '../services/payment';
import { PaymentDTO } from '../types/payment';
import PaymentTable from '../components/PaymentTable';
import { ChevronDown, Loader2, RefreshCw } from 'lucide-react';
import Toast, { ToastType } from '../components/Toast';
import { ALL_REPORT_FIELDS, generateBankReport, generateDetailsReport, generateSummaryReport } from '../utils/pdfGenerator';
import { generateExcelReport } from '../utils/excelGenerator';

export default function ReportPage() {
    const [payments, setPayments] = useState<PaymentDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [selectedTitle, setSelectedTitle] = useState<string>('');
    const [reportHeader, setReportHeader] = useState<string>('NECO POSTING - SSCE 2024 (EXTERNAL) MONITORING EXERCISE');
    const [generating, setGenerating] = useState<string | null>(null);
    const [showFieldSelector, setShowFieldSelector] = useState(false);
    const [visibleFields, setVisibleFields] = useState<Set<string>>(() => new Set(ALL_REPORT_FIELDS.map(f => f.key)));

    const toggleField = (key: string) => {
        setVisibleFields(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const activeFields = ALL_REPORT_FIELDS.map(f => f.key).filter(k => visibleFields.has(k));

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

                {/* Field Selector */}
                <div className="border border-gray-200 rounded-lg">
                    <button
                        onClick={() => setShowFieldSelector(v => !v)}
                        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                    >
                        <span>Report Columns <span className="text-gray-400 font-normal">({visibleFields.size} of {ALL_REPORT_FIELDS.length} selected)</span></span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showFieldSelector ? 'rotate-180' : ''}`} />
                    </button>
                    {showFieldSelector && (
                        <div className="px-4 pb-3 border-t border-gray-100">
                            <div className="flex gap-3 mt-2 mb-3">
                                <button onClick={() => setVisibleFields(new Set(ALL_REPORT_FIELDS.map(f => f.key)))} className="text-xs text-primary-600 hover:underline">Select all</button>
                                <button onClick={() => setVisibleFields(new Set())} className="text-xs text-gray-500 hover:underline">Clear all</button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {ALL_REPORT_FIELDS.map(f => (
                                    <label key={f.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={visibleFields.has(f.key)}
                                            onChange={() => toggleField(f.key)}
                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        {f.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
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
                                    generateDetailsReport(filtered, selectedTitle, reportHeader, activeFields);
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
                                    generateExcelReport(filtered, selectedTitle, activeFields);
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
