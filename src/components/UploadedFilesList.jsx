import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Trash2, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { translations } from '../i18n/translations';

export function UploadedFilesList({
  uploadedFiles,
  onUploadPdfs,
  onRemoveFile,
  onClearAll,
  lang,
}) {
  const t = translations[lang];
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUploadPdfs(Array.from(e.dataTransfer.files));
    }
  };

  const duplicateFilesCount = uploadedFiles.filter(f => f.isDuplicate).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>{t.uploadedFiles}</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              {uploadedFiles.length}
            </span>
          </h2>
        </div>

        {uploadedFiles.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            {t.removeAllFiles}
          </button>
        )}
      </div>

      {/* Drag & Drop Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          id="pdf-files-input"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onUploadPdfs(Array.from(e.target.files));
              e.target.value = '';
            }
          }}
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-800">
              {t.dragDropPdfs}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'bn' ? 'একাধিক ফাইল একসাথে নির্বাচন করা যাবে' : 'Select multiple PDF files simultaneously'}
            </p>
          </div>
        </div>
      </div>

      {/* Duplicate warning banner if any duplicates exist */}
      {duplicateFilesCount > 0 && (
        <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">
              {lang === 'bn' ? 'সতর্কতা: ' : 'Duplicate Notice: '}
            </span>
            <span>
              {lang === 'bn'
                ? `${duplicateFilesCount}টি ফাইলে হুবহু একই কন্টেন্ট পাওয়া গেছে। ডুপ্লিকেট ফাইল ভিন্ন ভিন্ন নথিতে ব্যবহার করা যাবে না।`
                : `${duplicateFilesCount} file(s) share identical content. Exact duplicate files cannot be assigned to different requirements.`}
            </span>
          </div>
        </div>
      )}

      {/* Uploaded Files Table / List */}
      {uploadedFiles.length > 0 ? (
        <div className="mt-4 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
          {uploadedFiles.map((file) => (
            <div
              key={file.id}
              className="py-2.5 flex items-center justify-between gap-3 group hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>
                      {file.pageCount || 1} {file.pageCount === 1 ? t.page : t.pages}
                    </span>
                    <span>•</span>
                    <span>{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {file.isDuplicate && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-bold tracking-tight"
                    title={t.duplicate}
                  >
                    <Copy className="w-3 h-3" />
                    <span>{lang === 'bn' ? 'ডুপ্লিকেট' : 'Duplicate'}</span>
                  </span>
                )}

                <button
                  onClick={() => onRemoveFile(file.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title={t.removeFile}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-slate-400">
          {lang === 'bn' ? 'এখনো কোনো ফাইল আপলোড করা হয়নি' : 'No PDF files uploaded yet'}
        </div>
      )}
    </div>
  );
}
