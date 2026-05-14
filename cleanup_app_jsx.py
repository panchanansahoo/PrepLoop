import os

missing = ['./pages/BehavioralCoach', './pages/InterviewExperiences', './pages/AICodeReviewer', './pages/PeerMockInterview', './pages/OfferNegotiationCoach', './pages/Flashcards', './pages/ComplexityAnalyzer', './pages/JDQuestionGenerator', './pages/ReadinessCheck', './pages/ConceptExplainer', './pages/CodeTranslator', './pages/PatternTrainer', './pages/BugDebugger', './pages/SkillHeatmap', './pages/DailyWin', './pages/AnswerTimer', './pages/QuestionBankSearch', './pages/WeeklyReport', './pages/RejectionAnalyzer', './pages/AccountabilityPartner']

# Extract the base names
missing_names = [m.split('/')[-1] for m in missing]

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    keep = True
    for name in missing_names:
        if name in line:
            keep = False
            break
    if keep:
        new_lines.append(line)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Cleaned up App.jsx")
