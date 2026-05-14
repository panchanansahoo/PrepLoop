export const HR_THEORY = {
    'tell-me-about-yourself': {
        title: 'The Elevator Pitch',
        theory: `The goal here isn't to recite your resume. It's to tell a cohesive story. Use the **Present-Past-Future** framework:\n\n1. **Present:** Where you are right now and your current impact.\n2. **Past:** The key experiences that got you there.\n3. **Future:** What you are looking for next (and why you are excited about *this* company).`,
        starPrompt: 'Write out your Present, Past, and Future bullet points.',
        simulator: {
            question: 'So, tell me about yourself.',
            options: [
                { text: 'Well, I was born in Ohio, went to state college, graduated in 2018...', isGood: false, feedback: 'Too early/personal. Start professional.' },
                { text: "My resume lists everything, but basically I've been coding for 3 years.", isGood: false, feedback: 'Dismissive to the interviewer.' },
                { text: 'I am currently a backend dev at X focusing on scale. Previously, I worked at Y doing data pipelines, and now I am looking to move into a full-stack role here.', isGood: true, feedback: 'Perfect Present-Past-Future format!' }
            ]
        },
        exampleAnswers: [
            {
                question: 'Walk me through your background.',
                answer: 'I am currently a Software Engineer at TechCorp, where I lead backend development for our core payment gateway, recently reducing transaction latency by 15%. Prior to this, I worked at StartupX building highly interactive React dashboards. I am looking to transition to this Senior Backend role because I want to tackle larger-scale distributed systems challenges, which aligns perfectly with your recent expansion plans.',
                analysis: 'This is a flawless Present-Past-Future model. It includes quantifiable metrics, highlights specific skills, and naturally bridges into why the candidate wants the specific job they are interviewing for.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'How did you get into programming?',
                answer: 'I started coding in high school writing simple Python scripts to automate my math homework. That curiosity led me to major in Computer Science. During my early career, I drifted towards frontend work because I love immediate visual feedback, which culminated in leading the UI redesign at my last company. Now, I am looking to bring that user-centric focus to a product-first company like yours.',
                analysis: 'A great narrative arc that connects personal passion (math homework) to professional success (leading a UI redesign), finishing strong with alignment to the target company.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Tell me about your most recent role.',
                answer: 'For the past two years at Initech, I have been focused on stabilizing our legacy architecture. My biggest win was migrating our monolithic PHP app to a microservices ecosystem in Node.js, which dropped our server costs by 30%. I enjoyed the challenge, but the migration is now largely complete and in maintenance mode. I am interviewing here because I want to return to building greenfield product features in a fast-paced environment.',
                analysis: 'Effectively frames a "boring" maintenance job as a massive technical and financial win, and provides a highly positive, non-toxic reason for wanting to leave their current employer.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'conflict-resolution': {
        title: 'Handling Disagreement',
        theory: `Interviewers want to see that you are collaborative, not spiteful or a pushover. Good conflict resolution involves:\n\n- Empathy: Understanding the other side.\n- Communication: Taking it offline/sync to figure things out.\n- Compromise/Data: Resolving the issue using metrics or team alignment, not egos.`,
        starPrompt: 'Think of a time you disagreed on a technical choice or product feature.',
        simulator: {
            question: 'Tell me about a time you strongly disagreed with a coworker.',
            options: [
                { text: 'I just escalated it to my manager immediately to handle it.', isGood: false, feedback: 'Shows lack of autonomy and conflict avoidance.' },
                { text: "I knew I was right, so I just ignored them and built it my way.", isGood: false, feedback: 'Huge red flag. Poor team player.' },
                { text: 'We disagreed on the DB schema. I set up a 15-min call to understand their concerns, presented benchmark data for my approach, and we found a hybrid solution.', isGood: true, feedback: 'Excellent! Shows empathy, data-driven decisions, and collaboration.' }
            ]
        },
        exampleAnswers: [
            {
                question: 'Tell me about a time you disagreed with an engineering decision made by your team lead.',
                answer: 'My team lead wanted to use a NoSQL database for a new feature, but I noticed our data was highly relational and required strict ACID guarantees. Instead of arguing in the PR, I built a quick prototype over the weekend comparing read/write speeds and data integrity between Postgres and MongoDB for our specific use case. I presented the findings objectively. Seeing the data, the lead agreed Postgres was safer, and we pivoted without bruised egos.',
                analysis: 'Shows technical competence, proactive data gathering, and extreme professionalism. The candidate didn\'t just argue; they brought evidence and resolved it amicably.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Describe a situation where a product manager pushed back on a technical refactor.',
                answer: 'Our PM wanted to ship a feature immediately, but our legacy authentication code was an unmaintainable mess that posed a security risk. I set up a 1-on-1 to understand their pressure—they had a hard deadline from Marketing. I proposed a compromise: we would ship the feature on time using the legacy auth, but we would officially log a "tech debt" ticket to rewrite it the very next sprint, before any new features were started. The PM agreed, and we stuck to the deal.',
                analysis: 'Demonstrates deep empathy for the business side (Marketing deadlines) while still successfully negotiating a hard boundary to protect engineering quality.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Tell me about a time you had a conflict with a peer who wasn\'t pulling their weight.',
                answer: 'I was pair-programming with a developer who frequently missed deadlines, which put our sprint at risk. Instead of complaining to our manager, I pulled them aside for a private chat. I approached it from a place of concern, asking if everything was okay. They admitted they were struggling to understand the new React architecture we had just adopted. I spent the next 3 days heavily mentoring them on the new patterns. Their velocity doubled by the next sprint.',
                analysis: 'Incredible emotional intelligence. Instead of assuming malice or laziness, the candidate assumed a roadblock, investigated, and solved the root problem via mentorship.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'failure': {
        title: 'Owning Your Mistakes',
        theory: `Everyone fails. The worst thing you can do is say "I've never really failed" or blame someone else. The anatomy of a good failure story:\n\n1. **The Mistake:** Own it completely. Be specific.\n2. **The Damage Control:** How did you step up to fix it in the moment?\n3. **The Lesson:** What systemic change did you implement so it never happens again?`,
        starPrompt: 'Think of a production incident, a missed deadline, or a miscommunicated requirement.',
        simulator: {
            question: 'Tell me about a time you failed.',
            options: [
                { text: 'I work too hard and sometimes burn out.', isGood: false, feedback: 'This is a humblebrag, not a real failure.' },
                { text: 'My team lead gave me bad requirements so the feature failed.', isGood: false, feedback: 'Blaming others is an immediate rejection.' },
                { text: 'I pushed code that took down production for 20 mins. I immediately reverted it, communicated to stakeholders, and later added a CI check to catch that error.', isGood: true, feedback: 'Great ownership, immediate remediation, and a systemic fix.' }
            ]
        },
        exampleAnswers: [
            {
                question: 'Describe a project that did not go according to plan.',
                answer: 'Early in my career, I deployed a database migration script without fully testing it against a production-sized dataset. It locked the users table, causing a 10-minute outage. I immediately alerted the team, killed the process, and rolled back the deployment. In the post-mortem, I owned the mistake and proposed we implement a staging environment that mirrors production data volume. We built it the next month, and deployment-related downtime dropped to zero.',
                analysis: 'Takes 100% accountability (no blaming), explains the immediate damage control, and most importantly, highlights the systemic improvement they drove to prevent it forever.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Tell me about a time you missed a deadline.',
                answer: 'I was responsible for integrating a third-party payment API. I underestimated the complexity of their legacy documentation and realized a week before the deadline that I wouldn\'t make it. I immediately flagged this to my Product Manager. Because I gave them a week\'s notice instead of waiting until the deadline day, they were able to inform marketing to delay the launch email, and I worked with another senior dev to pair-program and finish the integration just 3 days late.',
                analysis: 'Failing to meet an estimate is normal; hiding it is fireable. This answer highlights the crucial skill of proactive communication and failing gracefully.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'What is your biggest professional regret?',
                answer: 'When I was promoted to Tech Lead, I initially kept trying to write as much code as I used to. I ended up burning out and becoming a bottleneck for PR reviews. My team\'s velocity actually dropped. I realized my job was no longer just shipping code, but unblocking others. I shifted my focus to code reviews, architecture planning, and mentoring. My personal commit count dropped, but my team\'s overall output skyrocketed.',
                analysis: 'A highly introspective answer that avoids cliché "humblebrags". It shows mature self-reflection and a clear understanding of the transition from Junior to Senior/Lead.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'teamwork-collaboration': {
        title: 'Mastering Teamwork Stories',
        theory: `The best teamwork stories emphasize *your role* in elevating the entire team. Avoid saying "we did X", instead say "I contributed X to help the team achieve Y".\n\nKey themes to hit: Sharing credit, filling gaps when someone falls behind, and overcommunicating during crunches.`,
        starPrompt: 'Think of a time you worked on a cross-functional team or had to step in for a sick coworker.',
        simulator: {
            question: 'Tell me about a time you worked on a difficult team project.',
            options: [
                { text: 'My team was pretty lazy, so I ended up doing all the coding myself to ensure we met the deadline.', isGood: false, feedback: 'Shows a hero complex and terrible team dynamics. Never drag your teammates.' },
                { text: 'We had a tight deadline, so we all worked really hard together and got it done.', isGood: false, feedback: 'Too vague. What specifically did YOU do? What was the interpersonal challenge?' },
                { text: 'Our designer fell ill, risking the deadline. I proposed a descoped MVP to product, took on some css work myself, and we shipped on time without burning out our remaining devs.', isGood: true, feedback: 'Perfect. Shows initiative, compromise, and protecting the team.' }
            ]
        },
        exampleAnswers: [
            {
                question: 'Tell me about a time you stepped into a leadership role without the formal title.',
                answer: 'During a critical launch, our project manager had an unexpected family emergency. The team was uncoordinated, and tickets were piling up. I took the initiative to organize a daily 15-minute sync, triaged the backlog, and acted as the point of contact for stakeholders. We delivered the launch on time, and my team felt much less chaotic. I passed everything clearly back to the PM when they returned.',
                analysis: 'Demonstrates stepping up during a crisis, filling a gap for the team, and doing it without ego.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Tell me about a time you mentored a junior developer.',
                answer: 'We hired a brilliant junior dev who was incredibly fast but wrote very messy, untestable "spaghetti" code. Instead of just rejecting their PRs, I set up a recurring 30-minute pair programming session every Tuesday. Rather than telling them what to do, I asked guiding questions: "How would we write a unit test for this function?" Within two months, they were independently writing modular, test-driven code and actually caught a bug in one of my own PRs.',
                analysis: 'Shows that they view mentorship as an ongoing time investment, not just a one-off code review. Mentions a specific, measurable result.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Describe a time you had to rely on a team to get something done.',
                answer: 'We had to completely overhaul our frontend architecture over a holiday weekend to patch a critical security flaw. No single person knew the entire codebase. I proposed we divide the app into three domains: I took Auth, another dev took the Dashboard, and the third took Payments. We stayed constantly synced in a dedicated Slack channel, reviewing each other\'s PRs in real-time. Because we trusted each other\'s domain expertise and over-communicated, we shipped the patch with zero regressions.',
                analysis: 'Highlights parallelizing work, leveraging domain expertise, and extreme communication during a high-pressure scenario.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'adaptability-change': {
        title: 'Navigating Ambiguity',
        theory: `Tech moves fast. Interviewers want to know you won't panic when requirements change halfway through a sprint. Show that you can pivot gracefully without getting overly attached to your initial code.\n\nDemonstrate: Emotional regulation, quick re-planning, and mitigating sunk cost fallacy.`,
        starPrompt: 'Think of a project where the spec changed dramatically, or an API you relied on was suddenly deprecated.',
        simulator: {
            question: 'Tell me about a time you had to adapt to a major change in project scope.',
            options: [
                { text: 'I complained to management because they were wasting my time.', isGood: false, feedback: 'Resistant to change. Very bad attitude.' },
                { text: 'I just deleted all my code and started over.', isGood: false, feedback: 'Shows adaptability, but lacks strategic thinking or preservation of reusable work.' },
                { text: 'Two weeks in, the client changed the core feature. I ran an impact analysis, salvaged the generic components, and provided revised timelines to PMs before pivoting.', isGood: true, feedback: 'Strategic, communicative, and composed under pressure.' }
            ]
        },
        exampleAnswers: [
            {
                question: 'Describe a time when a requirement changed halfway through development.',
                answer: 'We were building an admin dashboard, and right before QA, the client decided they wanted real-time websocket updates instead of a refresh button. It was frustrating, but I quickly organized a scoping meeting. I explained that a full rewrite would take 3 weeks, but we could implement polling in 3 days as an MVP. The client chose polling, and we delivered a slightly modified version on time.',
                analysis: 'Shows that they don\'t just blindly accept changing requirements, but rather negotiate scope and find pragmatic middle-grounds.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Tell me about a time you had to learn a new technology very quickly.',
                answer: 'Two weeks before shipping a new mobile app, Apple rejected our submission due to a specific native library we were using via React Native. We had no iOS native developers on staff. I volunteered to rewrite that specific bridge in Swift. I spent 48 hours immersing myself in iOS documentation, wrote a clunky but functional Swift module, and got the app approved. It wasn\'t pretty code, but it saved the launch.',
                analysis: 'Demonstrates extreme adaptability, lack of ego regarding "clean code" when a hard deadline hits, and willingness to step completely outside their comfort zone.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'How do you handle context switching?',
                answer: 'I used to struggle with it until I aggressively changed my communication habits. Now, I block out "maker time" on my calendar for 3 hours a day where Slack is closed. If an urgent production issue interrupts me, before I switch contexts, I spend 2 minutes writing a "breadcrumb" comment in my code explaining exactly what I was thinking. When I come back 3 hours later, I can resume my train of thought almost instantly.',
                analysis: 'Provides a highly specific, tactical answer (breadcrumb comments, blocking calendar) rather than a generic "I just try to focus" answer.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'time-management': {
        title: 'Prioritizing like a Pro',
        theory: `Time management isn't just working faster; it's about saying 'No' and prioritizing based on impact. Use the Eisenhower Matrix implicitly in your answers: focus on Urgent + Important.\n\nCrucial: Always communicate delays *before* the deadline hits, not after.`,
        starPrompt: 'Think of a time you were given three top-priority tasks at the same time.',
        simulator: {
            question: 'How do you handle multiple competing high-priority deadlines?',
            options: [
                { text: 'I just work nights and weekends until everything is done.', isGood: false, feedback: 'Red flag for burnout. Not sustainable or strategic.' },
                { text: 'I usually ask my manager to pick what I should do.', isGood: false, feedback: 'Lacks autonomy. You should propose a prioritization first.' },
                { text: 'I assess the business impact of each. I propose a priority list to stakeholders, delegate what I can, and explicitly communicate what items will be delayed.', isGood: true, feedback: 'Excellent. Shows autonomy, business sense, and proactive communication.' }
            ]
        },
        exampleAnswers: [
            {
                question: 'Tell me about a time you had too much on your plate.',
                answer: 'During Q4, I was tasked with an infrastructure migration while simultaneously pushing out a highly requested product feature. I realized both would miss their deadlines if I split my focus equally. I spoke to the Product Manager and Engineering Manager, laid out the timelines, and recommended pausing the infra migration since the product feature was tied to immediate Q4 revenue. They agreed, I successfully shipped the feature, and I picked back up the infra task in Q1.',
                analysis: 'Shows high business acumen, proactive communication, and ability to prioritize based on company goals.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'How do you estimate how long a task will take?',
                answer: 'I break the task down into sub-tasks that take no more than a day each. Then, I apply a multiplier based on the unknowns. If I\'ve done it before, I multiply by 1.2 for testing/PR time. If it involves a new third-party API, I multiply by 2 to account for bad documentation and unexpected integration bugs. Finally, I communicate the estimate not as a single date, but as a confidence range (e.g., "3 to 5 days").',
                analysis: 'An incredibly mature, senior-level answer. Acknowledges that software estimation is difficult and explicitly prices in risk (third party APIs, PR review time).',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Describe a time you realized you were going to be late on a deliverable.',
                answer: 'I was building a complex data export feature. Three days before the deadline, I realized the database query was timing out on production-sized tables. Instead of doing "heroics" and hoping I could fix it by Friday, I immediately messaged the stakeholder on Tuesday. I told them the PDF export wouldn\'t be ready, but I could deliver a CSV export by Friday as a stopgap. They were perfectly fine with the CSV, and I avoided missing the deadline completely.',
                analysis: 'Demonstrates the Golden Rule of Time Management: Communicate bad news early, and always bring a compromised solution.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'questions-for-interviewer': {
        title: 'Flipping the Script',
        theory: `When they ask "Do you have any questions for me?", never say "No". This is your chance to interview *them* and show you are thinking deeply about the role.\n\nGood questions:\n- What is the biggest technical challenge the team is facing right now?\n- How did the team adapt to your recent major release?\n- What does success look like in the first 90 days?`,
        starPrompt: 'Draft 3 specific questions tailored to the company you are interviewing with next.',
        simulator: {
            question: 'Do you have any questions for me?',
            options: [
                { text: 'No, I think you covered everything. Thanks!', isGood: false, feedback: 'Missed opportunity. Shows lack of deep interest.' },
                { text: 'How much paid time off do I get?', isGood: false, feedback: 'Don\'t ask about benefits until the offer stage.' },
                { text: 'Can you tell me about the team\'s engineering culture and how you handle technical debt?', isGood: true, feedback: 'Great question. Shows you care about the working environment and realistic engineering.' }
            ]
        },
        exampleAnswers: [
            {
                question: 'What are good questions to ask the interviewer?',
                answer: '1. "What is the biggest technical challenge your team is facing today?"\n2. "If I were hired, what would success look like in the first 30, 60, and 90 days?"\n3. "How does the team handle balancing new feature development with paying down technical debt?"',
                analysis: 'These questions show that the candidate is already thinking like an employee who wants to make a positive impact. It also gives the candidate crucial data about the company\'s engineering culture.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Questions to ask a high-level Engineering Manager?',
                answer: '"Looking back at the engineers who really excelled at this company, what traits did they share?" or "How do you measure individual developer performance?"',
                analysis: 'These show ambition and a desire to align with the manager\'s expectations immediately.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Questions to avoid asking?',
                answer: 'Do not ask "What does your company do?" (you should have researched this). Do not ask "How many hours do you work?" (makes you sound lazy). Do not ask about salary or PTO in the first interview (wait for the recruiter/offer stage).',
                analysis: 'Knowing what NOT to say is just as important as knowing what to say. Focus on impact, culture, and tech.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'handling-failure-under-pressure': {
        title: 'Thriving in Critical Errors',
        theory: `Everyone makes mistakes. Senior engineers communicate them immediately.\n\nThe framework for critical failure:\n1. **Acknowledge:** Tell stakeholders immediately. Don't hide it.\n2. **Triage:** Implement a temporary fix or rollback.\n3. **Root Cause Analysis (RCA):** Blameless post-mortem. "What failed in our system?", not "Who failed?"\n4. **Systemic Fix:** Automate against it happening again.`,
        starPrompt: 'Think of a time you caused a high-severity bug in production. How did you react in the first 10 minutes?',
        simulator: {
            question: 'Tell me about a time your code broke production. What did you do?',
            options: [
                { text: 'I quietly pushed a hotfix so my manager wouldn\'t notice.', isGood: false, feedback: 'Terrible. Hiding bugs destroys trust.' },
                { text: 'I panicked and asked the senior dev to fix it.', isGood: false, feedback: 'Shows lack of ownership and composure.' },
                { text: 'I immediately alerted the team in Slack, reverted the commit to restore service, and then wrote a post-mortem to add a specific test to our CI/CD pipeline.', isGood: true, feedback: 'Excellent. Prioritization of uptime, open communication, and systemic improvement.' }
            ]
        },
        exampleAnswers: [
            {
                question: 'Tell me about a time you caused a high-severity issue.',
                answer: 'I deployed a frontend update that broke the checkout flow for Internet Explorer users. Within 15 minutes, customer support reported the issue. Instead of trying to debug it live, I immediately hit the rollback button to restore revenue flow. Once stable, I reproduced the bug locally, fixed the polyfill issue, and wrote an E2E test in Cypress specifically for IE11 checkout before redeploying. I presented a brief post-mortem to the team the next morning.',
                analysis: 'Shows prioritization: restore service first, debug second. Then proves that they learn from mistakes by adding automated tests.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'How do you handle an incident when you don\'t know the root cause?',
                answer: 'I follow a strict triage process. First, I establish communication, dropping a note in the incident channel that I am investigating. Second, I look at dashboards—CPU, memory, database latency—to isolate the failing component. If I can\'t find the cause within 15 minutes, I aggressively escalate to a senior or domain expert, providing them with the exact logs I\'ve found. The goal is restoring uptime, not protecting my pride.',
                analysis: 'Senior engineers know when to ask for help. Escalating quickly with context is a highly sought-after skill in on-call rotations.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Describe a post-mortem you led or participated in.',
                answer: 'After a database failure, I wrote the post-mortem document. I made sure to strictly focus on the *system* rather than the *person*. Instead of writing "John ran a bad query", I wrote "The system allowed an unindexed query to lock the table without a timeout." This blameless approach kept the team constructive. We ultimately added a maximum execution time limit to all read queries on the primary DB to prevent a recurrence.',
                analysis: 'Perfectly captures the essence of a "Blameless Post-Mortem"—a critical cultural element of top-tier engineering organizations.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'managing-up': {
        title: 'Leading Your Manager',
        theory: `Managing up means making your manager's life easier and protecting the engineering team from bad ideas.\n\nKey skills:\n- **Pushing Back:** Saying "We can't do X, but we can do Y by the deadline."\n- **Status:** Never letting your manager wonder what you are doing. Async updates are king.\n- **Bringing Solutions:** When presenting a problem to leadership, always present 2 options to solve it.`,
        starPrompt: 'Think of a time your manager asked for an impossible deadline or a feature you knew was technically flawed.',
        simulator: {
            question: 'Your manager asks for a feature that will take 4 weeks, but gives you a 1-week deadline. What do you do?',
            options: [
                { text: 'I say okay and work 80 hours a week to try and get it done.', isGood: false, feedback: 'Leads to burnout and likely failure anyway. Not sustainable.' },
                { text: 'I tell them it\'s impossible and they are being unreasonable.', isGood: false, feedback: 'Combative and unprofessional.' },
                { text: 'I break down the 4-week estimate for them. I ask what the core goal of the feature is, and propose a highly scoped-down MVP we can deliver in 1 week.', isGood: true, feedback: 'Perfect. Data-driven pushback combined with a constructive compromise.' }
            ]
        },
        exampleAnswers: [
            {
                question: 'Tell me about a time you had to push back against leadership.',
                answer: 'Leadership wanted to launch a massive new recommendation engine before Black Friday, giving us only 3 weeks. After scoping it, I realized we couldn\'t build the ML pipeline in time. I scheduled a meeting with the VP of Product, laid out the timeline risks, and proposed a compromise: we would launch a simpler, rules-based engine (e.g., "Trending Now") before Black Friday, and build the true ML engine for Q1. He agreed, and the rules-based engine still drove a 5% increase in conversion.',
                analysis: 'Pushes back using data, presents an alternative solution rather than just saying "no", and still achieves a positive business outcome.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'How do you keep your manager informed without overwhelming them?',
                answer: 'I believe my manager\'s job is to unblock me, not track my every move. So instead of waiting for them to ask, I provide asynchronous, structured updates. Every Friday, I send a short bulleted slack message: 1. What I shipped this week. 2. What I\'m shipping next week. 3. Where I am blocked. If I am blocked on another team, I specifically ask if they can apply top-down leverage.',
                analysis: 'Demonstrates a deep understanding of what a manager actually needs. Shows extreme autonomy and clear communication.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Describe a time a mandate came down that you fundamentally disagreed with.',
                answer: 'CTO issued a mandate that all new microservices must be written in Go, even though my team exclusively knew Python. We were on a tight deadline. I compiled a small document outlining the required ramp-up time for Go versus the business value of shipping the Python service now. I presented it stating: "I support the Go initiative long-term, but for this specific Q3 deadline, Python is the only way we ship on time." They granted us a one-time exception.',
                analysis: 'Shows "Disagree and Commit." They challenged the technical decision using business logic (deadlines), but did so respectfully without being insubordinate.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    },
    'giving-receiving-feedback': {
        title: 'The Art of Feedback',
        theory: `Code reviews and performance cycles require high emotional intelligence.\n\n**Receiving:** Assume good intent. Separate your ego from your code. Say "Thank you, I'll look into it" instead of getting defensive.\n**Giving:** Be specific, actionable, and kind. Focus on the code, not the person. Use the "SBI" model: Situation, Behavior, Impact.`,
        starPrompt: 'Think of a time you received harsh feedback, or had to give difficult feedback to a peer who was underperforming.',
        simulator: {
            question: 'A senior engineer leaves a very blunt, borderline rude comment on your Pull Request saying your architecture is entirely wrong. How do you respond?',
            options: [
                { text: 'I argue back in the comments explaining why they are wrong.', isGood: false, feedback: 'Defensive. Text arguments are counter-productive.' },
                { text: 'I agree and rewrite the whole thing exactly how they want it.', isGood: false, feedback: 'Shows no spine or willingness to discuss engineering tradeoffs.' },
                { text: 'I assume good intent but recognize the disconnect. I DMs them or ask for a quick 5-min call to understand their viewpoint and discuss the tradeoffs together.', isGood: true, feedback: 'De-escalates tension, moves to high-bandwidth communication, and focuses on collaboration.' }
            ]
        },
        exampleAnswers: [
            {
                question: 'Tell me about a time you received critical feedback that you disagreed with.',
                answer: 'My engineering manager told me my code was functional but completely unreadable and undocumented. Initially, I was defensive because it met all acceptance criteria. However, I took a step back, asked a peer to read my code, and realized my manager was right. I scheduled a 1-on-1 with my manager, thanked them for the honest feedback, and asked them to share some codebases they consider standard-setting. Since then, I\'ve made self-documenting code a core habit.',
                analysis: 'Shows high emotional intelligence, lack of ego, and a genuine desire to grow from negative feedback.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'How do you structure code review feedback?',
                answer: 'I follow a strict principle: "Nitpicks should be automated; architecture should be debated." If someone misses a semicolon, the linter should catch it, not me. When I review, I focus on security, performance, and maintainability. When I suggest a change, I never just say "This is wrong." I say, "What do you think about using a Map here instead of an Array? It might save us O(N) lookup time on line 42."',
                analysis: 'Establishes them as a mature reviewer who asks questions rather than making demands, fostering a collaborative rather than adversarial PR culture.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            },
            {
                question: 'Tell me about a time you had to give difficult feedback to a peer.',
                answer: 'A peer was consistently rushing their PRs, leaving glaring bugs for me to catch. Instead of calling them out in the team meeting or going to the boss, I set up a private 1-on-1. I used the Situation-Behavior-Impact model. I said, "In the last 3 PRs (Situation), there were unhandled exceptions (Behavior), which caused QA to reject the ticket and delayed the sprint (Impact)." Framing it around the impact on the *team*, rather than attacking their skill, led to a very productive conversation where we agreed they would write unit tests before opening PRs.',
                analysis: 'A flawless answer. It cites a proven management framework (SBI) and demonstrates the ability to de-escalate peer conflict directly.',
                theory: 'This question tests your understanding of the underlying principles and your ability to articulate them clearly in a high-pressure environment. A strong grasp of this theory demonstrates both foundational knowledge and practical experience.'
            }
        ]
    }
};
