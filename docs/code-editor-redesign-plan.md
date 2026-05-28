# Code Editor Redesign — LeetCode-Style Plan

## Current State Assessment

### What exists today (fragmented across 11+ files)

| File | Lines | Pain Points |
|---|---|---|
| `CodingPlayground.jsx` | 2,247 | Monolith — state, UI, logic all in one file |
| `DSACodeEditor.jsx` | 855 | Duplicates 70% of CodingPlayground logic with minor variations |
| `ProblemDescriptionPanel.jsx` | 897 | Does too much — description, solutions, hints, history all in one |
| `TestCasePanel.jsx` | 510 | Tightly coupled to CodingPlayground's state |
| `VisualizationPanel.jsx` | 413 | Only used in DSACodeEditor |
| `CodeEditorPanel.jsx` | 177 | Reusable wrapper but underutilized |
| ProblemSolver / SQLCodeEditor etc | varied | More divergent editor copies |

### Root problems

1. **No single source of truth** — each editor page reimplements code execution, state management, and layout
2. **Monolithic components** — `CodingPlayground.jsx` mixes data fetching, theme registration, code execution, AI assist, console, execution history, layout drag-resize, fullscreen, sharing, formatting, error parsing
3. **Inconsistent UX** — LeetCode has a polished, uniform layout. We have different layouts in every editor
4. **Missing LeetCode-equivalent features**: editorial tab, submissions history panel, discussion tab, clean test-case tab system, keyboard shortcuts modal, progress tracking integration
5. **Resizable panels work but are finicky** — drag handles use inline styles and manual mouse events instead of a library

---

## Proposed Architecture

### Component Tree

```
ProblemWorkspace                    ← top-level layout shell
├── ProblemLeftPanel                ← left sidebar (problem content)
│   ├── DescriptionTab              ← problem statement, examples, constraints
│   ├── EditorialTab                ← official solution(s) in all languages
│   ├── SubmissionsTab              ← user's past submissions with verdicts
│   └── DiscussionTab               ← community Q&A (future)
│       NEW: tabs mimic LeetCode's left panel exactly
│
├── EditorRightPanel                ← center-right (code editor)
│   ├── EditorToolbar               ← language + theme + font-size + actions
│   │   ├── LanguageSelector        ← dropdown with search
│   │   ├── ThemeSelector           ← quick-switch themes
│   │   ├── FontSizeControls        ← +/- buttons
│   │   └── ActionButtons           ← format, reset, fullscreen, share
│   │       NEW: condensed toolbar matching LeetCode's minimal style
│   ├── MonacoEditorWrapper         ← @monaco-editor/react with lazy theme registration
│   │   └── EditorStatusBar         ← cursor position, language, indent info
│   │       NEW: LeetCode-style status bar at bottom of editor
│   └── FocusModeToggle             ← expand editor to full viewport
│
├── BottomPanel                     ← collapsible bottom panel (test results)
│   ├── TestCaseTabs                ← tab for each test case (1, 2, 3, Custom)
│   ├── TestCaseInput               ← editable input for selected test case
│   ├── TestCaseOutput              ← expected vs actual w/ diff highlight
│   │   NEW: LeetCode-style diff view (line-by-line green/red)
│   └── ConsoleOutput               ← raw stdout/stderr (collapsible sub-panel)
│       ENHANCED: cleaner output formatting with ANSI support
│
├── ExecutionBar                    ← fixed bar at top of editor area
│   ├── RunButton                   ← Ctrl+Enter
│   ├── SubmitButton                ← full test suite
│   └── StatusIndicator             ← idle → running → passed/failed
│       NEW: LeetCode-style colored button bar
│
└── KeyboardShortcutsModal          ← "?" shortcut overlay
    NEW: comprehensive shortcuts reference
```

### State Architecture

```
ProblemWorkspaceState (single hook: useProblemWorkspace)
├── problem: ProblemData             ← from problemsDatabase or API
├── language: string                 ← persisted to localStorage
├── code: string                     ← persisted per problem+language
├── theme: string                    ← persisted to localStorage
├── fontSize: number                 ← persisted to localStorage
├── activeLeftTab: 'description' | 'editorial' | 'submissions' | 'discussion'
├── testCases: TestCase[]            ← problem examples + custom
├── activeTestCase: number
├── executionState: 'idle' | 'running' | 'passed' | 'failed' | 'error'
├── runResult: { passed, total, results[], runtime, memory }
├── submissions: Submission[]
└── editorSettings: { minimap, wordWrap, bracketPair, tabSize }
```

**No more prop drilling** — use a single `useProblemWorkspace` hook that wraps all state and actions, consumed by child components via context.

---

## LeetCode Feature Parity Matrix

