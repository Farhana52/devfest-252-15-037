import React, { useState, useEffect, useMemo } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Header } from './components/Header';
import { TenderMeta } from './components/TenderMeta';
import { UploadedFilesList } from './components/UploadedFilesList';
import { RequirementsTable } from './components/RequirementsTable';
import { PackageActions } from './components/PackageActions';
import { PdfPreviewModal } from './components/PdfPreviewModal';

import { validateRequirementsJson, validateUploadedFile, validateUploadLimits, findDuplicateMatchingConflicts } from './lib/validator';
import { computeFileHash, markDuplicateFiles } from './lib/hasher';
import { evaluatePackageStatus } from './lib/status';
import { buildTenderPackagePdf } from './lib/pdfBuilder';
import { autoMatchFiles } from './lib/autoMatcher';
import { exportChecklistCsv } from './lib/csvExporter';
import { translations } from './i18n/translations';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

const INITIAL_TENDER = {
  tender_id: 'T-2026-0417',
  title: 'Supply of IT Equipment',
  procuring_entity: 'Example Directorate',
  bidder: 'Example Company Ltd.',
  submission_deadline: '2026-10-20',
};

const INITIAL_REQUIREMENTS = [
  { id: 'R01', order: 1, title_en: 'Trade License', title_bn: 'ট্রেড লাইসেন্স', mandatory: true, has_expiry: true },
  { id: 'R02', order: 2, title_en: 'TIN & VAT Certificate', title_bn: 'টিআইএন ও ভ্যাট সনদ', mandatory: true, has_expiry: false },
  { id: 'R03', order: 3, title_en: 'Bank Solvency Letter', title_bn: 'ব্যাংক সলভেন্সি সার্টিফিকেট', mandatory: true, has_expiry: true },
  { id: 'R04', order: 4, title_en: 'Technical Proposal', title_bn: 'কারিগরি প্রস্তাবনা', mandatory: true, has_expiry: false },
  { id: 'R05', order: 5, title_en: 'Experience Certificate', title_bn: 'অভিজ্ঞতার সনদ', mandatory: false, has_expiry: false },
  { id: 'R06', order: 6, title_en: 'Manufacturer Authorization', title_bn: 'প্রস্তুতকারকের অনুমোদনপত্র', mandatory: false, has_expiry: true },
];

