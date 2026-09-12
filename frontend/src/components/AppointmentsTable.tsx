import React from 'react';
import { Search, Filter, ArrowUpDown, Eye, Edit3, Trash2, FileText, ChevronLeft, ChevronRight, FileX } from 'lucide-react';

export interface AppointmentItem {
  id: string;
  appointmentId: string;
  fullName: string;
  email: string;
  position: string;
  department: string;
  team?: string;
  batch?: string;
  appointmentDate: string;
  status: string;
  documentUrl?: string;
  documentFilename?: string;
}

interface AppointmentsTableProps {
  appointments: AppointmentItem[];
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  deptFilter: string;
  onDeptFilterChange: (v: string) => void;
  sortBy: string;
  onSortByChange: (v: string) => void;
  page: number;
  totalPages: number;
  limit: number;
  totalRecords: number;
  onPageChange: (p: number) => void;
  onLimitChange: (l: number) => void;
  onView: (appt: AppointmentItem) => void;
  onEdit: (appt: AppointmentItem) => void;
  onDelete: (appt: AppointmentItem) => void;
}

export const AppointmentsTable: React.FC<AppointmentsTableProps> = ({
  appointments,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  deptFilter,
  onDeptFilterChange,
  sortBy,
  onSortByChange,
  page,
  totalPages,
  limit,
  totalRecords,
  onPageChange,
  onLimitChange,
  onView,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="space-y-4">
      
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#091424] p-4 rounded-2xl border border-slate-800">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, email or appointment ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white placeholder-slate-500 outline-none transition"
          />
        </div>

        {/* Filter Group */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#00F0FF]" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="bg-[#050B14] border border-slate-800 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl outline-none focus:border-[#00F0FF]"
            >
              <option value="All">Status: All</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Revoked">Revoked</option>
            </select>
          </div>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => onDeptFilterChange(e.target.value)}
            className="bg-[#050B14] border border-slate-800 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl outline-none focus:border-[#00F0FF]"
          >
            <option value="All">Department: All</option>
            <option value="Technical">Technical</option>
            <option value="Events">Events</option>
            <option value="Creative">Creative</option>
            <option value="Management">Management</option>
            <option value="Photography">Photography</option>
            <option value="Research">Research</option>
            <option value="Social Media">Social Media</option>
            <option value="Panel">Panel</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-[#050B14] border border-slate-800 rounded-xl px-3 py-2.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="createdAt">Newest First</option>
              <option value="fullName">Sort Name</option>
              <option value="appointmentId">Sort ID</option>
              <option value="appointmentDate">Sort Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#091424] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#050B14] border-b border-slate-800 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Appointment ID</th>
                <th className="py-3.5 px-4">Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Position</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Batch</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-sm">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-mono text-sm">
                    <FileX className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    NO APPOINTMENTS FOUND
                    <p className="text-xs text-slate-600 mt-1">Try changing your search query or add a new appointment record.</p>
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-900/60 transition group">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#00F0FF] text-xs">
                      {appt.appointmentId}
                    </td>
                    <td className="py-3.5 px-4 font-heading font-extrabold text-white">
                      {appt.fullName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-xs">
                      {appt.email}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      {appt.position}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold">
                        {appt.department}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-xs font-bold">
                      {appt.batch ? `'${appt.batch}` : "'25"}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-300">
                      {appt.appointmentDate}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                          appt.status === 'Verified'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : appt.status === 'Pending'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {appt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {appt.documentUrl ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-semibold">
                          <FileText className="w-3.5 h-3.5" /> ✓ Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-amber-400/80 font-mono">
                          ⚠ Missing
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => onView(appt)}
                        className="p-1.5 text-slate-400 hover:text-[#00F0FF] hover:bg-slate-800 rounded-lg transition"
                        title="View Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(appt)}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                        title="Edit Appointment"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(appt)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        title="Delete Appointment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-[#050B14] border-t border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs font-mono text-slate-400">
          <div>
            Showing <span className="text-white font-bold">{appointments.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="text-white font-bold">{Math.min(page * limit, totalRecords)}</span> of{' '}
            <span className="text-white font-bold">{totalRecords}</span> records
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Per Page:</span>
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="bg-[#091424] border border-slate-800 text-white rounded-lg px-2 py-1 outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-30 hover:bg-slate-800 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-white font-bold rounded-lg">
                {page} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg disabled:opacity-30 hover:bg-slate-800 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
