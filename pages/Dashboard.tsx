import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ArrowUp, ArrowDown, FileText, Search } from 'lucide-react';

const data = [
  { name: 'Basic', value: 80 },
  { name: 'Housing', value: 60 },
  { name: 'Transport', value: 45 },
  { name: 'Utility', value: 30 },
  { name: 'Medical', value: 55 },
  { name: 'Others', value: 25 },
];

const pieData = [
  { name: 'CONRAISS 1-5', value: 35, color: '#4f46e5' },
  { name: 'CONRAISS 6-10', value: 30, color: '#6366f1' },
  { name: 'CONRAISS 11-15', value: 20, color: '#818cf8' },
  { name: 'Others', value: 15, color: '#cbd5e1' },
];

const StatCard = ({ title, value, change, isPositive }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-2">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
    <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-primary-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
      <span>{change}</span>
    </div>
  </div>
);

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Administrator. Overview of current payment cycle.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-gray-200">
          {['Last 24 Hours', 'Last 7 Days', 'Last 30 Days'].map((range, i) => (
            <button 
              key={range}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${i === 0 ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Staff" value="15,234" change="+1.2%" isPositive={true} />
        <StatCard title="Uploaded Assignments" value="89" change="+5" isPositive={true} />
        <StatCard title="Verified Records" value="14,876" change="+45" isPositive={true} />
        <StatCard title="Flagged Mismatches" value="358" change="-3" isPositive={false} />
        <StatCard title="Total Payout" value="₦1.25B" change="+2.5%" isPositive={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Uploads Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Recent Uploads</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">File Name</th>
                  <th className="px-6 py-3 font-medium">Upload Date</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: 'Posting_Record_May.xlsx', date: '2024-05-30', status: 'Verified', color: 'bg-green-100 text-green-700' },
                  { name: 'Correction_File_Apr.csv', date: '2024-05-28', status: 'Verified', color: 'bg-green-100 text-green-700' },
                  { name: 'Adj_Staff_List.xlsx', date: '2024-05-25', status: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
                  { name: 'Posting_Record_Apr.xlsx', date: '2024-04-30', status: 'Mismatched', color: 'bg-red-100 text-red-700' },
                  { name: 'New_Hires_Q1.csv', date: '2024-04-15', status: 'Verified', color: 'bg-green-100 text-green-700' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{row.name}</td>
                    <td className="px-6 py-4 text-gray-500">{row.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${row.color}`}>{row.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary-600 hover:text-primary-700 font-medium">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">CONRAISS Distribution</h2>
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">15,234</span>
              <span className="text-xs text-gray-500">Total Staff</span>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {pieData.map((item) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Summaries Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Cost Summaries</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Station Statistics */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Station Statistics</h2>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search station..." 
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="space-y-4 overflow-y-auto max-h-60 pr-2">
            {[
              { name: 'Abuja FCT', staff: '1,250', amount: '₦120.5M' },
              { name: 'Lagos State', staff: '1,180', amount: '₦115.2M' },
              { name: 'Rivers State', staff: '980', amount: '₦95.8M' },
              { name: 'Kano State', staff: '952', amount: '₦92.1M' },
              { name: 'Kaduna State', staff: '890', amount: '₦88.7M' },
            ].map((station, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900">{station.name}</p>
                  <p className="text-xs text-gray-500">{station.staff} Staff</p>
                </div>
                <span className="font-bold text-gray-900">{station.amount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}