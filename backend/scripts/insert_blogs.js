import { supabaseAdmin } from '../db/supabaseClient.js';

const insertBlogs = async () => {
    try {
        console.log('Fetching an admin user...');
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .limit(1);
        
        if (profileError) throw profileError;
        if (!profiles || profiles.length === 0) {
            console.log('No profiles found! Cannot insert blogs without an author_id.');
            process.exit(1);
        }
        
        const authorId = profiles[0].id;
        console.log(`Using author_id: ${authorId}`);

        const blog1Html = `
            <h1>Mastering the Sliding Window Pattern: A Comprehensive Guide</h1>
            <p>The Sliding Window pattern is one of the most powerful and frequently asked algorithmic techniques in Data Structures and Algorithms (DSA) interviews. If you've ever faced a problem asking for a "contiguous subarray," "substring," or "maximum/minimum sum of a window," chances are high that you need this pattern.</p>
            <h2>What is the Sliding Window Pattern?</h2>
            <p>Imagine looking out of a small window in a moving train. You can only see a specific portion of the landscape at any given time. As the train moves forward, the landscape visible through the window changes—the trailing edge disappears, and a new leading edge comes into view.</p>
            <p>In programming, a sliding window is a sublist that runs over an underlying collection. The window "slides" by adjusting its start and end pointers, allowing us to process overlapping data sequentially without redundant computations.</p>
            <h2>Why Use It?</h2>
            <p>The primary advantage of the sliding window technique is performance optimization. It helps reduce nested loops (typically O(N^2) time complexity) into a single loop, bringing the time complexity down to O(N).</p>
            <h2>Types of Sliding Windows</h2>
            <h3>1. Fixed Window Length</h3>
            <p>The size of the window remains constant. <b>Use case:</b> Find the maximum sum of a contiguous subarray of size K.</p>
            <h3>2. Dynamic Window Length</h3>
            <p>The size of the window expands or shrinks based on certain conditions. <b>Use case:</b> Find the smallest contiguous subarray whose sum is greater than or equal to S.</p>
            <h2>Example: Maximum Sum Subarray of Size K</h2>
            <pre><code>
function maxSubArrayOfSizeK(k, arr) {
  let maxSum = 0, windowSum = 0, windowStart = 0;
  for (let windowEnd = 0; windowEnd < arr.length; windowEnd++) {
    windowSum += arr[windowEnd];
    if (windowEnd >= k - 1) {
      maxSum = Math.max(maxSum, windowSum);
      windowSum -= arr[windowStart];
      windowStart += 1;
    }
  }
  return maxSum;
}
            </code></pre>
            <h2>Summary</h2>
            <p>The Sliding Window pattern is an elegant way to reduce time complexity from O(N^2) to O(N) for array and string problems. By recognizing the keywords "contiguous," "subarray," and "substring," you can quickly identify when to apply this technique in your next coding interview.</p>
        `;

        const blog2Html = `
            <h1>System Design: Architecting a Scalable Notification System</h1>
            <p>Notifications are the heartbeat of modern applications. Whether it's an email confirming your e-commerce order, an SMS alert from your bank, or a push notification from your favorite social media app, users expect timely and reliable updates.</p>
            <h2>1. High-Level Architecture</h2>
            <p>At a high level, a notification system consists of three main phases: Trigger, Processing, and Delivery.</p>
            <h2>2. Core Components</h2>
            <p>To achieve high availability and scalability, the architecture needs to be decoupled using message queues.</p>
            <ul>
                <li><b>The Notification Service:</b> The entry point for other microservices.</li>
                <li><b>Message Queues (e.g., Kafka, RabbitMQ):</b> Decouples the sender from the processor, providing buffering and reliability.</li>
                <li><b>Workers (Consumers):</b> Fleet of worker nodes that read from queues, fetch user preferences, handle rate limiting, and template the messages.</li>
                <li><b>Third-Party Integrations:</b> SendGrid (Email), Twilio (SMS), FCM/APNs (Push).</li>
            </ul>
            <h2>3. Handling Failures and Retries</h2>
            <p>If a delivery attempt fails, the worker moves the message to a "Retry Queue" with an exponential backoff strategy. If all retries fail, it goes to a Dead Letter Queue for manual inspection.</p>
            <h2>4. De-duplication</h2>
            <p>Every incoming request should include an <code>idempotency_key</code> to ensure the system doesn't send duplicate alerts for the same event.</p>
        `;

        const blog3Html = `
            <h1>The Future of AI in Software Engineering</h1>
            <p>Artificial Intelligence is no longer just a buzzword restricted to data science departments; it has fundamentally embedded itself into the daily workflows of software engineers. With the rapid evolution of Large Language Models (LLMs) and generative AI, the way we design, write, and test code is undergoing a massive transformation.</p>
            <h2>1. AI-Assisted Coding and Copilots</h2>
            <p>Tools like GitHub Copilot, Cursor, and ChatGPT act as pair programmers, helping developers write boilerplate code, auto-complete functions, and even scaffold entire projects. The AI writes the first draft, and the engineer reviews, optimizes, and integrates it.</p>
            <h2>2. Automated Testing and QA</h2>
            <p>Writing unit tests and integration tests is notoriously time-consuming. AI models are now capable of analyzing a codebase and automatically generating comprehensive test suites and catching edge cases.</p>
            <h2>3. Intelligent Code Reviews</h2>
            <p>AI-powered code review tools can automatically analyze pull requests for security vulnerabilities, styling guideline violations, and performance bottlenecks, saving senior engineers valuable time.</p>
            <h2>Will AI Replace Software Engineers?</h2>
            <p><b>No.</b> AI is exceptionally good at solving localized, well-defined problems. However, software engineering is largely about ambiguity. It involves understanding complex business requirements, architecting scalable systems, navigating organizational constraints, and making trade-offs between performance, cost, and time-to-market. The role will evolve—engineers will spend less time writing syntax and more time designing systems, orchestrating AI agents, and solving high-level business problems.</p>
        `;

        const blogsToInsert = [
            {
                title: "Mastering the Sliding Window Pattern",
                category: "DSA",
                slug: "mastering-sliding-window-" + Date.now(),
                content: JSON.stringify(blog1Html),
                author_id: authorId,
                is_published: true,
                read_time: 5,
                cover_image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop"
            },
            {
                title: "Architecting a Scalable Notification System",
                category: "System Design",
                slug: "architecting-scalable-notifications-" + Date.now(),
                content: JSON.stringify(blog2Html),
                author_id: authorId,
                is_published: true,
                read_time: 8,
                cover_image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop"
            },
            {
                title: "The Future of AI in Software Engineering",
                category: "AI/ML",
                slug: "future-of-ai-engineering-" + Date.now(),
                content: JSON.stringify(blog3Html),
                author_id: authorId,
                is_published: true,
                read_time: 6,
                cover_image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965&auto=format&fit=crop"
            }
        ];

        console.log('Inserting blogs...');
        const { error } = await supabaseAdmin.from('blogs').insert(blogsToInsert).select();
        
        if (error) {
            console.error('Insert error:', error);
            process.exit(1);
        }

        console.log('Successfully inserted blogs!');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
};

insertBlogs();
