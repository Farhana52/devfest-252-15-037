import React from 'react';
import { BookOpen, CheckCircle, UploadCloud, FileCheck, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import { translations } from '../i18n/translations';

export function SubmissionGuidelines({ lang, tender }) {
  const isBn = lang === 'bn';

  const steps = [
    {
      step: '1',
      title: isBn ? 'পিডিএফ ফাইল আপলোড' : 'Upload Tender PDFs',
      desc: isBn
        ? 'দরপত্রের সকল প্রয়োজনীয় পিডিএফ ফাইল ড্র্যাগ অ্যান্ড ড্রপ করুন (সর্বোচ্চ ৩০ ফাইল, ৫০ MB)।'
        : 'Drag & drop all relevant PDF documents (up to 30 files, max 50MB total).',
      icon: UploadCloud,
    },
    {
      step: '2',
      title: isBn ? 'নথি অনুযায়ী সংযুক্তি' : 'Assign to Requirements',
      desc: isBn
        ? 'ডানপাশের তালিকা থেকে প্রতিটি নথির বিপরীতে সঠিক ফাইল নির্বাচন করুন (১ ফাইল = ১ নথি)।'
        : 'Select the matching uploaded file for each tender item in the checklist.',
      icon: FileCheck,
    },
    {
      step: '3',
      title: isBn ? 'মেয়াদ যাচাইকরণ' : 'Verify Expiry Dates',
      desc: isBn
        ? 'মেয়াদ প্রযোজ্য এমন নথির তারিখ দিন; তারিখ ডেডলাইনের সমান বা পরের হতে হবে।'
        : 'Enter validity dates for expiry-checked files; must not precede submission deadline.',
      icon: Calendar,
    },
    {
      step: '4',
      title: isBn ? 'প্যাকেজ তৈরি ও ডাউনলোড' : 'Compile & Download',
      desc: isBn
        ? 'সব শর্ত পূরণ হলে অফিসিয়াল কভার পেজ ও ফুটারসহ সমন্বিত প্যাকেজ ডাউনলোড করুন।'
        : 'Generate unified PDF with official cover page, ordered pages, and page footers.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all">
      <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
          <BookOpen className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {isBn ? 'দরপত্র প্যাকেজ প্রস্তুত নির্দেশিকা' : 'Package Preparation Guide'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {isBn ? 'সঠিক ও গ্রহণযোগ্য প্যাকেজ তৈরির নিয়মাবলী' : 'Standard operating workflow & compliance rules'}
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.step} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                {s.step}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{s.title}</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-start gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            {isBn
              ? `জমা দেওয়ার শেষ তারিখ (${tender.submission_deadline || '—'}) এর পূর্বে কোনো নথির মেয়াদ শেষ হলে তা গ্রহণযোগ্য হবে না।`
              : `Any document expiring prior to the deadline (${tender.submission_deadline || '—'}) will be rejected as Expired.`}
          </span>
        </div>
      </div>
    </div>
  );
}
