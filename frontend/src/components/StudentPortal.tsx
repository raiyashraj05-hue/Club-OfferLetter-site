import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Mail,
  ShieldCheck,
  FileCheck,
  Download,
  Eye,
  AlertCircle,
  Sparkles,
  User,
  Calendar,
  Award,
  Hash,
  Building2,
  GraduationCap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PDFViewerModal } from './PDFViewerModal';
import { API_BASE_URL } from '../config';

interface StudentPortalProps {
  onOpenAdmin: () => void;
}

interface AppointmentRecord {
  id: string;
  appointmentId: string;
  fullName: string;
  email: string;
  position: string;
  department: string;
  team?: string;
  appointmentDate: string;
  joiningDate?: string;
  duration?: string;
  batch?: string;
  status: string;
  hasDocument: boolean;
}

const API_URL = API_BASE_URL;

export const StudentPortal: React.FC<StudentPortalProps> = ({ onOpenAdmin }) => {
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);

  // Secret admin access — triple-click the club logo within 600 ms
  const logoClickCount = useRef(0);
  const logoClickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleLogoClick = () => {
    logoClickCount.current += 1;
    if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
    if (logoClickCount.current >= 5) {
      logoClickCount.current = 0;
      onOpenAdmin();
      return;
    }
    logoClickTimer.current = setTimeout(() => {
      logoClickCount.current = 0;
    }, 600);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setLoading(true);
    setError(null);
    setAppointment(null);

    try {
      const res = await fetch(`${API_URL}/api/appointments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: cleanEmail
        })
      });

      const data = await res.json();

      if (!data.ok) {
        setError(
          data.error ||
            'No appointment record found for this email address.'
        );
        setLoading(false);
        return;
      }

      setAppointment(data.appointment);
      setLoading(false);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F0FF', '#0070F3', '#7928CA', '#10B981']
      });
    } catch (err: any) {
      console.error(err);
      setError('Server connection error. Please try again.');
      setLoading(false);
    }
  };

  const getDocUrl = (id: string) =>
    `${API_URL}/api/appointments/${id}/document`;

  return (
    <div className="min-h-screen bg-[#050B14] bg-grid-pattern text-white flex flex-col font-sans relative overflow-hidden">

      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-[#050B14]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">

          {/* Left — fixed width to balance right side */}
          <div className="flex items-center w-32 sm:w-40 shrink-0">
            <div className="bg-white/95 px-3 py-1.5 rounded-xl border border-white/20 shadow-md">
              <img
                src="/vit_bhopal_logo.png"
                alt="VIT Bhopal Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>

          {/* Center Title — truly centred because both sides are equal width */}
          <div className="flex-1 text-center hidden sm:block">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-extrabold text-[#00F0FF] tracking-widest uppercase mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              OFFICIAL APPOINTMENT PORTAL
            </div>

            <h1 className="font-heading font-black text-xl tracking-wider text-white">
              STATS-O-LOCKED
            </h1>

            <p className="text-[11px] font-mono text-slate-400 tracking-widest">
              VIT BHOPAL &bull; AI & DATA CLUB
            </p>
          </div>

          {/* Right — same fixed width as left, logo centred inside */}
          <div className="flex items-center justify-end w-32 sm:w-40 shrink-0">
            <div
              className="w-12 h-12 rounded-full border-2 border-[#00F0FF] overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer select-none"
              onClick={handleLogoClick}
              title=""
            >
              <img
                src="/stats_club_logo.png"
                alt="Stats Emblem"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 z-10">

        {/* Verification Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#091424]/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative hud-box overflow-hidden mb-8"
        >
          <div className="text-center max-w-2xl mx-auto mb-8">

            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/20 text-xs font-mono font-bold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              APPOINTMENT ACCESS
            </span>

            <h2 className="font-heading font-black text-2xl sm:text-4xl text-white tracking-wide mb-2">
              Appointment Letter Verification
            </h2>

            <p className="text-sm sm:text-base text-slate-400">
              Enter your registered email ID to retrieve your official appointment letter.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleVerify}
            className="max-w-xl mx-auto space-y-4"
          >
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-widest mb-2">
                REGISTERED EMAIL
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00F0FF]" />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-[#050B14] border-2 border-slate-800 focus:border-[#00F0FF] rounded-2xl text-white placeholder-slate-500 font-sans text-base outline-none transition duration-200 shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#00F0FF] to-[#0070F3] text-black font-heading font-extrabold text-base tracking-wider uppercase rounded-2xl shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_40px_rgba(0,240,255,0.7)] hover:scale-[1.01] active:scale-[0.99] transition duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  VERIFY & RETRIEVE
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 max-w-xl mx-auto p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Identity Verified Result Section */}
        <AnimatePresence>
          {appointment && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >

              {/* Status Header Badge */}
              <div className="bg-[#091424] border border-[#00F0FF]/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative hud-box">

                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-800">

                  <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full font-mono font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    IDENTITY VERIFIED
                  </div>

                  <div className="text-xs font-mono text-slate-400">
                    APPOINTMENT ID:{' '}
                    <span className="text-[#00F0FF] font-bold">
                      {appointment.appointmentId}
                    </span>
                  </div>
                </div>

                {/* Candidate Grid Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00F0FF]" />
                      NAME
                    </span>
                    <p className="font-heading font-black text-xl text-white">
                      {appointment.fullName}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-[#00F0FF]" />
                      POSITION
                    </span>
                    <p className="font-heading font-bold text-lg text-[#00F0FF]">
                      {appointment.position}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                      DEPARTMENT
                    </span>
                    <p className="font-sans font-semibold text-slate-200">
                      {appointment.department || 'Technical'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#00F0FF]" />
                      APPOINTMENT DATE
                    </span>
                    <p className="font-sans font-semibold text-slate-200">
                      {appointment.appointmentDate}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#00F0FF]" />
                      EMAIL
                    </span>
                    <p className="font-sans font-semibold text-slate-300 text-sm truncate">
                      {appointment.email}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-[#00F0FF]" />
                      BATCH
                    </span>
                    <p className="font-mono font-bold text-slate-200">
                      Batch '{appointment.batch || '25'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-[#00F0FF]" />
                      STATUS
                    </span>

                    <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold">
                      {appointment.status}
                    </span>
                  </div>
                </div>

                {/* Document Action Section */}
                <div className="mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">

                  <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                    <FileCheck className="w-4 h-4 text-[#00F0FF]" />
                    APPOINTMENT LETTER Status:{' '}
                    <span className="text-emerald-400 font-bold">
                      VERIFIED DOCUMENT
                    </span>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">

                    <button
                      onClick={() => setShowPdfModal(true)}
                      className="flex-1 sm:flex-initial px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-heading font-bold text-xs tracking-wider uppercase rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4 text-[#00F0FF]" />
                      PREVIEW LETTER
                    </button>

                    <a
                      href={`${getDocUrl(appointment.id)}?download=true`}
                      download
                      className="flex-1 sm:flex-initial px-6 py-3 bg-gradient-to-r from-[#00F0FF] to-[#0070F3] text-black font-heading font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] hover:scale-105 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      DOWNLOAD APPOINTMENT LETTER
                    </a>

                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* PDF Modal */}
      {showPdfModal && appointment && (
        <PDFViewerModal
          documentUrl={getDocUrl(appointment.id)}
          candidateName={appointment.fullName}
          onClose={() => setShowPdfModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050B14] py-6 text-center text-xs font-mono text-slate-500">
        Stats-O-Locked Club &bull; VIT Bhopal University &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
};
