import React, { useRef } from 'react';
import { Calendar, Building2, User2, Hash, RotateCcw, UploadCloud, FolderSync } from 'lucide-react';
import { translations } from '../i18n/translations';

export function TenderMeta({
  tender,
  requirements,
  lang,
  onLoadSample,
  onUploadJson,
  onReset,
  isLoadingSample,
}) {
  const t = translations[lang];
  const fileInputRef = useRef(null);

  const mandatoryCount = requirements.filter(r => r.mandatory).length;
  const optionalCount = requirements.filter(r => !r.mandatory).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-bold tracking-wide uppercase">
              {tender.tender_id || 'T-XXXX'}
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs font-semibold text-slate-600">
              {mandatoryCount} {lang === 'bn' ? 'বাধ্যতামূলক' : 'Mandatory'}, {optionalCount} {lang === 'bn' ? 'ঐচ্ছিক' : 'Optional'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            {tender.title || (lang === 'bn' ? 'দরপত্রের শিরোনাম' : 'Tender Title')}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="load-sample-btn"
            onClick={onLoadSample}
            disabled={isLoadingSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>{isLoadingSample ? (lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...') : t.loadSample}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            id="json-file-input"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onUploadJson(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />

          <button
            id="upload-json-btn"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.uploadRequirements}</span>
          </button>

          <button
            id="reset-all-btn"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title={t.resetAll}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.resetAll}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-slate-50 text-slate-500 mt-0.5">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.procuringEntity}
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {tender.procuring_entity || '—'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-slate-50 text-slate-500 mt-0.5">
            <User2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t.bidder}
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {tender.bidder || '—'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 mt-0.5">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-amber-700/80 uppercase tracking-wider">
              {t.submissionDeadline}
            </div>
            <div className="text-sm font-bold text-amber-900">
              {tender.submission_deadline || '—'}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 mt-0.5">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-blue-700/80 uppercase tracking-wider">
              {lang === 'bn' ? 'মোট নথি তালিকা' : 'Total Items'}
            </div>
            <div className="text-sm font-bold text-blue-900">
              {requirements.length} {lang === 'bn' ? 'টি নথি' : 'Documents'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
