import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function createSamplePdf(outputPath, title, pageCount, subtitle = '') {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 30,
      y: 30,
      width: width - 60,
      height: height - 60,
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 1.5,
    });

    page.drawText(title, {
      x: 60,
      y: height - 80,
      size: 20,
      font,
      color: rgb(0.1, 0.2, 0.4),
    });

    if (subtitle) {
      page.drawText(subtitle, {
        x: 60,
        y: height - 110,
        size: 12,
        font: regularFont,
        color: rgb(0.4, 0.45, 0.5),
      });
    }

    page.drawText(`Sample Official Document Content - Page ${i} of ${pageCount}`, {
      x: 60,
      y: height - 160,
      size: 11,
      font: regularFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText('This document is a certified copy for tender submission verification.', {
      x: 60,
      y: height - 185,
      size: 10,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

async function run() {
  const dataDir = path.resolve('public/data');
  const docsDir = path.join(dataDir, 'documents');
  fs.mkdirSync(docsDir, { recursive: true });

  const requirements = {
    tender: {
      tender_id: "T-2026-0417",
      title: "Supply of IT Equipment",
      procuring_entity: "Example Directorate",
      bidder: "Example Company Ltd.",
      submission_deadline: "2026-10-20"
    },
    requirements: [
      { id: "R01", order: 1, title_en: "Trade License", title_bn: "ট্রেড লাইসেন্স", mandatory: true, has_expiry: true },
      { id: "R02", order: 2, title_en: "TIN & VAT Certificate", title_bn: "টিআইএন ও ভ্যাট সনদ", mandatory: true, has_expiry: false },
      { id: "R03", order: 3, title_en: "Bank Solvency Letter", title_bn: "ব্যাংক সলভেন্সি সার্টিফিকেট", mandatory: true, has_expiry: true },
      { id: "R04", order: 4, title_en: "Technical Proposal", title_bn: "কারিগরি প্রস্তাবনা", mandatory: true, has_expiry: false },
      { id: "R05", order: 5, title_en: "Experience Certificate", title_bn: "অভিজ্ঞতার সনদ", mandatory: false, has_expiry: false },
      { id: "R06", order: 6, title_en: "Manufacturer Authorization", title_bn: "প্রস্তুতকারকের অনুমোদনপত্র", mandatory: false, has_expiry: true }
    ]
  };

  fs.writeFileSync(path.join(dataDir, 'requirements.json'), JSON.stringify(requirements, null, 2));

  await createSamplePdf(path.join(docsDir, 'trade_license_valid.pdf'), 'TRADE LICENSE 2026', 2, 'Valid until 2026-12-31');
  await createSamplePdf(path.join(docsDir, 'tin_vat_certificate.pdf'), 'TIN & VAT REGISTRATION', 1, 'Tax Identification Certification');
  await createSamplePdf(path.join(docsDir, 'bank_solvency.pdf'), 'BANK SOLVENCY CERTIFICATE', 1, 'Issued by National Bank');
  await createSamplePdf(path.join(docsDir, 'technical_proposal.pdf'), 'TECHNICAL PROPOSAL', 4, 'Detailed Specifications & BOM');
  await createSamplePdf(path.join(docsDir, 'experience_cert.pdf'), 'PAST EXPERIENCE CREDENTIALS', 2, 'Prior Government Deployments');
  await createSamplePdf(path.join(docsDir, 'expired_trade_license.pdf'), 'OLD TRADE LICENSE 2025', 1, 'Expired 2026-06-01');

  // Create an exact duplicate with different filename to test duplicate detection
  fs.copyFileSync(
    path.join(docsDir, 'bank_solvency.pdf'),
    path.join(docsDir, 'bank_solvency_duplicate_copy.pdf')
  );

  console.log('Sample requirements and PDFs generated successfully in public/data');
}

run().catch(console.error);
