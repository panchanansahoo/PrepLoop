// Structured Company Interview Tracks
// Each track contains syllabus, rounds, must-do topics, and estimated prep time

export const companyTracks = [
    {
        id: 'tcs-nqt',
        name: 'TCS NQT',
        fullName: 'TCS National Qualifier Test',
        logo: '🏢',
        difficulty: 'Medium',
        category: 'IT Services',
        prepTime: '2-3 weeks',
        salary: '₹3.5 - 7 LPA',
        rounds: [
            { name: 'NQT Online Test', type: 'test', desc: 'Aptitude + Coding (2h)' },
            { name: 'Technical Interview', type: 'interview', desc: 'DSA, DBMS, OS basics' },
            { name: 'HR Interview', type: 'hr', desc: 'Behavioral + situational' },
        ],
        syllabus: [
            { section: 'Quantitative Aptitude', topics: ['Number System', 'Percentages', 'Profit & Loss', 'Time & Work', 'Permutations'], link: '/aptitude' },
            { section: 'Verbal Ability', topics: ['Reading Comprehension', 'Error Detection', 'Sentence Completion', 'Synonyms/Antonyms'], link: null },
            { section: 'Programming Logic', topics: ['Arrays', 'Strings', 'Basic Sorting', 'Pattern Programs', 'Loops'], link: '/problems' },
            { section: 'Coding', topics: ['Two Pointers', 'HashMap', 'String Manipulation', 'Basic DP'], link: '/code-editor/two-sum' },
        ],
        mustDo: ['Arrays basics', 'String problems', 'Aptitude speed math', 'Email writing'],
        tips: ['Focus on speed for NQT', 'Practice aptitude daily', 'Coding section is moderate difficulty'],
    },
    {
        id: 'infosys-se',
        name: 'Infosys SE',
        fullName: 'Infosys System Engineer',
        logo: '🔷',
        difficulty: 'Medium',
        category: 'IT Services',
        prepTime: '2-4 weeks',
        salary: '₹3.6 - 6.5 LPA',
        rounds: [
            { name: 'InfyTQ Online Test', type: 'test', desc: 'MCQ + Coding (3h)' },
            { name: 'Technical Interview', type: 'interview', desc: 'Projects, DSA, DBMS' },
            { name: 'HR Round', type: 'hr', desc: 'Cultural fit' },
        ],
        syllabus: [
            { section: 'Data Structures', topics: ['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees'], link: '/dsa-path' },
            { section: 'SQL & DBMS', topics: ['JOINs', 'Subqueries', 'Normalization', 'ACID Properties'], link: '/sql-problems' },
            { section: 'System Design Basics', topics: ['Monolith vs Microservice', 'REST APIs', 'Caching'], link: null },
            { section: 'Coding Problems', topics: ['Sliding Window', 'Two Pointers', 'Recursion', 'Basic Graphs'], link: '/problems' },
        ],
        mustDo: ['LinkedList operations', 'SQL JOINs', 'Binary Tree traversals', 'OOP concepts'],
        tips: ['InfyTQ certification gives shortlist advantage', 'Focus on Java/Python', 'Practice SQL thoroughly'],
    },
    {
        id: 'wipro-nlth',
        name: 'Wipro NLTH',
        fullName: 'Wipro National Level Talent Hunt',
        logo: '🌐',
        difficulty: 'Easy-Medium',
        category: 'IT Services',
        prepTime: '1-2 weeks',
        salary: '₹3.5 - 6 LPA',
        rounds: [
            { name: 'Online Assessment', type: 'test', desc: 'Aptitude + Essay + Coding' },
            { name: 'Technical Interview', type: 'interview', desc: 'Fundamentals only' },
            { name: 'Business Discussion', type: 'hr', desc: 'HR + managerial' },
        ],
        syllabus: [
            { section: 'Aptitude', topics: ['Arithmetic', 'Logical Reasoning', 'Verbal'], link: '/aptitude' },
            { section: 'Written Communication', topics: ['Essay Writing', 'Email Etiquette'], link: null },
            { section: 'Coding Basics', topics: ['Pattern Printing', 'String Operations', 'Array Manipulation'], link: '/problems' },
        ],
        mustDo: ['Speed math', 'Essay writing practice', 'Basic coding patterns'],
        tips: ['Focus on aptitude accuracy', 'Prepare a good essay template', 'Coding section is beginner-level'],
    },
    {
        id: 'deloitte',
        name: 'Deloitte',
        fullName: 'Deloitte Analyst / Consultant',
        logo: '💼',
        difficulty: 'Hard',
        category: 'Consulting / Big4',
        prepTime: '3-5 weeks',
        salary: '₹6 - 12 LPA',
        rounds: [
            { name: 'Online Assessment', type: 'test', desc: 'Aptitude + Technical MCQ' },
            { name: 'Group Discussion', type: 'interview', desc: 'Current affairs, business topics' },
            { name: 'Technical Interview', type: 'interview', desc: 'Domain-specific + projects' },
            { name: 'HR Interview', type: 'hr', desc: 'Behavioral + case study' },
        ],
        syllabus: [
            { section: 'Quantitative', topics: ['Data Interpretation', 'Probability', 'Statistics', 'Percentages'], link: '/aptitude' },
            { section: 'Logical Reasoning', topics: ['Puzzles', 'Seating Arrangement', 'Blood Relations', 'Coding-Decoding'], link: '/aptitude' },
            { section: 'Technical', topics: ['DBMS', 'Networking', 'Cloud Basics', 'Cybersecurity'], link: null },
            { section: 'Case Studies', topics: ['Business Analysis', 'Process Optimization', 'Risk Assessment'], link: null },
        ],
        mustDo: ['Data interpretation', 'GD practice', 'STAR method for HR', 'Current affairs'],
        tips: ['Deloitte values communication skills highly', 'Practice case studies', 'Prepare consulting frameworks'],
    },
    {
        id: 'accenture',
        name: 'Accenture',
        fullName: 'Accenture Associate Software Engineer',
        logo: '🔮',
        difficulty: 'Easy-Medium',
        category: 'IT Services',
        prepTime: '1-2 weeks',
        salary: '₹4.5 - 8 LPA',
        rounds: [
            { name: 'Cognitive Assessment', type: 'test', desc: 'Aptitude + Logical (90min)' },
            { name: 'Coding Round', type: 'test', desc: '2 problems (45min)' },
            { name: 'Communication Test', type: 'interview', desc: 'English proficiency' },
        ],
        syllabus: [
            { section: 'Cognitive & Technical', topics: ['Verbal Ability', 'Analytical Skills', 'Abstract Reasoning'], link: '/aptitude' },
            { section: 'Coding', topics: ['String Processing', 'Array Operations', 'Basic Math'], link: '/problems' },
        ],
        mustDo: ['Aptitude speed drills', 'Basic coding', 'English communication'],
        tips: ['Very aptitude-heavy', 'Coding is moderate', 'Communication test is pass/fail'],
    },
    {
        id: 'cognizant',
        name: 'Cognizant',
        fullName: 'Cognizant GenC / GenC Next',
        logo: '🔵',
        difficulty: 'Medium',
        category: 'IT Services',
        prepTime: '2-3 weeks',
        salary: '₹4 - 6.75 LPA',
        rounds: [
            { name: 'Online Test', type: 'test', desc: 'Quant + Logical + Coding' },
            { name: 'Technical Interview', type: 'interview', desc: 'DSA + Projects' },
            { name: 'HR Interview', type: 'hr', desc: 'Behavioral' },
        ],
        syllabus: [
            { section: 'Aptitude', topics: ['Quant', 'Logical', 'Verbal', 'Automata Fix (Debug)'], link: '/aptitude' },
            { section: 'Coding', topics: ['Arrays', 'Strings', 'Two Pointers', 'Basic DP'], link: '/problems' },
            { section: 'CS Fundamentals', topics: ['OOP', 'DBMS', 'OS basics'], link: null },
        ],
        mustDo: ['Automata Fix debugging', 'OOP concepts', 'SQL basics'],
        tips: ['GenC Next has harder coding', 'Practice debugging questions', 'Focus on Java/Python'],
    },
];

export const getTrackById = (id) => companyTracks.find(t => t.id === id);
export const getTracksByCategory = () => {
    const grouped = {};
    companyTracks.forEach(t => {
        if (!grouped[t.category]) grouped[t.category] = [];
        grouped[t.category].push(t);
    });
    return grouped;
};
