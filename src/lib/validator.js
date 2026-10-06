/**
 * Validation constants and limits from problem specification.
 */
export const MAX_FILES = 30;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB

/**
 * Validate the structure and fields of requirements.json.
 */
export function validateRequirementsJson(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'File content must be a valid JSON object.' };
  }

  const { tender, requirements } = data;

  if (!tender || typeof tender !== 'object') {
    return { valid: false, error: 'Missing "tender" details object.' };
  }

  const requiredTenderFields = ['tender_id', 'title', 'procuring_entity', 'bidder', 'submission_deadline'];
  for (const field of requiredTenderFields) {
    if (!tender[field] || typeof tender[field] !== 'string') {
      return { valid: false, error: `Tender details missing or invalid field: "${field}".` };
    }
  }

  // Validate deadline format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tender.submission_deadline)) {
    return { valid: false, error: 'Tender submission_deadline must be formatted as YYYY-MM-DD.' };
  }

  if (!Array.isArray(requirements) || requirements.length === 0) {
    return { valid: false, error: 'Requirements must be a non-empty array of items.' };
  }

  const seenIds = new Set();
  for (const [idx, req] of requirements.entries()) {
    if (!req.id || typeof req.id !== 'string') {
      return { valid: false, error: `Requirement at index ${idx} is missing a valid "id".` };
    }
    if (seenIds.has(req.id)) {
      return { valid: false, error: `Duplicate requirement ID found: "${req.id}".` };
    }
    seenIds.add(req.id);

    if (typeof req.order !== 'number' || req.order < 1) {
      return { valid: false, error: `Requirement "${req.id}" has invalid "order" (must be positive number).` };
    }

    if (!req.title_en || typeof req.title_en !== 'string') {
      return { valid: false, error: `Requirement "${req.id}" is missing "title_en".` };
    }

    if (typeof req.mandatory !== 'boolean') {
      return { valid: false, error: `Requirement "${req.id}" has non-boolean "mandatory" flag.` };
    }

    if (typeof req.has_expiry !== 'boolean') {
      return { valid: false, error: `Requirement "${req.id}" has non-boolean "has_expiry" flag.` };
    }
  }

  // Return sorted requirements by order
  const sortedRequirements = [...requirements].sort((a, b) => a.order - b.order);

  return {
    valid: true,
    data: {
      tender: { ...tender },
      requirements: sortedRequirements,
    },
  };
}

/**
 * Validate individual uploaded file to ensure it is a PDF.
 */
export function validateUploadedFile(file) {
  const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf' || file.type === '';

  if (!isPdfExtension && !isPdfMime) {
    return {
      valid: false,
      error: `File "${file.name}" is not a PDF. Only PDF files are accepted.`,
    };
  }

  return { valid: true };
}

/**
 * Validate batch upload limits (up to 30 files, 50MB max total).
 */
export function validateUploadLimits(existingFiles, newFiles) {
  const totalCount = existingFiles.length + newFiles.length;
  if (totalCount > MAX_FILES) {
    return {
      valid: false,
      error: `Maximum file limit exceeded. Total allowed is ${MAX_FILES} files.`,
    };
  }

  const existingSize = existingFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const newSize = newFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSize = existingSize + newSize;

  if (totalSize > MAX_TOTAL_BYTES) {
    return {
      valid: false,
      error: `Maximum size limit exceeded. Total size must be under 50 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Check for duplicate file assignment conflicts.
 * Task 4.6: If two or more uploaded files have exactly the same content,
 * do not allow them to be matched to different documents.
 */
export function findDuplicateMatchingConflicts(matches, uploadedFiles) {
  // Map fileId to hash
  const fileHashMap = {};
  for (const f of uploadedFiles) {
    if (f.hash) {
      fileHashMap[f.id] = f.hash;
    }
  }

  // Check if multiple matched requirements use files with identical hash
  const hashToReqs = {};
  for (const [reqId, file] of Object.entries(matches)) {
    if (file && file.id) {
      const hash = fileHashMap[file.id] || file.hash;
      if (hash) {
        if (!hashToReqs[hash]) {
          hashToReqs[hash] = [];
        }
        hashToReqs[hash].push({ reqId, fileName: file.name });
      }
    }
  }

  const conflicts = [];
  for (const [hash, entries] of Object.entries(hashToReqs)) {
    if (entries.length > 1) {
      const names = entries.map(e => `"${e.fileName}"`).join(' and ');
      conflicts.push(`Identical files ${names} are matched to multiple requirements. Duplicate files cannot be assigned to different documents.`);
    }
  }

  return conflicts;
}
