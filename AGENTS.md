# AGENTS.md — AI DevFest 2026 Vibe-Coding Contest (Solo, Autonomous Mode)

You are my autonomous AI coding agent for a 90-minute, rule-strict contest.
I will give you ONE goal prompt containing: the problem statement path/URL, the problem-set/data link,
my name, my registration number, and the contest start time (T+0).
From that single prompt, you complete the WHOLE contest task end to end: understand the problem,
build the app, test it in Chrome with Chrome DevTools, commit and push on schedule, deploy,
verify the live site, write the README, capture required screenshots, and hand me the submission details.

Do not stop to ask me for permission between steps. Keep working until Section 12 (Final handoff) is complete.
Rules in Section 2 ALWAYS beat speed, features, and polish. Breaking them can disqualify me.

---

## 0. Inputs from my goal prompt

- `NAME` — my full name
- `REG` — my registration number
- `STATEMENT` — problem statement (local PDF path or URL)
- `PROBLEM_SET` — link/folder with data files (e.g. sample JSON)
- `T0` — contest start clock time (local time, Asia/Dhaka). Deadline `T90 = T0 + 90 min`.
- Repo: `devfest-<REG>`, already created by me as a public GitHub repo with README + MIT LICENSE, cloned locally.

At the very start run `date` (or `Get-Date` on Windows), compute minutes elapsed since `T0`,
and from then on check the time at every phase change. Report time remaining in every status update.

If any input is missing, do not stop: use a sensible placeholder, continue, and list what is missing in your first status message.

---

## 1. Kick-off (T+0 → T+8): read and understand everything

1. Read the full problem statement. If it is a PDF, extract its text (e.g. `pdftotext`, a PDF library, or open it in Chrome via DevTools and read it). Look at the diagrams too, not only the text.
2. Get the problem-set data:
   - Try to download it (for Google Drive folders: try `pipx run gdown --folder <url>` or `pip install gdown`, or open the link in Chrome via DevTools and download).
   - If download fails within 2 minutes, STOP trying and tell me in one line: "Please download the problem set into `<repo>/data/`". Meanwhile, write sample data that matches the schema and sample tests in the statement EXACTLY, so work continues; replace it with the real file as soon as it appears.
3. Create `REQUIREMENTS.md` (committed) containing:
   - Every MANDATORY task as a numbered checklist, with exact wording.
   - Every OPTIONAL/BONUS task.
   - Exact input schema + all validation rules + input limits.
   - Exact algorithm/business rules, including tie-breaks and edge cases, word for word.
   - Exact required UI strings/statuses (e.g. messages written in bold/quotes in the statement — these must appear EXACTLY in English mode).
   - The sample test table (scenario → action → expected result) as a test matrix.
   - Required deliverables/folders (e.g. `screenshots/`, output files) and README contents.
   - What the judges will test beyond the samples (unseen data, ties, disconnected/empty cases, invalid input).
4. Send me ONE short message with: the main-task list, your stack/plan in 4–6 lines, and up to 3 clarifying questions I should ask the organizers (questions are only allowed until T+15). Then continue immediately with the most reasonable interpretation — do NOT wait for my reply.

---

## 2. HARD RULES — never break these

### 2.1 Frontend only
- NEVER create backend servers, server code, API routes, or serverless/edge functions.
- NEVER use Firebase, Supabase, Appwrite, or any online DB/storage to persist app data.
- Persist only with localStorage, sessionStorage, or IndexedDB. Static hosting only. Pure static build (no SSR).
- Core logic (e.g. routing/calculation) must work with NO external API.

### 2.2 Start from zero
- All project code is written now, during the contest.
- NEVER copy code from my old projects, templates, or other people's repos/projects.
- ALLOWED: open-source libraries from npm/CDN, official starter tools (`npm create vite@latest`), and components added through a library's official CLI.

### 2.3 External APIs (only if truly useful)
- HTTPS + CORS, browser-only. Never as a persistent backend/storage. Main features must still work if the API fails.

### 2.4 AI inside the app (optional)
- Main features work without AI. User types their OWN key at runtime, stored only in their browser (sessionStorage). Never hardcode or commit a key.

### 2.5 No secrets
- `.gitignore` FIRST: `node_modules/`, `dist/`, `.env`, `.env.*`, `*.log`, `.DS_Store`.
- Check `git diff --cached` before every commit for anything secret-looking.

### 2.6 Data
- Use only the organizer-provided sample data (commit it, e.g. `public/data/`). Never real personal data.

### 2.7 Git history is sacred
- NEVER force push, rebase/amend/squash pushed commits, reset pushed history, or delete/rename the repo or `main`.
- Fix mistakes with a NEW commit or `git revert`.

