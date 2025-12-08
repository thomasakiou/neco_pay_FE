import React, { useState, useRef } from 'react';
import { Upload, FileDown, Loader2, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';
import { processExcelFile, ProcessedExcelResult } from '../utils/excelProcessor';
import Toast, { ToastType } from '../components/Toast';

export default function UtilityPage() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<ProcessedExcelResult | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: ToastType) => {
        setToast({ message, type });
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsProcessing(true);
            setResult(null);

            const processedData = await processExcelFile(file);
            setResult(processedData);

            showToast('File processed successfully!', 'success');
        } catch (error: any) {
            console.error(error);
            showToast(error.message || 'Failed to process file', 'error');
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDownload = () => {
        if (!result) return;

        const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-gray-900">Cleaning</h1>
                <p className="text-gray-500">Tools for data processing and conversion.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Converter Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <FileSpreadsheet className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Excel to CSV Cleaner</h2>
                            <p className="text-sm text-gray-500">Convert Excel to CSV and remove duplicate headers</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-center">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".xlsx, .xls"
                                className="hidden"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="mx-auto flex flex-col items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <Upload className="w-8 h-8" />
                                )}
                                <span className="text-sm font-medium">
                                    {isProcessing ? 'Processing File...' : 'Click to Upload Excel File'}
                                </span>
                            </button>
                            <p className="text-xs text-gray-400 mt-2">Supports .xlsx and .xls formats</p>
                        </div>

                        {result && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-green-800 font-medium">Conversion Complete</span>
                                    <span className="text-green-600 text-xs">{result.fileName}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div className="bg-white p-2 rounded border border-green-100">
                                        <div className="text-gray-400">Original Rows</div>
                                        <div className="font-semibold text-lg">~{result.originalRowCount}</div>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-green-100">
                                        <div className="text-gray-400">Cleaned Rows</div>
                                        <div className="font-semibold text-lg">{result.cleanedRowCount}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleDownload}
                                    className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <FileDown className="w-4 h-4" />
                                    Download CSV
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Instructions / Info */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                        How it works
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
                        <li>Upload an Excel file (.xlsx or .xls).</li>
                        <li>The system automatically detects the header row based on standard columns (File No, Name, Station, etc.).</li>
                        <li>It scans through the entire file and removes any rows that duplicate the header information.</li>
                        <li>Empty rows are automatically removed.</li>
                        <li>The result is a clean CSV file ready for upload in the Posting or other modules.</li>
                    </ul>
                </div>
            </div>

            {/* Preview Table */}
            {result && result.preview.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-6">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Data Preview (Top 200 Rows)</h3>
                        <span className="text-xs text-gray-500">Showing {result.preview.length} rows</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    {Object.keys(result.preview[0]).map((header, idx) => (
                                        <th key={idx} className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {result.preview.map((row, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-gray-50">
                                        {Object.values(row).map((cell: any, cellIdx) => (
                                            <td key={cellIdx} className="px-4 py-2 text-gray-600 whitespace-nowrap">
                                                {cell}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
