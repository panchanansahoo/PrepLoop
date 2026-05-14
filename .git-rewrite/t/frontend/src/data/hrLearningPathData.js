export const HR_STAGES = [
    { id: 'intro', name: 'Stage 1: Core Behavioral', color: '#8b5cf6', icon: '🎭' },
    { id: 'conflict', name: 'Stage 2: Conflict & Feedback', color: '#ec4899', icon: '⚔️' },
    { id: 'leadership', name: 'Stage 3: Leadership & Initiative', color: '#eab308', icon: '👑' },
    { id: 'logistics', name: 'Stage 4: Logistics & Negotiation', color: '#14b8a6', icon: '🤝' },
    { id: 'culture', name: 'Stage 5: Work Culture & Team', color: '#3b82f6', icon: '🏢' },
    { id: 'career', name: 'Stage 6: Career Goals & Situational', color: '#f97316', icon: '🎯' },
];

export const HR_TOPICS = [
    // ═══════════════ STAGE 1: CORE BEHAVIORAL ═══════════════
    {
        id: 'tell-me-about-yourself',
        title: '"Tell Me About Yourself"',
        stage: 'intro',
        icon: '👋',
        color: '#8b5cf6',
        estimatedTime: '2 hrs',
        difficulty: 'Foundational',
        description: 'The critical first impression. Master your personal elevator pitch without rambling.',
        flashcards: [
            { q: 'Tell me about yourself.', a: 'Start with your current role and key achievement, briefly mention 1-2 past relevant experiences, then explain why you\'re excited about this opportunity. Keep it under 2 minutes. Formula: Present → Past → Future.' },
            { q: 'Walk me through your resume.', a: 'Chronologically highlight key transitions, why you made each move, and what you learned. Focus on roles relevant to the position. End by connecting your journey to why this role is the perfect next step.' },
            { q: 'What do you know about our company?', a: 'Mention the company\'s mission, recent achievements, products, or culture. Show you\'ve done research. Example: "I know [Company] recently launched [product] and is focused on [mission]. I admire how you [specific detail]."' },
            { q: 'Why are you interested in this role?', a: 'Connect your skills and career goals to the specific job description. Mention what excites you about the role\'s challenges, the team, or the company\'s impact. Avoid generic answers like "it\'s a great company."' },
            { q: 'What motivates you to come to work every day?', a: 'Share genuine motivations like solving challenging problems, learning new skills, making an impact, or collaborating with talented people. Use a specific example of when you felt truly motivated at work.' },
            { q: 'How did you hear about this position?', a: 'If referred, mention the referrer and what they said. If through research, mention what specifically drew you to apply. Shows enthusiasm and initiative beyond just browsing job boards.' },
            { q: 'What are your hobbies and interests outside of work?', a: 'Mention hobbies that show positive traits — leadership (team sports), creativity (music/art), discipline (fitness), curiosity (reading). Be genuine and briefly connect to how it shapes your professional approach.' },
            { q: 'Describe yourself in three words.', a: 'Choose words that match the role requirements. Example: "Analytical, Collaborative, Resilient." Back each with a one-line example. Avoid clichés like "hardworking" — be specific and memorable.' },
            { q: 'Why did you choose your field of study / major?', a: 'Connect it to your passion and career: "I chose Computer Science because I was fascinated by how technology can solve real-world problems. Building my first app in college confirmed that this was the right path for me."' },
            { q: 'What do you consider your most significant accomplishment?', a: 'Use STAR method with measurable impact: "At my last role, I redesigned our customer support workflow, reducing average resolution time from 48 hours to 6 hours. It increased customer satisfaction scores by 30%."' },
            { q: 'Where else are you interviewing?', a: 'Be honest but tactful: "I\'m exploring a few opportunities in [industry/role type] but I\'m most excited about this position because [specific reason]. I want to make sure I find the right fit for long-term growth."' },
            { q: 'What is your work style?', a: 'Be specific: "I\'m a structured planner who likes to break tasks into milestones. I work best when given clear goals but autonomy to achieve them. I\'m collaborative when needed and can also work independently on deep-focus tasks."' },
            { q: 'How would your previous colleagues describe you?', a: 'Quote real feedback: "My team lead described me as \"reliable and solution-oriented\" in my last review. Colleagues have said I\'m approachable and always willing to help troubleshoot issues."' },
            { q: 'What are you passionate about?', a: 'Choose something genuine that shows character: "I\'m passionate about making technology accessible. I volunteer to teach coding to underprivileged students on weekends. Seeing them build their first projects is incredibly rewarding."' },
            { q: 'If you were an animal, what would you be and why?', a: 'Pick an animal that reflects positive professional traits: "An eagle — I like to see the big picture while being precise in execution. I focus on my goals and have the patience to plan before acting."' },
            { q: 'What do you think is the most important quality for success?', a: 'Show depth: "Consistency. Talent opens doors, but consistently showing up, learning, and delivering results is what builds trust and creates long-term success. I\'ve seen this in my own career — steady effort compounds over time."' },
            { q: 'Tell me something about yourself that is not on your resume.', a: 'Share a meaningful personal story: "I run a small tech blog where I simplify complex concepts for beginners. It helps me think clearly and has built a community of 5,000+ readers. Teaching forces me to truly understand a topic."' },
            { q: 'What is the most interesting project you have worked on?', a: 'Choose a project that shows both technical skills and impact: "I built a real-time inventory management system that replaced manual tracking. Used WebSockets for live updates and reduced stock discrepancies by 90%. The CTO presented it at a company all-hands."' }
        ]
    },
    {
        id: 'strengths-weaknesses',
        title: 'Strengths & Weaknesses',
        stage: 'intro',
        icon: '⚖️',
        color: '#a855f7',
        estimatedTime: '1.5 hrs',
        difficulty: 'Foundational',
        description: 'How to be honest about flaws while demonstrating growth and self-awareness.',
        flashcards: [
            { q: 'What is your greatest strength?', a: 'Pick a strength directly relevant to the job. Back it with a concrete example: "My greatest strength is problem-solving. At [Company], I identified a bottleneck in our deployment pipeline and reduced deploy time by 40%."' },
            { q: 'What is your greatest weakness?', a: 'Choose a real weakness (not a disguised strength). Show self-awareness and steps you\'re taking to improve. Example: "I used to struggle with delegation. I\'ve since started using task management tools and trusting my team more, which has improved our output."' },
            { q: 'What makes you unique compared to other candidates?', a: 'Highlight a rare combination of skills, a unique experience, or a specific accomplishment that differentiates you. Example: "I combine deep technical skills with strong communication — I\'ve led workshops that improved team velocity by 25%."' },
            { q: 'What is your biggest professional achievement?', a: 'Use the STAR method (Situation, Task, Action, Result). Choose an achievement with measurable impact. Example: "Led a migration project that reduced server costs by 60% and improved page load times by 3x."' },
            { q: 'What areas do you want to improve?', a: 'Pick a professional skill you\'re actively working on. Show a growth mindset: "I\'m improving my public speaking skills by volunteering to present at team meetings and joining a local Toastmasters chapter."' },
            { q: 'What skills do you bring to this role?', a: 'Map your skills to the job description: "I bring strong [technical skill], proven [soft skill], and experience in [relevant domain]. For example, I used [skill] to [achieve specific result] at my previous company."' },
            { q: 'How do you define success?', a: 'Show balanced thinking: "Success to me is delivering tangible impact while continuously growing. It\'s meeting team goals, earning the trust of colleagues, and looking back knowing I added real value — not just completing tasks."' },
            { q: 'Rate yourself on a scale of 1-10.', a: 'Be honest and confident: "I\'d rate myself an 8. I have strong skills and deliver consistently, but I believe there\'s always room for learning. The remaining 2 represents my hunger to keep growing and acquiring new expertise."' },
            { q: 'What is the most challenging thing you have done?', a: 'Pick something professionally impressive: "Leading a product launch with a 3-person team in just 6 weeks was my biggest challenge. We worked on tight timelines, coordinated with vendors, and launched on schedule with 99% uptime."' },
            { q: 'What are your core values?', a: 'Choose 3-4 values with examples: "Integrity — I always communicate transparently. Growth — I actively seek feedback and learning. Ownership — I don\'t wait to be told; I take responsibility for outcomes."' },
            { q: 'What do people most often criticize about you?', a: 'Be honest but show awareness: "I\'ve been told I sometimes take too much responsibility instead of delegating. I\'ve been actively working on empowering team members by assigning ownership and stepping back to let them grow."' },
            { q: 'How do you handle repetitive or boring tasks?', a: 'Show professionalism: "I automate what I can and find ways to make routine work efficient. For tasks I can\'t automate, I remind myself they\'re part of delivering a bigger goal. I once automated weekly reporting, saving 5 hours per week."' },
            { q: 'What is your learning style?', a: 'Be specific: "I\'m a hands-on learner. I understand concepts best by building something with them. I supplement this with documentation and tutorials, but nothing beats writing actual code and debugging it to truly internalize a concept."' },
            { q: 'Are you a leader or a follower?', a: 'Show flexibility: "It depends on the situation. I lead when I have relevant expertise and can add the most value. I follow when someone else is better suited to lead — ego should never get in the way of the best outcome for the team."' }
        ]
    },

    // ═══════════════ STAGE 2: CONFLICT & FEEDBACK ═══════════════
    {
        id: 'conflict-resolution',
        title: 'Conflict with a Colleague',
        stage: 'conflict',
        icon: '⚔️',
        color: '#ec4899',
        estimatedTime: '2 hrs',
        difficulty: 'Medium',
        description: 'Navigating disagreements professionally without coming across as difficult to work with.',
        flashcards: [
            { q: 'Tell me about a time you had a conflict with a coworker.', a: 'Use STAR: Describe the situation briefly, explain the disagreement objectively, share how you listened first, found common ground, and resolved it. Emphasize the positive outcome and what you learned about collaboration.' },
            { q: 'How do you handle disagreements with your manager?', a: 'Show respect while being assertive: "I present my perspective with data and listen to their reasoning. If we disagree, I support the final decision while noting my concerns. I once suggested an alternative approach to my manager that saved us 2 weeks of work."' },
            { q: 'Describe a time you received negative feedback. How did you handle it?', a: 'Show you\'re coachable: "My manager once told me my documentation was insufficient. Instead of being defensive, I asked for examples, created a template, and got positive feedback within a month. I now see feedback as a growth tool."' },
            { q: 'How do you handle criticism?', a: 'Demonstrate emotional maturity: "I separate the feedback from my ego. I listen carefully, ask clarifying questions, and focus on what I can improve. Constructive criticism has been the biggest driver of my professional growth."' },
            { q: 'Tell me about a time you had to give someone difficult feedback.', a: 'Show tact and empathy: "I had to tell a teammate their code quality was affecting the team. I scheduled a private meeting, used specific examples (not personal attacks), and offered to pair-program. Their code quality improved significantly within weeks."' },
            { q: 'How do you deal with a difficult team member?', a: 'Focus on understanding first: "I try to understand the root cause — often it\'s workload, unclear expectations, or personal issues. I address behavior, not personality. I once helped a struggling team member by clarifying their role, which transformed their performance."' },
            { q: 'Tell me about a time you had to persuade someone to see your point of view.', a: 'Show influence without authority: "A teammate opposed adopting TypeScript. Instead of arguing, I built a small prototype showing how TypeScript caught bugs earlier. After seeing the results, the team voted unanimously to adopt it."' },
            { q: 'How do you handle a situation where you don\'t get along with your boss?', a: 'Show emotional intelligence: "I focus on the work, not personality differences. I clarify expectations, adapt to their communication style, and find common ground through professional respect. I once improved a strained relationship by proactively seeking weekly 1:1s."' },
            { q: 'Describe a time you had to apologize.', a: 'Show humility: "I once accidentally shared incomplete data in a client meeting. I immediately acknowledged the mistake, sent a corrected report within hours, and implemented a review checklist. The client appreciated the honesty and our relationship grew stronger."' },
            { q: 'How do you give feedback to peers who outrank you?', a: 'Show tact: "I frame feedback as observations and questions rather than direct criticism. I say \"I noticed X, would it make sense to try Y?\" This approach is respectful and opens dialogue rather than creating defensiveness."' },
            { q: 'How do you handle a situation where you are right but your team disagrees?', a: 'Show collaborative spirit: "I present my case with evidence. If the team still disagrees, I respect the decision and commit fully. I once documented my concerns, we went with the team\'s choice, and I supported it 100%."' },
            { q: 'Tell me about a time you had to work with someone you did not like.', a: 'Show professionalism: "I focus on the work, not personal feelings. I had a colleague with a very different communication style. I adapted by being more direct in emails and keeping conversations focused on tasks. We delivered successfully."' },
            { q: 'How do you handle unfair treatment at work?', a: 'Show maturity: "I address it directly with the person involved first, assuming good intent. If it persists, I escalate through proper channels with documented examples. I believe in giving people a chance to self-correct before involving management."' }
        ]
    },
    {
        id: 'failure',
        title: 'A Time You Failed',
        stage: 'conflict',
        icon: '🌧️',
        color: '#f43f5e',
        estimatedTime: '2 hrs',
        difficulty: 'Hard',
        description: 'Turning a professional failure into a powerful story of resilience and learning.',
        flashcards: [
            { q: 'Tell me about a time you failed.', a: 'Choose a real failure (not trivial). Use STAR: Describe what happened, take ownership (no excuses), explain what you learned, and how you applied the lesson. Example: "I underestimated a project timeline. I learned to add buffer and now break tasks into smaller sprints."' },
            { q: 'Describe a mistake you made and how you handled it.', a: 'Show accountability: "I once deployed code without thorough testing that caused a brief outage. I immediately rolled back, did a root cause analysis, and implemented a mandatory code review + staging test policy. Zero similar incidents since."' },
            { q: 'What would you do differently if you could start your career over?', a: 'Show growth mindset: "I would seek mentorship earlier and invest more in soft skills from the start. Technical skills got me the job, but communication and leadership opened doors for growth."' },
            { q: 'How do you handle pressure and stressful situations?', a: 'Demonstrate composure: "I prioritize tasks, break problems into manageable chunks, and communicate proactively with stakeholders about timelines. During a critical production issue, I stayed calm, coordinated the team, and we resolved it within 2 hours."' },
            { q: 'Tell me about a time you missed a deadline.', a: 'Be honest and show learning: "I missed a deadline due to scope creep I didn\'t push back on. I learned to define clear requirements upfront, communicate blockers early, and negotiate scope when needed. I haven\'t missed a deadline since."' },
            { q: 'What is the biggest risk you have taken?', a: 'Show calculated courage: "I proposed migrating our legacy system to cloud despite resistance. I presented a risk-benefit analysis, secured buy-in, and led the migration. It reduced infrastructure costs by 45% and improved reliability significantly."' },
            { q: 'Tell me about a time you worked with incomplete information.', a: 'Show decision-making: "During a product launch, we had limited user data. I made assumptions based on market research, implemented an MVP, and used A/B testing to validate. 70% of my assumptions were correct, and we iterated quickly on the rest."' },
            { q: 'How do you bounce back from setbacks?', a: 'Show resilience: "I allow myself to feel the disappointment briefly, then shift to analytical mode — what went wrong, what I can control, and what\'s the next step. After a failed project, I documented lessons learned and applied them to the next project, which succeeded."' },
            { q: 'Describe a time you had to make an unpopular decision.', a: 'Show conviction: "I advocated for removing a popular but buggy feature to improve overall stability. Despite pushback, I showed data on crash rates and customer complaints. After the removal, our app store rating went from 3.2 to 4.5 stars."' },
            { q: 'What is the hardest decision you have ever made at work?', a: 'Show thoughtful decision-making: "Deciding to recommend a complete rewrite of a critical module. It meant admitting our earlier design was flawed, but the technical debt was crippling velocity. I presented data on bug rates, and the team agreed. The rewrite improved our deployment speed by 5x."' },
            { q: 'Tell me about a time you worked under tight deadlines.', a: 'Show composure and planning: "We had 3 days to ship a critical feature for a client demo. I broke it into tasks, pair-programmed with a colleague on the hardest parts, cut non-essential scope, and we delivered a working MVP on time. The client signed a $200K contract."' },
            { q: 'How do you handle ambiguity?', a: 'Show comfort with uncertainty: "I start by clarifying what I DO know, identify assumptions, and validate them quickly with stakeholders or small experiments. I\'m comfortable making decisions with 70% information and iterating based on feedback rather than waiting for perfect clarity."' },
            { q: 'Describe a time when you had to deal with a project that was going off-track.', a: 'Show problem-solving: "I noticed our sprint velocity dropping. I called a team retrospective, identified that unclear requirements were causing rework. We implemented a \'Definition of Ready\' checklist for user stories, and velocity improved by 40% in the next sprint."' }
        ]
    },

    // ═══════════════ STAGE 3: LEADERSHIP & INITIATIVE ═══════════════
    {
        id: 'leadership-initiative',
        title: 'Taking Initiative',
        stage: 'leadership',
        icon: '🚀',
        color: '#eab308',
        estimatedTime: '1.5 hrs',
        difficulty: 'Medium',
        description: 'Showcasing ownership, even if you are not in a formal management role.',
        flashcards: [
            { q: 'Tell me about a time you took initiative.', a: 'Show proactiveness: "I noticed our onboarding process was slow and inconsistent. Without being asked, I created a comprehensive onboarding guide and automated setup scripts. New hire ramp-up time decreased from 2 weeks to 3 days."' },
            { q: 'Describe a time you went above and beyond.', a: 'Show dedication without sounding like a workaholic: "A client had an urgent issue on a Friday evening. I stayed to investigate, found the root cause, deployed a fix, and documented everything. The client renewed their contract specifically citing our support."' },
            { q: 'How do you prioritize your work when everything is urgent?', a: 'Show structured thinking: "I use the Eisenhower Matrix — categorize tasks by urgency and importance. I communicate with stakeholders to align on true priorities, delegate when possible, and tackle high-impact items first."' },
            { q: 'Describe a time you led a project.', a: 'Use STAR format: "I led a 4-person team to migrate our monolith to microservices. I created the roadmap, assigned tasks based on strengths, ran daily standups, and handled stakeholder communication. We delivered 2 weeks early with zero downtime."' },
            { q: 'Tell me about a time you had to learn something quickly.', a: 'Show adaptability: "I was assigned to a project using Python when I only knew JavaScript. I spent a weekend with tutorials and documentation, started contributing within 3 days, and was reviewing others\' PRs within 2 weeks."' },
            { q: 'How do you handle multiple projects simultaneously?', a: 'Demonstrate organization: "I use a combination of time-blocking, project management tools (Jira/Notion), and weekly planning sessions. I set clear milestones for each project and communicate progress to all stakeholders regularly."' },
            { q: 'Tell me about a time you mentored someone.', a: 'Show leadership: "I mentored a fresher for 6 months. We set weekly goals, I reviewed their code daily, and gradually increased complexity. They went from needing constant guidance to independently handling a critical module. They\'re now mentoring others."' },
            { q: 'How do you motivate a team during tough times?', a: 'Show empathy and action: "During a crunch period, I acknowledged the stress openly, helped reprioritize tasks, organized short breaks, and celebrated small wins daily. I also ensured equitable workload distribution. The team delivered without burnout."' },
            { q: 'Describe a situation where you had to make a decision without your manager.', a: 'Show judgment: "A production issue arose when my manager was unavailable. I assessed the severity, consulted with the senior engineer, deployed a hotfix following our runbook, and documented everything. My manager appreciated the initiative when they returned."' },
            { q: 'Tell me about a time you influenced a team without formal authority.', a: 'Show soft skills: "As a mid-level developer, I noticed our code review process was inconsistent. I created a review checklist, presented it at a team meeting with data on bugs caught, and the engineering lead adopted it as the team standard."' },
            { q: 'How do you delegate tasks effectively?', a: 'Show trust and structure: "I match tasks to people\'s strengths and growth areas, provide clear expectations and deadlines, and check in at milestones without micromanaging. I\'m available for questions but let them own the solution."' },
            { q: 'What is your management style?', a: 'Even if not a manager, show leadership awareness: "I believe in servant leadership — removing obstacles, providing context, and trusting people. I set clear expectations and then get out of the way. I\'d rather coach than direct, and I celebrate team wins over individual achievements."' },
            { q: 'How do you handle a situation where your idea is rejected?', a: 'Show maturity: "I ask for the reasoning behind the rejection to understand what I might have missed. If the feedback is valid, I learn from it. If I still believe strongly, I refine my proposal with better data and try again at a more appropriate time."' },
            { q: 'Tell me about a time you demonstrated creativity at work.', a: 'Show innovation: "Our manual data reconciliation took 8 hours weekly. I built a Python script that automated 90% of the process in 15 minutes. Management now uses it across 3 departments. Creative solutions don\'t always need to be groundbreaking — sometimes they\'re about seeing inefficiency differently."' }
        ]
    },

    // ═══════════════ STAGE 4: LOGISTICS & NEGOTIATION ═══════════════
    {
        id: 'salary-negotiation',
        title: 'Salary Negotiation',
        stage: 'logistics',
        icon: '💰',
        color: '#14b8a6',
        estimatedTime: '1.5 hrs',
        difficulty: 'Hard',
        description: 'The psychology of anchoring, counter-offering, and advocating for your worth.',
        flashcards: [
            { q: 'What are your salary expectations?', a: 'Research market rates first (Glassdoor, Levels.fyi). Give a range: "Based on my experience and market research, I\'m looking at [X–Y range]. I\'m flexible and more interested in the overall compensation package and growth opportunities."' },
            { q: 'Why are you leaving your current job?', a: 'Stay positive — never badmouth: "I\'m grateful for what I\'ve learned, but I\'m seeking new challenges and growth opportunities that align with my career goals. This role excites me because [specific reason]."' },
            { q: 'Why should we hire you?', a: 'Connect your skills to their needs: "I bring [specific skill] that directly addresses [their challenge]. My track record of [achievement] shows I can deliver results. I\'m also genuinely passionate about [company/product/mission]."' },
            { q: 'What is your expected notice period?', a: 'Be honest about your current notice period. If it\'s long, show flexibility: "My current notice period is [X weeks/months]. I\'m willing to discuss arrangements and can start transitioning knowledge immediately to ensure a smooth handover."' },
            { q: 'Do you have any other offers?', a: 'Be strategic: "I\'m in discussions with a few companies, but this role is my top choice because [specific reason]. I\'m looking to make a decision within [timeframe]." This creates urgency without being dishonest.' },
            { q: 'Are you willing to relocate?', a: 'Be honest about your preferences. If flexible: "I\'m open to relocation for the right opportunity. I\'d appreciate knowing about relocation support." If not: "I prefer [location] but am very interested in remote/hybrid arrangements."' },
            { q: 'What is more important to you: salary or the work itself?', a: 'Show balance: "Both matter. I want to be fairly compensated, but I\'ve found that challenging work, growth opportunities, and a good team culture contribute more to my long-term satisfaction and performance than salary alone."' },
            { q: 'If you got two offers, how would you decide?', a: 'Show decision-making framework: "I\'d compare on multiple dimensions: growth opportunities, team culture, technical challenges, company mission alignment, work-life balance, and total compensation. I prioritize where I can make the most impact and grow the most."' },
            { q: 'What benefits are most important to you beyond salary?', a: 'Be specific: "Learning budget, flexible work arrangements, health coverage, and career growth paths matter most to me. I value companies that invest in their employees\' development as much as their output."' },
            { q: 'Can you work overtime or on weekends if required?', a: 'Be honest and reasonable: "I\'m committed to getting the work done and can be flexible during critical periods — launches, deadlines, or production issues. However, I believe sustainable pace leads to better output long-term."' },
            { q: 'How soon can you join if selected?', a: 'Be clear: "I\'ll need to serve my [X-week/month] notice period at my current company. During that time, I\'m happy to start any onboarding preparation, documentation review, or team introductions to hit the ground running."' },
            { q: 'What is your biggest concern about this role?', a: 'Turn it into a positive: "My only concern would be the learning curve with your specific domain/tech stack, but I\'ve consistently proven I can ramp up quickly. I\'m more excited about the challenge than worried about it."' },
            { q: 'How do you handle work-life balance?', a: 'Show responsibility: "I\'m disciplined about setting boundaries while being flexible during critical periods. I plan my week in advance, block time for deep work, and make sure I recharge on weekends. Burnout helps nobody — sustainable performance is better than short bursts."' },
            { q: 'Why is there a gap in your employment?', a: 'Be honest and positive: "I took time to [upskill with courses/handle personal matters/travel]. During this period, I completed [certification/project], which made me a stronger candidate. The gap was intentional and I used it productively."' }
        ]
    },

    // ═══════════════ STAGE 5: WORK CULTURE & TEAM ═══════════════
    {
        id: 'teamwork-collaboration',
        title: 'Teamwork & Collaboration',
        stage: 'culture',
        icon: '🤝',
        color: '#3b82f6',
        estimatedTime: '2 hrs',
        difficulty: 'Medium',
        description: 'Demonstrating how you work with teams, contribute to culture, and handle cross-functional collaboration.',
        flashcards: [
            { q: 'Describe your ideal work environment.', a: 'Align with the company culture: "I thrive in collaborative environments with open communication, where ideas are valued regardless of seniority, and there\'s a balance between autonomy and teamwork. I also appreciate clear goals and regular feedback."' },
            { q: 'How do you handle working with someone whose work style is different from yours?', a: 'Show flexibility: "I appreciate diverse perspectives. I once worked with a detail-oriented colleague while I\'m more big-picture. We leveraged our differences — I handled architecture while they ensured quality. Together we delivered a robust solution."' },
            { q: 'Tell me about a time you helped a struggling team member.', a: 'Show empathy: "A junior developer was struggling with debugging. Instead of just fixing it for them, I walked through my debugging process, taught them how to use tools, and set up weekly mentoring sessions. They became one of our most independent developers."' },
            { q: 'How do you contribute to a positive team culture?', a: 'Give concrete examples: "I organize knowledge-sharing sessions, celebrate team wins in standups, provide constructive code reviews, and actively include quieter team members in discussions. I believe culture is built through daily small actions."' },
            { q: 'What type of manager brings out the best in you?', a: 'Be honest and professional: "I work best with managers who set clear expectations, provide regular feedback, and trust me with autonomy. I appreciate managers who are accessible for guidance but don\'t micromanage. A good manager coaches rather than directs."' },
            { q: 'How do you handle remote/hybrid work challenges?', a: 'Show discipline: "I maintain a dedicated workspace, set clear work hours, and over-communicate via Slack/Teams. I schedule regular video check-ins, use async documentation for decisions, and make intentional effort to build relationships with remote colleagues."' },
            { q: 'Tell me about a successful team project you were part of.', a: 'Highlight your contribution: "Our team built a new analytics dashboard in 4 sprints. I led the frontend development, coordinated with the data team on APIs, and drove the demo session. We increased data-driven decisions by 40% across the company."' },
            { q: 'How do you handle a situation where two team members disagree?', a: 'Show mediation skills: "I listen to both sides without taking sides, identify the core issue (often it\'s a different understanding of requirements), and facilitate a discussion focused on facts and goals rather than opinions. I help the team reach consensus."' },
            { q: 'How do you communicate technical concepts to non-technical stakeholders?', a: 'Show translation ability: "I use analogies, visual diagrams, and focus on business impact rather than technical details. Instead of saying \"We need to refactor the API layer,\" I say \"This change will reduce load time by 50%, meaning fewer customers dropping off.\""' },
            { q: 'What role do you usually play in a team?', a: 'Be self-aware: "I naturally gravitate towards being a connector — I identify blockers, facilitate communication between team members, and ensure everyone\'s aligned. Depending on the project, I can also be the driver who pushes execution forward."' },
            { q: 'How do you build relationships with new colleagues?', a: 'Show initiative: "I schedule 1:1 coffee chats in my first week, ask about their work and challenges, and actively look for ways to help. I\'ve found that genuine curiosity about people\'s work builds stronger professional relationships than any team-building event."' },
            { q: 'How do you handle being the least experienced person on a team?', a: 'Show humility and growth: "I see it as the best learning opportunity. I listen more than I speak initially, ask thoughtful questions, and volunteer for tasks that stretch me. Within 2-3 months, I\'m usually contributing insights the senior members hadn\'t considered."' },
            { q: 'What do you do when you disagree with a team decision?', a: 'Show commitment: "I disagree and commit. I voice my concerns with reasoning, but once the team decides, I fully support the decision and work to make it successful. Undermining decisions after they\'re made is worse than the wrong decision itself."' },
            { q: 'How do you handle working with cross-functional teams?', a: 'Show collaboration: "I invest time understanding each team\'s priorities and constraints. I use shared documents for alignment, schedule regular syncs, and always tie my requests to shared business outcomes rather than just technical needs."' },
            { q: 'Describe your communication style.', a: 'Be specific: "Direct but empathetic. I prefer clarity over diplomacy that creates confusion. Written communication: I use bullet points and action items. Verbal: I lead with context, state the ask clearly, and confirm understanding. I adapt to my audience — technical depth for engineers, business impact for stakeholders."' }
        ]
    },

    // ═══════════════ STAGE 6: CAREER GOALS & SITUATIONAL ═══════════════
    {
        id: 'career-goals',
        title: 'Career Goals & Situational',
        stage: 'career',
        icon: '🎯',
        color: '#f97316',
        estimatedTime: '2 hrs',
        difficulty: 'Medium',
        description: 'Where do you see yourself, ethical dilemmas, and scenario-based situational questions.',
        flashcards: [
            { q: 'Where do you see yourself in 5 years?', a: 'Show ambition aligned with the role: "In 5 years, I see myself as a senior/lead engineer who has deep domain expertise, mentors junior developers, and contributes to architectural decisions. I want to grow with the company and take on increasing responsibility."' },
            { q: 'What are your long-term career goals?', a: 'Be aspirational yet realistic: "My long-term goal is to become a technical leader who bridges the gap between engineering and business. I want to build impactful products while developing the next generation of engineers."' },
            { q: 'What would you do in the first 90 days of this role?', a: 'Show a structured approach: "First 30 days: Learn the codebase, meet the team, and understand the product. Days 31-60: Start contributing to small tasks and identify quick wins. Days 61-90: Take ownership of a feature, propose improvements, and deliver measurable impact."' },
            { q: 'If you could change one thing about your last job, what would it be?', a: 'Be diplomatic: "I wish there were more opportunities for cross-team collaboration. I believe diverse perspectives lead to better solutions. That\'s one reason I\'m excited about this role — your cross-functional team structure is exactly what I\'m looking for."' },
            { q: 'What would you do if you disagreed with a company policy?', a: 'Show professionalism: "I\'d first understand the reasoning behind the policy by asking questions. If I still disagreed, I\'d prepare a well-researched proposal with data and present it to the appropriate person through proper channels, while respecting the final decision."' },
            { q: 'How do you stay updated with industry trends?', a: 'Show genuine curiosity: "I follow tech blogs (Dev.to, Medium), listen to podcasts, attend meetups and conferences, contribute to open source, and take online courses. I also participate in coding challenges and study groups with peers."' },
            { q: 'What questions do you have for us?', a: 'Always have questions prepared: "What does the team\'s typical sprint cycle look like? What are the biggest technical challenges the team is facing? How does the company support continuous learning and career growth? What does success look like in this role in the first 6 months?"' },
            { q: 'Tell me about a time you had to adapt to a major change at work.', a: 'Show resilience: "When my company suddenly shifted to remote work, I helped establish new communication norms, created async standup formats, and set up virtual team-building activities. Our team productivity actually improved by 15% within a month."' },
            { q: 'What would you do if you were assigned a task you\'ve never done before?', a: 'Show resourcefulness: "I\'d break it down into smaller pieces, research similar implementations, consult with experienced colleagues, and create a rough plan. I\'d start with a prototype, seek feedback early, and iterate. I\'ve learned that starting imperfectly is better than waiting for perfection."' },
            { q: 'How do you handle a situation where you realize you\'re wrong?', a: 'Show maturity: "I admit it openly and early. Denying mistakes wastes everyone\'s time. I say \"I was wrong about X, here\'s what I\'ve learned, and here\'s how I\'d approach it now.\" People respect honesty more than perfection."' },
            { q: 'If your best friend applied here, what would you tell them about the role?', a: 'Show honesty and understanding: "I\'d tell them it\'s a great opportunity to work on [specific challenge] with a [culture description] team. I\'d also prepare them for [realistic challenge like fast pace]. Overall, it\'s a role where someone driven can really shine."' },
            { q: 'What do you value most in a company\'s culture?', a: 'Show alignment: "Transparency, psychological safety, and a learning culture. I want to work where people can respectfully disagree, where failures are treated as learning opportunities, and where continuous improvement is genuinely valued."' },
            { q: 'Describe a time you had to balance quality vs speed.', a: 'Show pragmatism: "During a product launch, we had to balance feature completeness with deadline. I advocated for an 80/20 approach — ship core features with high quality, and iterate on nice-to-haves post-launch. We launched on time with great user reception."' },
            { q: 'What would make you quit a job?', a: 'Show thoughtfulness: "Consistently toxic culture, ethical concerns, or a complete lack of growth opportunities. I believe in communicating issues before quitting — most problems can be solved if leadership is receptive. But life is too short to stay in a place that doesn\'t value its people."' },
            { q: 'Tell me about a time you improved a process at work.', a: 'Show continuous improvement: "I noticed our test suite took 45 minutes to run, slowing everyone down. I parallelized the tests, removed redundant ones, and added caching. Reduced it to 8 minutes. The team saved ~3 hours/day collectively."' },
            { q: 'What would you do if you caught a colleague being dishonest?', a: 'Show integrity: "I\'d first verify my understanding to be sure. If confirmed, I\'d speak to them privately first, giving them a chance to correct it. If the issue is serious (affecting clients, finances, or safety), I\'d escalate to management. Integrity is non-negotiable."' },
            { q: 'How do you handle it when your workload becomes overwhelming?', a: 'Show self-management: "I reprioritize using impact and urgency, communicate with stakeholders about realistic timelines, and ask for help when needed. I\'ve learned that saying \"I can do A and B by Friday, but C will need to wait until next week\" is better than silently drowning."' },
            { q: 'Tell me about a time you had to make a decision quickly.', a: 'Show decisiveness: "A critical API went down during peak hours. With limited diagnostic time, I made the call to failover to our backup service, then debugged the primary system offline. We restored full service within 10 minutes. Sometimes speed matters more than perfection."' },
            { q: 'What legacy do you want to leave at every company you work for?', a: 'Show impact: "I want to be remembered as someone who left the codebase better than they found it, helped teammates grow, and built systems that outlasted their tenure. I\'m proud when colleagues reference my documentation or patterns years later."' },
            { q: 'How do you ensure you continue to grow professionally?', a: 'Show commitment to growth: "I set quarterly learning goals, maintain a personal development log, seek feedback proactively, and build side projects to explore new technologies. I also believe in teaching — explaining concepts to others reveals gaps in my own understanding."' }
        ]
    }
];

export const getHRTopicIds = () => HR_TOPICS.map(t => t.id);
export const getHRTopicsByStage = (stageId) => HR_TOPICS.filter(t => t.stage === stageId);