| Feature | Current Status | Target | Priority |
|---|---|---|---|
| Split-pane layout (description \| editor) | ✅ Partial | ✅ Refined resize handles | P1 |
| Problem tabs (desc / editorial / submissions / discussion) | ❌ Missing | ✅ 4-tab system | P1 |
| Editorial solutions in all languages | ⚠️ Partial (in DescriptionPanel) | ✅ Separate tab with clean UX | P1 |
| Submissions history with verdicts | ❌ Missing | ✅ Full submission history panel | P1 |
| Test case tabs (Case 1, 2, 3, Custom) | ✅ Basic | ✅ LeetCode-style tabbed cases | P1 |
| Expected vs actual diff view | ❌ Inline only | ✅ Line-level diff highlighting | P1 |
| Run / Submit buttons with status | ⚠️ Basic | ✅ Animated button states | P1 |
| Language selector dropdown | ✅ Yes | ✅ Searchable + test the code also shows the template | P1 |
| Theme selector (editor themes) | ✅ Yes | ✅ Quick-switch in toolbar | P2 |
| Font size controls | ✅ Yes | ✅ Keep + add to status bar | P2 |
| Execution status animation (spinner/phases) | ✅ Yes | ✅ Refine with LeetCode-style phases | P2 |
| Minimap toggle | ✅ Monaco default | ✅ Expose in settings dropdown | P2 |
| Keyboard shortcuts modal | ❌ Missing | ✅ "?" button + modal | P2 |
| Focus mode (full-screen editor) | ⚠️ Partial | ✅ Clean enter/exit | P2 |
| Code auto-format | ⚠️ JS only | ✅ Multi-language (Prettier + language formatters) | P2 |
| AI assistant panel | ✅ Yes | ✅ Keep — slide-out from right | P3 |
| Code visualization | ✅ Limited | ✅ Keep in right panel | P3 |
| Timer / stopwatch | ✅ Yes | ✅ Keep in bottom bar | P3 |
| Share code via URL | ✅ Yes | ✅ Keep | P3 |
| Problem explorer integration | ✅ Good | ✅ Keep side panel link | P3 |
| Code snippet templates per language | ✅ Starter code | ✅ Expand templates | P3 |
| Discussion tab / community | ❌ Missing | 🔮 Phase 2 | P4 |
| Live collaboration | ❌ Missing | 🔮 Phase 2 | P4 |

---

## UX / UI Improvements (Why This Is Better)

### 1. Left Panel: LeetCode-Style Tabs
```
[Description] [Editorial] [Submissions] [Discussion]
```
- **Description**: problem statement + examples + constraints (same as today but cleaner)
- **Editorial**: solution in multiple languages with explanation, unlock gated by coins or solving
- **Submissions**: list of past submissions with verdict (✅ Accepted / ❌ Wrong Answer / ⏱ TLE), runtime distribution bar, memory stats — **completely new**
- **Discussion**: placeholder for future community feature

### 2. Editor Area: Minimalist Toolbar
```
| Python ▼ | ○○○ Theme | A- A+ | [↻ Format] | [⛶ Fullscreen] | [? Shortcuts] |
[████████ RUN ████████]   [████████ SUBMIT ████████]   ● Ready / ● Running...
```
- Buttons use green for Run, dark green for Submit (LeetCode-inspired)
- Status indicator shows execution phases with animated dots
- Language selector doubles as template loader

### 3. Bottom Panel: LeetCode Test Case System
```
[Case 1 ✓] [Case 2 ✗] [Case 3] [+ Custom]          [Run] [Submit]
┌────────────────────────────────────────────────────────────┐
│ Input:  nums = [2,7,11,15], target = 9                    │
│ Expected: [0,1]                                            │
│ Actual:   [0,1]                                            │
│ ┌─── Diff View ──────────────────────────────────────────┐ │
│ │ ✅ Test passed (0.023 ms)                              │ │
│ └────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 4. Submission Results Overlay
```
┌─────────────────────────────────────────────┐
│  ✅ Accepted                                 │
│  Runtime: 56 ms (beats 85.2%)                │
│  Memory:  44.2 MB (beats 62.1%)              │
│  ┌───────────────────────────────────────┐   │
│  │ ████████████████████░░░░ 85.2%       │   │
│  │ ████████████████░░░░░░░░ 62.1%       │   │
│  └───────────────────────────────────────┘   │
│  [×]                                          │
└─────────────────────────────────────────────┘
```

### 5. Keyboard Shortcuts Modal
| Shortcut | Action |
|---|---|
| `Ctrl + Enter` | Run code |
| `Ctrl + '` | Submit solution |
| `Ctrl + B` | Toggle sidebar |
| `Ctrl + J` | Toggle bottom panel |
| `Ctrl + ,` | Open settings |
| `Ctrl + /` | Toggle comment |
| `Tab` | Indent |
| `Shift + Tab` | Outdent |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal**: Clean, modular architecture with all major features working

