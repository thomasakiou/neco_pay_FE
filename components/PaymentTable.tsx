import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Filter } from 'lucide-react';
import { PaymentDTO } from '../types/payment';

interface PaymentTableProps {
    data: PaymentDTO[];
    requireSelection?: boolean;
    selectedTitle?: string;
    onTitleChange?: (title: string) => void;
}

export default function PaymentTable({ data, requireSelection = false, selectedTitle: controlledTitle, onTitleChange }: PaymentTableProps) {
    const isControlled = controlledTitle !== undefined;
    const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());
    const [internalTitle, setInternalTitle] = useState<string>(requireSelection ? '' : 'All');

    const selectedTitle = isControlled ? controlledTitle : internalTitle;
    const setSelectedTitle = (title: string) => {
        if (onTitleChange) onTitleChange(title);
        if (!isControlled) setInternalTitle(title);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filter Logic
    const titles = useMemo(() => {
        const unique = new Set(data.map(p => p.payment_title).filter(Boolean));
        return ['All', ...Array.from(unique as Set<string>)];
    }, [data]);

    const filteredData = useMemo(() => {
        if (requireSelection && selectedTitle === '') return [];
        if (selectedTitle === 'All') return data;
        return data.filter(p => p.payment_title === selectedTitle);
    }, [data, selectedTitle, requireSelection]);

    // Pagination Logic
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    // Update selectedTitle if requireSelection changes dynamically, though unlikely
    // useEffect(() => { if(requireSelection && selectedTitle === 'All') setSelectedTitle(''); }, [requireSelection]);

    const totalPages = Math.ceil(filteredData.length / pageSize);

    const toggleRow = (id: number) => {
        const newSet = new Set(expandedRowIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedRowIds(newSet);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter by Title:</span>
                    <select
                        value={selectedTitle}
                        onChange={(e) => { setSelectedTitle(e.target.value); setCurrentPage(1); }}
                        className="h-9 rounded-lg border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500 min-w-[200px]"
                    >
                        {requireSelection && <option value="" disabled>Select a Payment Title</option>}
                        {titles.map(title => (
                            <option key={title} value={title}>{title}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Total Records: <span className="font-semibold text-gray-900">{filteredData.length}</span></span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                            <th className="w-10 px-4 py-3"></th>
                            <th className="px-6 py-3 font-semibold text-gray-700">File No</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Name</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Payment Title</th>
                            <th className="px-6 py-3 font-semibold text-gray-700">Bank</th>
                            <th className="px-6 py-3 font-semibold text-gray-700 text-right">Netpay</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedData.map((row) => (
                            <React.Fragment key={row.id}>
                                <tr
                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                    onClick={() => toggleRow(row.id)}
                                >
                                    <td className="px-4 py-3 text-center text-gray-400">
                                        {expandedRowIds.has(row.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{row.file_no}</td>
                                    <td className="px-6 py-3 text-gray-600">{row.name}</td>
                                    <td className="px-6 py-3 text-gray-600">{row.payment_title}</td>
                                    <td className="px-6 py-3 text-gray-600">{row.bank}</td>
                                    <td className="px-6 py-3 text-gray-900 font-semibold text-right">₦{row.total_netpay?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                                {expandedRowIds.has(row.id) && (
                                    <tr className="bg-gray-50/50">
                                        <td colSpan={6} className="px-6 py-4 border-t border-gray-100 shadow-inner">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-2">Staff Details</h4>
                                                    <div className="flex justify-between"><span className="text-gray-500">Conraiss:</span> <span className="text-gray-900 font-medium">{row.conraiss}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Station:</span> <span className="text-gray-900 font-medium">{row.station}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Posted To:</span> <span className="text-gray-900 font-medium">{row.posting}</span></div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-2">Components</h4>
                                                    <div className="flex justify-between"><span className="text-gray-500">Transport:</span> <span className="text-gray-900">₦{row.transport?.toLocaleString()}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">DTA:</span> <span className="text-gray-900">₦{row.dta?.toLocaleString()}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Fuel/Local Runs:</span> <span className="text-gray-900">₦{row.fuel_local?.toLocaleString()}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Amt Per Night:</span> <span className="text-gray-900">₦{row.amount_per_night?.toLocaleString()}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Numb Nights:</span> <span className="text-gray-900">{row.numb_of_nights}</span></div>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-2">Financials</h4>
                                                    <div className="flex justify-between"><span className="text-gray-500">Gross Total:</span> <span className="text-gray-900 font-medium">₦{(row.total || (row.total_netpay && row.tax ? row.total_netpay / (1 - row.tax / 100) : row.total_netpay))?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                                                    <div className="flex justify-between"><span className="text-gray-500">Tax Deduction:</span> <span className="text-red-600 font-medium">- ₦{row.tax ? (((row.total || (row.total_netpay && row.tax ? row.total_netpay / (1 - row.tax / 100) : row.total_netpay)) || 0) * row.tax / 100).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'} ({row.tax}%)</span></div>
                                                    <div className="flex justify-between pt-2 border-t border-gray-200"><span className="font-bold text-gray-900">Netpay:</span> <span className="font-bold text-primary-700">₦{row.total_netpay?.toLocaleString()}</span></div>
                                                    <div className="flex justify-between mt-2"><span className="text-gray-500">Account No:</span> <span className="text-gray-900 font-mono">{row.account_numb}</span></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No payment records found matching the filter.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm outline-none bg-white"
                    >
                        {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                </div>
                <div className="flex gap-2 items-center">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-50"><ChevronsLeft className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm text-gray-600 px-2">Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{Math.max(1, totalPages)}</span></span>
                    <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages} className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages} className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-50"><ChevronsRight className="w-4 h-4" /></button>
                </div>
            </div>
        </div>
    );
}
