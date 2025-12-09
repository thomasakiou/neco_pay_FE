import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StaffDatabase from './pages/StaffDatabase';
import CreateAssignment from './pages/CreateAssignment';
import ValidationSummary from './pages/ValidationSummary';
import MismatchedRecords from './pages/MismatchedRecords';
import ValidMatches from './pages/ValidMatches';
import MissingRecords from './pages/MissingRecords';
import Configuration from './pages/Configuration';
import ReportPage from './pages/Report';
import StagingTable from './pages/StagingTable';
import Banks from './pages/Banks';
import States from './pages/States';
import DistancePage from './pages/Distance';
import ParameterPage from './pages/Parameter';
import PostingPage from './pages/Posting';
import UtilityPage from './pages/Utility';
import PaymentPage from './pages/Payment';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/staff" element={<StaffDatabase />} />
            <Route path="/upload" element={<CreateAssignment />} />

            <Route path="/validation" element={<ValidationSummary />} />
            <Route path="/validation/mismatch" element={<MismatchedRecords />} />
            <Route path="/validation/missing" element={<MissingRecords />} />
            <Route path="/validation/valid" element={<ValidMatches />} />
            <Route path="/staging" element={<StagingTable />} />

            <Route path="/banks" element={<Banks />} />
            <Route path="/states" element={<States />} />
            <Route path="/distance" element={<DistancePage />} />
            <Route path="/parameter" element={<ParameterPage />} />
            <Route path="/posting" element={<PostingPage />} />
            <Route path="/utility" element={<UtilityPage />} />
            <Route path="/payments" element={<PaymentPage />} />

            <Route path="/config" element={<Configuration />} />
            <Route path="/reports" element={<ReportPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}