**Tasks**:
1. Create `src/components/problemWorkspace/` directory with modular structure
2. Extract `useProblemWorkspace` hook — single source of truth for all editor state
3. Build `ProblemWorkspace.jsx` — layout shell with resizable panels (use `react-resizable-panels` or refine existing)
4. Build `ProblemLeftPanel.jsx` with tab system (Description, Editorial, Submissions, Discussion)
5. Extract `DescriptionTab.jsx` from existing `ProblemDescriptionPanel.jsx`
6. Build `EditorToolbar.jsx` — condensed LeetCode-style toolbar
7. Build `MonacoEditorWrapper.jsx` — clean Monaco wrapper with theme registration, status bar
8. Build `BottomPanel.jsx` with `TestCaseTabs` and `TestCaseOutput` (with diff view)
9. Build `ExecutionBar.jsx` — Run/Submit buttons with status indicator
10. Build `SubmissionsTab.jsx` — submission history with verdict badges

### Phase 2: Polish (Week 2)
**Goal**: Feature-complete LeetCode parity

**Tasks**:
1. Build `EditorialTab.jsx` — multi-language solution viewer with coin-gating
2. Add `SubmissionResultsOverlay.jsx` — runtime distribution, memory, beats %
3. Add `KeyboardShortcutsModal.jsx`
4. Add settings dropdown (minimap, word wrap, bracket pair, tab size)
5. Consolidate `/code-editor/:id` and `/playground/:id` into single route
6. Connect submission results to backend for persistence
7. Add progress tracking integration (mark solved, update streak, earn coins)
8. Add test case count display ("Passed 3/5" with red/green progress)

### Phase 3: Advanced (Week 3+)
**Goal**: Delightful extras and migration of all old editor pages

**Tasks**:
1. Add AI assistant as slide-out panel in the editor (right side)
2. Add code visualization panel
3. Add "Related Problems" section in editorial
4. Migrate `DSACodeEditor.jsx` to use the new workspace
5. Migrate `SQLCodeEditor.jsx` (or build SQL-specific variant that reuses same shell)
6. Migrate `DebuggingInterview.jsx` and `CodeReviewInterview.jsx` to use the editor wrapper
7. Add `DiscussionTab.jsx` (phase 2, requires backend)
8. Monorepo old editor components → deprecated

---

## New Files to Create

```
frontend/src/
├── components/
│   └── problemWorkspace/
│       ├── ProblemWorkspace.jsx          ← layout shell (panels + resize)
│       ├── ProblemWorkspace.css          ← workspace-specific styles
│       ├── ProblemLeftPanel.jsx          ← left panel with tabs
│       ├── DescriptionTab.jsx            ← extracted from ProblemDescriptionPanel
│       ├── EditorialTab.jsx              ← multi-language solution viewer
│       ├── SubmissionsTab.jsx            ← submission history with verdicts
│       ├── DiscussionTab.jsx             ← placeholder / future
│       ├── MonacoEditorWrapper.jsx       ← clean Monaco wrapper + status bar
│       ├── EditorToolbar.jsx             ← language, theme, actions
│       ├── EditorStatusBar.jsx           ← cursor, language, indent info
│       ├── ExecutionBar.jsx              ← Run + Submit + status
│       ├── BottomPanel.jsx               ← test cases + console output
│       ├── TestCaseOutput.jsx            ← diff view for expected vs actual
│       ├── SubmissionResultsOverlay.jsx  ← accepted/failed overlay
│       └── KeyboardShortcutsModal.jsx    ← shortcut reference
│
├── hooks/
│   └── useProblemWorkspace.js            ← centralized state hook
│
├── pages/
│   └── NewCodeEditor.jsx                 ← thin page that mounts ProblemWorkspace
│
└── App.jsx                               ← add route: /editor/:problemId
```

---

## Key Decisions

### 1. State Management
Use a **single custom hook** (`useProblemWorkspace`) with React Context rather than Zustand/Redux. This keeps it simple, matches the existing codebase pattern (3 existing contexts), and avoids adding a dependency.

### 2. Resizable Panels
Use **`react-resizable-panels`** (lightweight, 3KB, maintained) instead of the custom mouse-event-based resize currently in CodingPlayground. This eliminates drag-handle bugs.

### 3. Diff View
Build a simple inline diff using **`diff`** library (NPM package, used by LeetCode internally) to show line-level expected vs actual output highlighting. Green for matching, red for differing lines.

### 4. Submissions History
Store submissions in **localStorage** + sync to **backend API** when authenticated. Show worst submission first, best at top, with color-coded verdicts.

### 5. Editorial Gating
Use the existing **coin system** — solution view costs N coins unless user has already solved the problem. Store unlock state in localStorage.

