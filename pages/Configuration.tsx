import React from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';

export default function Configuration() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur py-4 z-10 border-b border-gray-200 lg:border-none">
        <h1 className="text-3xl font-black text-gray-900">Payment Configuration</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-sm">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Station Rates */}
        <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Station Rates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Standard Rate</label>
              <input type="text" placeholder="$0.00" className="w-full h-12 px-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Overtime Rate</label>
              <input type="text" placeholder="$0.00" className="w-full h-12 px-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Weekend Rate</label>
              <input type="text" placeholder="$0.00" className="w-full h-12 px-3 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
        </div>

        {/* CONRAISS Pay Table */}
        <div className="col-span-1 md:col-span-3 bg-white p-6 rounded-xl border border-gray-200">
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">CONRAISS Pay Table</h2>
            <button className="flex items-center gap-1 text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-lg hover:bg-primary-100">
              <Plus className="w-4 h-4" /> Add New Range
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="p-3 font-semibold text-gray-500">Range Start</th>
                  <th className="p-3 font-semibold text-gray-500">Range End</th>
                  <th className="p-3 font-semibold text-gray-500">Amount</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { s: '$50,000', e: '$75,000', a: '$1,200' },
                  { s: '$75,001', e: '$100,000', a: '$1,500' }
                ].map((r, i) => (
                  <tr key={i}>
                    <td className="p-3"><input type="text" defaultValue={r.s} className="w-full rounded-lg border-gray-300 h-10 px-3" /></td>
                    <td className="p-3"><input type="text" defaultValue={r.e} className="w-full rounded-lg border-gray-300 h-10 px-3" /></td>
                    <td className="p-3"><input type="text" defaultValue={r.a} className="w-full rounded-lg border-gray-300 h-10 px-3" /></td>
                    <td className="p-3 text-center"><button className="text-gray-400 hover:text-red-500"><Trash2 className="w-5 h-5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Local Running */}
        <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Local Running</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
             <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Minimum Range</label>
              <input type="text" placeholder="Min" className="w-full h-12 px-3 rounded-lg border-gray-300" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Maximum Range</label>
              <input type="text" placeholder="Max" className="w-full h-12 px-3 rounded-lg border-gray-300" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Amount</label>
            <input type="text" placeholder="Enter amount" className="w-full h-12 px-3 rounded-lg border-gray-300" />
          </div>
        </div>

        {/* Params */}
        <div className="col-span-1 bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Calculation Parameters</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Number of Nights</label>
            <input type="number" placeholder="Enter number" className="w-full h-12 px-3 rounded-lg border-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}