export function App() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('tender_app_lang') || 'en';
  });

  const [tender, setTender] = useState(INITIAL_TENDER);
  const [requirements, setRequirements] = useState(INITIAL_REQUIREMENTS);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [matches, setMatches] = useState({});
  const [expiryDates, setExpiryDates] = useState({});
  const [sealImageBytes, setSealImageBytes] = useState(null);
  const [sealImageName, setSealImageName] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [alertMessage, setAlertMessage] = useState(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const t = translations[lang];

  // Update HTML lang attribute and localStorage on language change
  useEffect(() => {
    localStorage.setItem('tender_app_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (generatedPdfUrl) {
        URL.revokeObjectURL(generatedPdfUrl);
      }
    };
  }, [generatedPdfUrl]);

  // Duplicate conflicts check
  const duplicateConflicts = useMemo(() => {
    return findDuplicateMatchingConflicts(matches, uploadedFiles);
  }, [matches, uploadedFiles]);

  // Real-time package & requirement status evaluation
  const { requirementStatuses, blockingReasons, canGenerate } = useMemo(() => {
    return evaluatePackageStatus(
      requirements,
      matches,
      expiryDates,
      tender.submission_deadline,
      duplicateConflicts
    );
  }, [requirements, matches, expiryDates, tender.submission_deadline, duplicateConflicts]);

  // Show temporary alert banner
  const triggerAlert = (type, text) => {
    setAlertMessage({ type, text });
    setTimeout(() => {
      setAlertMessage((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  // Upload requirements.json
  const handleUploadJson = async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validation = validateRequirementsJson(parsed);

      if (!validation.valid) {
        triggerAlert('error', validation.error);
        return;
      }

      setTender(validation.data.tender);
      setRequirements(validation.data.requirements);
      // Reset matching since requirements schema changed
      setMatches({});
      setExpiryDates({});
      setGeneratedPdfBlob(null);
      setGeneratedPdfUrl(null);

      triggerAlert(
        'success',
        lang === 'bn' ? 'requirements.json সফলভাবে লোড হয়েছে।' : 'requirements.json loaded successfully.'
      );
    } catch {
      triggerAlert('error', t.errors.invalidJson);
    }
  };

  // Upload multiple PDF files
  const handleUploadPdfs = async (files) => {
    const limitsCheck = validateUploadLimits(uploadedFiles, files);
    if (!limitsCheck.valid) {
      triggerAlert('error', limitsCheck.error);
      return;
    }

    const validNewFiles = [];
    const rejectedFiles = [];

    for (const file of files) {
      const validation = validateUploadedFile(file);
      if (!validation.valid) {
        rejectedFiles.push(file.name);
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const hash = await computeFileHash(arrayBuffer);

        // Compute page count using pdf-lib safely
        let pageCount = 1;
        try {
          const loadedPdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
          pageCount = loadedPdf.getPageCount();
        } catch {
          pageCount = 1;
        }

        validNewFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          pageCount,
          arrayBuffer,
          bytes,
          hash,
        });
      } catch {
        rejectedFiles.push(file.name);
      }
    }

    if (rejectedFiles.length > 0) {
      triggerAlert(
        'error',
        `${t.errors.nonPdf} (${rejectedFiles.join(', ')})`
      );
    }

    if (validNewFiles.length > 0) {
      const updatedList = markDuplicateFiles([...uploadedFiles, ...validNewFiles]);
      setUploadedFiles(updatedList);
      triggerAlert(
        'success',
        lang === 'bn'
          ? `${validNewFiles.length}টি পিডিএফ ফাইল যুক্ত করা হয়েছে।`
          : `Added ${validNewFiles.length} PDF file(s).`
      );
    }
  };

  // Remove a single uploaded file
  const handleRemoveFile = (fileId) => {
    const remaining = uploadedFiles.filter((f) => f.id !== fileId);
    setUploadedFiles(markDuplicateFiles(remaining));

    // Clear any matches referencing this file
    const newMatches = { ...matches };
    let changed = false;
    for (const [reqId, f] of Object.entries(newMatches)) {
      if (f && f.id === fileId) {
        delete newMatches[reqId];
        changed = true;
      }
    }
    if (changed) {
      setMatches(newMatches);
    }
  };

  // Clear all files
  const handleClearAllFiles = () => {
    setUploadedFiles([]);
    setMatches({});
    setExpiryDates({});
    setGeneratedPdfBlob(null);
    setGeneratedPdfUrl(null);
  };

  // Match / unmatch file to requirement
  const handleMatchChange = (reqId, file) => {
    const updated = { ...matches };
    if (!file) {
      delete updated[reqId];
    } else {
      // 1 file goes to at most 1 document: remove from previous requirement if assigned
      for (const [rId, f] of Object.entries(updated)) {
        if (f && f.id === file.id && rId !== reqId) {
          delete updated[rId];
        }
      }
      updated[reqId] = file;
    }
    setMatches(updated);
  };

  // Expiry date input change
  const handleExpiryChange = (reqId, dateString) => {
    setExpiryDates((prev) => ({
      ...prev,
      [reqId]: dateString,
    }));
  };

  // Clear a requirement match
  const handleUnmatch = (reqId) => {
    const updated = { ...matches };
    delete updated[reqId];
    setMatches(updated);
  };

  // Auto-match helper
  const handleAutoMatch = () => {
    if (uploadedFiles.length === 0) {
      triggerAlert(
        'info',
        lang === 'bn' ? 'স্বয়ংক্রিয় মিল করতে প্রথমে পিডিএফ ফাইল আপলোড করুন।' : 'Upload PDF files first to run auto-match.'
      );
      return;
    }

    const suggested = autoMatchFiles(requirements, uploadedFiles);
    setMatches((prev) => ({ ...prev, ...suggested }));
    triggerAlert('success', t.success.autoMatched);
  };

  // Export checklist CSV
  const handleExportCsv = () => {
    exportChecklistCsv(tender, requirementStatuses, lang);
    triggerAlert('success', t.success.csvExported);
  };

  // Seal / signature upload
  const handleUploadStamp = async (file) => {
    if (!file.type.includes('png')) {
      triggerAlert('error', lang === 'bn' ? 'স্ট্যাম্প অবশ্যই PNG ফরম্যাটে হতে হবে।' : 'Stamp must be a PNG image.');
      return;
    }
    const arrayBuffer = await file.arrayBuffer();
    setSealImageBytes(new Uint8Array(arrayBuffer));
    setSealImageName(file.name);
    triggerAlert(
      'success',
      lang === 'bn' ? 'ডিজিটাল সিল/স্বাক্ষর যুক্ত হয়েছে।' : 'Digital seal/signature stamp attached.'
    );
  };

  const handleClearStamp = () => {
    setSealImageBytes(null);
    setSealImageName(null);
  };

  // Load sample pack
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const basePath = import.meta.env.BASE_URL || './';
      const cleanBase = basePath.endsWith('/') ? basePath : `${basePath}/`;
      const res = await fetch(`${cleanBase}data/requirements.json`);
      if (!res.ok) throw new Error('Could not fetch sample requirements.json');
      const sampleReq = await res.json();

      setTender(sampleReq.tender);
      setRequirements(sampleReq.requirements);

      // Fetch sample documents
      const sampleDocs = [
        { name: 'trade_license_valid.pdf', path: `${cleanBase}data/documents/trade_license_valid.pdf` },
        { name: 'tin_vat_certificate.pdf', path: `${cleanBase}data/documents/tin_vat_certificate.pdf` },
        { name: 'bank_solvency.pdf', path: `${cleanBase}data/documents/bank_solvency.pdf` },
        { name: 'technical_proposal.pdf', path: `${cleanBase}data/documents/technical_proposal.pdf` },
        { name: 'experience_cert.pdf', path: `${cleanBase}data/documents/experience_cert.pdf` },
        { name: 'bank_solvency_duplicate_copy.pdf', path: `${cleanBase}data/documents/bank_solvency_duplicate_copy.pdf` },
      ];

      const loadedFiles = [];
      for (const doc of sampleDocs) {
        try {
          const docRes = await fetch(doc.path);
          if (docRes.ok) {
            const ab = await docRes.arrayBuffer();
            const bytes = new Uint8Array(ab);
            const hash = await computeFileHash(ab);
            const parsed = await PDFDocument.load(bytes, { ignoreEncryption: true });
            loadedFiles.push({
              id: `${doc.name}-${Math.random().toString(36).substr(2, 5)}`,
              name: doc.name,
              size: ab.byteLength,
              type: 'application/pdf',
              pageCount: parsed.getPageCount(),
              arrayBuffer: ab,
              bytes,
              hash,
            });
          }
        } catch {
          // ignore individual fetch errors
        }
      }

      const marked = markDuplicateFiles(loadedFiles);
      setUploadedFiles(marked);

      // Pre-set matching for sample baseline
      const newMatches = {};
      const newExpiry = {};

      const tradeFile = marked.find((f) => f.name.includes('trade_license_valid'));
      if (tradeFile) {
        newMatches['R01'] = tradeFile;
        newExpiry['R01'] = '2026-12-31'; // Valid future date
      }

      const tinFile = marked.find((f) => f.name.includes('tin_vat'));
      if (tinFile) newMatches['R02'] = tinFile;

      const solvencyFile = marked.find((f) => f.name === 'bank_solvency.pdf');
      if (solvencyFile) {
        newMatches['R03'] = solvencyFile;
        newExpiry['R03'] = '2026-11-15'; // Valid date
      }

      const techFile = marked.find((f) => f.name.includes('technical_proposal'));
      if (techFile) newMatches['R04'] = techFile;

      setMatches(newMatches);
      setExpiryDates(newExpiry);

      triggerAlert('success', t.success.sampleLoaded);
    } catch (err) {
      triggerAlert('error', `Failed to load sample: ${err.message}`);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Reset all
  const handleReset = () => {
    setTender(INITIAL_TENDER);
    setRequirements(INITIAL_REQUIREMENTS);
    setUploadedFiles([]);
    setMatches({});
    setExpiryDates({});
    setSealImageBytes(null);
    setSealImageName(null);
    setGeneratedPdfBlob(null);
    if (generatedPdfUrl) URL.revokeObjectURL(generatedPdfUrl);
    setGeneratedPdfUrl(null);
    triggerAlert('info', lang === 'bn' ? 'সকল তথ্য রিসেট করা হয়েছে।' : 'Reset all data.');
  };

  // Generate package PDF
  const handleGeneratePackage = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);

    try {
      const pdfBytes = await buildTenderPackagePdf({
        tender,
        requirements,
        matches,
        expiryDates,
        sealImageBytes,
      });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (generatedPdfUrl) URL.revokeObjectURL(generatedPdfUrl);
      setGeneratedPdfBlob(blob);
      setGeneratedPdfUrl(url);

      triggerAlert('success', t.packageReady);
    } catch (err) {
      triggerAlert('error', `Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download package PDF
  const handleDownloadPackage = () => {
    if (!generatedPdfBlob) return;
    const link = document.createElement('a');
    link.href = generatedPdfUrl;
    link.download = `${tender.tender_id || 'Tender'}_Package.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header lang={lang} setLang={setLang} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Floating Notification Toast */}
        {alertMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-md animate-in slide-in-from-top-2 duration-200 ${
              alertMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : alertMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {alertMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              ) : alertMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <Info className="w-4 h-4 shrink-0 text-blue-600" />
              )}
              <span>{alertMessage.text}</span>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer ml-4"
            >
              ✕
            </button>
          </div>
        )}

        {/* Section 1: Tender Metadata Card */}
        <TenderMeta
          tender={tender}
          requirements={requirements}
          lang={lang}
          onLoadSample={handleLoadSample}
          onUploadJson={handleUploadJson}
          onReset={handleReset}
          isLoadingSample={isLoadingSample}
        />

        {/* Two-column layout on large screens: Uploaded Files + Requirements List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Uploaded Files Box (Task 4.2 & 4.6) */}
          <div className="lg:col-span-4">
            <UploadedFilesList
              uploadedFiles={uploadedFiles}
              onUploadPdfs={handleUploadPdfs}
              onRemoveFile={handleRemoveFile}
              onClearAll={handleClearAllFiles}
              lang={lang}
            />
          </div>

          {/* Requirements & Matching Table (Task 4.1, 4.3, 4.4, 4.5) */}
          <div className="lg:col-span-8">
            <RequirementsTable
              requirements={requirements}
              matches={matches}
              expiryDates={expiryDates}
              requirementStatuses={requirementStatuses}
              uploadedFiles={uploadedFiles}
              onMatchChange={handleMatchChange}
              onExpiryChange={handleExpiryChange}
              onUnmatch={handleUnmatch}
              lang={lang}
            />
          </div>
        </div>

        {/* Section 3: Package Summary, Verification & Actions (Task 4.7 & 4.8) */}
        <PackageActions
          tender={tender}
          canGenerate={canGenerate}
          blockingReasons={blockingReasons}
          isGenerating={isGenerating}
          generatedPdfBlob={generatedPdfBlob}
          generatedPdfUrl={generatedPdfUrl}
          sealImageName={sealImageName}
          onGeneratePackage={handleGeneratePackage}
          onDownloadPackage={handleDownloadPackage}
          onPreviewPackage={() => setIsPreviewOpen(true)}
          onAutoMatch={handleAutoMatch}
          onExportCsv={handleExportCsv}
          onUploadStamp={handleUploadStamp}
          onClearStamp={handleClearStamp}
          requirementStatuses={requirementStatuses}
          lang={lang}
        />
      </main>

      {/* PDF Modal Viewer */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfUrl={generatedPdfUrl}
        tenderId={tender.tender_id}
        lang={lang}
      />

      <footer className="border-t border-slate-200 bg-white py-4 mt-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI DevFest 2026 • Tender Document Package Builder</span>
          <span>Contestant: Farhana Nasrin (252-15-037)</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
