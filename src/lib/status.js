/**
 * Status constants matching Section 5 exact specification.
 */
export const STATUS_CODES = {
  OK: 'OK',
  MISSING: 'Missing',
  EXPIRY_NEEDED: 'Expiry date needed',
  EXPIRED: 'Expired',
  NOT_PROVIDED: 'Not provided',
};

/**
 * Determine the exact status for a single tender requirement.
 * 
 * @param {Object} requirement - Requirement object from requirements.json
 * @param {Object|null} matchedFile - File matched to this requirement (if any)
 * @param {string|null} expiryDate - Expiry date entered by user (YYYY-MM-DD)
 * @param {string} submissionDeadline - Tender submission deadline (YYYY-MM-DD)
 * @returns {{ status: string, isBlocking: boolean, reason: string }}
 */
export function evaluateRequirementStatus(requirement, matchedFile, expiryDate, submissionDeadline) {
  const isMatched = Boolean(matchedFile);

  // If no file is matched
  if (!isMatched) {
    if (requirement.mandatory) {
      return {
        status: STATUS_CODES.MISSING,
        isBlocking: true,
        reason: 'Required document has no file matched.',
      };
    } else {
      return {
        status: STATUS_CODES.NOT_PROVIDED,
        isBlocking: false,
        reason: 'Optional document not provided.',
      };
    }
  }

  // File is matched. Check expiry requirement.
  if (requirement.has_expiry) {
    if (!expiryDate || expiryDate.trim() === '') {
      return {
        status: STATUS_CODES.EXPIRY_NEEDED,
        isBlocking: true,
        reason: 'Expiry date must be entered.',
      };
    }

    // Compare date with submission deadline. Normalize to YYYY-MM-DD.
    const cleanExpiry = expiryDate.trim();
    const cleanDeadline = (submissionDeadline || '').trim();

    if (cleanExpiry < cleanDeadline) {
      return {
        status: STATUS_CODES.EXPIRED,
        isBlocking: true,
        reason: `Document expired (${cleanExpiry} is before deadline ${cleanDeadline}).`,
      };
    }
  }

  // Otherwise valid
  return {
    status: STATUS_CODES.OK,
    isBlocking: false,
    reason: 'Document verified and valid.',
  };
}

/**
 * Evaluate the overall package status and blocking list.
 */
export function evaluatePackageStatus(requirements, matches, expiryDates, submissionDeadline, duplicateConflicts = []) {
  const requirementStatuses = [];
  const blockingReasons = [];

  for (const req of requirements) {
    const matchedFile = matches[req.id] || null;
    const expiryDate = expiryDates[req.id] || '';
    const result = evaluateRequirementStatus(req, matchedFile, expiryDate, submissionDeadline);

    requirementStatuses.push({
      requirement: req,
      matchedFile,
      expiryDate,
      ...result,
    });

    if (result.isBlocking) {
      blockingReasons.push(`${req.title_en || req.id}: ${result.status} (${result.reason})`);
    }
  }

  // Check duplicate file conflicts
  if (duplicateConflicts.length > 0) {
    for (const conflict of duplicateConflicts) {
      blockingReasons.push(`Duplicate file conflict: ${conflict}`);
    }
  }

  return {
    requirementStatuses,
    blockingReasons,
    canGenerate: blockingReasons.length === 0,
  };
}
