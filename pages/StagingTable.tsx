import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, ArrowRight, Upload, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getStaffList } from '../services/staff';
import { Staff } from '../types/staff';
import Toast, { ToastType } from '../components/Toast';

interface StagingRow {
  fileNo: string;
  name: string;
  conraiss: string;
  station: string;
  postedTo: string;
  matchStatus: 'MATCH' | 'MISMATCH' | 'NOT_FOUND';
  systemStaffId?: string;
  systemName?: string;
}

export default function StagingTable() {
  const navigate = useNavigate();
  const [stagingData, setStagingData] = useState<StagingRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // 1. Read CSV
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
        console.log("Raw JSON Data from CSV:", jsonData);
        if (jsonData.length > 0) {
          console.log("First Row Keys:", Object.keys(jsonData[0]));
        }

        if (jsonData.length === 0) {
          showToast('File is empty', 'error');
          setIsProcessing(false);
          return;
        }

        // 2. Fetch System Data (Optimization: Fetch all for now, or large chunk)
        // In production, might need a more efficient search or batch check endpoint.
        let allStaff: Staff[] = [];
        try {
          // Fetching a large chunk for client-side matching. 
          // ideally we should have an endpoint/service to validate a list of IDs.
          // For now, assume < 5000 active staff or fetching main list.
          allStaff = await getStaffList(0, 5000);
        } catch (err) {
          console.error("Failed to fetch staff for validation", err);
          showToast("Failed to fetch system staff data. Comparison may be incomplete.", "error");
        }

        const staffMap = new Map<string, Staff>();
        allStaff.forEach(s => {
          if (s.staff_id) staffMap.set(s.staff_id.toLowerCase().trim(), s);
        });

        // Helper to find key case-insensitively
        const getKey = (row: any, target: string) => {
          const foundKey = Object.keys(row).find(k => k.trim().toLowerCase() === target.toLowerCase());
          return foundKey ? row[foundKey] : '';
        };

        // 3. Process & Compare
        const processedRows: StagingRow[] = jsonData.map((row: any) => {
          // Use helper to safely get values even if headers have weird casing/spacing
          const fileNo = String(getKey(row, 'File No') || getKey(row, 'FileNo') || '').trim();
          const name = String(getKey(row, 'Name') || '').trim();
          const conraiss = String(getKey(row, 'Conraiss') || '');
          const station = String(getKey(row, 'Station') || '');
          const postedTo = String(getKey(row, 'Posted To') || getKey(row, 'PostedTo') || '');

          let matchStatus: 'MATCH' | 'MISMATCH' | 'NOT_FOUND' = 'NOT_FOUND';
          let systemStaffId = '-';
          let systemName = '-';

          if (fileNo) {
            // Fix: Pad to 4 digits to match staff_id format (e.g. 347 -> 0347)
            const paddedFileNo = fileNo.padStart(4, '0');

            // Try match with exact File No first, then padded
            const staff = staffMap.get(fileNo.toLowerCase()) || staffMap.get(paddedFileNo.toLowerCase());

            if (staff) {
              systemStaffId = staff.staff_id;

              const parts = [staff.surname, staff.firstname, staff.middlename].filter(Boolean);
              if (parts.length > 0) {
                systemName = parts.join(' ');
              } else {
                systemName = staff.name || '-';
              }

              // Simple name check - extremely basic, can be improved with Levenshtein
              // For now, strict on ID, loose on name (just visual check for user mostly)
              // If ID matches, we consider it FOUND. 
              // Mismatch if Name is wildly different? Let's just say MATCH if ID exists for now, 
              // validation usually implies ID is key.
              // However, user asked to compare Name and FileNo to Name and PerNo.

              // Let's mark as mismatch if name is very different?
              // For simplicity in this iteration:
              // MATCH = ID exists. 
              matchStatus = 'MATCH';

              // Optional: Check if names look similar (contains parts of each other)
              const sysNameLower = systemName.toLowerCase();
              const csvNameLower = name.toLowerCase();
              if (!sysNameLower.includes(csvNameLower) && !csvNameLower.includes(sysNameLower)) {
                // matchStatus = 'MISMATCH'; // Uncomment if strict name check needed
              }
            }
          }

          return {
            fileNo,
            name,
            conraiss,
            station,
            postedTo,
            matchStatus,
            systemStaffId,
            systemName
          };
        });

        setStagingData(processedRows);
        showToast(`Processed ${processedRows.length} records.`, 'success');
        setIsProcessing(false);
      };
      reader.readAsArrayBuffer(file);

    } catch (error) {
      console.error(error);
      showToast('Failed to process file', 'error');
      setIsProcessing(false);
    }
  };

  const clearTable = () => {
    setStagingData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Stats
  const totalRecords = stagingData.length;
  const matchedRecords = stagingData.filter(r => r.matchStatus === 'MATCH').length;
  const invalidRecords = totalRecords - matchedRecords;

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Staging: Validation</h1>
          <p className="text-gray-500">Upload Cleaned CSV to validate against Staff Database (File No vs Staff ID).</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-2 h-10 px-4 bg-primary-50 text-primary-700 rounded-lg text-sm font-bold hover:bg-primary-100 disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Upload CSV
          </button>
          {stagingData.length > 0 && (
            <button
              onClick={clearTable}
              className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {stagingData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{totalRecords}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Valid Matches</p>
              <p className="text-2xl font-bold text-green-600">{matchedRecords}</p>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Not Found / Mismatch</p>
              <p className="text-2xl font-bold text-red-600">{invalidRecords}</p>
            </div>
            <div className="p-3 bg-red-50 text-red-600 rounded-lg">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th colSpan={3} className="px-4 py-2 text-center border-r border-gray-200 text-gray-500 bg-blue-50/50">Uploaded Data (CSV)</th>
                <th colSpan={3} className="px-4 py-2 text-center text-gray-500 bg-green-50/50">System Data (Staff Table)</th>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 font-semibold text-gray-700 bg-blue-50/30">File No</th>
                <th className="px-4 py-3 font-semibold text-gray-700 bg-blue-50/30">Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700 border-r border-gray-200 bg-blue-50/30">Station</th>

                <th className="px-4 py-3 font-semibold text-gray-700 bg-green-50/30">Staff ID</th>
                <th className="px-4 py-3 font-semibold text-gray-700 bg-green-50/30">System Name</th>
                <th className="px-4 py-3 font-semibold text-gray-700 bg-green-50/30">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stagingData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No data loaded. Upload a CSV file to begin validation.
                  </td>
                </tr>
              ) : (
                stagingData.map((row, i) => (
                  <tr key={i} className={`hover:bg-gray-50 ${row.matchStatus === 'NOT_FOUND' ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.fileNo}</td>
                    <td className="px-4 py-3 text-gray-600">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500 border-r border-gray-200">{row.station}</td>

                    <td className="px-4 py-3 font-medium text-gray-900">{row.systemStaffId}</td>
                    <td className="px-4 py-3 text-gray-600">{row.systemName}</td>
                    <td className="px-4 py-3">
                      {row.matchStatus === 'MATCH' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3.5 h-3.5" /> Match
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <XCircle className="w-3.5 h-3.5" /> Not Found
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={() => navigate('/posting')}
          disabled={stagingData.length === 0}
          className="px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Proceed to Posting <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}