### 6. Route Consolidation
Replace current divergent routes:
- `/code-editor/:problemId` → redirect to `/editor/:problemId`
- `/playground/:problemId` → redirect to `/editor/:problemId`
- `/sql-editor/:problemId` → `/sql-editor/:problemId` (reuses same shell with SQL-specific tabs)
- New: `/editor/:problemId` serves the unified LeetCode-style workspace

---

## Deep Dive: LeetCode-Style Test Case System

### Current vs Target

| Aspect | Current (CodingPlayground) | Target (LeetCode-style) |
|---|---|---|
| Test case display | Single input/output textarea | Tabbed: Case 1, Case 2, Case 3, Custom |
| Running tests | Run = execute raw code in console | Run = execute against first N examples; Submit = full suite |
| Expected vs Actual | No comparison, just raw stdout | Side-by-side with green/red diff highlighting |
| Custom test case | Separate textarea, no structure | Inline editable as a new tab (Case 4, 5...) |
| Test results | Scrolling console text | Structured: ✅/❌ per case, aggregated summary |
| Memory tracking | Not shown | Execution time + memory per test |

### Component: TestCasePanel (redesigned)

```
┌──────────────────────────────────────────────────────────────┐
│ [Case 1 ●] [Case 2 ✓] [Case 3 ✗] [Case 4] [+ Add Custom]   │
│                                             3/5 passed       │
├──────────────────────────────────────────────────────────────┤
│ Input                                                        │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ nums = [2,7,11,15], target = 9                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Expected                          Actual                     │
│ ┌──────────────────────────┐  ┌──────────────────────────┐   │
│ │ [0, 1]                   │  │ [0, 1]                   │   │
│ └──────────────────────────┘  └──────────────────────────┘   │
│                                                              │
│ Diff View (when mismatch)                                    │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ - Expected: [0, 1]  (line 1)                             │ │
│ │ + Actual:   [0, 2]  (line 1)                             │ │
│ │                                           ✗ Wrong Answer │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Runtime: 0.056 ms  │  Memory: 44.2 MB                        │
└──────────────────────────────────────────────────────────────┘
```

### Data Model

```js
{
  testCases: [
    {
      id: 'example-1',
      label: 'Case 1',
      input: { nums: [2,7,11,15], target: 9 },
      expected: [0, 1],
      actual: null,          // populated after run
      passed: null,          // true/false after run
      runtime: null,         // ms
      memory: null,          // MB
      error: null,           // error message if any
      isCustom: false,
    },
    // ...
  ],
}
```

### Test Execution Flow

```
User clicks RUN
  │
  ├─ Pre-flight checks
  │   ├─ Code not empty?          → ❌ "Write some code first"
  │   ├─ Language selected?       → ❌ "Select a language"
  │   └─ Has test cases?          → ❌ "No test cases defined"
  │
  ├─ UI state: running=true
  │   ├─ Button shows spinner + "Running..."
  │   ├─ Status bar: "Running against 3 test cases..."
  │   └─ Disable Run/Submit buttons
  │
  ├─ POST /api/dsa/run { code, language, testCases }
  │   ├─ Request phases (shown in status):
  │   │   1. Queued      → "● Queued..."
  │   │   2. Compiling   → "● Compiling..."
  │   │   3. Running     → "● Running test 2/5..."
  │   │   4. Evaluating  → "● Evaluating results..."
  │   └─ AbortController for cancellation
  │
  ├─ Response received
  │   ├─ HTTP 200 → parse structured results
  │   │   ├─ results[] = { passed, runtime, memory, actual, error }
  │   │   └─ populate each testCase.actual/passed/runtime/memory
  │   └─ HTTP 4xx/5xx → show error in overlay
  │
  ├─ Render results
  │   ├─ Each tab badge: ✅ green / ❌ red / ● gray (untested)
  │   ├─ Summary line: "Passed 3/5" with progress bar
  │   ├─ If all passed → green "Accepted" overlay with confetti (optional)
  │   └─ If some failed → first failed case auto-selected, diff shown
  │
  └─ UI state: running=false
```

### Submit Flow (separate from Run)

- **Run**: executes against first N example cases (quick feedback)
- **Submit**: executes against ALL test cases (including hidden edge cases)
- Submit also calls backend to:
  1. Save submission to database
  2. Update user's problem-solving progress
  3. Earn coins if accepted
  4. Update streak
- Submit button turns green if all passed, red if any failed

### Diff View Implementation

Use the `diff` npm library (same approach as LeetCode):

```
Input strings:
  Expected: "[0, 1]"
  Actual:   "[0, 2]"

Diff output:
  - [0, 1]
  + [0, 2]
       ^

Styled as:
  <span class="diff-removed">- [0, 1]</span>    ← red background
  <span class="diff-added">+ [0, 2]</span>       ← green background
  <span class="diff-marker">^</span>              ← caret on diff char
```

