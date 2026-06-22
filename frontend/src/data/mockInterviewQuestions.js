export const MOCK_INTERVIEW_QUESTIONS = {
  roles: [
    {
      id: "frontend",
      title: "Frontend Developer",
      description: "React, Vue, CSS, System Design",
      icon: "Layout",
      questions: [
        {
          id: "fe_1",
          text: "Can you explain the virtual DOM and how it improves performance in React?",
          difficulty: "Easy",
          topics: ["React", "Performance"],
          hints: ["Think about reconciliation and batch updates.", "Compare with real DOM manipulation."]
        },
        {
          id: "fe_2",
          text: "How would you optimize the critical rendering path of a web application?",
          difficulty: "Medium",
          topics: ["Performance", "Browser"],
          hints: ["Consider resource loading order.", "Think about render-blocking resources."]
        },
        {
          id: "fe_3",
          text: "Explain the concept of closures in JavaScript with a practical example.",
          difficulty: "Medium",
          topics: ["JavaScript", "Core Concepts"],
          hints: ["Function bundling", "Lexical scope"]
        }
      ]
    },
    {
      id: "backend",
      title: "Backend Developer",
      description: "Node.js, Python, Databases, API Design",
      icon: "Server",
      questions: [
        {
          id: "be_1",
          text: "What are the differences between SQL and NoSQL databases, and when would you use each?",
          difficulty: "Medium",
          topics: ["Databases", "System Design"],
          hints: ["Structure vs Flexibility", "Scaling (Vertical vs Horizontal)"]
        },
        {
          id: "be_2",
          text: "Explain how you would handle concurrent transactions in a banking application.",
          difficulty: "Hard",
          topics: ["Concurrency", "Databases"],
          hints: ["ACID properties", "Locking mechanisms"]
        },
        {
          id: "be_3",
          text: "Design a RESTful API for a social media platform's user feed.",
          difficulty: "Medium",
          topics: ["API Design", "System Design"],
          hints: ["Pagination", "Endpoints structure", "Optimization"]
        }
      ]
    },
    {
      id: "pm",
      title: "Product Manager",
      description: "Strategy, User Experience, Prioritization",
      icon: "Briefcase",
      questions: [
        {
          id: "pm_1",
          text: "How would you prioritize features for a new MVP launch with limited resources?",
          difficulty: "Medium",
          topics: ["Prioritization", "Strategy"],
          hints: ["RICE score", "User impact vs Effort"]
        },
        {
          id: "pm_2",
          text: "Tell me about a time you had to say 'no' to a stakeholder request. How did you handle it?",
          difficulty: "Medium",
          topics: ["Communication", "Stakeholder Management"],
          hints: ["Data-driven decision", "Alternative solutions"]
        }
      ]
    },
    {
      id: "analyst",
      title: "Data Analyst",
      description: "SQL, Python, Visualization, Statistics",
      icon: "BarChart",
      questions: [
        {
          id: "da_1",
          text: "Explain the difference between inner, left, right, and full outer joins.",
          difficulty: "Easy",
          topics: ["SQL", "Data Manipulation"],
          hints: ["Venn diagrams logic", "Which rows are kept"]
        },
        {
          id: "da_2",
          text: "How would you handle missing data in a large dataset before analysis?",
          difficulty: "Medium",
          topics: ["Data Cleaning", "Statistics"],
          hints: ["Imputation", "Removal", "Flagging"]
        }
      ]
    },
    {
      id: "fresher",
      title: "Fresher / Student",
      description: "Campus placements, Internships, Core CS",
      icon: "GraduationCap",
      questions: [
        {
          id: "fr_1",
          text: "Tell me about yourself — what are you studying and what excites you about tech?",
          difficulty: "Easy",
          topics: ["Introduction", "Communication"],
          hints: ["Mention your branch, interests, and a project you enjoyed.", "Keep it concise — 1-2 minutes."]
        },
        {
          id: "fr_2",
          text: "Walk me through a project you built during college or a hackathon. What was your role?",
          difficulty: "Easy",
          topics: ["Projects", "Teamwork"],
          hints: ["Use STAR format", "Mention tech stack and your specific contribution"]
        },
        {
          id: "fr_3",
          text: "Explain the difference between a stack and a queue. When would you use each?",
          difficulty: "Easy",
          topics: ["Data Structures", "Fundamentals"],
          hints: ["Think LIFO vs FIFO", "Real-world analogies help"]
        }
      ]
    }
  ]
};
