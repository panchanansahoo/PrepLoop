// src/data/studyPlans.js

export const STUDY_PLANS = [
    { 
        id: 'top-interview-150', 
        label: 'Interview Top 150', 
        desc: 'Master the top 150 most frequently asked questions in tech interviews. Essential for Big Tech.', 
        icon: '🏆',
        gradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(202, 138, 4, 0.15))',
        border: 'rgba(234, 179, 8, 0.35)',
        textLight: '#854d0e',
        textDark: '#fef08a',
        filter: p => p.studyPlans && p.studyPlans.includes('top-interview-150')
    },
    { 
        id: 'beginner', 
        label: 'Beginner 50', 
        desc: 'A curated list of 50 easy problems to build your confidence and fundamental problem-solving skills.', 
        icon: '🌱',
        gradient: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.15))',
        border: 'rgba(34, 197, 94, 0.35)',
        textLight: '#166534',
        textDark: '#bbf7d0',
        filter: p => p.difficulty === 'Easy', 
        limit: 50 
    },
    { 
        id: 'top-medium', 
        label: 'Top Medium', 
        desc: 'The most frequently asked medium difficulty problems. Perfect for the main interview rounds.', 
        icon: '🔥',
        gradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.15))',
        border: 'rgba(249, 115, 22, 0.35)',
        textLight: '#9a3412',
        textDark: '#fed7aa',
        filter: p => p.difficulty === 'Medium' && p.frequency === 'high', 
        limit: 50 
    },
    { 
        id: 'hard-grind', 
        label: 'Hard Grind', 
        desc: 'Challenge yourself with the hardest problems to guarantee you can pass any technical bar.', 
        icon: '💪',
        gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.15))',
        border: 'rgba(239, 68, 68, 0.35)',
        textLight: '#991b1b',
        textDark: '#fecaca',
        filter: p => p.difficulty === 'Hard', 
        limit: 30 
    },
    { 
        id: 'arrays-strings', 
        label: 'Arrays & Strings', 
        desc: 'Master the foundation of data structures. Crucial for both coding and system design rounds.', 
        icon: '📚',
        gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.15))',
        border: 'rgba(59, 130, 246, 0.35)',
        textLight: '#1e40af',
        textDark: '#bfdbfe',
        filter: p => p.topics.includes('Arrays') || p.topics.includes('Strings'), 
        limit: 50 
    },
    { 
        id: 'trees-graphs', 
        label: 'Trees & Graphs', 
        desc: 'Conquer tree traversals and graph algorithms like BFS, DFS, and topological sort.', 
        icon: '🌳',
        gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))',
        border: 'rgba(16, 185, 129, 0.35)',
        textLight: '#065f46',
        textDark: '#a7f3d0',
        filter: p => p.topics.includes('Trees') || p.topics.includes('Graphs'), 
        limit: 40 
    },
    { 
        id: 'dp-master', 
        label: 'DP Master', 
        desc: 'Build intuition for Dynamic Programming. Learn to identify states, transitions, and memoization.', 
        icon: '🧠',
        gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.15))',
        border: 'rgba(168, 85, 247, 0.35)',
        textLight: '#6b21a8',
        textDark: '#e9d5ff',
        filter: p => p.topics.includes('Dynamic Programming'), 
        limit: 45 
    },
];