### Custom Test Case Editor

- "+ Custom" tab appends a new editable case
- Structured input: field per function parameter (parsed from problem signature)
- Users can type `nums = [1,2,3], target = 4` or use JSON
- Custom cases persist in localStorage per problem
- "Bulk add" mode for pasting multiple test cases at once

---

## Deep Dive: Run / Submit / Execution Pipeline

### ExecutionBar Component Spec

```
┌────────────────────────────────────────────────────────────┐
│  Python ▼  │  ○○○ Theme  │  A- A+  │  [?]  │  ↻ Format   │
├────────────────────────────────────────────────────────────┤
│  [▶ Run]  [▲ Submit]        ● Ready                        │
│  [▶ Run]  [▲ Submit]        ◌ Running (test 2/5)...       │
│  [▶ Run]  [▲ Submit]        ✅ Passed 5/5                  │
│  [▶ Run]  [▲ Submit]        ❌ Failed 2/5                  │
│  [▶ Run]  [▲ Submit]        ⚠ Error — line 15: ...        │
└────────────────────────────────────────────────────────────┘
```

### Button States

| State | Run Button | Submit Button | Behavior |
|---|---|---|---|
| `idle` | Green "▶ Run" | Dark green "▲ Submit" | Both clickable |
| `running` | Disabled, spinner | Disabled, spinner | Cancel via Escape |
| `passed` | Green "▶ Run" (pulse) | Green "✓ Accepted" | Re-run allowed |
| `failed` | Green "▶ Run" | Red "✗ Rejected" (shake) | Re-run allowed |
| `error` | Green "▶ Run" | Red "⚠ Failed" | Show error detail |
| `submitting` | Disabled | Spinner "Submitting..." | Full suite running |

### Keyboard Shortcuts (updated)

| Shortcut | Action |
|---|---|
| `Ctrl + Enter` | Run code (execute examples) |
| `Ctrl + '` | Submit solution (execute all) |
| `Ctrl + Shift + Enter` | Submit and close |
| `Escape` | Cancel running execution |
| `Ctrl + ]` | Next test case tab |
| `Ctrl + [` | Previous test case tab |
| `Ctrl + Shift + C` | Add custom test case |

### Monaco Integration

- `Ctrl+Enter` bound via `editor.addAction()` (already exists, enhance)
- Inline error markers (squiggly lines) for compile errors returned from server
- Clicking an error in result panel scrolls editor to the relevant line
- "Go to next error" (F8) and "Go to previous error" (Shift+F8) shortcuts

### Backend API Contract

```js
// POST /api/dsa/run
Request: {
  code: string,
  language: 'python' | 'javascript' | 'cpp' | 'java' | 'go',
  testCases: [
    { input: { nums: [2,7,11,15], target: 9 }, expected: [0,1] }
  ],
  problemId?: string
}

Response: {
  success: true,
  results: [
    {
      passed: true,
      actual: [0, 1],
      runtime: 0.056,    // ms
      memory: 44.2,      // MB
      stdout: "..."      // captured print/console.log
    }
  ],
  summary: {
    total: 5,
    passed: 3,
    failed: 2,
    totalRuntime: 1.234,
    peakMemory: 48.1
  }
}

// POST /api/dsa/submit
// Same structure but runs ALL test cases (including hidden)
// Also persists result to database
```

---

## Deep Dive: Error Handling

### Error Taxonomy

| Error Type | Icon | Behavior | Display |
|---|---|---|---|
| **Compile Error** | ⚠️ | Execution halted | Full compiler output, line-linked markers |
| **Runtime Error** | 💥 | Execution halted | Stack trace, line-linked, collapsed frames |
| **Wrong Answer** | ❌ | Test case failed | Expected vs Actual diff view |
| **Time Limit Exceeded** | ⏱ | Execution killed at N seconds | "TLE on test case 4" + input shown |
| **Memory Limit Exceeded** | 💾 | Execution killed | "MLE — exceeded 256 MB" |
| **Assertion Error** | ⚡ | Raised by user code | Line-linked assertion message |
| **Syntax Error** | 🔴 | Pre-execution check | Underlined in editor, message in panel |
| **Network / Server Error** | 🔌 | Request failed | "Connection lost. Retry?" toast |
| **Internal Error** | 🔧 | Unexpected server error | "Something went wrong. Try again." |

### Error Display Components

