import React from 'react';
import { Search, Filter, MoreVertical } from 'lucide-react';

export default function MismatchedRecords() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-black text-gray-900">Mismatched Records</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col gap-1">
          <p className="text-gray-500 font-medium">Total Mismatches</p>
          <p className="text-3xl font-bold text-gray-900">1,204</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col gap-1">
          <p className="text-gray-500 font-medium">Pending Review</p>
          <p className="text-3xl font-bold text-yellow-500">850</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col gap-1">
          <p className="text-gray-500 font-medium">Resolved</p>
          <p className="text-3xl font-bold text-green-500">354</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by staff name or ID"
            className="w-full pl-10 h-12 rounded-lg border-gray-200 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          {['Mismatch Type: All', 'Status: All', 'Date Range'].map(label => (
            <button key={label} className="flex items-center gap-2 px-4 h-12 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 whitespace-nowrap hover:bg-gray-50">
              {label}
              <Filter className="w-4 h-4 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 w-4"><input type="checkbox" className="rounded border-gray-300 text-primary-600" /></th>
                <th className="px-6 py-4 font-semibold text-gray-600">Staff ID</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Staff Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Mismatch Type</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Uploaded Value</th>
                <th className="px-6 py-4 font-semibold text-gray-600">System Value</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { id: 'STF-00123', name: 'Adewale Johnson', type: 'Name', up: 'Adewale Jonson', sys: 'Adewale Johnson', status: 'Pending Review', statusColor: 'bg-yellow-100 text-yellow-700' },
                { id: 'STF-00456', name: 'Bolanle Adeboye', type: 'Station', up: 'Lagos', sys: 'Abuja', status: 'Pending Review', statusColor: 'bg-yellow-100 text-yellow-700' },
                { id: 'STF-00789', name: 'Chiamaka Nwosu', type: 'CONRAISS', up: '7', sys: '8', status: 'Resolved', statusColor: 'bg-green-100 text-green-700' },
                { id: 'STF-01122', name: 'Musa Ibrahim', type: 'Station', up: 'Kano', sys: 'Kaduna', status: 'Resolved', statusColor: 'bg-green-100 text-green-700' },
                { id: 'STF-01357', name: 'Fatima Bello', type: 'Name', up: 'Fatima Belio', sys: 'Fatima Bello', status: 'Pending Review', statusColor: 'bg-yellow-100 text-yellow-700' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300 text-primary-600" /></td>
                  <td className="px-6 py-4 text-gray-500">{row.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                  <td className="px-6 py-4 text-gray-500">{row.type}</td>
                  <td className="px-6 py-4"><span className="bg-red-50 text-red-700 px-2 py-1 rounded">{row.up}</span></td>
                  <td className="px-6 py-4 text-gray-900">{row.sys}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${row.statusColor}`}>{row.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-gray-400 hover:text-gray-600"><MoreVertical className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-500">Showing 1 to 5 of 850 results</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">Prev</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-sm">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}