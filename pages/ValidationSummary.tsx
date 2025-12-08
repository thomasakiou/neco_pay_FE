import React from 'react';
import { Download, ArrowRight, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SummaryCard = ({ title, value, subtext, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col gap-2">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
    <p className={`text-base font-medium ${color}`}>{subtext}</p>
  </div>
);

const DetailCard = ({ title, count, desc, icon: Icon, color, bg, btnText, link }: any) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${bg} ${color}`}>{count}</span>
      </div>
      <p className="text-sm text-gray-500">{desc}</p>
      <button 
        onClick={() => navigate(link)}
        className="mt-auto text-sm font-bold text-primary-600 hover:underline text-left"
      >
        {btnText}
      </button>
    </div>
  );
}

export default function ValidationSummary() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Dashboard</span> / <span>File Upload</span> / <span className="text-gray-900 font-medium">Validation Summary</span>
        </div>
        
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Data Validation Summary</h1>
            <p className="text-gray-500">A summary of the staff data validation process results.</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg font-bold text-gray-700 bg-white hover:bg-gray-50">
               <Download className="w-4 h-4" />
               Export Report
             </button>
             <button 
              onClick={() => navigate('/staging')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-sm"
            >
               Proceed to Payment Calculation
             </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Records Processed" value="1500" subtext="" color="text-gray-500" />
        <SummaryCard title="Valid Matches" value="1250" subtext="+83%" color="text-green-600" />
        <SummaryCard title="Mismatches" value="150" subtext="10%" color="text-yellow-600" />
        <SummaryCard title="Missing Staff" value="100" subtext="7%" color="text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DetailCard 
          title="Valid Matches" 
          count="1250" 
          desc="Records that successfully matched existing staff data and are ready for payment calculation."
          icon={CheckCircle}
          color="text-green-600"
          bg="bg-green-50"
          btnText="View Details"
          link="/validation/valid"
        />
        <DetailCard 
          title="Mismatches" 
          count="150" 
          desc="Records where staff ID was found but other details (e.g., name, bank info) do not match. These require review."
          icon={AlertTriangle}
          color="text-yellow-600"
          bg="bg-yellow-50"
          btnText="Review Mismatches"
          link="/validation/mismatch"
        />
        <DetailCard 
          title="Missing Staff" 
          count="100" 
          desc="Records where the provided staff ID was not found. These will be excluded from payment processing."
          icon={AlertOctagon}
          color="text-red-600"
          bg="bg-red-50"
          btnText="View Missing Records"
          link="/validation/missing"
        />
      </div>
    </div>
  );
}