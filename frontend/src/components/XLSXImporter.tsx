import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, XCircle, ArrowRight, RefreshCw, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../config';

interface XLSXRow {
  rowNum: number;
  appointmentId: string;
  fullName: string;
  email: string;
  position: string;
  department: string;
  batch?: string;
  appointmentDate: string;
  statusCategory: 'VALID' | 'ATTENTION' | 'INVALID';
  issues: string[];
}

interface XLSXImportSummary {
  total: number;
  valid: number;
  attention: number;
  invalid: number;
}

interface XLSXImporterProps {
  onComplete: () => void;
}

export const XLSXImporter: React.FC<XLSXImporterProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'UPLOAD' | 'PREVIEW' | 'COMPLETE'>('UPLOAD');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [detectedMapping, setDetectedMapping] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<XLSXImportSummary | null>(null);
  const [rows, setRows] = useState<XLSXRow[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'update' | 'skip' | 'create'>('update');

  const [importResult, setImportResult] = useState<{
    inserted: number;
    updated: number;
    skipped: number;
    errors: { rowNum: number; name: string; email: string; reason: string }[];
  } | null>(null);

  // Download Sample XLSX Template
  const handleDownloadTemplate = () => {
    const data = [
      {
        appointment_id: 'SOL-2026-001',
        full_name: 'Sankil Sudrik',
        email: 'sankil@statsolocked.in',
        position: 'Data Science Core Member',
        department: 'Technical',
        appointment_date: '20/08/2026',
        status: 'Verified'
      },
      {
        appointment_id: 'SOL-2026-002',
        full_name: 'Student Two',
        email: 'student2@example.com',
        position: 'Event Coordinator',
        department: 'Events',
        appointment_date: '20/08/2026',
        status: 'Verified'
      },
      {
        appointment_id: 'SOL-2026-003',
        full_name: 'Student Three',
        email: 'student3@example.com',
        position: 'Creative Co-Lead',
        department: 'Creative',
        appointment_date: '20/08/2026',
        status: 'Verified'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'stats_o_locked_appointment_template.xlsx');
  };

  // Upload & Parse XLSX
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('xlsxFile', file);

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE_URL}/api/admin/import/xlsx-parse`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'Failed to parse XLSX file.');
        setLoading(false);
        return;
      }

      setDetectedMapping(data.detectedMapping);
      setSummary(data.summary);
      setRows(data.rows);
      setStage('PREVIEW');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Server error uploading XLSX.');
      setLoading(false);
    }
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_BASE_URL}/api/admin/import/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rows,
          duplicateStrategy,
        }),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error || 'Bulk import failed.');
        setLoading(false);
        return;
      }

      setImportResult(data.summary);
      setStage('COMPLETE');
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error processing import.');
      setLoading(false);
    }
  };

  // Download Error Report XLSX
  const handleDownloadErrorReport = () => {
    if (!importResult || !importResult.errors.length) return;

    const errorRows = importResult.errors.map(e => ({
      'Row Number': e.rowNum,
      'Name': e.name,
      'Email': e.email,
      'Reason': e.reason
    }));

    const worksheet = XLSX.utils.json_to_sheet(errorRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Error Report');
    XLSX.writeFile(workbook, 'import_error_report.xlsx');
  };

  return (
    <div className="bg-[#091424] border border-slate-800 rounded-3xl p-6 sm:p-8 hud-box space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="font-heading font-black text-xl sm:text-2xl text-white tracking-wide">
            BULK XLSX IMPORT ENGINE
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Upload an XLSX file to create or update multiple appointment records at once.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-[#00F0FF] border border-[#00F0FF]/30 text-xs font-mono font-bold rounded-xl transition flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> DOWNLOAD XLSX TEMPLATE
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-mono">
          ⚠ {error}
        </div>
      )}

      {/* STAGE 1: UPLOAD DROPZONE */}
      {stage === 'UPLOAD' && (
        <div className="space-y-6">
          <div className="relative border-2 border-dashed border-slate-700 hover:border-[#00F0FF] bg-[#050B14] rounded-3xl p-10 text-center cursor-pointer transition hud-box">
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => e.target.files?.length && handleFileUpload(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />

            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="p-4 bg-[#00F0FF]/10 text-[#00F0FF] rounded-full">
                <FileSpreadsheet className="w-10 h-10" />
              </div>
              <h3 className="font-heading font-extrabold text-lg text-white">
                DROP XLSX FILE HERE or CHOOSE XLSX FILE
              </h3>
              <p className="text-xs text-slate-400 max-w-md">
                Supports column headers like <code className="text-[#00F0FF]">Name</code>, <code className="text-[#00F0FF]">Email</code>, <code className="text-[#00F0FF]">Position</code>, <code className="text-[#00F0FF]">Department</code>, <code className="text-[#00F0FF]">Appointment ID</code>.
              </p>
            </div>
          </div>

          {loading && (
            <div className="text-center py-6 font-mono text-xs text-[#00F0FF] animate-pulse">
              Parsing and validating XLSX data...
            </div>
          )}
        </div>
      )}

      {/* STAGE 2: AUTO-MAPPING & PREVIEW */}
      {stage === 'PREVIEW' && summary && (
        <div className="space-y-6">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-mono text-slate-400">TOTAL PARSED</span>
              <p className="font-heading font-black text-2xl text-white">{summary.total}</p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <span className="text-xs font-mono text-emerald-400">✓ VALID RECORDS</span>
              <p className="font-heading font-black text-2xl text-emerald-400">{summary.valid}</p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
              <span className="text-xs font-mono text-amber-400">⚠ ATTENTION REQUIRED</span>
              <p className="font-heading font-black text-2xl text-amber-400">{summary.attention}</p>
            </div>
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
              <span className="text-xs font-mono text-rose-400">✕ REJECTED INVALID</span>
              <p className="font-heading font-black text-2xl text-rose-400">{summary.invalid}</p>
            </div>
          </div>

          {/* Auto-Detected Mapping Badge Banner */}
          <div className="p-4 bg-[#050B14] border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs font-mono font-bold text-[#00F0FF] uppercase flex items-center gap-2">
              <Layers className="w-4 h-4" /> INTELLIGENT COLUMN AUTO-MAPPING DETECTED:
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-mono text-slate-300">
              {Object.entries(detectedMapping).map(([k, v]) => (
                <span key={k} className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg">
                  {v} &rarr; <strong className="text-[#00F0FF]">{k}</strong>
                </span>
              ))}
            </div>
          </div>

          {/* Duplicate Handling Options */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">DUPLICATE HANDLING RULE:</span>
            <div className="flex flex-wrap gap-4 text-xs font-mono">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="dup"
                  value="update"
                  checked={duplicateStrategy === 'update'}
                  onChange={() => setDuplicateStrategy('update')}
                  className="accent-[#00F0FF]"
                />
                Update Existing Records (Recommended)
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="dup"
                  value="skip"
                  checked={duplicateStrategy === 'skip'}
                  onChange={() => setDuplicateStrategy('skip')}
                  className="accent-[#00F0FF]"
                />
                Skip Duplicates
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="dup"
                  value="create"
                  checked={duplicateStrategy === 'create'}
                  onChange={() => setDuplicateStrategy('create')}
                  className="accent-[#00F0FF]"
                />
                Create Duplicates
              </label>
            </div>
          </div>

          {/* Parsed Table Preview */}
          <div className="max-h-72 overflow-y-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#050B14] sticky top-0 text-slate-400">
                <tr>
                  <th className="p-3">Row</th>
                  <th className="p-3">Appt ID</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Position</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {rows.slice(0, 15).map((r) => (
                  <tr key={r.rowNum} className={r.statusCategory === 'INVALID' ? 'bg-rose-500/10' : ''}>
                    <td className="p-3">{r.rowNum}</td>
                    <td className="p-3 text-[#00F0FF]">{r.appointmentId}</td>
                    <td className="p-3 font-bold text-white">{r.fullName || '—'}</td>
                    <td className="p-3">{r.email || '—'}</td>
                    <td className="p-3">{r.position}</td>
                    <td className="p-3">{r.department}</td>
                    <td className="p-3 font-bold text-slate-200">{r.batch ? `'${r.batch}` : "'25"}</td>
                    <td className="p-3">
                      {r.statusCategory === 'VALID' ? (
                        <span className="text-emerald-400 font-bold">✓ Valid</span>
                      ) : r.statusCategory === 'ATTENTION' ? (
                        <span className="text-amber-400 font-bold">⚠ Attention</span>
                      ) : (
                        <span className="text-rose-400 font-bold">✕ Invalid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <button
              onClick={() => setStage('UPLOAD')}
              className="px-4 py-2.5 bg-slate-800 text-slate-300 text-xs font-mono font-bold rounded-xl"
            >
              &larr; UPLOAD DIFFERENT FILE
            </button>

            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-[#00F0FF] to-[#0070F3] text-black font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:scale-105 transition"
            >
              {loading ? 'IMPORTING DATABASE...' : 'IMPORT VALID RECORDS'}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: COMPLETE REPORT */}
      {stage === 'COMPLETE' && importResult && (
        <div className="text-center space-y-6 py-6">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-heading font-black text-2xl text-white">IMPORT COMPLETE</h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Database successfully updated with XLSX records.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <span className="text-xs font-mono text-emerald-400">INSERTED</span>
              <p className="font-heading font-black text-2xl text-white">{importResult.inserted}</p>
            </div>
            <div className="p-4 bg-[#00F0FF]/10 border border-[#00F0FF]/30 rounded-2xl">
              <span className="text-xs font-mono text-[#00F0FF]">UPDATED</span>
              <p className="font-heading font-black text-2xl text-white">{importResult.updated}</p>
            </div>
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-2xl">
              <span className="text-xs font-mono text-slate-400">SKIPPED</span>
              <p className="font-heading font-black text-2xl text-white">{importResult.skipped}</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4 flex-wrap">
            {importResult.errors.length > 0 && (
              <button
                onClick={handleDownloadErrorReport}
                className="px-5 py-3 bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold text-xs rounded-xl flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> DOWNLOAD ERROR REPORT ({importResult.errors.length})
              </button>
            )}

            <button
              onClick={() => {
                onComplete();
                setStage('UPLOAD');
              }}
              className="px-8 py-3 bg-gradient-to-r from-[#00F0FF] to-[#0070F3] text-black font-heading font-black text-xs uppercase rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            >
              RETURN TO DASHBOARD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
