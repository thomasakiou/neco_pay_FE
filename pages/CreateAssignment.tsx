import React from 'react';
import { UploadCloud, FileText, CheckCircle, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CreateAssignment() {
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate('/validation');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Home</span> / <span>Assignments</span> / <span className="text-gray-900 font-medium">Create New</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900">Create New Assignment</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-8">
        {/* Section 1 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">1. Assignment Details</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Assignment Title</label>
            <input 
              type="text" 
              placeholder="e.g., Q4 2024 Staff Payments" 
              className="w-full h-12 px-4 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Section 2 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">2. Upload Data File</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
            <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-900 font-medium mb-1">Click to upload <span className="font-normal text-gray-500">or drag and drop</span></p>
            <p className="text-sm text-gray-500">CSV or XLSX (MAX. 5MB)</p>
          </div>
          
          <p className="text-sm text-center text-gray-500">
            Ensure file columns: <code className="bg-gray-100 px-1 py-0.5 rounded">File Number</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">Name</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">Station</code>, <code className="bg-gray-100 px-1 py-0.5 rounded">CONRAISS</code>
          </p>

          <div className="space-y-3 pt-2">
            {/* Uploading File */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <FileText className="w-5 h-5 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">staff_payment_q3.xlsx</p>
                <p className="text-xs text-gray-500">3.2 MB</p>
              </div>
              <div className="w-24">
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 w-[45%]"></div>
                </div>
                <p className="text-xs text-right mt-1 text-gray-500">45%</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

             {/* Completed File */}
             <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="p-2 bg-white rounded-md shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 truncate">staff_payment_q2.csv</p>
                <p className="text-xs text-green-700">1.8 MB • Upload Complete</p>
              </div>
              <button className="text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
          <button className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold hover:bg-gray-50">Cancel</button>
          <button 
            onClick={handleCreate}
            className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-sm"
          >
            Create Assignment
          </button>
        </div>
      </div>
    </div>
  );
}