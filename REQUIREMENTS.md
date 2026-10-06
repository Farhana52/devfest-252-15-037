# REQUIREMENTS.md — Tender Document Package Builder

## 1. Project Overview & Contest Metadata
- **Project Name**: Tender Document Package Builder
- **Participant Name**: Farhana Nasrin
- **Registration Number**: 252-15-037
- **Contest**: AI DevFest 2026 Vibe-Coding Contest
- **Repository**: `https://github.com/Farhana52/devfest-252-15-037`
- **Live Deployment**: `https://farhana52.github.io/devfest-252-15-037/`

---

## 2. Mandatory Tasks Checklist

- [ ] **4.1 Load the list**: The user opens `requirements.json`. The app shows the tender details and the list of required documents, sorted by `order`.
- [ ] **4.2 Upload files**: The user can upload many PDF files at once. Show each file's name and number of pages. If a file is not a PDF, reject it and show a clear message. The user can remove any uploaded file.
- [ ] **4.3 Match files**: The user matches each uploaded file to one required document. One document gets at most one file. One file goes to at most one document. The user can change or undo a match at any time.
- [ ] **4.4 Enter expiry dates**: If a document has `has_expiry = true` and a file is matched to it, the user enters its expiry date.
- [ ] **4.5 Check everything**: Show a status for every required document (see Status Rules). Update the status right away after every change.
- [ ] **4.6 Find duplicates**: If two or more uploaded files have exactly the same content (even with different names), mark them as duplicates. Do not allow them to be matched to different documents.
- [ ] **4.7 Make the package**: Keep the Generate button disabled while any document has a blocking status, and show why. When there are no blocking problems, create one combined PDF as described in Section 6.
- [ ] **4.8 Download**: The user downloads the package as `<tender_id>_Package.pdf`.
- [ ] **4.9 Two languages**: The user can switch the whole app between Bangla and English. Show document names from `title_bn` or `title_en`, based on the chosen language.

---

## 3. Optional & Bonus Tasks Checklist

- [ ] **Index page after the cover**: Showing the page number where each document starts.
- [ ] **Seal or signature**: The user uploads a PNG image and places it on chosen pages.
- [ ] **Export checklist as CSV / Excel**: Export (document title, file name, pages, expiry date, status).
- [ ] **Save and reopen work**: Auto-save to localStorage and/or export/import JSON state.
- [ ] **Bangla text on PDF cover / index**: Rendered correctly.
- [ ] **Auto-match**: Suggest matches based on file names.
- [ ] **Handle bad files safely**: For damaged or password-protected PDFs, show a clear message instead of crashing.
- [ ] **AI help (optional)**: User enters runtime API key stored in sessionStorage.

---

## 4. Input Schema & Validation Rules

### 4.1 `requirements.json` Schema
```json
{
  "tender": {
    "tender_id": "string (e.g. T-2026-0417)",
    "title": "string",
    "procuring_entity": "string",
    "bidder": "string",
    "submission_deadline": "string (YYYY-MM-DD)"
  },
  "requirements": [
    {
      "id": "string (e.g. R01)",
      "order": "number (positive integer, 1 = first)",
      "title_en": "string",
      "title_bn": "string",
      "mandatory": "boolean",
      "has_expiry": "boolean"
    }
  ]
}
```

### 4.2 Validation Rules
1. **JSON Structure**: Must contain valid `tender` object with required fields and `requirements` array.
2. **File Types**: Only PDF files (`.pdf` / `application/pdf`) allowed for documents. Non-PDF files must be rejected with an informative error message.
3. **File Limits**: Up to 30 files, up to 50 MB in total.
4. **Duplicate Detection**: Calculated via exact file content hashing (SHA-256). Files with identical hashes are flagged as duplicate and prevented from concurrent multi-document assignments.
5. **Date Format**: Expiry dates must be valid ISO `YYYY-MM-DD` dates.

---

## 5. Status Rules & Exact UI Strings

Each required document shows exactly one status:

| English Status | Bangla Status | Condition | Blocks Package? |
|---|---|---|---|
| **Missing** | **অনুপস্থিত** | Required document (`mandatory: true`), no file matched. | **Yes** |
| **Expiry date needed** | **মেয়াদ উত্তীর্ণের তারিখ প্রয়োজন** | `has_expiry = true` and a file is matched, but no expiry date entered. | **Yes** |
| **Expired** | **মেয়াদ শেষ** | The expiry date is strictly before the submission deadline (`expiry < deadline`). | **Yes** |
| **Not provided** | **প্রদান করা হয়নি** | Optional document (`mandatory: false`), no file matched. | **No** |
| **OK** | **ঠিক আছে** | File matched, and (if `has_expiry = true`) the expiry date is on or after the submission deadline (`expiry >= deadline`). | **No** |

*Note*: If a document expires on the same day as the submission deadline, it is **OK**.
Duplicate files are marked with a distinct badge ("Duplicate" / "ডুপ্লিকেট") in the uploaded files list.

---

## 6. PDF Package Generation Rules

1. **Cover Page (Page 1)**:
   - Language: English (clean, official layout).
   - Details: Tender ID, Tender Title, Procuring Entity, Bidder Name, Submission Deadline, Generation Date, and list of included documents in order.
2. **Document Pages (Page 2+)**:
   - Sorted strictly by `order` ascending.
   - Include all pages of each matched file in original order.
   - Optional documents without matched files are skipped.
3. **Footer**:
   - Printed on every page, including the cover page.
   - Format: `<tender_id> | Page X of Y` (where Y is total pages in the merged package).
   - Centered or positioned at the bottom margin, easy to read, non-overlapping.
4. **Download**:
   - Downloaded file named exactly `<tender_id>_Package.pdf`.

---

## 7. Test Matrix & Edge Cases

| Scenario | Action / Input | Expected Result |
|---|---|---|
| Sample baseline | Valid requirements.json loaded | Displays tender info & sorted document requirements |
| Non-PDF upload | Upload .txt or .docx | Rejected with clear bilingual error; valid files retained |
| Missing mandatory | Mandatory document has no file matched | Status is "Missing", Generate button disabled with reason |
| Expiry required | Document with `has_expiry: true` matched, empty date | Status is "Expiry date needed", Generate disabled |
| Expired document | Expiry date < deadline | Status is "Expired", Generate disabled |
| Valid same-day | Expiry date == deadline | Status is "OK", does not block |
| Valid future date | Expiry date > deadline | Status is "OK", does not block |
| Optional omitted | Optional document (`mandatory: false`), no file | Status is "Not provided", does not block package |
| Content duplicate | Two files with identical bytes | Flagged as duplicate; cannot match to different documents |
| Language toggle | Toggle English / বাংলা | Instant full UI translation; document titles toggle between `title_en` and `title_bn` |
| Package creation | All mandatory items OK, optional skipped | Generates combined PDF with Cover Page, correct document order, footer `Page X of Y` |

---

## 8. Required Deliverables
1. `REQUIREMENTS.md` (committed)
2. `output/<tender_id>_Package.pdf` (committed sample output)
3. `screenshots/` (with status verification screenshot)
4. `README.md` with full contest criteria
5. `LICENSE` (MIT, Farhana Nasrin 2026)
6. GitHub repo `devfest-252-15-037` with working GitHub Actions Pages deployment