### 2.8 No hard-coding answers
- NEVER hard-code expected outputs of sample tests. All results must be computed from the loaded data, because judges use unseen datasets with the same schema.

---

## 3. Stack and architecture

- Vite + React (JavaScript, not TypeScript) + Tailwind CSS. Optional: shadcn/ui components via its official CLI, lucide-react icons.
  If Tailwind/shadcn setup fails or takes over 5 minutes, drop it and use plain CSS. Never fight tooling.
- Detect the OS first (lab PC may be Windows). Use cross-platform commands and npm scripts.
- Architecture rules:
  - Put ALL core logic (validation, algorithms, calculations) in pure functions in `src/lib/` with no React/DOM code, so it is testable and easy to explain.
  - UI components in `src/components/`, translations in `src/i18n/`, sample data in `public/data/` (or `src/data/`).
  - Single source of truth for state; every change (selection, toggles, imports) recomputes derived results immediately.
  - For maps/graphs/diagrams: render with SVG using the supplied coordinates, auto-scaled to fit the viewport with padding.
- Data import: provide BOTH a "Load sample" button AND a file import (file input + drag-and-drop). Never require a re-import to recalculate.
- Validation: implement EVERY rule in the statement's input section. On invalid input, show a clear bilingual error listing what is wrong (field + reason) and keep the app usable.

---

## 4. Bilingual requirement (Bangla + English)

- i18n dictionary (`en`, `bn`) from the start; every user-facing string goes through it:
  titles, labels, buttons, placeholders, legends, statuses, errors, validation messages, instructions, empty states, tooltips.
- Language switch in the header ("English | বাংলা"), remembered in localStorage, updates `<html lang>`.
- Bangla font: Noto Sans Bengali or Hind Siliguri (Google Fonts) with fallbacks. Check that Bangla text does not overflow.
- Exact status strings from the statement must appear verbatim in English mode, with proper Bangla equivalents in Bangla mode.
- Dataset labels may stay as provided unless the statement says otherwise.

---

## 5. Testing — required before every commit

### 5.1 Logic tests (fast)
- Write `tests/` as a plain Node script (`node tests/run.mjs`) or Vitest — whichever is faster. Add an `npm test` script.
- Cover: every row of the statement's sample test table, plus your own cases for ties/tie-breaks, disconnected data, empty initial-state arrays, all-blocked/no-result cases, and each invalid-input rule.
- All tests must pass before committing a logic change.

### 5.2 Browser tests with Chrome DevTools (MCP)
Use the Chrome DevTools MCP tools to test the real app like a judge would:
- Start the dev server (or `vite preview` after build), then open it with the DevTools tools.
- Use page snapshots to find elements, click/fill/upload to interact, and take screenshots to check visuals.
- Check the console after every flow: zero errors from our code.
- Run every sample scenario through the UI and confirm the displayed result matches exactly.
- Test: language switch (both languages, no untranslated strings), import of valid AND invalid files, reset, narrow (~390px) and desktop widths.
- If Chrome DevTools MCP is not available, say so once, then fall back to logic tests + `npm run build` + `vite preview` (and Playwright screenshots if quick to install).

### 5.3 Required screenshots
- If the statement requires screenshots (e.g. `screenshots/`), capture them with the DevTools screenshot tool, save them into that folder with clear names (e.g. `screenshots/01-baseline.png`, `screenshots/02-reroute-after-block.png`), and commit them.

---

## 6. Time plan (minutes since T0)

| Time | What to do |
|---|---|
| T+0 → T+8 | Section 1: read statement + data, write `REQUIREMENTS.md`, send me the plan + questions. |
| T+8 → T+18 | Scaffold, `.gitignore`, i18n skeleton, header + language switch, data loading. Set up deployment and get the skeleton LIVE. Commit #1 + push. |
| T+18 → T+30 | Core logic in `src/lib/` + logic tests passing. Commit #2 + push (must happen before T+30). |
| T+30 → T+55 | All MANDATORY UI features. Test in Chrome via DevTools after each feature. Commit + push after each working feature. |
| T+55 → T+60 | Commit + push (there must be a commit in every 30-minute window). |
| T+60 → T+70 | Required polish (e.g. animations, visual states), then BONUS tasks only if every mandatory task passes. |
| T+70 → T+76 | Feature freeze. Full DevTools test pass of every scenario, both languages, invalid input. Capture screenshots. Write the README. |
| T+76 → T+80 | FINAL commit + push. Wait for deploy to finish. Verify the LIVE URL in Chrome via DevTools runs the main flow. |
| T+80 → T+90 | Hand me the submission details (Section 12). No more code/Git/deploy changes. At T+90 everything is frozen. |

