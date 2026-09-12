import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, AlertTriangle, UserPlus, Edit3, Trash2, FileText } from 'lucide-react';
import { AppointmentItem } from './AppointmentsTable';

interface AddEditModalProps {
  isOpen: boolean;
  isEditing: boolean;
  initialData?: AppointmentItem | null;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
}

export const AddEditAppointmentModal: React.FC<AddEditModalProps> = ({
  isOpen,
  isEditing,
  initialData,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('Technical');
  const [team, setTeam] = useState('Technical Team');
  const [batch, setBatch] = useState('25');
  const [appointmentId, setAppointmentId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('20/08/2026');
  const [joiningDate, setJoiningDate] = useState('01/09/2026');
  const [duration, setDuration] = useState('1 Year');
  const [status, setStatus] = useState('Verified');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('VIT Bhopal University');
  const [regNo, setRegNo] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && isEditing) {
      setFullName(initialData.fullName || '');
      setEmail(initialData.email || '');
      setPosition(initialData.position || '');
      setDepartment(initialData.department || 'Technical');
      setTeam(initialData.team || initialData.department || 'Technical Team');
      setBatch(initialData.batch || '25');
      setAppointmentId(initialData.appointmentId || '');
      setAppointmentDate(initialData.appointmentDate || '20/08/2026');
      setStatus(initialData.status || 'Verified');
    } else {
      setFullName('');
      setEmail('');
      setPosition('');
      setDepartment('Technical');
      setTeam('Technical Team');
      setBatch('25');
      setAppointmentId('');
      setAppointmentDate('20/08/2026');
      setStatus('Verified');
    }
    setSelectedFile(null);
    setError(null);
  }, [initialData, isEditing, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !position.trim()) {
      setError('Full Name, Email, and Position are required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('fullName', fullName.trim());
    formData.append('email', email.trim().toLowerCase());
    formData.append('position', position.trim());
    formData.append('department', department.trim());
    formData.append('team', team.trim());
    formData.append('batch', batch.trim());
    formData.append('appointmentId', appointmentId.trim());
    formData.append('appointmentDate', appointmentDate.trim());
    formData.append('joiningDate', joiningDate.trim());
    formData.append('duration', duration.trim());
    formData.append('status', status.trim());
    formData.append('phone', phone.trim());
    formData.append('college', college.trim());
    formData.append('registrationNumber', regNo.trim());

    if (selectedFile) {
      formData.append('document', selectedFile);
    }

    try {
      await onSave(formData);
      setLoading(false);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save appointment record.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#091424] border border-[#00F0FF]/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl hud-box my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#050B14] border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00F0FF]/10 text-[#00F0FF] rounded-xl">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-white tracking-wide">
                {isEditing ? 'EDIT APPOINTMENT RECORD' : 'CREATE APPOINTMENT RECORD'}
              </h3>
              <p className="text-xs font-mono text-slate-400">
                {isEditing ? `Modifying Record ID: ${initialData?.appointmentId}` : 'Add a new member to the database'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono">
              ⚠ {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">FULL NAME *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sankil Sudrik"
                required
                className="w-full px-3.5 py-2.5 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">REGISTERED EMAIL *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. sankil@statsolocked.in"
                required
                className="w-full px-3.5 py-2.5 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">POSITION / ROLE *</label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Data Science Core Member"
                required
                className="w-full px-3.5 py-2.5 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">DEPARTMENT</label>
              <select
                value={department}
                onChange={(e) => {
                  const val = e.target.value;
                  setDepartment(val);
                  setTeam(val === 'Panel' ? 'Panel' : `${val} Team`);
                  if (val === 'Panel') {
                    if (!['President', 'Vice President', 'General Secretary', 'Joint Secretary', 'Operations Manager'].includes(position)) {
                      setPosition('General Secretary');
                    }
                  } else if (val === 'Social Media') {
                    if (!['Social Media Lead', 'Social Media Co-Lead', 'Social Media Core Member'].includes(position)) {
                      setPosition('Social Media Core Member');
                    }
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
              >
                <option value="Technical">Technical</option>
                <option value="Events">Events</option>
                <option value="Creative">Creative</option>
                <option value="Management">Management</option>
                <option value="Photography">Photography</option>
                <option value="Research">Research</option>
                <option value="Social Media">Social Media</option>
                <option value="Panel">Panel</option>
              </select>
            </div>

            {department === 'Panel' && (
              <div>
                <label className="block text-xs font-mono font-bold text-[#00F0FF] uppercase mb-1">PANEL ROLE DROPDOWN *</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#050B14] border-2 border-[#00F0FF]/60 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none font-semibold shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                >
                  <option value="President">President</option>
                  <option value="Vice President">Vice President</option>
                  <option value="General Secretary">General Secretary</option>
                  <option value="Joint Secretary">Joint Secretary</option>
                  <option value="Operations Manager">Operations Manager</option>
                </select>
              </div>
            )}

            {department === 'Social Media' && (
              <div>
                <label className="block text-xs font-mono font-bold text-[#00F0FF] uppercase mb-1">SOCIAL MEDIA DROPDOWN *</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#050B14] border-2 border-[#00F0FF]/60 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none font-semibold shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                >
                  <option value="Social Media Lead">Social Media Lead</option>
                  <option value="Social Media Co-Lead">Social Media Co-Lead</option>
                  <option value="Social Media Core Member">Social Media Core Member</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">STUDENT BATCH *</label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="e.g. 25, 26, 27"
                required
                className="w-full px-3.5 py-2.5 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">APPOINTMENT ID</label>
              <input
                type="text"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="Auto-generated if empty (e.g. SOL-2026-001)"
                className="w-full px-3.5 py-2.5 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">APPOINTMENT DATE</label>
              <input
                type="text"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                placeholder="20/08/2026"
                className="w-full px-3.5 py-2.5 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">STATUS</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
              >
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Revoked">Revoked</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">REGISTRATION NUMBER</label>
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="e.g. 21BCE1001"
                className="w-full px-3.5 py-2.5 bg-[#050B14] border border-slate-800 focus:border-[#00F0FF] rounded-xl text-sm text-white outline-none"
              />
            </div>
          </div>

          {/* Upload Appointment Letter PDF */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase">
              UPLOAD APPOINTMENT LETTER (PDF)
            </label>
            <div className="relative border-2 border-dashed border-slate-700 hover:border-[#00F0FF] bg-[#050B14] rounded-2xl p-4 text-center cursor-pointer transition">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.length && setSelectedFile(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="flex flex-col items-center gap-1 pointer-events-none">
                <Upload className="w-6 h-6 text-[#00F0FF]" />
                <span className="text-xs text-slate-300 font-semibold">
                  {selectedFile ? selectedFile.name : 'Choose or drop custom PDF appointment letter'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">PDF files up to 20MB supported</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#00F0FF] to-[#0070F3] text-black font-heading font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)] hover:scale-105 transition"
            >
              {loading ? 'SAVING...' : isEditing ? 'SAVE CHANGES' : 'CREATE RECORD'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// Delete Confirmation Modal
interface DeleteModalProps {
  isOpen: boolean;
  appointment: AppointmentItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const DeleteConfirmModal: React.FC<DeleteModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !appointment) return null;

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#091424] border border-rose-500/40 rounded-3xl w-full max-w-md p-6 shadow-2xl text-center space-y-4"
      >
        <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto border border-rose-500/30">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="font-heading font-black text-xl text-white">DELETE APPOINTMENT?</h3>
        
        <p className="text-xs text-slate-300 leading-relaxed">
          This action will permanently remove the appointment record for{' '}
          <strong className="text-white">{appointment.fullName}</strong> ({appointment.appointmentId}) and its associated document from the database.
        </p>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >
            {loading ? 'DELETING...' : 'DELETE RECORD'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
