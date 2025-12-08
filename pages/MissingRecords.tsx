import React from 'react';
import { Search, Filter, Ban, UserPlus } from 'lucide-react';

export default function MissingRecords() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">Missing Staff Records</h1>
        <p className="text-gray-500">Staff from the uploaded file not found in the master database.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-500 font-medium">Total Missing</p>
          <p className="text-3xl font-bold text-gray-900">152</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-500 font-medium">Pending Review</p>
          <p className="text-3xl font-bold text-gray-900">128</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-500 font-medium">Added</p>
          <p className="text-3xl font-bold text-gray-900">15</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200">
          <p className="text-gray-500 font-medium">Ignored</p>
          <p className="text-3xl font-bold text-gray-900">9</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Search by Name, Staff ID..." className="w-full pl-9 h-10 rounded-lg border-gray-300 text-sm" />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">
              <Ban className="w-4 h-4" /> Ignore Selected
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
              <UserPlus className="w-4 h-4" /> Add Selected
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-4 w-4"><input type="checkbox" className="rounded border-gray-300 text-primary-600" /></th>
                <th className="px-6 py-3">Staff ID</th>
                <th className="px-6 py-3">Full Name</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Job Title</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { id: 'ID-84321', name: 'John Doe', dept: 'Engineering', title: 'Senior Developer', status: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
                { id: 'ID-84322', name: 'Jane Smith', dept: 'Marketing', title: 'Marketing Manager', status: 'Added', color: 'bg-green-100 text-green-800' },
                { id: 'ID-84323', name: 'Peter Jones', dept: 'Sales', title: 'Sales Associate', status: 'Ignored', color: 'bg-gray-100 text-gray-800' },
                { id: 'ID-84324', name: 'Mary Williams', dept: 'Engineering', title: 'QA Tester', status: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-4"><input type="checkbox" className="rounded border-gray-300 text-primary-600" /></td>
                  <td className="px-6 py-4 text-gray-500">{row.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                  <td className="px-6 py-4 text-gray-500">{row.dept}</td>
                  <td className="px-6 py-4 text-gray-500">{row.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${row.color}`}>{row.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {row.status === 'Pending' && (
                      <>
                        <button className="text-primary-600 hover:underline font-medium">Add to Database</button>
                        <button className="text-red-600 hover:underline font-medium">Ignore</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}