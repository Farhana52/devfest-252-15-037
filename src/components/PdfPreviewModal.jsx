import React from 'react';
import { X, Download, ExternalLink } from 'lucide-react';
import { translations } from '../i18n/translations';

export function PdfPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  tenderId,
  lang,
}) {
  if (!isOpen || !pdfUrl) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl h-[90vh] overflow-hidden border border-slate-200">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {t.previewPackage} — {tenderId || 'Tender'}_Package.pdf
            </h3>
            <p className="text-[11px] text-slate-500">
              {lang === 'bn' ? 'সরাসরি ব্রাউজারে প্রিভিউ' : 'Direct PDF preview in browser'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নতুন ট্যাবে খুলুন' : 'Open in New Tab'}</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 p-2">
          <iframe
            src={pdfUrl}
            title="Generated Tender Package PDF"
            className="w-full h-full rounded-xl border border-slate-200 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
