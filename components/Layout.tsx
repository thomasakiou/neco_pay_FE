import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UploadCloud,
  CreditCard,
  FileBarChart,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  Menu,
  X,
  ShieldCheck,
  Search,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Upload,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { generatePaymentInsights } from '../services/geminiService';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${isActive
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span>{label}</span>
  </NavLink>
);

const NavSection = ({ label, children, isOpen, onToggle }: { label: string; children: React.ReactNode; isOpen: boolean; onToggle: () => void }) => (
  <div className="space-y-1 pt-3">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-gray-700 uppercase tracking-wider hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-all group bg-gray-100"
    >
      <span>{label}</span>
      {isOpen ? (
        <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
      ) : (
        <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
      )}
    </button>
    {isOpen && (
      <div className="space-y-1 pl-2 animate-in slide-in-from-top-2 duration-200">
        {children}
      </div>
    )}
  </div>
);

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    master: true,
    payment: true,
    report: true,
    validation: true,
    system: true,
    tools: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    navigate('/');
  };

  const handleAiQuery = async () => {
    if (!aiPrompt) return;
    setIsLoadingAi(true);
    const response = await generatePaymentInsights(aiPrompt);
    setAiResponse(response);
    setIsLoadingAi(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-xl">
              N
            </div>
            <div>
              <h1 className="font-bold text-gray-900">NECO Pay</h1>
              <p className="text-xs text-gray-500">Payment Manager</p>
            </div>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <SidebarItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <SidebarItem to="/staff" icon={Users} label="Staff Database" />


            <NavSection
              label="Master Data"
              isOpen={openSections.master}
              onToggle={() => toggleSection('master')}
            >
              <SidebarItem to="/banks" icon={CreditCard} label="Banks" />
              <SidebarItem to="/states" icon={CreditCard} label="States" />
              <SidebarItem to="/distance" icon={UploadCloud} label="Distance" />
              <SidebarItem to="/parameter" icon={CreditCard} label="Payment Parameter" />
            </NavSection>

            <NavSection
              label="TOOLS"
              isOpen={openSections.tools}
              onToggle={() => toggleSection('tools')}
            >
              <SidebarItem to="/utility" icon={RefreshCw} label="Cleaning" />
              <SidebarItem to="/staging" icon={FileSpreadsheet} label="Staging" />
            </NavSection>

            <NavSection
              label="Payment"
              isOpen={openSections.payment}
              onToggle={() => toggleSection('payment')}
            >
              <SidebarItem to="/posting" icon={Upload} label="Posting" />
              <SidebarItem to="/payments" icon={CreditCard} label="Payment" />
            </NavSection>

            <NavSection
              label="Report"
              isOpen={openSections.report}
              onToggle={() => toggleSection('report')}
            >
              <SidebarItem to="/reports" icon={FileBarChart} label="Reports" />
            </NavSection>
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setShowAiModal(true)}
              className="flex w-full items-center justify-center gap-2 px-4 py-2 mb-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI Assistant
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 px-4 lg:px-8">
            {/* Breadcrumbs or Title could go here */}
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Finance Officer</p>
              </div>
              <img
                src="https://ui-avatars.com/api/?name=Admin+User&background=10b981&color=fff"
                alt="Profile"
                className="w-9 h-9 rounded-full border-2 border-white shadow-sm"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary-600" />
                Payment Assistant
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 h-64 overflow-y-auto">
              {aiResponse ? (
                <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 text-sm leading-relaxed text-gray-700">
                  {aiResponse}
                </div>
              ) : (
                <p className="text-center text-gray-500 text-sm mt-10">Ask me about payment anomalies, staff distribution, or budget trends.</p>
              )}
            </div>
            <div className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
                />
                <button
                  onClick={handleAiQuery}
                  disabled={isLoadingAi}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {isLoadingAi ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}