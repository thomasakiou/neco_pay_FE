import React from 'react';
import { Download, Search, CheckCircle } from 'lucide-react';

export default function ValidMatches() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-gray-900">Valid Matches</h1>
        <p className="text-gray-500">Successfully validated staff records from the latest upload.</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span>Total Valid Records:</span>
          <span className="font-bold text-gray-900">1,234</span>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search records..."
              className="w-full pl-10 h-10 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 h-10 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">
            <Download className="w-5 h-5" /> Export as CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-gray-900">File Number</th>
              <th className="px-6 py-4 font-semibold text-gray-900">Name</th>
              <th className="px-6 py-4 font-semibold text-gray-900">Station</th>
              <th className="px-6 py-4 font-semibold text-gray-900">CONRAISS</th>
              <th className="px-6 py-4 font-semibold text-gray-900">Validation Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[
              { num: 'NG-23840', name: 'Adebayo Oluwatoyin', st: 'Headquarters, Abuja', con: '08 Level 4', date: '2023-10-26' },
              { num: 'NG-23841', name: 'Chidinma Nwosu', st: 'State Office, Lagos', con: '09 Level 2', date: '2023-10-26' },
              { num: 'NG-23842', name: 'Musa Ibrahim', st: 'Zonal Office, Kano', con: '07 Level 5', date: '2023-10-26' },
              { num: 'NG-23843', name: 'Fatima Bello', st: 'State Office, Kaduna', con: '08 Level 3', date: '2023-10-26' },
            ].map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{row.num}</td>
                <td className="px-6 py-4 text-gray-600">{row.name}</td>
                <td className="px-6 py-4 text-gray-600">{row.st}</td>
                <td className="px-6 py-4 text-gray-600">{row.con}</td>
                <td className="px-6 py-4 text-gray-600">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}