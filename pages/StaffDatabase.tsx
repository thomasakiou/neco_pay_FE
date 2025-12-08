import React, { useEffect, useState, useRef } from 'react';
import { Search, Plus, Upload, Filter, Trash2, Edit, Loader2, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, ChevronsLeft, ChevronsRight, ChevronLeft, RefreshCcw, X } from 'lucide-react';
import { getStaffList, createStaff, uploadStaff, resetPosted, updateStaff, deleteStaff } from '../services/staff';

// ...


import { Staff, CreateStaffDTO } from '../types/staff';
import StaffModal from '../components/StaffModal';
import Toast, { ToastType } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

// Helper for consistent colors
const stringToColor = (str: string = '') => {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-indigo-100 text-indigo-700',
    'bg-pink-100 text-pink-700',
    'bg-orange-100 text-orange-700',
    'bg-teal-100 text-teal-700',
    'bg-cyan-100 text-cyan-700'
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function StaffDatabase() {
  const [allData, setAllData] = useState<Staff[]>([]); // Stores ALL fetched data
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error] = useState<string | null>(null); // Kept for logic compatibility, but handling errors via Toast now mainly

  // Pagination & Sorting State
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Staff; direction: 'asc' | 'desc' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filterActive, setFilterActive] = useState<string>('All');
  const [filterPosted, setFilterPosted] = useState<string>('All');
  const [filterBank, setFilterBank] = useState<string>('All');
  const [filterReason, setFilterReason] = useState<string>('All');

  // UI State
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
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
      // Fetch a large number to simulate "Get All" for client-side processing
      const result = await getStaffList(0, 10000);
      setAllData(result);
    } catch (err) {
      showToast('Failed to load staff data. Please ensure the backend is running.', 'error');
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
      await uploadStaff(file);
      // Refresh data after upload
      await fetchData();
      showToast('Staff data imported successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to import staff data', 'error');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSort = (key: keyof Staff) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleResetPosted = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Posted Status',
      message: 'Are you sure you want to reset ALL Posted statuses to "N"? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          setLoading(true);
          await resetPosted();
          await fetchData(); // Refresh data to reflect server state
          showToast('All records have been reset to Posted: NO.', 'success');
        } catch (err: any) {
          showToast(err.message || 'Failed to reset posted status.', 'error');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // Derive Dynamic Filter Options
  const uniqueBanks = React.useMemo(() => {
    const banks = new Set(allData.map(item => item.bank_name).filter(Boolean));
    return Array.from(banks).sort();
  }, [allData]);

  const uniqueReasons = React.useMemo(() => {
    const reasons = new Set(allData.map(item => item.reason).filter(Boolean));
    return Array.from(reasons).sort();
  }, [allData]);

  // 1. Filter
  const filteredData = React.useMemo(() => {
    let data = allData;

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter(item =>
        (item.name1?.toLowerCase().includes(lowerQuery)) ||
        (item.surname?.toLowerCase().includes(lowerQuery)) ||
        (item.firstname?.toLowerCase().includes(lowerQuery)) ||
        (item.staff_id?.toLowerCase().includes(lowerQuery)) ||
        (item.department?.toLowerCase().includes(lowerQuery))
      );
    }

    // Filter Active
    if (filterActive !== 'All') {
      const isActive = filterActive === 'Active';
      data = data.filter(item => item.active === isActive);
    }

    // Filter Posted
    if (filterPosted !== 'All') {
      const target = filterPosted === 'Yes' ? 'Y' : 'N';
      data = data.filter(item => item.posted === target);
    }

    // Filter Bank
    if (filterBank !== 'All') {
      data = data.filter(item => item.bank_name === filterBank);
    }

    // Filter Reason
    if (filterReason !== 'All') {
      data = data.filter(item => item.reason === filterReason);
    }

    return data;
  }, [allData, searchQuery, filterActive, filterPosted, filterBank, filterReason]);

  // 2. Sort
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

  // 3. Paginate
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const toggleRow = (id: number) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setIsModalOpen(true);
  };

  const openEditModal = (staff: Staff, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expand
    setEditingStaff(staff);
    setIsModalOpen(true);
  };

  const handleSubmitStaff = async (formData: CreateStaffDTO) => {
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, formData);
        showToast('Staff record updated successfully', 'success');
      } else {
        await createStaff(formData);
        showToast('New staff member added successfully', 'success');
      }
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to save staff', 'error');
    }
  };

  const handleDeleteClick = (staff: Staff, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Staff Member',
      message: `Are you sure you want to delete ${staff.surname} ${staff.firstname}? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await deleteStaff(staff.id);
          showToast('Staff member deleted successfully', 'success');
          await fetchData();
        } catch (err: any) {
          showToast(err.message || 'Failed to delete staff', 'error');
        }
      }
    });
  };

  const renderSortIcon = (key: keyof Staff) => {
    if (sortConfig?.key !== key) return <ArrowUpDown className="w-4 h-4 text-gray-400 ml-1" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-4 h-4 text-primary-600 ml-1" />
      : <ArrowDown className="w-4 h-4 text-primary-600 ml-1" />;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ConfirmModal
        isOpen={!!confirmModal}
        title={confirmModal?.title || ''}
        message={confirmModal?.message || ''}
        onConfirm={() => confirmModal?.onConfirm()}
        onCancel={() => setConfirmModal(null)}
        isDestructive={true}
      />

      <StaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitStaff}
        initialData={editingStaff}
        title={editingStaff ? "Edit Staff" : "Add New Staff"}
      />

      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-gray-900">Staff Database Management</h1>
        <p className="text-gray-500">Manage staff records, add new staff, and upload master data.</p>
      </div>

      {/* Main Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, ID, or department..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 h-12 rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500 shadow-sm transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
          <button onClick={handleResetPosted} className="flex-1 sm:flex-none h-12 px-4 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-medium hover:bg-orange-200 flex items-center justify-center gap-2 shadow-sm transition-all">
            <RefreshCcw className="w-4 h-4" />
            Reset Posted
          </button>

          <button onClick={openAddModal} className="flex-1 sm:flex-none h-12 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2 shadow-sm transition-all">
            <Plus className="w-5 h-5" />
            Add Staff
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.xlsx,.xls,.dbf"
            onChange={handleFileChange}
          />
          <button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex-1 sm:flex-none h-12 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary-600" /> : <Upload className="w-5 h-5" />}
            {isUploading ? 'Uploading...' : 'Upload CSV'}
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Active Status</label>
          <div className="relative">
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="w-full h-10 pl-3 pr-8 rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm appearance-none bg-white"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Posted Status</label>
          <div className="relative">
            <select
              value={filterPosted}
              onChange={(e) => setFilterPosted(e.target.value)}
              className="w-full h-10 pl-3 pr-8 rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm appearance-none bg-white"
            >
              <option value="All">All Items</option>
              <option value="Yes">Posted (Yes)</option>
              <option value="No">Not Posted (No)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Bank</label>
          <div className="relative">
            <select
              value={filterBank}
              onChange={(e) => setFilterBank(e.target.value)}
              className="w-full h-10 pl-3 pr-8 rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm appearance-none bg-white"
            >
              <option value="All">All Banks</option>
              {uniqueBanks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-500 uppercase">Reason</label>
          <div className="relative">
            <select
              value={filterReason}
              onChange={(e) => setFilterReason(e.target.value)}
              className="w-full h-10 pl-3 pr-8 rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm appearance-none bg-white"
            >
              <option value="All">All Reasons</option>
              {uniqueReasons.map(reason => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">

        {/* Table Header Controls */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-primary-500 focus:border-primary-500 outline-none bg-white font-medium text-gray-900"
            >
              {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
          {/* Active Filters Display could go here */}
          {(filterActive !== 'All' || filterPosted !== 'All' || filterBank !== 'All' || filterReason !== 'All') && (
            <button
              onClick={() => {
                setFilterActive('All');
                setFilterPosted('All');
                setFilterBank('All');
                setFilterReason('All');
              }}
              className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 font-medium"
            >
              <X className="w-4 h-4" /> Clear Filters
            </button>
          )}
        </div>

        {loading && allData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <span className="ml-2 text-gray-500">Loading Staff Data...</span>
          </div>
        ) : error && !toast ? (
          <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 cursor-pointer select-none">
                <tr>
                  <th className="px-6 py-4 w-10"></th>
                  <th onClick={() => handleSort('staff_id')} className="px-6 py-4 font-semibold text-gray-600 flex items-center hover:bg-gray-100 transition-colors">Per No {renderSortIcon('staff_id')}</th>
                  <th onClick={() => handleSort('surname')} className="px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Name {renderSortIcon('surname')}</th>
                  <th onClick={() => handleSort('department')} className="px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Department {renderSortIcon('department')}</th>
                  <th onClick={() => handleSort('location')} className="px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Location {renderSortIcon('location')}</th>
                  <th onClick={() => handleSort('level')} className="px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Level {renderSortIcon('level')}</th>
                  <th onClick={() => handleSort('active')} className="px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Active {renderSortIcon('active')}</th>
                  <th onClick={() => handleSort('posted')} className="px-6 py-4 font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Posted {renderSortIcon('posted')}</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedData.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedRowId === row.id ? 'bg-gray-50' : ''}`} onClick={() => toggleRow(row.id)}>
                      <td className="px-6 py-4 text-gray-400">
                        {expandedRowId === row.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{row.staff_id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{row.name1 || `${row.surname} ${row.firstname}`}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${stringToColor(row.department || '')}`}>
                          {row.department || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{row.location}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-gray-700 text-xs font-bold border border-gray-200">
                          {row.level || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex w-fit items-center gap-1 ${row.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${row.active ? 'bg-green-600' : 'bg-red-600'}`}></span>
                          {row.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-bold ${row.posted === 'Y' ? 'text-green-600' : row.posted === 'N' ? 'text-red-500' : 'text-gray-500'}`}>
                          {row.posted === 'Y' ? 'YES' : row.posted === 'N' ? 'NO' : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={(e) => openEditModal(row, e)} className="p-1.5 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                          <button onClick={(e) => handleDeleteClick(row, e)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    {expandedRowId === row.id && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={9} className="px-6 py-8 border-t border-gray-100 shadow-inner">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">

                            <div className="space-y-1">
                              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-2">Organization</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <span className="text-gray-500">State:</span> <span className="text-gray-900">{row.state}</span>
                                <span className="text-gray-500">Level:</span> <span className="text-gray-900">{row.level}</span>
                                <span className="text-gray-500">Step:</span> <span className="text-gray-900">{row.step}</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-2">Banking</h4>
                              <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1">
                                <span className="text-gray-500">Bank:</span> <span className="text-gray-900 font-medium">{row.bank_name}</span>
                                <span className="text-gray-500">Account:</span> <span className="text-gray-900 font-mono">{row.account_no}</span>
                                <span className="text-gray-500">Sort Code:</span> <span className="text-gray-900">{row.sortcode}</span>
                                <span className="text-gray-500">Code:</span> <span className="text-gray-900">{row.bank_code}</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-1 mb-2">Meta</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <span className="text-gray-500">Added:</span> <span className="text-gray-900">{row.created_at ? new Date(row.created_at).toLocaleDateString() : 'N/A'}</span>
                                <span className="text-gray-500">Remark:</span> <span className="text-gray-900">{row.remark || '-'}</span>
                                <span className="text-gray-500">Reason:</span> <span className="text-gray-900">{row.reason || '-'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            {paginatedData.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No staff records found.
              </div>
            )}
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-wrap gap-4 bg-gray-50">
          <div className="text-sm text-gray-500">
            Total Records: <span className="font-semibold text-gray-900">{sortedData.length}</span>
          </div>

          <div className="flex gap-2 items-center">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-100 transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-100 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-sm text-gray-600 px-2">
              Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{Math.max(1, totalPages)}</span>
            </span>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-100 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages}
              className="p-2 bg-white border border-gray-300 rounded-md text-gray-600 disabled:opacity-50 hover:bg-gray-100 transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}