```
1. Inline in Editor (Monaco markers):
   ┌─────────────────────────────────────┐
   │  def solve(nums)                    │
   │  🔴 Expected ':' — line 3, col 19  │  ← squiggly underline
   │      return nums[0]                 │
   └─────────────────────────────────────┘

2. In Bottom Panel (error tab):
   ┌─────────────────────────────────────┐
   │  [⚙ Compile Error] [💥 Runtime] [🔌]│
   │                                     │
   │  Traceback (most recent call last): │
   │    File "solution.py", line 5       │
   │      return nums[len(nums)]         │
   │             ~~~~~~~~~~~~~~~         │
   │  IndexError: list index out of range│
   │                                     │
   │  [Jump to line 5]                   │
   └─────────────────────────────────────┘

3. Submission Overlay (all-cases view):
   ┌─────────────────────────────────────┐
   │  ❌ Wrong Answer                    │
   │  Passed: 3/5                        │
   │                                     │
   │  Case 1: ✅ 0.023 ms                │
   │  Case 2: ✅ 0.015 ms                │
   │  Case 3: ❌ Wrong Answer            │
   │  Case 4: ⏱ TLE (> 5s)              │
   │  Case 5: ❌ Wrong Answer            │
   │                                     │
   │  [View Details]                     │
   └─────────────────────────────────────┘

4. Monaco Inline Decorations (enhanced):
   - Compile errors: red squiggly + gutter icon
   - Runtime crash line: red background highlight
   - TLE (infinite loop suspicion): orange highlight on loop lines
   - Click error → scroll + highlight line + show tooltip
```

### Error Response Parsing

```js
function parseExecutionError(raw, language) {
  switch (language) {
    case 'python':
      // Parse Python traceback for line numbers
      // Extract: File "...", line N, in <module>
      // Extract: ErrorType: message
      return { line, col, type, message, stack: [...] }

    case 'javascript':
      // Parse: at functionName (file.js:N:C)
      // Parse: ErrorType: message
      return { line, col, type, message, stack: [...] }

    case 'cpp' | 'java' | 'go':
      // Parse compiler output for: file:line:col: error:
      // Parse runtime exceptions
      return { line, col, type, message, stack: [...] }
  }
}
```

### Offline & Transient Error Handling

| Scenario | UX |
|---|---|
| Network offline | "You're offline. Code saved locally. Results will sync when connected." |
| Request timeout | "Request timed out. The server may be under load. Try again?" |
| Rate limited | "Too many requests. Please wait 30 seconds." |
| Server 500 | "Server error. Your code was not lost — try running again." |
| Aborted by user | Execution cancelled cleanly. Partial results discarded. |

---

## Deep Dive: AI Features

### Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Monaco Editor                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  User code  ▲  AI suggestions inline          │    │
│  │              │  (ghost text / inline diff)    │    │
│  └──────────────┴───────────────────────────────┘    │
│           │                                           │
│           ▼                                           │
│  ┌──────────────────────────────────────────────┐    │
│  │  AI Panel (slide-out from right)             │    │
│  │                                              │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │ Quick Actions:                        │  │    │
│  │  │ [✨ Explain] [🐛 Debug] [⚡ Optimize]  │  │    │
│  │  │ [🔍 Review] [📊 Complexity]           │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  │                                              │    │
│  │  ┌────────────────────────────────────────┐  │    │
│  │  │ Chat: "Can you help me understand..."  │  │    │
│  │  │ Assistant: "This function uses two-    │  │    │
│  │  │  pointer technique. The left pointer   │  │    │
│  │  │  starts at index 0..."                 │  │    │
│  │  └────────────────────────────────────────┘  │    │
│  │                                              │    │
│  │  [Type a message...] [Send]                  │    │
│  └──────────────────────────────────────────────┘    │
│           │                                           │
│           ▼                                           │
│  AI Service Layer (backend /api/ai/)                  │
│  ├── playground-assist    ← general help              │
│  ├── debug-code          ← finds bugs                 │
│  ├── optimize-code       ← performance                │
│  ├── explain-code        ← readability                │
│  ├── review-code         ← code review                │
│  ├── analyze-complexity  ← Big-O analysis             │
│  ├── generate-hints      ← problem-specific hints     │
│  └── auto-complete       ← inline suggestions         │
└──────────────────────────────────────────────────────┘
```

### AI Quick Action Buttons

Each button triggers a specific prompt + context:

| Button | Prompt Context | Return Format |
|---|---|---|
| ✨ Explain | Selected code block OR entire function | Plain English explanation with line references |
| 🐛 Debug | Code + last error output + test case | Bug identified + fix suggestion + corrected code |
| ⚡ Optimize | Code + constraints (N size) | Optimized version + Big-O comparison (before vs after) |
| 🔍 Review | Full code | Issues list (bugs, edge cases, style, naming) |
| 📊 Complexity | Code (selected or full) | Time: O(N) — explanation, Space: O(N) — explanation |
| 💡 Hint | Problem description + user's current code | Progressive hint (not the full solution) |

### AI Panel Chat

- Always shows conversation context (last N exchanges)
- "Apply Suggestion" button on code blocks in AI responses
- Applies as Monaco edit (inline diff preview before applying)
- Supports @mention syntax:
  - `@explain` — re-routes to explain mode
  - `@debug` — re-routes to debug mode with error context
  - `@fix` — ask AI to fix and show diff
  - `@hint` — get next hint for current problem

### Inline AI Suggestions (Monaco Integration)

```
User types:  def twoSum(sel
             ┌─────────────────────┐
             │ def twoSum(self,    │  ← ghost text (gray)
             │   nums: List[int],  │
             │   target: int       │
             │ ) -> List[int]:     │
             │                     │
             │ [Tab] to accept     │
             └─────────────────────┘
```

- Triggered after typing pause (>500ms) or explicit `Ctrl+I`
- Uses Monaco's `InlayHint` API for ghost text
- Suggestions are context-aware (problem description + function signature)
- User presses Tab to accept, Escape to dismiss

### Hint System (Problem-Specific)

```
┌──────────────────────────────────────┐
│ 💡 Hints (1/3)                       │
│                                      │
│ Hint 1:                              │
│ Try using a hash map to store        │
│ seen values.                         │
│                                      │
│ [Reveal Next Hint]  [Show More]      │
│                                      │
│ Cost: 5 coins to reveal next hint    │
└──────────────────────────────────────┘
```

- Progressive: hints get more specific (1 → 2 → 3 → solution sketch)
- Coin-gated: first hint is free, subsequent hints cost coins
- AI-generated hints based on problem + user's current approach code
- Editorial hint stored in problem data, AI hint generated dynamically

### AI-Powered Auto-Completion

- **Function-level**: AI generates the entire function body based on signature + problem description
- **Line-level**: AI suggests next line(s) based on context (Monaco ghost text)
- **Test-case generation**: AI generates edge case test cases automatically
- Triggered via:
  - `Ctrl+Space` — explicit completion request
  - Typing pause — automatic suggestion
  - Right-click menu → "AI Complete"

### Error Resolution Assistant

When a test fails with an error:

```
[Test Failed — Wrong Answer]

┌──────────────────────────────────────┐
│ 🤖 AI Analysis                       │
│                                      │
│ I found the issue: Your code returns │
│ [0, 1] but expected is [1, 0]. The   │
│ problem asks for indices in sorted   │
│ order.                               │
│                                      │
│ Fix: sort the output before return   │
│ ┌──────────────────────────────────┐ │
│ │ return sorted(result)            │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [Apply Fix] [Dismiss]               │
└──────────────────────────────────────┘
```

### AI Features Backend API Contract

```js
// POST /api/ai/editor-assist
{
  mode: 'explain' | 'debug' | 'optimize' | 'review' | 'complexity' | 'hint' | 'complete',
  code: string,
  language: string,
  problemId?: string,
  problemDescription?: string,
  testResults?: [...],
  cursorPosition?: { line, col },
  selectedCode?: string,         // if user selected specific code
  conversationHistory?: [...],   // for chat mode
  errorOutput?: string,          // last error if debugging
}

Response: {
  response: string,               // markdown response
  suggestedCode?: string,         // code to apply
  ghostText?: string,             // for inline completion
  location?: { line, col },       // where to apply
  hints?: string[],               // for hint mode
  complexity?: { time, space },   // for complexity mode
}
```

---

## Phase Breakdown (Updated with AI)

### Phase 1: Foundation (Week 1)
**Goal**: Clean, modular architecture with core execution working

**Tasks**:
1. Create `src/components/problemWorkspace/` directory
2. Build `useProblemWorkspace` hook — centralized state
3. Build `ProblemWorkspace.jsx` — layout shell with `react-resizable-panels`
4. Build `ProblemLeftPanel.jsx` — Description + Editorial + Submissions + Discussion tabs
5. Build `MonacoEditorWrapper.jsx` — cleaner Monaco + theme registration + error markers
6. Build `EditorToolbar.jsx` — language dropdown, theme, font size, actions
7. Build `ExecutionBar.jsx` — Run + Submit buttons with 5-state machine
8. Build `BottomPanel.jsx` — LeetCode-style test case tabs + output + diff view
9. Build `EditorStatusBar.jsx` — cursor, language, mode indicator
10. Wire up `/api/dsa/run` — structured test execution with per-case results

### Phase 2: Polish & AI (Week 2)
**Goal**: Full parity + AI assistant integration

**Tasks**:
1. Build `EditorialTab.jsx` — multi-language solutions with coin gating
2. Build `SubmissionsTab.jsx` — verdict list with runtime distribution chart
3. Build `SubmissionResultsOverlay.jsx` — "Accepted" overlay with beats % + bars
4. Add inline error markers (compile/runtime errors as Monaco decorations)
5. Add error parsing service (Python/JS/C++/Java/Go traceback → structured)
6. Build `KeyboardShortcutsModal.jsx` — comprehensive shortcuts modal
7. Build `AIPanel.jsx` — right slide-out panel with quick actions + chat
8. Wire up AI endpoints (explain, debug, optimize, review, complexity, hints)
9. Add error resolution assistant (AI analysis on test failure)
10. Add progressive hints system with coin gating
11. Add settings dropdown (minimap, word wrap, bracket pairs, tab size)

### Phase 3: Advanced (Week 3+)
**Goal**: Delightful extras + migration of all old pages

**Tasks**:
1. Add inline AI autocomplete (Monaco ghost text via `InlayHint`)
2. Add AI-powered test case generation
3. Add code visualization panel integration
4. Add "Apply Fix" one-click from AI suggestions
5. Add mark-as-solved + streak + coin rewards on acceptance
6. Migrate `/code-editor/:id` → redirect to `/editor/:id`
7. Migrate `/playground/:id` → redirect to `/editor/:id`
8. Migrate `DSACodeEditor.jsx` → remove (replaced)
9. Add `DiscussionTab.jsx` (future, requires backend)
10. Performance audit — lazy load AI panel, memoize Monaco

---

## New Files to Create (Updated)

```
frontend/src/
├── components/
│   └── problemWorkspace/
│       ├── ProblemWorkspace.jsx              ← layout shell
│       ├── ProblemWorkspace.css              ← styles
│       ├── ProblemLeftPanel.jsx              ← 4-tab left panel
│       ├── DescriptionTab.jsx                ← problem description
│       ├── EditorialTab.jsx                  ← solutions + gating
│       ├── SubmissionsTab.jsx                ← submission history
│       ├── DiscussionTab.jsx                 ← placeholder
│       ├── MonacoEditorWrapper.jsx           ← Monaco + theme + markers
│       ├── EditorToolbar.jsx                 ← language, theme, actions
│       ├── EditorStatusBar.jsx               ← cursor + language
│       ├── ExecutionBar.jsx                  ← Run/Submit + 5 states
│       ├── BottomPanel.jsx                   ← test cases + output
│       ├── TestCaseOutput.jsx                ← diff view component
│       ├── SubmissionResultsOverlay.jsx      ← accepted overlay
│       ├── KeyboardShortcutsModal.jsx        ← shortcuts reference
│       └── AI/
│           ├── AIPanel.jsx                   ← slide-out AI panel
│           ├── AIQuickActions.jsx            ← action buttons
│           ├── AIChat.jsx                    ← chat interface
│           ├── AIHintPanel.jsx              ← progressive hints
│           └── AIErrorAssistant.jsx         ← error resolution
│
├── hooks/
│   ├── useProblemWorkspace.js                ← centralized state
│   ├── useCodeExecution.js                   ← run/submit logic
│   └── useAIEditor.js                       ← AI actions
│
├── services/
│   ├── errorParser.js                        ← traceback → structured
│   ├── diffUtils.js                          ← diff computation
│   └── codeFormatter.js                      ← multi-lang formatting
│
├── pages/
│   └── NewCodeEditor.jsx                     ← mounts ProblemWorkspace
│
└── App.jsx                                   ← add /editor/:problemId
```

---

## Success Metrics (Updated)

| Metric | Current | Target |
|---|---|---|
| Editor page load time | ~2-3s (monolith) | <1s (modular + lazy) |
| Lines per editor component | 2,247 (CodingPlayground) | <300 per component |
| Reusable components | ~30% | >85% |
| Test coverage (editor) | Minimal | >70% |
| Error types handled | 2 (compile, runtime) | 9 (all taxonomy) |
| AI features | 1 (playground-assist) | 7 (explain, debug, optimize, review, complexity, hints, autocomplete) |
| Test case UX | Console text | LeetCode-style tabs + diff |
| User-reported satisfaction | N/A | Internal testing |

---

| Metric | Current | Target |
|---|---|---|
| Editor page load time | ~2-3s (monolith) | <1s (modular + lazy) |
| Lines per editor component | 2,247 (CodingPlayground) | <300 per component |
| Reusable components | ~30% | >80% |
| Test coverage (editor) | Minimal | >70% |
| User-reported satisfaction | N/A | Internal testing |

---

## Migration Strategy

1. **Build new components in parallel** — new files, no changes to existing
2. **Create single page** `NewCodeEditor.jsx` that uses new workspace
3. **Route new URL** `/editor/:problemId`
4. **Test side-by-side** — both old and new work during transition
5. **Redirect old routes** after validation
6. **Delete/sunset old components** once migration is confirmed
