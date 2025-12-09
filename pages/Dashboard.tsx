import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { ArrowUp, ArrowDown, Users, FileText, CheckCircle, AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import { getPayments } from '../services/payment';
import { getStaffList } from '../services/staff';
import { PaymentDTO } from '../types/payment';
import { Staff } from '../types/staff';

interface DashboardStats {
  totalStaff: number;
  totalPayments: number;
  totalPayout: number;
  uniqueTitles: number;
  bankCount: number;
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

export default function Dashboard() {
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStaff: 0,
    totalPayments: 0,
    totalPayout: 0,
    uniqueTitles: 0,
    bankCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [paymentsData, staffData] = await Promise.all([
          getPayments(),
          getStaffList(0, 10000) // Fetch all staff with high limit
        ]);

        setPayments(paymentsData);
        setStaff(staffData);

        // Calculate stats
        const totalPayout = paymentsData.reduce((sum, p) => sum + (p.total_netpay || 0), 0);
        const uniqueTitles = new Set(paymentsData.map(p => p.payment_title).filter(Boolean)).size;
        const uniqueBanks = new Set(paymentsData.map(p => p.bank).filter(Boolean)).size;

        setStats({
          totalStaff: staffData.length,
          totalPayments: paymentsData.length,
          totalPayout,
          uniqueTitles,
          bankCount: uniqueBanks
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group payments by bank
  const bankData = React.useMemo(() => {
    const grouped: Record<string, number> = {};
    payments.forEach(p => {
      const bank = p.bank || 'Unknown';
      grouped[bank] = (grouped[bank] || 0) + (p.total_netpay || 0);
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [payments]);

  // Group payments by payment title
  const titleData = React.useMemo(() => {
    const grouped: Record<string, number> = {};
    payments.forEach(p => {
      const title = p.payment_title || 'Unknown';
      grouped[title] = (grouped[title] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [payments]);

  // Recent payments (last 10)
  const recentPayments = React.useMemo(() => {
    return [...payments]
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 10);
  }, [payments]);

  // Station statistics
  const stationData = React.useMemo(() => {
    const grouped: Record<string, { count: number; total: number }> = {};
    payments.forEach(p => {
      const station = p.station || 'Unknown';
      if (!grouped[station]) {
        grouped[station] = { count: 0, total: 0 };
      }
      grouped[station].count++;
      grouped[station].total += p.total_netpay || 0;
    });
    return Object.entries(grouped)
      .map(([name, data]) => ({
        name,
        staff: data.count,
        amount: data.total
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [payments]);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `₦${(amount / 1000000000).toFixed(2)}B`;
    } else if (amount >= 1000000) {
      return `₦${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `₦${(amount / 1000).toFixed(2)}K`;
    }
    return `₦${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Administrator. Overview of payment system.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Staff"
          value={stats.totalStaff.toLocaleString()}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Payment Records"
          value={stats.totalPayments.toLocaleString()}
          icon={FileText}
          color="bg-green-500"
        />
        <StatCard
          title="Payment Titles"
          value={stats.uniqueTitles}
          icon={CheckCircle}
          color="bg-purple-500"
        />
        <StatCard
          title="Banks"
          value={stats.bankCount}
          icon={AlertCircle}
          color="bg-orange-500"
        />
        <StatCard
          title="Total Payout"
          value={formatCurrency(stats.totalPayout)}
          icon={DollarSign}
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payments Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Recent Payments</h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Bank</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{payment.name || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-500">{payment.bank || 'N/A'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatCurrency(payment.total_netpay || 0)}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No payment records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Titles Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Titles</h2>
          <div className="space-y-3 flex-1">
            {titleData.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.value} records</p>
                </div>
              </div>
            ))}
            {titleData.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-8">No data available</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Distribution Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Bank Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bankData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Station Statistics */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top Stations by Payout</h2>
          <div className="space-y-4 overflow-y-auto flex-1">
            {stationData.map((station, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">{station.name}</p>
                  <p className="text-xs text-gray-500">{station.staff} payments</p>
                </div>
                <span className="font-bold text-gray-900">{formatCurrency(station.amount)}</span>
              </div>
            ))}
            {stationData.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-8">No station data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}