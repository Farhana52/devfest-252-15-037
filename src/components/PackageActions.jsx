import React, { useRef } from 'react';
import {
  FileCheck2,
  Download,
  Eye,
  AlertOctagon,
  FileDown,
  Stamp,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  FileQuestion,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import { STATUS_CODES } from '../lib/status';
import { translations } from '../i18n/translations';

export function PackageActions({
  tender,
  canGenerate,
  blockingReasons,
  isGenerating,
  generatedPdfBlob,
  generatedPdfUrl,
  sealImageName,
  onGeneratePackage,
  onDownloadPackage,
  onPreviewPackage,
  onExportCsv,
  onUploadStamp,
  onClearStamp,
  requirementStatuses,
  lang,
}) {
  const t = translations[lang];
  const stampInputRef = useRef(null);

  // Calculate status counters
  const counts = {
    ok: requirementStatuses.filter((s) => s.status === STATUS_CODES.OK).length,
    missing: requirementStatuses.filter((s) => s.status === STATUS_CODES.MISSING).length,
    expiryNeeded: requirementStatuses.filter((s) => s.status === STATUS_CODES.EXPIRY_NEEDED).length,
    expired: requirementStatuses.filter((s) => s.status === STATUS_CODES.EXPIRED).length,
    notProvided: requirementStatuses.filter((s) => s.status === STATUS_CODES.NOT_PROVIDED).length,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {t.summaryTitle}
          </h2>
          <p className="text-xs text-slate-500">
            {lang === 'bn'
              ? 'বাধ্যতামূলক সকল শর্ত পূরণ হলেই প্যাকেজ তৈরির বাটন সক্রিয় হবে'
              : 'The package generator activates once all mandatory requirements are satisfied'}
          </p>
        </div>

        {/* Quick Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Download CSV report of documents and verification status"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Status Counters Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5">
        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{t.statuses['OK']}</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-950 mt-1">{counts.ok}</div>
        </div>

        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>{t.statuses['Missing']}</span>
          </div>
          <div className="text-xl font-extrabold text-rose-950 mt-1">{counts.missing}</div>
        </div>

        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
          <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-600" />
            <span>{t.statuses['Expiry date needed']}</span>
          </div>
          <div className="text-xl font-extrabold text-purple-950 mt-1">{counts.expiryNeeded}</div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
          <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
            <Ban className="w-3 h-3 text-amber-600" />
            <span>{t.statuses['Expired']}</span>
          </div>
          <div className="text-xl font-extrabold text-amber-950 mt-1">{counts.expired}</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <FileQuestion className="w-3 h-3 text-slate-500" />
            <span>{t.statuses['Not provided']}</span>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{counts.notProvided}</div>
        </div>
      </div>

      {/* Blocking Issues or Success Banner */}
      {!canGenerate ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs mb-5">
          <div className="flex items-center gap-2 font-bold text-rose-800 mb-2">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{t.blockingNotice}</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-700 ml-1">
            {blockingReasons.map((reason, idx) => (
              <li key={idx} className="font-medium">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs mb-5 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{t.allGoodNotice}</span>
        </div>
      )}

      {/* Digital Stamp / Signature Upload Bonus Section */}
      <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Stamp className="w-4 h-4 text-slate-600" />
          <div>
            <span className="font-semibold text-slate-800">{t.signatureStamp}:</span>
            <span className="ml-2 text-slate-500 font-medium">
              {sealImageName ? `✓ ${sealImageName}` : (lang === 'bn' ? 'কোনো স্ট্যাম্প যুক্ত নেই' : 'None attached')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={stampInputRef}
            type="file"
            accept="image/png"
            id="stamp-file-input"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUploadStamp(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => stampInputRef.current?.click()}
            className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold cursor-pointer"
          >
            {t.uploadStamp}
          </button>
          {sealImageName && (
            <button
              onClick={onClearStamp}
              className="px-2 py-1 rounded-md text-rose-600 hover:bg-rose-50 text-[11px] font-semibold cursor-pointer"
            >
              {t.clearStamp}
            </button>
          )}
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          id="generate-package-btn"
          disabled={!canGenerate || isGenerating}
          onClick={onGeneratePackage}
          className={`w-full sm:flex-1 py-3 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
            !canGenerate || isGenerating
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/25 hover:shadow-md'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.generating}</span>
            </>
          ) : (
            <>
              <FileCheck2 className="w-4 h-4" />
              <span>{t.generatePackage}</span>
            </>
          )}
        </button>

        {generatedPdfBlob && (
          <>
            <button
              id="download-package-btn"
              onClick={onDownloadPackage}
              className="w-full sm:w-auto py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {t.downloadPackage} ({tender.tender_id || 'Tender'}_Package.pdf)
              </span>
            </button>

            <button
              id="preview-package-btn"
              onClick={onPreviewPackage}
              className="w-full sm:w-auto py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <Eye className="w-4 h-4 text-slate-600" />
              <span>{t.previewPackage}</span>
            </button>
          </>
        )}
      </div>

      {/* Status Legend Section */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-2">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>{t.legend}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>{t.legendOk}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span>{t.legendMissing}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
            <span>{t.legendExpiryNeeded}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>{t.legendExpired}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            <span>{t.legendNotProvided}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
