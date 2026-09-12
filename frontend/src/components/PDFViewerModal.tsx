import React from 'react';
import { X, Download } from 'lucide-react';
import { API_BASE_URL } from '../config';

const API_BASE = API_BASE_URL;

export interface PDFViewerModalProps {
  documentUrl?: string;
  candidateName?: string;
  pdfUrl?: string;
  title?: string;
  regNo?: string;
  name?: string;
  onClose: () => void;
}

export function PDFViewerModal({
  documentUrl,
  candidateName,
  pdfUrl,
  title,
  regNo,
  name,
  onClose
}: PDFViewerModalProps) {
  const resolvedUrl =
    documentUrl ||
    pdfUrl ||
    (regNo ? `${API_BASE}/api/appointments/download/${encodeURIComponent(regNo)}` : '');

  const resolvedName = candidateName || name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div>
            <h3 className="text-white font-semibold text-sm">{title || 'Appointment Letter Preview'}</h3>
            {resolvedName && (
              <p className="text-gray-400 text-xs">
                {resolvedName} {regNo ? `(${regNo})` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {resolvedUrl && (
              <a
                href={resolvedUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-[#00F0FF] hover:bg-[#00F0FF]/90 text-black rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-black/40 relative">
          {resolvedUrl ? (
            <iframe
              src={`${resolvedUrl}#toolbar=0`}
              title="Appointment Letter"
              className="w-full h-full border-none"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Document unavailable
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
