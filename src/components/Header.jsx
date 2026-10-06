import React from 'react';
import { Globe, FileCheck2 } from 'lucide-react';
import { translations } from '../i18n/translations';

export function Header({ lang, setLang }) {
  const t = translations[lang];

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <FileCheck2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 leading-tight truncate">
              {t.appTitle}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden md:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex flex-col text-right">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              DevFest 2026 Contestant
            </span>
            <span className="text-xs font-medium text-slate-700">
              Farhana Nasrin (252-15-037)
            </span>
          </div>

          <button
            id="lang-toggle-btn"
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors shadow-2xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            title="Switch Language / ভাষা পরিবর্তন করুন"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.langToggle}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
