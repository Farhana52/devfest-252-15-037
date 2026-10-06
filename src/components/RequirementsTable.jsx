import React from 'react';
import { CheckCircle2, AlertCircle, Clock, FileQuestion, Ban, X } from 'lucide-react';
import { STATUS_CODES } from '../lib/status';
import { translations } from '../i18n/translations';

export function RequirementsTable({
  requirements,
  matches,
  expiryDates,
  requirementStatuses,
  uploadedFiles,
  onMatchChange,
  onExpiryChange,
  onUnmatch,
  lang,
}) {
  const t = translations[lang];

  // Helper to get status badge config
  const getStatusBadge = (status) => {
    switch (status) {
      case STATUS_CODES.OK:
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
        };
      case STATUS_CODES.MISSING:
        return {
          icon: AlertCircle,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
        };
      case STATUS_CODES.EXPIRY_NEEDED:
        return {
          icon: Clock,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
        };
      case STATUS_CODES.EXPIRED:
        return {
          icon: Ban,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
        };
      case STATUS_CODES.NOT_PROVIDED:
      default:
        return {
          icon: FileQuestion,
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  // Set of file IDs already matched to other requirements
  const matchedFileIdToReqId = {};
  for (const [rId, file] of Object.entries(matches)) {
    if (file && file.id) {
      matchedFileIdToReqId[file.id] = rId;
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {t.requirementsList}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === 'bn'
              ? 'দরপত্রের শর্তানুযায়ী প্রতিটি নথির ফাইল সংযুক্ত করুন এবং প্রয়োজনীয় মেয়াদ দিন'
              : 'Assign PDF files to each tender requirement and provide validity dates'}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
          {requirements.length} {lang === 'bn' ? 'নথি' : 'Items'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 w-16 text-center">{t.order}</th>
              <th className="py-3 px-4">{t.documentTitle}</th>
              <th className="py-3 px-4 w-28">{t.type}</th>
              <th className="py-3 px-4 min-w-[220px]">{t.matchedFile}</th>
              <th className="py-3 px-4 w-44">{t.expiryDate}</th>
              <th className="py-3 px-4 w-40 text-center">{t.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {requirements.map((req) => {
              const currentMatch = matches[req.id] || null;
              const currentExpiry = expiryDates[req.id] || '';
              const statusObj = requirementStatuses.find((s) => s.requirement.id === req.id);
              const status = statusObj ? statusObj.status : STATUS_CODES.MISSING;
              const badge = getStatusBadge(status);
              const StatusIcon = badge.icon;

              const title = lang === 'bn' ? (req.title_bn || req.title_en) : req.title_en;

              return (
                <tr
                  key={req.id}
                  className={`hover:bg-slate-50/60 transition-colors ${
                    statusObj?.isBlocking ? 'bg-rose-50/15' : ''
                  }`}
                >
                  {/* Order Number */}
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 text-slate-800 text-xs">
                      {req.order}
                    </span>
                  </td>

                  {/* Document Title */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 text-sm">{title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ID: <span className="font-mono text-slate-500">{req.id}</span>
                      {req.has_expiry && (
                        <span className="ml-2 text-purple-600 font-medium">
                          • {t.expiryNeeded}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Mandatory / Optional Type */}
                  <td className="py-3.5 px-4">
                    {req.mandatory ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] tracking-wide uppercase">
                        {t.mandatory}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px] tracking-wide uppercase">
                        {t.optional}
                      </span>
                    )}
                  </td>

                  {/* Matched File Dropdown */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <select
                        aria-label={`Match file for ${title}`}
                        value={currentMatch ? currentMatch.id : ''}
                        onChange={(e) => {
                          const fileId = e.target.value;
                          const selectedFile = uploadedFiles.find((f) => f.id === fileId) || null;
                          onMatchChange(req.id, selectedFile);
                        }}
                        className="w-full text-xs rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-slate-800 shadow-2xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="">{t.noFileMatched}</option>
                        {uploadedFiles.map((file) => {
                          const isAssignedElsewhere =
                            matchedFileIdToReqId[file.id] &&
                            matchedFileIdToReqId[file.id] !== req.id;
                          const isDuplicateAssignedElsewhere =
                            file.hash &&
                            Object.entries(matches).some(
                              ([rId, f]) => rId !== req.id && f && f.hash === file.hash
                            );
                          const isDisabled = isAssignedElsewhere || isDuplicateAssignedElsewhere;

                          return (
                            <option
                              key={file.id}
                              value={file.id}
                              disabled={isDisabled}
                            >
                              {file.name} ({file.pageCount || 1} {file.pageCount === 1 ? t.page : t.pages})
                              {isAssignedElsewhere ? ` [${lang === 'bn' ? 'সংযুক্ত' : 'Assigned'}]` : ''}
                              {isDuplicateAssignedElsewhere ? ` [${lang === 'bn' ? 'ডুপ্লিকেট ব্যবহৃত' : 'Duplicate Assigned'}]` : ''}
                            </option>
                          );
                        })}
                      </select>

                      {currentMatch && (
                        <button
                          onClick={() => onUnmatch(req.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer shrink-0"
                          title={t.unassign}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Expiry Date Input */}
                  <td className="py-3.5 px-4">
                    {req.has_expiry ? (
                      <div className="relative">
                        <input
                          type="date"
                          aria-label={`Expiry date for ${title}`}
                          disabled={!currentMatch}
                          value={currentExpiry}
                          onChange={(e) => onExpiryChange(req.id, e.target.value)}
                          className={`w-full text-xs rounded-lg border py-1.5 px-2 text-slate-800 shadow-2xs focus:ring-1 focus:outline-hidden ${
                            !currentMatch
                              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                              : currentExpiry === ''
                              ? 'border-purple-300 focus:border-purple-500 focus:ring-purple-500 bg-purple-50/20'
                              : 'border-slate-300 focus:border-blue-500 focus:ring-blue-500'
                          }`}
                        />
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] italic">
                        {t.noExpiry}
                      </span>
                    )}
                  </td>

                  {/* Real-time Status Badge */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold tracking-tight shadow-2xs whitespace-nowrap ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{t.statuses[status] || status}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
