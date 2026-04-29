const fs = require('fs');
const file = 'frontend/src/pages/AIInterviewPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const \[savedSession, setSavedSession\] = useState\(null\); \/\/ Recoverable session from localStorage[\s\S]*?}, \[\]\); \/\/ eslint-disable-line react-hooks\/exhaustive-deps/m;

const replacement = `const { savedSession, clearSavedSession, restoreSession } = useInterviewRecovery({
        phase,
        conversation,
        questionIndex,
        currentQuestion,
        elapsed,
        totalQuestions,
        interviewType,
        interviewerGender,
        code,
        language,
        notes,
        setConversation,
        setQuestionIndex,
        setCurrentQuestion,
        setElapsed,
        setTotalQuestions,
        setInterviewType,
        setInterviewerGender,
        setCode,
        setLanguage,
        setNotes,
        setPhase
    });`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
