import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Mail,
  Key,
  LayoutDashboard,
  Users,
  UserPlus,
  Upload,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';

import { AppointmentsTable, AppointmentItem } from './AppointmentsTable';
import {
  AddEditAppointmentModal,
  DeleteConfirmModal,
} from './AppointmentModals';
import { XLSXImporter } from './XLSXImporter';
import { PDFViewerModal } from './PDFViewerModal';
import { API_BASE_URL } from '../config';

interface AdminPortalProps {
  onBackToStudent: () => void;
}

interface StatsData {
  total: number;
  verified: number;
  pending: number;
  documentsAvailable: number;
}

/*
 * BACKEND API
 *
 * Frontend:
 * https://appointmentstatsolocked.vercel.app
 *
 * Backend:
 * https://backend-six-sand-58.vercel.app
 */
const API_URL = API_BASE_URL;

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onBackToStudent,
}) => {
  // --------------------------------------------------------------------------
  // AUTH
  // --------------------------------------------------------------------------

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('admin_token')
  );

  const [adminUser, setAdminUser] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);

  // --------------------------------------------------------------------------
  // LOGIN
  // --------------------------------------------------------------------------

  const [loginEmail, setLoginEmail] = useState<string>(
    'admin@statsolocked.in'
  );

  const [loginPassword, setLoginPassword] = useState<string>('admin123');

  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  const [loginError, setLoginError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------------------------------

  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'APPOINTMENTS' | 'BULK_IMPORT' | 'SETTINGS'
  >('DASHBOARD');

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // STATS
  // --------------------------------------------------------------------------

  const [stats, setStats] = useState<StatsData>({
    total: 0,
    verified: 0,
    pending: 0,
    documentsAvailable: 0,
  });

  const [systemStatus, setSystemStatus] = useState<Record<string, string>>({
    database: 'ONLINE',
    storage: 'ONLINE',
    api: 'ONLINE',
    auth: 'ACTIVE',
  });

  // --------------------------------------------------------------------------
  // APPOINTMENTS
  // --------------------------------------------------------------------------

  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);

  const [search, setSearch] = useState<string>('');

  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [deptFilter, setDeptFilter] = useState<string>('All');

  const [sortBy, setSortBy] = useState<string>('createdAt');

  const [page, setPage] = useState<number>(1);

  const [limit, setLimit] = useState<number>(25);

  const [totalPages, setTotalPages] = useState<number>(1);

  const [totalRecords, setTotalRecords] = useState<number>(0);

  // --------------------------------------------------------------------------
  // MODALS
  // --------------------------------------------------------------------------

  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [showEditModal, setShowEditModal] = useState<boolean>(false);

  const [selectedAppt, setSelectedAppt] =
    useState<AppointmentItem | null>(null);

  const [showDeleteModal, setShowDeleteModal] =
    useState<boolean>(false);

  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // INITIAL AUTH / DATA LOAD
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (token) {
      fetchAdminMe();
      fetchStats();
      fetchAppointments();
    }
  }, [token]);

  // --------------------------------------------------------------------------
  // REFRESH APPOINTMENTS WHEN FILTERS CHANGE
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (token) {
      fetchAppointments();
    }
  }, [
    search,
    statusFilter,
    deptFilter,
    sortBy,
    page,
    limit,
    token,
  ]);

  // --------------------------------------------------------------------------
  // FETCH ADMIN SESSION
  // --------------------------------------------------------------------------

  const fetchAdminMe = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error(
          'Admin session request failed:',
          res.status,
          res.statusText
        );

        if (res.status === 401 || res.status === 403) {
          handleLogout();
        }

        return;
      }

      const data = await res.json();

      if (data.ok) {
        setAdminUser(data.admin);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error('Admin session error:', err);
    }
  };

  // --------------------------------------------------------------------------
  // FETCH STATS
  // --------------------------------------------------------------------------

  const fetchStats = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error(
          'Stats request failed:',
          res.status,
          res.statusText
        );
        return;
      }

      const data = await res.json();

      if (data.ok) {
        setStats(data.stats);

        if (data.systemStatus) {
          setSystemStatus(data.systemStatus);
        }
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  // --------------------------------------------------------------------------
  // FETCH APPOINTMENTS
  // --------------------------------------------------------------------------

  const fetchAppointments = async () => {
    if (!token) return;

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status: statusFilter,
        department: deptFilter,
        sortBy,
      });

      const res = await fetch(
        `${API_URL}/api/admin/appointments?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error(
          'Appointments request failed:',
          res.status,
          res.statusText
        );
        return;
      }

      const data = await res.json();

      if (data.ok) {
        setAppointments(data.appointments || []);

        setTotalPages(
          data.pagination?.totalPages || 1
        );

        setTotalRecords(
          data.pagination?.totalRecords || 0
        );
      }
    } catch (err) {
      console.error('Appointments error:', err);
    }
  };

  // --------------------------------------------------------------------------
  // ADMIN LOGIN
  // --------------------------------------------------------------------------

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoginLoading(true);
    setLoginError(null);

    try {
      console.log(
        'Admin login request:',
        `${API_URL}/api/admin/login`
      );

      const res = await fetch(
        `${API_URL}/api/admin/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: loginEmail.trim().toLowerCase(),
            password: loginPassword,
          }),
        }
      );

      if (!res.ok) {
        let errorMessage = `Server returned ${res.status}`;

        try {
          const errorData = await res.json();

          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Response was not JSON.
        }

        throw new Error(errorMessage);
      }

      const data = await res.json();

      if (!data.ok) {
        setLoginError(
          data.error || 'Authentication failed.'
        );

        setLoginLoading(false);
        return;
      }

      if (!data.token) {
        throw new Error(
          'Login succeeded but no authentication token was returned.'
        );
      }

      localStorage.setItem(
        'admin_token',
        data.token
      );

      setToken(data.token);

      setAdminUser(data.admin || null);

      setLoginLoading(false);
    } catch (err: any) {
      console.error(
        'Admin login error:',
        err
      );

      setLoginError(
        err?.message ||
          'Server authentication error. Please try again.'
      );

      setLoginLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // LOGOUT
  // --------------------------------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem('admin_token');

    setToken(null);

    setAdminUser(null);

    setLoginError(null);

    setLoginEmail('admin@statsolocked.in');

    setLoginPassword('admin123');
  };

  // --------------------------------------------------------------------------
  // SAVE / EDIT APPOINTMENT
  // --------------------------------------------------------------------------

  const handleSaveAppointment = async (
    formData: FormData
  ) => {
    if (!token) {
      throw new Error('Admin session expired.');
    }

    const isEdit =
      showEditModal && selectedAppt;

    const url = isEdit
      ? `${API_URL}/api/admin/appointments/${selectedAppt!.id}`
      : `${API_URL}/api/admin/appointments`;

    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        let message = `Server returned ${res.status}`;

        try {
          const errorData = await res.json();

          if (errorData?.error) {
            message = errorData.error;
          }
        } catch {
          // Ignore non-JSON response.
        }

        throw new Error(message);
      }

      const data = await res.json();

      if (!data.ok) {
        throw new Error(
          data.error ||
            'Failed to save appointment.'
        );
      }

      await fetchStats();

      await fetchAppointments();

      setShowAddModal(false);

      setShowEditModal(false);

      setSelectedAppt(null);
    } catch (err: any) {
      console.error(
        'Save appointment error:',
        err
      );

      throw err;
    }
  };

  // --------------------------------------------------------------------------
  // DELETE APPOINTMENT
  // --------------------------------------------------------------------------

  const handleDeleteConfirm = async () => {
    if (!selectedAppt || !token) return;

    try {
      const res = await fetch(
        `${API_URL}/api/admin/appointments/${selectedAppt.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        let message = `Server returned ${res.status}`;

        try {
          const errorData = await res.json();

          if (errorData?.error) {
            message = errorData.error;
          }
        } catch {
          // Ignore non-JSON response.
        }

        throw new Error(message);
      }

      const data = await res.json();

      if (!data.ok) {
        alert(
          data.error ||
            'Failed to delete record.'
        );

        return;
      }

      setShowDeleteModal(false);

      setSelectedAppt(null);

      await fetchStats();

      await fetchAppointments();
    } catch (err: any) {
      console.error(
        'Delete appointment error:',
        err
      );

      alert(
        err?.message ||
          'Failed to delete appointment.'
      );
    }
  };

  // --------------------------------------------------------------------------
  // LOGIN SCREEN
  // --------------------------------------------------------------------------

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050B14] bg-grid-pattern text-white flex flex-col items-center justify-center p-4 relative font-sans select-none">

        {/* BACK TO STUDENT PORTAL */}
        <div className="absolute top-6 left-6">
          <button
            onClick={onBackToStudent}
            className="text-xs font-mono text-[#00F0FF] hover:underline flex items-center gap-1.5"
          >
            &larr; STUDENT PORTAL
          </button>
        </div>

        {/* LOGIN CARD */}
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          className="w-full max-w-md bg-[#091424]/90 border border-slate-800 p-8 rounded-3xl shadow-2xl hud-box space-y-6"
        >

          {/* HEADER */}
          <div className="text-center space-y-3">

            <div className="w-14 h-14 bg-[#00F0FF]/10 text-[#00F0FF] rounded-full flex items-center justify-center mx-auto border border-[#00F0FF]/30">
              <Lock className="w-7 h-7" />
            </div>

            <h2 className="font-heading font-black text-2xl text-white tracking-wider">
              STATS-O-LOCKED ADMIN
            </h2>

            <p className="text-xs font-mono text-slate-400">
              Appointment Management System Access
            </p>

          </div>

          {/* LOGIN ERROR */}
          {loginError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono">
              ⚠ {loginError}
            </div>
          )}

          {/* LOGIN FORM */}
          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >

            {/* EMAIL */}
            <div>

              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                ADMIN EMAIL
              </label>

              <div className="relative">

                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) =>
                    setLoginEmail(
                      e.target.value
                    )
                  }
                  placeholder="admin@statsolocked.in"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
                />

              </div>

            </div>

            {/* PASSWORD */}
            <div>

              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                PASSWORD
              </label>

              <div className="relative">

                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) =>
                    setLoginPassword(
                      e.target.value
                    )
                  }
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
                />

              </div>

            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-gradient-to-r from-[#00F0FF] to-[#0070F3] text-black font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 transition disabled:opacity-50"
            >
              {loginLoading
                ? 'AUTHENTICATING...'
                : 'AUTHENTICATE'}
            </button>

          </form>

          {/* DEMO CREDENTIALS */}
          <div className="text-center pt-2">

            <span className="text-[11px] font-mono text-slate-500">

              Demo Credentials:{' '}

              <code className="text-[#00F0FF]">
                admin@statsolocked.in
              </code>

              {' / '}

              <code className="text-[#00F0FF]">
                admin123
              </code>

            </span>

          </div>

        </motion.div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATED ADMIN DASHBOARD
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col font-sans">

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-[#091424] sticky top-0 z-30">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">

          {/* BRAND */}
          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="w-9 h-9 rounded-full border border-[#00F0FF] p-0.5 bg-white">

              <img
                src="/stats_club_logo.png"
                alt="Stats Emblem"
                className="w-full h-full object-contain rounded-full"
              />

            </div>

            <div>

              <h1 className="font-heading font-black text-lg text-white tracking-wider leading-none">
                STATS-O-LOCKED ADMIN
              </h1>

              <span className="text-[10px] font-mono text-[#00F0FF]">
                APPOINTMENT CONTROL CENTER
              </span>

            </div>

          </div>

          {/* HEADER ACTIONS */}
          <div className="flex items-center gap-4">

            <div className="hidden sm:block text-right">

              <p className="text-xs font-bold text-white leading-none">
                {adminUser?.name ||
                  'Administrator'}
              </p>

              <p className="text-[10px] font-mono text-slate-400">
                {adminUser?.email}
              </p>

            </div>

            {/* STUDENT VIEW */}
            <button
              onClick={onBackToStudent}
              className="px-3 py-1.5 text-xs font-mono text-[#00F0FF] hover:bg-[#00F0FF]/10 rounded-lg border border-[#00F0FF]/30 transition"
            >
              STUDENT VIEW
            </button>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
              title="Logout Session"
            >
              <LogOut className="w-5 h-5" />
            </button>

          </div>

        </div>

      </header>

      {/* WORKSPACE */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex gap-6">

        {/* SIDEBAR */}
        <aside
          className={`md:w-64 flex-shrink-0 bg-[#091424] border border-slate-800 rounded-2xl p-4 space-y-6 h-fit ${
            mobileMenuOpen
              ? 'fixed inset-y-0 left-0 z-40 w-64 shadow-2xl'
              : 'hidden md:block'
          }`}
        >

          {/* MOBILE MENU HEADER */}
          <div className="flex items-center justify-between md:hidden pb-4 border-b border-slate-800">

            <span className="font-heading font-bold text-sm text-white">
              MENU
            </span>

            <button
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

          </div>

          {/* NAVIGATION */}
          <div className="space-y-1">

            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-3">
              CONTROL CENTER
            </span>

            {/* DASHBOARD */}
            <button
              onClick={() => {
                setActiveTab('DASHBOARD');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs tracking-wider uppercase transition ${
                activeTab === 'DASHBOARD'
                  ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            {/* APPOINTMENTS */}
            <button
              onClick={() => {
                setActiveTab('APPOINTMENTS');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs tracking-wider uppercase transition ${
                activeTab === 'APPOINTMENTS'
                  ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              Appointments
            </button>

            {/* ADD APPOINTMENT */}
            <button
              onClick={() => {
                setShowAddModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs tracking-wider uppercase text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              Add Appointment
            </button>

            {/* BULK IMPORT */}
            <button
              onClick={() => {
                setActiveTab('BULK_IMPORT');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading font-bold text-xs tracking-wider uppercase transition ${
                activeTab === 'BULK_IMPORT'
                  ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Upload className="w-4 h-4 text-amber-400" />
              Bulk Import
            </button>

          </div>

          {/* SYSTEM STATUS */}
          <div className="p-3.5 bg-[#050B14] border border-slate-800 rounded-xl space-y-2 font-mono text-[10.5px]">

            <span className="text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-800 pb-1">
              SYSTEM STATUS
            </span>

            <div className="flex items-center justify-between text-slate-300">
              <span>DATABASE</span>
              <span className="text-emerald-400 font-bold">
                ● {systemStatus.database}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>STORAGE</span>
              <span className="text-emerald-400 font-bold">
                ● {systemStatus.storage}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>API</span>
              <span className="text-emerald-400 font-bold">
                ● {systemStatus.api}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <span>AUTH</span>
              <span className="text-emerald-400 font-bold">
                ● {systemStatus.auth}
              </span>
            </div>

          </div>

        </aside>

        {/* MAIN */}
        <main className="flex-1 space-y-6 min-w-0">

          {/* DASHBOARD HEADER */}
          <div className="flex items-center justify-between flex-wrap gap-4 bg-[#091424] border border-slate-800 p-6 rounded-3xl hud-box">

            <div>

              <h2 className="font-heading font-black text-2xl text-white tracking-wide">
                ADMIN CONTROL CENTER
              </h2>

              <p className="text-xs font-mono text-slate-400">
                Stats-O-Locked Official Appointment Management System
              </p>

            </div>

            <div className="flex items-center gap-3">

              <button
                onClick={() =>
                  setShowAddModal(true)
                }
                className="px-4 py-2.5 bg-gradient-to-r from-[#00F0FF] to-[#0070F3] text-black font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                ADD APPOINTMENT
              </button>

            </div>

          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-[#091424] border border-slate-800 p-5 rounded-2xl">

              <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                TOTAL APPOINTMENTS
              </span>

              <p className="font-heading font-black text-3xl text-white mt-1">
                {stats.total}
              </p>

            </div>

            <div className="bg-[#091424] border border-emerald-500/30 p-5 rounded-2xl">

              <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
                VERIFIED
              </span>

              <p className="font-heading font-black text-3xl text-emerald-400 mt-1">
                {stats.verified}
              </p>

            </div>

            <div className="bg-[#091424] border border-amber-500/30 p-5 rounded-2xl">

              <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                PENDING
              </span>

              <p className="font-heading font-black text-3xl text-amber-400 mt-1">
                {stats.pending}
              </p>

            </div>

            <div className="bg-[#091424] border border-[#00F0FF]/30 p-5 rounded-2xl">

              <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase">
                DOCUMENTS AVAILABLE
              </span>

              <p className="font-heading font-black text-3xl text-[#00F0FF] mt-1">
                {stats.documentsAvailable}
              </p>

            </div>

          </div>

          {/* CONTENT */}
          {activeTab === 'BULK_IMPORT' ? (

            <XLSXImporter
              onComplete={() => {
                fetchStats();
                fetchAppointments();
                setActiveTab('APPOINTMENTS');
              }}
            />

          ) : (

            <AppointmentsTable
              appointments={appointments}

              search={search}
              onSearchChange={setSearch}

              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}

              deptFilter={deptFilter}
              onDeptFilterChange={setDeptFilter}

              sortBy={sortBy}
              onSortByChange={setSortBy}

              page={page}
              totalPages={totalPages}

              limit={limit}
              totalRecords={totalRecords}

              onPageChange={setPage}
              onLimitChange={setLimit}

              onView={(appt) =>
                setViewPdfUrl(
                  `${API_URL}/api/appointments/${appt.id}/document`
                )
              }

              onEdit={(appt) => {
                setSelectedAppt(appt);
                setShowEditModal(true);
              }}

              onDelete={(appt) => {
                setSelectedAppt(appt);
                setShowDeleteModal(true);
              }}
            />

          )}

        </main>

      </div>

      {/* ADD / EDIT MODAL */}
      <AddEditAppointmentModal
        isOpen={
          showAddModal ||
          showEditModal
        }

        isEditing={showEditModal}

        initialData={selectedAppt}

        onClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setSelectedAppt(null);
        }}

        onSave={handleSaveAppointment}
      />

      {/* DELETE CONFIRMATION */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}

        appointment={selectedAppt}

        onClose={() => {
          setShowDeleteModal(false);
          setSelectedAppt(null);
        }}

        onConfirm={handleDeleteConfirm}
      />

      {/* PDF VIEWER */}
      {viewPdfUrl && (
        <PDFViewerModal
          documentUrl={viewPdfUrl}
          candidateName={
            selectedAppt?.fullName ||
            'Appointment'
          }
          onClose={() =>
            setViewPdfUrl(null)
          }
        />
      )}

    </div>
  );
};
