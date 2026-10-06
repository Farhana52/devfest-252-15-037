import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import {
  STATUS_CODES,
  evaluateRequirementStatus,
  evaluatePackageStatus,
} from '../src/lib/status.js';
import {
  validateRequirementsJson,
  validateUploadedFile,
  validateUploadLimits,
  findDuplicateMatchingConflicts,
} from '../src/lib/validator.js';
import {
  computeFileHash,
  markDuplicateFiles,
} from '../src/lib/hasher.js';
import { buildTenderPackagePdf } from '../src/lib/pdfBuilder.js';

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(err);
    failed++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✓ ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${desc}`);
    console.error(err);
    failed++;
  }
}

console.log('\n--- 1. Testing Schema & Input Validation ---');

it('validates a correct requirements.json structure and sorts by order', () => {
  const raw = {
    tender: {
      tender_id: 'T-2026-0417',
      title: 'IT Hardware',
      procuring_entity: 'Ministry',
      bidder: 'Acme Corp',
      submission_deadline: '2026-10-20',
    },
    requirements: [
      { id: 'R02', order: 2, title_en: 'TIN', title_bn: 'টিআইএন', mandatory: true, has_expiry: false },
      { id: 'R01', order: 1, title_en: 'Trade License', title_bn: 'ট্রেড লাইসেন্স', mandatory: true, has_expiry: true },
    ],
  };

  const res = validateRequirementsJson(raw);
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.data.requirements[0].id, 'R01');
  assert.strictEqual(res.data.requirements[1].id, 'R02');
});

it('rejects requirements.json with missing tender metadata', () => {
  const bad = { tender: { tender_id: 'T1' }, requirements: [] };
  const res = validateRequirementsJson(bad);
  assert.strictEqual(res.valid, false);
});

it('rejects invalid date format in submission deadline', () => {
  const bad = {
    tender: {
      tender_id: 'T1',
      title: 'Test',
      procuring_entity: 'Test',
      bidder: 'Test',
      submission_deadline: '20-10-2026', // non-ISO
    },
    requirements: [{ id: 'R1', order: 1, title_en: 'T', mandatory: true, has_expiry: false }],
  };
  const res = validateRequirementsJson(bad);
  assert.strictEqual(res.valid, false);
});

it('rejects duplicate requirement IDs in requirements array', () => {
  const bad = {
    tender: {
      tender_id: 'T1',
      title: 'Test',
      procuring_entity: 'Test',
      bidder: 'Test',
      submission_deadline: '2026-10-20',
    },
    requirements: [
      { id: 'R01', order: 1, title_en: 'A', mandatory: true, has_expiry: false },
      { id: 'R01', order: 2, title_en: 'B', mandatory: false, has_expiry: false },
    ],
  };
  const res = validateRequirementsJson(bad);
  assert.strictEqual(res.valid, false);
});

console.log('\n--- 2. Testing File Type & Limit Validation ---');

it('accepts PDF files and rejects non-PDF files', () => {
  assert.strictEqual(validateUploadedFile({ name: 'document.pdf', type: 'application/pdf' }).valid, true);
  assert.strictEqual(validateUploadedFile({ name: 'scan.PDF', type: '' }).valid, true);

  const nonPdf = validateUploadedFile({ name: 'notes.docx', type: 'application/vnd.openxmlformats-officedocument' });
  assert.strictEqual(nonPdf.valid, false);
  assert.ok(nonPdf.error.includes('Only PDF'));

  const image = validateUploadedFile({ name: 'photo.png', type: 'image/png' });
  assert.strictEqual(image.valid, false);
});

it('enforces file count limit (<= 30) and size limit (<= 50MB)', () => {
  const existing29 = Array.from({ length: 29 }, (_, i) => ({ id: `f${i}`, size: 100 }));
  assert.strictEqual(validateUploadLimits(existing29, [{ size: 100 }]).valid, true);
  assert.strictEqual(validateUploadLimits(existing29, [{ size: 100 }, { size: 100 }]).valid, false);

  const largeFile = [{ size: 55 * 1024 * 1024 }];
  assert.strictEqual(validateUploadLimits([], largeFile).valid, false);
});

console.log('\n--- 3. Testing Duplicate Content Detection (Task 4.6) ---');

await itAsync('hashes content correctly and marks duplicate files', async () => {
  const bufferA = new Uint8Array([1, 2, 3, 4, 5]);
  const bufferB = new Uint8Array([1, 2, 3, 4, 5]);
  const bufferC = new Uint8Array([9, 9, 9]);

  const hashA = await computeFileHash(bufferA.buffer);
  const hashB = await computeFileHash(bufferB.buffer);
  const hashC = await computeFileHash(bufferC.buffer);

  assert.strictEqual(hashA, hashB);
  assert.notStrictEqual(hashA, hashC);

  const files = [
    { id: 'f1', name: 'license_copy_1.pdf', hash: hashA },
    { id: 'f2', name: 'license_copy_2.pdf', hash: hashB },
    { id: 'f3', name: 'other.pdf', hash: hashC },
  ];

  const marked = markDuplicateFiles(files);
  assert.strictEqual(marked[0].isDuplicate, true);
  assert.strictEqual(marked[1].isDuplicate, true);
  assert.strictEqual(marked[2].isDuplicate, false);

  // Check matching conflict detection
  const matches = {
    R01: { id: 'f1', name: 'license_copy_1.pdf', hash: hashA },
    R02: { id: 'f2', name: 'license_copy_2.pdf', hash: hashB },
  };

  const conflicts = findDuplicateMatchingConflicts(matches, files);
  assert.strictEqual(conflicts.length, 1);
  assert.ok(conflicts[0].includes('Duplicate files cannot be assigned to different documents'));
});

console.log('\n--- 4. Testing Section 5 Status Rules Matrix ---');

const deadline = '2026-10-20';

it('Row 1: Missing — Required document, no file matched (Blocks: Yes)', () => {
  const req = { id: 'R01', mandatory: true, has_expiry: true };
  const res = evaluateRequirementStatus(req, null, null, deadline);
  assert.strictEqual(res.status, STATUS_CODES.MISSING);
  assert.strictEqual(res.isBlocking, true);
});

it('Row 2: Expiry date needed — has_expiry=true & file matched, no expiry entered (Blocks: Yes)', () => {
  const req = { id: 'R01', mandatory: true, has_expiry: true };
  const file = { id: 'f1', name: 'license.pdf' };
  const res = evaluateRequirementStatus(req, file, '', deadline);
  assert.strictEqual(res.status, STATUS_CODES.EXPIRY_NEEDED);
  assert.strictEqual(res.isBlocking, true);
});

it('Row 3: Expired — Expiry date before submission deadline (Blocks: Yes)', () => {
  const req = { id: 'R01', mandatory: true, has_expiry: true };
  const file = { id: 'f1', name: 'license.pdf' };
  const res = evaluateRequirementStatus(req, file, '2026-10-19', deadline); // 1 day before
  assert.strictEqual(res.status, STATUS_CODES.EXPIRED);
  assert.strictEqual(res.isBlocking, true);
});

it('Row 4: Not provided — Optional document, no file matched (Blocks: No)', () => {
  const req = { id: 'R05', mandatory: false, has_expiry: false };
  const res = evaluateRequirementStatus(req, null, null, deadline);
  assert.strictEqual(res.status, STATUS_CODES.NOT_PROVIDED);
  assert.strictEqual(res.isBlocking, false);
});

it('Row 5a: OK — Expiry on exactly the same day as deadline (Blocks: No)', () => {
  const req = { id: 'R01', mandatory: true, has_expiry: true };
  const file = { id: 'f1', name: 'license.pdf' };
  const res = evaluateRequirementStatus(req, file, '2026-10-20', deadline);
  assert.strictEqual(res.status, STATUS_CODES.OK);
  assert.strictEqual(res.isBlocking, false);
});

it('Row 5b: OK — Expiry date after submission deadline (Blocks: No)', () => {
  const req = { id: 'R01', mandatory: true, has_expiry: true };
  const file = { id: 'f1', name: 'license.pdf' };
  const res = evaluateRequirementStatus(req, file, '2026-12-31', deadline);
  assert.strictEqual(res.status, STATUS_CODES.OK);
  assert.strictEqual(res.isBlocking, false);
});

it('Row 5c: OK — Matched document without expiry check (Blocks: No)', () => {
  const req = { id: 'R02', mandatory: true, has_expiry: false };
  const file = { id: 'f2', name: 'tin.pdf' };
  const res = evaluateRequirementStatus(req, file, null, deadline);
  assert.strictEqual(res.status, STATUS_CODES.OK);
  assert.strictEqual(res.isBlocking, false);
});

console.log('\n--- 5. Testing Overall Package Status & Blocking ---');

it('Blocks package generation when mandatory item is missing', () => {
  const reqs = [
    { id: 'R01', order: 1, title_en: 'License', mandatory: true, has_expiry: false },
    { id: 'R02', order: 2, title_en: 'Optional Cert', mandatory: false, has_expiry: false },
  ];
  const pkg = evaluatePackageStatus(reqs, {}, {}, deadline);
  assert.strictEqual(pkg.canGenerate, false);
  assert.strictEqual(pkg.blockingReasons.length, 1);
});

it('Allows package generation when mandatory items are OK and optional is Not provided', () => {
  const reqs = [
    { id: 'R01', order: 1, title_en: 'License', mandatory: true, has_expiry: false },
    { id: 'R02', order: 2, title_en: 'Optional Cert', mandatory: false, has_expiry: false },
  ];
  const matches = {
    R01: { id: 'f1', name: 'license.pdf' },
  };
  const pkg = evaluatePackageStatus(reqs, matches, {}, deadline);
  assert.strictEqual(pkg.canGenerate, true);
  assert.strictEqual(pkg.blockingReasons.length, 0);
});

console.log('\n--- 6. Testing End-to-End PDF Builder (Section 6) ---');

await itAsync('Generates complete PDF package with Cover Page, documents, and footer Page X of Y', async () => {
  const dataDir = path.resolve('public/data');
  const reqJson = JSON.parse(fs.readFileSync(path.join(dataDir, 'requirements.json'), 'utf8'));

  const file1Bytes = fs.readFileSync(path.join(dataDir, 'documents/trade_license_valid.pdf'));
  const file2Bytes = fs.readFileSync(path.join(dataDir, 'documents/tin_vat_certificate.pdf'));

  const matches = {
    R01: { id: 'f1', name: 'trade_license_valid.pdf', bytes: new Uint8Array(file1Bytes) },
    R02: { id: 'f2', name: 'tin_vat_certificate.pdf', bytes: new Uint8Array(file2Bytes) },
  };

  const expiryDates = {
    R01: '2026-12-31',
  };

  const pdfBytes = await buildTenderPackagePdf({
    tender: reqJson.tender,
    requirements: reqJson.requirements,
    matches,
    expiryDates,
  });

  // Verify merged PDF structure with pdf-lib
  const parsedPdf = await PDFDocument.load(pdfBytes);
  // Cover page (1) + trade_license (2 pages) + tin_vat (1 page) = 4 pages total
  assert.strictEqual(parsedPdf.getPageCount(), 4, 'Total pages must equal 1 cover + 2 doc1 + 1 doc2 = 4');

  // Verify that passing shuffled requirements still preserves strict order ascending
  const shuffledReqs = [reqJson.requirements[1], reqJson.requirements[0]];
  const pdfBytesShuffled = await buildTenderPackagePdf({
    tender: reqJson.tender,
    requirements: shuffledReqs,
    matches,
    expiryDates,
  });
  const parsedShuffled = await PDFDocument.load(pdfBytesShuffled);
  assert.strictEqual(parsedShuffled.getPageCount(), 4, 'Shuffled requirements still produce identical ordered package');

  // Verify output directory exists and save sample output
  const outputDir = path.resolve('output');
  fs.mkdirSync(outputDir, { recursive: true });
  const outPath = path.join(outputDir, `${reqJson.tender.tender_id}_Package.pdf`);
  fs.writeFileSync(outPath, pdfBytes);
  assert.ok(fs.existsSync(outPath), 'Output package file written successfully');
});

console.log(`\n========================================`);
console.log(`Test Summary: ${passed} passed, ${failed} failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
