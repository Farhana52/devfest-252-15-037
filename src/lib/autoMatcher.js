/**
 * Auto-match helper: matches files to requirements using keyword heuristics.
 */
export function autoMatchFiles(requirements, uploadedFiles) {
  const matches = {};
  const usedFileIds = new Set();

  const keywords = {
    R01: ['trade', 'license', 'ব্যবসায়', 'লাইসেন্স'],
    R02: ['tin', 'vat', 'tax', 'টিআইএন', 'ভ্যাট'],
    R03: ['solvency', 'bank', 'ব্যাংক', 'সলভেন্সি'],
    R04: ['tech', 'proposal', 'কারিগরি', 'প্রস্তাবনা'],
    R05: ['exp', 'cert', 'অভিজ্ঞতা'],
    R06: ['auth', 'manu', 'প্রস্তুতকারক', 'অনুমোদন'],
  };

  for (const req of requirements) {
    const titleTokens = (req.title_en || '').toLowerCase().split(/[\s_.-]+/);
    const specificKeywords = keywords[req.id] || [];

    for (const file of uploadedFiles) {
      if (usedFileIds.has(file.id)) continue;
      // Skip if marked duplicate and already assigned
      const fname = (file.name || '').toLowerCase();

      const matchedKeyword = specificKeywords.some(kw => fname.includes(kw));
      const matchedToken = titleTokens.some(token => token.length > 2 && fname.includes(token));

      if (matchedKeyword || matchedToken) {
        matches[req.id] = file;
        usedFileIds.add(file.id);
        break;
      }
    }
  }

  return matches;
}
