import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CodingAssessmentPage from '../pages/CodingAssessmentPage';

// Mock Monaco Editor for JSDOM environment
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange, language }) => (
    <textarea
      data-testid="monaco-editor"
      data-language={language}
      value={value}
      onChange={(e) => onChange && onChange(e.target.value)}
    />
  ),
}));

// Mock authFetch to trigger clean offline simulation fallback
vi.mock('../utils/authFetch', () => ({
  authFetch: vi.fn().mockRejectedValue(new Error('Network offline - fallback to simulation')),
}));

describe('CodingAssessmentPage - HackerRank-style Online Assessment', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();

    // Mock document.documentElement.requestFullscreen for JSDOM
    if (!document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen = vi.fn().mockResolvedValue();
    } else {
      vi.spyOn(document.documentElement, 'requestFullscreen').mockResolvedValue();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Scenario 1: Lobby View
  it('1. renders Lobby View with company name, role, problem count, time limit, and start button', () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google&role=SDE&difficulty=Medium']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Company and Role
    expect(screen.getByText(/Google Online Assessment/i)).toBeInTheDocument();
    expect(screen.getByText('SDE')).toBeInTheDocument();
    expect(screen.getByText(/Medium Level/i)).toBeInTheDocument();

    // Exam Specs
    expect(screen.getByText(/2 Coding Challenges/i)).toBeInTheDocument();
    expect(screen.getByText(/60 Minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/Tab Focus Tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/70% to Advance/i)).toBeInTheDocument();

    // Guidelines & Instructions
    expect(screen.getByText(/Exam Guidelines & Instructions/i)).toBeInTheDocument();
    expect(screen.getByText(/Timed Environment/i)).toBeInTheDocument();
    expect(screen.getByText(/Fullscreen & Tab Proctoring/i)).toBeInTheDocument();

    // Back Button
    const backBtn = screen.getByRole('button', { name: /^back$/i });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);

    // Start Button
    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    expect(startBtn).toBeInTheDocument();
    expect(startBtn).not.toBeDisabled();
  });

  // Scenario 2: Transition into Exam IDE view
  it('2. transitions into Exam IDE view on clicking Start Assessment with header, selector, panel, and buttons', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google&role=SDE&difficulty=Medium']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Header displaying company brand, role, timer and tab-switch warning counter
    expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument();
    expect(screen.getByText('Coding Assessment')).toBeInTheDocument();
    expect(screen.getByText(/— SDE/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Time Remaining/i)).toBeInTheDocument();
    expect(screen.getByText(/Tab Switches: 0 \/ 3/i)).toBeInTheDocument();

    // Problem selector buttons (Problem 1 and Problem 2)
    const prob1Tab = screen.getByRole('button', { name: /Problem 1:/i });
    const prob2Tab = screen.getByRole('button', { name: /Problem 2:/i });
    expect(prob1Tab).toBeInTheDocument();
    expect(prob2Tab).toBeInTheDocument();

    // Problem statement panel with description, constraints, and sample cases / examples
    expect(screen.getByText(/Constraints/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sample Examples|Sample Test Cases/i).length).toBeGreaterThanOrEqual(1);

    // Action buttons in test drawer
    expect(screen.getByRole('button', { name: /Run Code/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Code/i })).toBeInTheDocument();

    // Monaco Editor is rendered
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
  });

  // Scenario 3: Switching problems updates active problem panel
  it('3. updates the active problem panel when switching problems via tabs', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google&role=SDE&difficulty=Medium']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Enter exam
    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Check Problem 1 is initially active in the heading
    const prob1Heading = screen.getByRole('heading', { level: 2 });
    const initialTitle = prob1Heading.textContent;
    expect(initialTitle).toMatch(/1\./);

    // Click Problem 2 selector button
    const prob2Tab = screen.getByRole('button', { name: /Problem 2:/i });
    await act(async () => {
      fireEvent.click(prob2Tab);
    });

    // Heading should now show Problem 2
    const updatedHeading = screen.getByRole('heading', { level: 2 });
    expect(updatedHeading.textContent).toMatch(/2\./);
    expect(updatedHeading.textContent).not.toBe(initialTitle);
  });

  // Scenario 4: Tab switch / visibilitychange triggers proctoring warning counter
  it('4. triggers proctoring warning counter and toast on tab switch / visibilitychange event', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google&role=SDE&difficulty=Medium']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Enter exam
    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Initially 0 switches
    expect(screen.getByText(/Tab Switches: 0 \/ 3/i)).toBeInTheDocument();

    // Trigger visibilitychange to hidden
    await act(async () => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Warning counter in header updates to 1 / 3
    expect(screen.getByText(/Tab Switches: 1 \/ 3/i)).toBeInTheDocument();

    // Toast banner appears with warning message
    expect(screen.getByText(/Warning 1\/3: You navigated away from the exam window!/i)).toBeInTheDocument();
  });

  // Scenario 5: Finishing assessment transitions to HackerRank Scorecard view
  it('5. transitions to HackerRank Scorecard view with score, breakdown matrix, and Advance to Round 2 button', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google&role=SDE&difficulty=Medium&multiRound=true']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Enter exam
    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Click Finish & Submit Exam button
    const finishBtn = screen.getByRole('button', { name: /Finish & Submit Exam/i });
    await act(async () => {
      fireEvent.click(finishBtn);
    });

    // Confirmation modal should be visible
    expect(screen.getByText(/Finish & Submit Exam\?/i)).toBeInTheDocument();

    // Confirm submission
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Submit/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Scorecard view rendered
    expect(screen.getByText(/Online Assessment Evaluation/i)).toBeInTheDocument();
    expect(screen.getByText(/Google Coding Assessment Report/i)).toBeInTheDocument();

    // Overall Score and points display
    expect(screen.getAllByText(/pts/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Problem Breakdown Matrix/i)).toBeInTheDocument();

    // Proctoring integrity indicator
    expect(screen.getByText(/Proctoring/i)).toBeInTheDocument();

    // Back Button in Scorecard
    const backBtn = screen.getByRole('button', { name: /^back$/i });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);

    // Advance to Round 2 button
    const advanceBtn = screen.getByRole('button', { name: /Advance to Round 2: Technical Interview/i });
    expect(advanceBtn).toBeInTheDocument();

    // Clicking Advance to Round 2 executes without error
    await act(async () => {
      fireEvent.click(advanceBtn);
    });
  });

  // Scenario 6: Custom Time Limits and Question Count
  it('6. supports custom duration (90 mins) and question count (3 problems) via URL parameters and lobby specs', () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=amazon&duration=90&count=3']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Custom duration and question count reflected in Lobby specs
    expect(screen.getByText(/Amazon Online Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/3 Coding Challenges/i)).toBeInTheDocument();
    expect(screen.getByText(/90 Minutes/i)).toBeInTheDocument();
  });

  // Scenario 7: Custom Question Pools by ID and Company Focus Presets
  it('7. loads exact specified questions from problem explorer by ID or number', () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=meta&questions=1,4,15']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Verify 3 selected challenges are loaded
    expect(screen.getByText(/3 Coding Challenges/i)).toBeInTheDocument();
  });

  // Scenario 8: Webcam and Audio Proctoring Pre-Flight Check
  it('8. provides webcam & audio proctoring pre-flight panel and camera toggle button', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Proctoring panel visible in Lobby
    expect(screen.getByText(/Proctoring & Identity Pre-Flight Check/i)).toBeInTheDocument();
    const camToggleBtn = screen.getByRole('button', { name: /Enable Webcam & Mic Pre-Check/i });
    expect(camToggleBtn).toBeInTheDocument();

    // Toggle camera
    await act(async () => {
      fireEvent.click(camToggleBtn);
    });

    // Verification status updated
    expect(screen.getByText(/Camera Active \(Verified ✓\)/i)).toBeInTheDocument();
  });

  // Scenario 9: Recruiter / HR Dashboard Actions in Scorecard
  it('9. provides Recruiter / HR Dossier view and Download Report buttons in Scorecard', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Start exam
    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Finish exam
    const finishBtn = screen.getByRole('button', { name: /Finish & Submit Exam/i });
    await act(async () => {
      fireEvent.click(finishBtn);
    });
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Submit/i });
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    // Verify HR & Recruiter Tools are displayed
    expect(screen.getByText(/Recruiter \/ HR Tools/i)).toBeInTheDocument();
    const dossierBtn = screen.getByRole('button', { name: /View in Recruiter Dossier/i });
    const downloadBtn = screen.getByRole('button', { name: /Download Assessment Report/i });
    expect(dossierBtn).toBeInTheDocument();
    expect(downloadBtn).toBeInTheDocument();

    // Clicking View in Recruiter Dossier opens the modal
    await act(async () => {
      fireEvent.click(dossierBtn);
    });
    expect(screen.getByText(/Candidate Executive Dossier/i)).toBeInTheDocument();
  });

  // Scenario 10: Curated problem definition with authentic graph description and examples
  it('10. renders authentic problem description, prerequisites examples and topic tags for signature problems', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=amazon&questions=course-schedule']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Check Problem 1 is Course Schedule with authentic details
    expect(screen.getAllByText(/Course Schedule/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/There are a total of `numCourses` courses/i)).toBeInTheDocument();
    expect(screen.getByText(/numCourses = 2, prerequisites = \[\[1, 0\]\]/i)).toBeInTheDocument();
    expect(screen.getByText(/Topological Sort/i)).toBeInTheDocument();

    // Check Copy Input button is present
    const copyBtns = screen.getAllByRole('button', { name: /Copy Input/i });
    expect(copyBtns.length).toBeGreaterThanOrEqual(1);
  });

  // Scenario 11: Left pane sub-tabs (Description, Editorial & Approaches, Submissions)
  it('11. allows navigating between Description, Editorial, and Submissions tabs', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=amazon&questions=course-schedule']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Click Editorial & Approaches tab
    const editorialTab = screen.getByRole('button', { name: /Editorial & Approaches/i });
    await act(async () => {
      fireEvent.click(editorialTab);
    });

    // Verify editorial content
    expect(screen.getByText(/Topological Sort via Kahn's Algorithm/i)).toBeInTheDocument();
    expect(screen.getByText(/Time Complexity:/i)).toBeInTheDocument();
    expect(screen.getByText(/Space Complexity:/i)).toBeInTheDocument();

    // Click Submissions tab
    const submissionsTab = screen.getByRole('button', { name: /Submissions/i });
    await act(async () => {
      fireEvent.click(submissionsTab);
    });

    // Verify submissions pane is visible
    expect(screen.getByText(/Session Test & Submission History/i)).toBeInTheDocument();
  });

  // Scenario 12: Editor controls (font size, theme) and console drawer collapse toggle
  it('12. supports font zoom, theme switching, and console drawer collapse', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=google']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Font zoom controls
    expect(screen.getByText('13.5px')).toBeInTheDocument();
    const zoomInBtn = screen.getByTitle(/Increase font size/i);
    await act(async () => {
      fireEvent.click(zoomInBtn);
    });
    expect(screen.getByText('14.5px')).toBeInTheDocument();

    // Theme toggle
    const themeBtn = screen.getByRole('button', { name: /Dark/i });
    await act(async () => {
      fireEvent.click(themeBtn);
    });
    expect(screen.getByRole('button', { name: /High Contrast/i })).toBeInTheDocument();

    // Drawer collapse toggle
    const collapseBtn = screen.getByRole('button', { name: /Minimize/i });
    await act(async () => {
      fireEvent.click(collapseBtn);
    });
    expect(screen.getByRole('button', { name: /Console/i })).toBeInTheDocument();
  });

  // Scenario 13: Expandable hints accordion
  it('13. expands and reveals hints in the description tab on click', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=amazon&questions=course-schedule']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Find and expand Hint 1
    const hintTrigger = screen.getByRole('button', { name: /Hint 1/i });
    expect(hintTrigger).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(hintTrigger);
    });

    // Verify hint content is revealed
    expect(screen.getByText(/This problem is equivalent to detecting whether a cycle exists/i)).toBeInTheDocument();
  });

  // Scenario 14: Proctoring camera placement switcher and minimize controls
  it('14. allows candidate to switch proctoring camera position to any corner and toggle minimize/expand', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=amazon&questions=course-schedule']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    // Enable webcam pre-check in lobby
    const camToggleBtn = screen.getByRole('button', { name: /Enable Webcam/i });
    await act(async () => {
      fireEvent.click(camToggleBtn);
    });

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Verify proctoring feed is rendered with title
    expect(screen.getByText('Proctoring Feed')).toBeInTheDocument();

    // Verify corner switcher buttons by title
    const topLeftBtn = screen.getByTitle('Move to Top-Left');
    const bottomLeftBtn = screen.getByTitle('Move to Bottom-Left');
    const bottomRightBtn = screen.getByTitle('Move to Bottom-Right');
    const topRightBtn = screen.getByTitle('Move to Top-Right');

    expect(topLeftBtn).toBeInTheDocument();
    expect(bottomLeftBtn).toBeInTheDocument();
    expect(bottomRightBtn).toBeInTheDocument();
    expect(topRightBtn).toBeInTheDocument();

    // Switch to Top-Left
    await act(async () => {
      fireEvent.click(topLeftBtn);
    });
    expect(topLeftBtn).toHaveClass('active');

    // Switch to Bottom-Left
    await act(async () => {
      fireEvent.click(bottomLeftBtn);
    });
    expect(bottomLeftBtn).toHaveClass('active');

    // Toggle minimize
    const minBtn = screen.getByTitle(/Minimize to compact badge/i);
    await act(async () => {
      fireEvent.click(minBtn);
    });
    expect(screen.getByTitle(/Expand Camera View/i)).toBeInTheDocument();

    // Toggle expand back
    const expandBtn = screen.getByTitle(/Expand Camera View/i);
    await act(async () => {
      fireEvent.click(expandBtn);
    });
    expect(screen.getByTitle(/Minimize to compact badge/i)).toBeInTheDocument();
  });

  // Scenario 15: Case 1 / Case 2 test cases UI with formatted parameters, copy button, and custom input
  it('15. renders formatted Case 1 and Case 2 test cases with copy input button and custom input switcher', async () => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(
      <MemoryRouter initialEntries={['/coding-round?company=amazon&questions=course-schedule']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Make sure drawer is on Test Cases tab
    const testCasesTab = screen.getByRole('button', { name: /Test Cases/i });
    await act(async () => {
      fireEvent.click(testCasesTab);
    });

    // Verify Case 1 and Case 2 pills exist
    const case1Btn = screen.getByRole('button', { name: /Case 1/i });
    const case2Btn = screen.getByRole('button', { name: /Case 2/i });
    expect(case1Btn).toBeInTheDocument();
    expect(case2Btn).toBeInTheDocument();

    // Case 1 should be active by default
    expect(case1Btn).toHaveClass('active');

    // Verify formatted Course Schedule parameters in Case 1: numCourses and prerequisites
    expect(screen.getAllByText(/numCourses = 2/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/prerequisites = \[\[1,0\]\]/i).length).toBeGreaterThanOrEqual(1);

    // Verify Copy button works
    const copyBtns = screen.getAllByRole('button', { name: /Copy/i });
    await act(async () => {
      fireEvent.click(copyBtns[0]);
    });
    expect(screen.getAllByText(/Copied!/i).length).toBeGreaterThanOrEqual(1);

    // Click Case 2 pill
    await act(async () => {
      fireEvent.click(case2Btn);
    });
    expect(case2Btn).toHaveClass('active');

    // Click "+ Custom Input" pill to switch to custom stdin
    const customInputPill = screen.getByRole('button', { name: /\+ Custom Input/i });
    await act(async () => {
      fireEvent.click(customInputPill);
    });
    expect(screen.getByPlaceholderText(/e\.g\. 5/i)).toBeInTheDocument();
  });

  // Scenario 16: Code Run and Submit verification with live test execution
  it('16. executes code against sample and hidden test cases, reporting accurate pass/fail results', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=amazon&questions=course-schedule']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Switch language to JavaScript
    const langSelect = screen.getByLabelText(/Language:/i);
    await act(async () => {
      fireEvent.change(langSelect, { target: { value: 'javascript' } });
    });

    // Provide a valid working solution for Course Schedule
    const editor = screen.getByTestId('monaco-editor');
    await act(async () => {
      fireEvent.change(editor, {
        target: {
          value: `function canFinish(numCourses, prerequisites) {
            const inDegree = new Array(numCourses).fill(0);
            const adj = Array.from({ length: numCourses }, () => []);
            for (const [c, p] of prerequisites) {
              adj[p].push(c);
              inDegree[c]++;
            }
            const q = [];
            for (let i = 0; i < numCourses; i++) {
              if (inDegree[i] === 0) q.push(i);
            }
            let count = 0;
            while (q.length > 0) {
              const curr = q.shift();
              count++;
              for (const next of adj[curr]) {
                inDegree[next]--;
                if (inDegree[next] === 0) q.push(next);
              }
            }
            return count === numCourses;
          }`,
        },
      });
    });

    // Click Run Code
    const runBtn = screen.getByRole('button', { name: /Run Code/i });
    await act(async () => {
      fireEvent.click(runBtn);
    });

    // Verify Results show Accepted and 2/2 sample cases passed
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Case 1: Passed ✓/i)).toBeInTheDocument();
    expect(screen.getByText(/Case 2: Passed ✓/i)).toBeInTheDocument();

    // Click Submit Code
    const submitBtn = screen.getByRole('button', { name: /Submit Code/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Verify Submit runs against all 5 test cases and accepts
    expect(screen.getByText(/5 \/ 5/i)).toBeInTheDocument();
  });

  // Scenario 17: Custom stdin input execution
  it('17. accepts custom stdin input and executes it alongside sample cases', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=amazon&questions=course-schedule']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    // Switch language to JavaScript
    const langSelect = screen.getByLabelText(/Language:/i);
    await act(async () => {
      fireEvent.change(langSelect, { target: { value: 'javascript' } });
    });

    // Provide simple solution
    const editor = screen.getByTestId('monaco-editor');
    await act(async () => {
      fireEvent.change(editor, {
        target: {
          value: `function canFinish(numCourses, prerequisites) {
            return prerequisites.length === 0 || prerequisites.length === 1;
          }`,
        },
      });
    });

    // Switch to Custom Stdin tab
    const customTab = screen.getByRole('button', { name: /Custom Stdin/i });
    await act(async () => {
      fireEvent.click(customTab);
    });

    // Enter custom stdin JSON
    const textarea = screen.getByPlaceholderText(/e\.g\. 5/i);
    await act(async () => {
      fireEvent.change(textarea, { target: { value: '[1, []]' } });
    });

    // Click Run Code
    const runBtn = screen.getByRole('button', { name: /Run Code/i });
    await act(async () => {
      fireEvent.click(runBtn);
    });

    // Verify Custom Stdin test case was executed in the results
    expect(screen.getByText(/Custom Stdin/i)).toBeInTheDocument();
  });

  // Scenario 18: Multi-language support and starter code switching
  it('18. verifies multi-language switching across Python, JavaScript, C++, Java, and Go', async () => {
    render(
      <MemoryRouter initialEntries={['/coding-round?company=amazon&questions=course-schedule']}>
        <CodingAssessmentPage />
      </MemoryRouter>
    );

    const startBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Assessment/i });
    await act(async () => {
      fireEvent.click(startBtn);
    });

    const langSelect = screen.getByLabelText(/Language:/i);
    const editor = screen.getByTestId('monaco-editor');

    // Default language is Python
    expect(editor).toHaveAttribute('data-language', 'python');

    // Switch to JavaScript
    await act(async () => {
      fireEvent.change(langSelect, { target: { value: 'javascript' } });
    });
    expect(editor).toHaveAttribute('data-language', 'javascript');
    expect(editor.value).toContain('function canFinish');

    // Switch to C++
    await act(async () => {
      fireEvent.change(langSelect, { target: { value: 'cpp' } });
    });
    expect(editor).toHaveAttribute('data-language', 'cpp');
    expect(editor.value).toContain('vector<vector<int>>');

    // Switch to Java
    await act(async () => {
      fireEvent.change(langSelect, { target: { value: 'java' } });
    });
    expect(editor).toHaveAttribute('data-language', 'java');
    expect(editor.value).toContain('int[][] prerequisites');

    // Switch to Go
    await act(async () => {
      fireEvent.change(langSelect, { target: { value: 'go' } });
    });
    expect(editor).toHaveAttribute('data-language', 'go');
    expect(editor.value).toContain('func canFinish');
  });
});