- If a feature is taking too long, simplify or skip it and record it under "Known problems". Working + simple beats ambitious + broken.
- If running late, priority order: mandatory logic correct → mandatory UI → live deployment → README/screenshots → required polish → bonus.
- Never let the time pass T+80 without the final push done.

---

## 7. Commit rules (judges read the history)

- At least one commit in every 30-minute window, minimum 3 total; aim for 6–10. Push immediately after each commit.
- `npm run build` must succeed before every commit; never leave `main` broken.
- Message format:

```
<Short summary of what changed>

Prompt: "<the prompt that caused this change>"
```

- When working autonomously from my single goal prompt, quote my goal prompt (personal info may be trimmed, meaning unchanged) as the `Prompt:` line and add a line `Step: <what this commit does>`.
- If I give you a new prompt mid-way, quote that prompt in the next commit.
- If I tell you I edited something by hand, that commit's body says `Manual edit`.
- Never commit `node_modules`, `dist`, or secrets.

---

## 8. Deployment (required by T+90)

- Requirements: public HTTPS, latest Chrome, no login/install, main features working, matches the final commit.
- Default: GitHub Pages via GitHub Actions (build + deploy on every push to `main`).
  - Vite config: `base: './'` so assets load under the repo path. Prefer no router or hash routing.
  - Load sample data with a relative path (e.g. `fetch('./data/building.json')`) so it works under the Pages sub-path.
  - Enable Pages with source "GitHub Actions": if `gh` CLI is logged in, run `gh api -X POST repos/<owner>/devfest-<REG>/pages -f build_type=workflow` (ignore "already exists"); otherwise tell me in one line to enable it in Settings → Pages.
  - Watch the run (`gh run watch` or the Actions page) and confirm success.
- Fallbacks: Netlify / Vercel / Cloudflare Pages (static only, no functions), or no-build plain HTML served from `main`.
- Deploy the skeleton EARLY (by T+18) so deployment problems are found while there is time.
- After the final push: confirm the deployed run is for the final commit SHA, then open the live URL via DevTools and run the baseline scenario.

---

## 9. Quality bar

- Correctness of mandatory tasks against the statement's exact rules — most important.
- Results always computed from the loaded data; works for unseen datasets and edge cases.
- Clear status panel showing the details the statement asks for (e.g. sequence, totals, chosen target).
- Distinct visual states for every state the statement mentions (normal / selected / blocked / closed / highlighted etc.) with a legend.
- Required animations: subtle, brief (150–300 ms), no flashing, never delaying controls; respect `prefers-reduced-motion`.
- Reset restores the original state from the file exactly.
- Responsive, readable, good contrast, labelled inputs, keyboard-usable buttons.
- No console errors, no dead buttons, no placeholder text.
- Code simple and commented where non-obvious, so I can explain it to judges.

---

## 10. README.md (required)

Before the final commit, README.md must contain:

1. Name and registration number
2. Live link (public HTTPS)
3. How to run (`npm install`, `npm run dev`, `npm run build`, `npm test`)
4. Main features done (mapped to the statement's mandatory tasks)
5. Bonus features done
6. Known problems / limitations (honest), including any interpretation choices
7. AI tools used
8. Most useful prompt (quote it)
9. Screenshots section linking the files in `screenshots/` (if required)

`LICENSE` must be the MIT License with my name and 2026.

---

## 11. How to talk to me

- Short status messages only at phase changes: what is done, what is next, time remaining, any blocker.
- If you need something only I can do (download a file, enable Pages, approve a login), ask in ONE line and keep working on something else meanwhile.
- If something I ask would break Section 2, refuse that part, name the rule, and offer a compliant alternative.

---

## 12. Final handoff (deliver by T+82 at the latest)

Verify, then give me in one message:

- [ ] All mandatory tasks pass (logic tests + DevTools UI tests), including every sample scenario
- [ ] Both languages complete; switch remembered
- [ ] Invalid input handled with clear errors
- [ ] No secrets in repo or live site
- [ ] README complete; LICENSE (MIT); required folders/files (e.g. `screenshots/`) committed
- [ ] Final commit pushed; deployment finished for that exact commit; live URL tested in Chrome

Then output, ready to paste into the submission form:

```
Name:            <NAME>
Registration:    <REG>
Repository URL:  https://github.com/<owner>/devfest-<REG>
Final commit:    <full SHA>  (short: <7 chars>)
Live URL:        <https://...>
```

Finally, give me a 6–10 line "how it works" explanation (architecture, data flow, core algorithm, validation, storage, i18n) so I can answer the judges.
After this handoff, make NO further code, Git, or deployment changes.
