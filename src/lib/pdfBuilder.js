import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Build the complete tender package PDF following Section 6 specifications.
 * 
 * @param {Object} params
 * @param {Object} params.tender - Tender metadata object
 * @param {Array} params.requirements - List of requirements sorted by order
 * @param {Object} params.matches - Map of requirement ID to matched file object { file, name, arrayBuffer, pageCount }
 * @param {Object} params.expiryDates - Map of requirement ID to expiry date string
 * @param {Uint8Array|null} params.sealImageBytes - Optional PNG image bytes for signature/seal stamp
 * @returns {Promise<Uint8Array>} Merged PDF bytes
 */
export async function buildTenderPackagePdf({
  tender,
  requirements,
  matches,
  expiryDates = {},
  sealImageBytes = null,
}) {
  const mergedPdf = await PDFDocument.create();

  const helvetica = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // Filter only requirements that have an active matched file, strictly sorted by order
  const sortedRequirements = [...requirements].sort((a, b) => (a.order || 0) - (b.order || 0));
  const includedItems = [];
  for (const req of sortedRequirements) {
    const matched = matches[req.id];
    if (matched && (matched.arrayBuffer || matched.bytes)) {
      includedItems.push({
        requirement: req,
        matched,
        expiryDate: expiryDates[req.id] || null,
      });
    }
  }

  // Pre-load external PDF documents to calculate page counts and starting page numbers
  const loadedDocs = [];
  let currentStartPage = 2; // Page 1 is cover page

  for (const item of includedItems) {
    try {
      const rawData = item.matched.bytes || item.matched.arrayBuffer;
      const safeBytes = rawData instanceof Uint8Array ? rawData : new Uint8Array(rawData);
      const srcPdf = await PDFDocument.load(safeBytes, { ignoreEncryption: true });
      const pageCount = srcPdf.getPageCount();
      loadedDocs.push({
        ...item,
        srcPdf,
        pageCount,
        startPage: currentStartPage,
        endPage: currentStartPage + pageCount - 1,
      });
      currentStartPage += pageCount;
    } catch (err) {
      throw new Error(`Failed to read PDF "${item.matched.name}": ${err.message || 'File is damaged or password-protected'}`);
    }
  }

  // 1. Create Cover Page (Page 1)
  const coverPage = mergedPdf.addPage([595.28, 841.89]); // A4: 595.28 x 841.89 pt
  const { width: pageWidth, height: pageHeight } = coverPage.getSize();

  // Decorative border
  coverPage.drawRectangle({
    x: 36,
    y: 36,
    width: pageWidth - 72,
    height: pageHeight - 72,
    borderColor: rgb(0.12, 0.23, 0.38),
    borderWidth: 2,
  });

  coverPage.drawRectangle({
    x: 40,
    y: 40,
    width: pageWidth - 80,
    height: pageHeight - 80,
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 0.75,
  });

  // Header Title
  let yPos = pageHeight - 90;
  coverPage.drawText('TENDER SUBMISSION PACKAGE', {
    x: 60,
    y: yPos,
    size: 22,
    font: helveticaBold,
    color: rgb(0.1, 0.2, 0.4),
  });

  yPos -= 22;
  coverPage.drawText('Official Verified Bidder Submission Document', {
    x: 60,
    y: yPos,
    size: 11,
    font: helvetica,
    color: rgb(0.35, 0.4, 0.45),
  });

  yPos -= 30;
  // Divider line
  coverPage.drawLine({
    start: { x: 60, y: yPos },
    end: { x: pageWidth - 60, y: yPos },
    thickness: 1.5,
    color: rgb(0.12, 0.23, 0.38),
  });

  yPos -= 25;

  // Tender Details section (Section 6.1)
  const details = [
    { label: 'Tender ID:', value: tender.tender_id },
    { label: 'Tender Title:', value: tender.title },
    { label: 'Procuring Entity:', value: tender.procuring_entity },
    { label: 'Bidder Name:', value: tender.bidder },
    { label: 'Submission Deadline:', value: tender.submission_deadline },
    { label: 'Package Generated Date:', value: new Date().toISOString().split('T')[0] },
  ];

  for (const item of details) {
    coverPage.drawText(item.label, {
      x: 60,
      y: yPos,
      size: 10,
      font: helveticaBold,
      color: rgb(0.2, 0.25, 0.3),
    });

    coverPage.drawText(String(item.value || 'N/A'), {
      x: 210,
      y: yPos,
      size: 10,
      font: helvetica,
      color: rgb(0.1, 0.1, 0.1),
    });

    yPos -= 18;
  }

  yPos -= 15;

  // Table of included documents (Section 6.1 & Bonus Index)
  coverPage.drawText('INDEX OF INCLUDED DOCUMENTS', {
    x: 60,
    y: yPos,
    size: 12,
    font: helveticaBold,
    color: rgb(0.1, 0.2, 0.4),
  });

  yPos -= 18;

  // Table Header
  coverPage.drawRectangle({
    x: 60,
    y: yPos - 5,
    width: pageWidth - 120,
    height: 20,
    color: rgb(0.92, 0.95, 0.98),
  });

  coverPage.drawText('Order', { x: 65, y: yPos, size: 9, font: helveticaBold, color: rgb(0.1, 0.2, 0.3) });
  coverPage.drawText('Document Title', { x: 105, y: yPos, size: 9, font: helveticaBold, color: rgb(0.1, 0.2, 0.3) });
  coverPage.drawText('File Name', { x: 260, y: yPos, size: 9, font: helveticaBold, color: rgb(0.1, 0.2, 0.3) });
  coverPage.drawText('Pages', { x: 410, y: yPos, size: 9, font: helveticaBold, color: rgb(0.1, 0.2, 0.3) });
  coverPage.drawText('Start Page', { x: 470, y: yPos, size: 9, font: helveticaBold, color: rgb(0.1, 0.2, 0.3) });

  yPos -= 22;

  // Rows
  for (const doc of loadedDocs) {
    const title = doc.requirement.title_en || doc.requirement.id;
    const truncatedTitle = title.length > 28 ? title.slice(0, 26) + '..' : title;
    const fileName = doc.matched.name || 'document.pdf';
    const truncatedFile = fileName.length > 26 ? fileName.slice(0, 24) + '..' : fileName;

    coverPage.drawText(String(doc.requirement.order), { x: 72, y: yPos, size: 9, font: helvetica, color: rgb(0.1, 0.1, 0.1) });
    coverPage.drawText(truncatedTitle, { x: 105, y: yPos, size: 9, font: helvetica, color: rgb(0.1, 0.1, 0.1) });
    coverPage.drawText(truncatedFile, { x: 260, y: yPos, size: 9, font: helvetica, color: rgb(0.3, 0.3, 0.3) });
    coverPage.drawText(String(doc.pageCount), { x: 418, y: yPos, size: 9, font: helvetica, color: rgb(0.1, 0.1, 0.1) });
    coverPage.drawText(`Page ${doc.startPage}`, { x: 470, y: yPos, size: 9, font: helveticaBold, color: rgb(0.1, 0.2, 0.4) });

    // Subtle line below row
    coverPage.drawLine({
      start: { x: 60, y: yPos - 5 },
      end: { x: pageWidth - 60, y: yPos - 5 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });

    yPos -= 18;
  }

  // 2. Append all pages of each matched document (Section 6.2)
  for (const doc of loadedDocs) {
    const pageIndices = doc.srcPdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(doc.srcPdf, pageIndices);
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  // Total pages calculation (Y)
  const totalPages = mergedPdf.getPageCount();

  // Optional seal/signature stamp on cover page
  if (sealImageBytes) {
    try {
      const sealImage = await mergedPdf.embedPng(sealImageBytes);
      const sealDims = sealImage.scale(0.35);
      coverPage.drawImage(sealImage, {
        x: pageWidth - 190,
        y: 60,
        width: Math.min(sealDims.width, 120),
        height: Math.min(sealDims.height, 60),
      });
      coverPage.drawText('Digitally Sealed & Verified', {
        x: pageWidth - 190,
        y: 50,
        size: 7,
        font: helvetica,
        color: rgb(0.4, 0.4, 0.4),
      });
    } catch {
      // Ignore invalid seal format gracefully
    }
  }

  // 3. Add footer to every page (Section 6.3 & 6.4)
  // Format: <tender_id> | Page X of Y
  const allPages = mergedPdf.getPages();
  for (let idx = 0; idx < allPages.length; idx++) {
    const page = allPages[idx];
    const { width: pWidth } = page.getSize();
    const pageNumber = idx + 1;
    const footerText = `${tender.tender_id} | Page ${pageNumber} of ${totalPages}`;

    const textWidth = helvetica.widthOfTextAtSize(footerText, 9);
    const xPos = (pWidth - textWidth) / 2; // Center alignment
    const yFooter = 18; // Bottom margin

    // Subtle background strip to ensure readability even over busy scans
    page.drawRectangle({
      x: xPos - 8,
      y: yFooter - 4,
      width: textWidth + 16,
      height: 14,
      color: rgb(1, 1, 1),
      opacity: 0.85,
    });

    page.drawText(footerText, {
      x: xPos,
      y: yFooter,
      size: 9,
      font: helvetica,
      color: rgb(0.2, 0.25, 0.3),
    });
  }

  return await mergedPdf.save();
}
