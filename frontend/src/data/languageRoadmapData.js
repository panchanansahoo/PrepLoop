const makeProblems = (prefix, problems) =>
    problems.map((problem) => ({
        status: 'pending',
        difficulty: 'Medium',
        ...problem,
        id: `${prefix}-${problem.id}`,
        link: `/problems/${prefix}-${problem.id}`,
    }));

export const languageRoadmapHierarchy = [
    {
        id: 'foundations',
        label: 'Foundations',
        category: 'Root',
        children: [
            { id: 'syntax-basics', label: 'Syntax & Variables' },
            { id: 'types-variables', label: 'Type Systems & Memory Model' },
            { id: 'control-flow', label: 'Control Flow & Iteration' },
            { id: 'collections-core', label: 'Strings, Arrays, Maps & Sets' },
        ],
    },
    {
        id: 'code-organization',
        label: 'Code Organization',
        category: 'Root',
        children: [
            { id: 'functions-modules', label: 'Functions & Modules' },
            {
                id: 'oop-design',
                label: 'Objects & Abstractions',
                children: [
                    { id: 'classes-interfaces', label: 'Classes, Interfaces, Structs' },
                    { id: 'encapsulation-polymorphism', label: 'Encapsulation & Polymorphism' },
                ],
            },
            { id: 'error-handling', label: 'Errors, Exceptions & Validation' },
        ],
    },
    {
        id: 'runtime-systems',
        label: 'Runtime & Performance',
        category: 'Root',
        children: [
            { id: 'memory-model', label: 'Stack, Heap & Ownership Rules' },
            { id: 'concurrency-core', label: 'Threads, Async & Concurrency' },
            { id: 'io-networking', label: 'File I/O, Serialization & Networking' },
        ],
    },
    {
        id: 'craftsmanship',
        label: 'Craftsmanship',
        category: 'Root',
        children: [
            { id: 'testing-debugging', label: 'Testing & Debugging' },
            { id: 'tooling-build', label: 'Package Managers, Build & Linting' },
            { id: 'language-idioms', label: 'Idioms, Style & Refactoring' },
        ],
    },
    {
        id: 'specialization',
        label: 'Language Specialization',
        category: 'Root',
        children: [
            { id: 'python-core', label: 'Pythonic Patterns' },
            { id: 'java-core', label: 'Java & JVM Design' },
            { id: 'cpp-core', label: 'C++ STL & Resource Safety' },
        ],
    },
];

export const languagePatterns = [
    {
        id: 'syntax-basics',
        name: 'Syntax & Variables',
        category: 'Language Foundations',
        difficulty: 'Easy',
        roadmapPath: '/roadmap/language',
        description: 'Learn how a language expresses values, declarations, scope, operators, and basic program structure.',
        theory: `Start by understanding the smallest unit of executable code: variables, expressions, statements, and scope.

Strong language fundamentals make debugging easier because you know exactly when values change, how they are represented, and which constructs create new scope.

Focus on reading code as much as writing it. Syntax mastery is really about fluency, not memorization.`,
        examples: [
            'Write small CLI programs without looking up basic syntax',
            'Trace how values move through conditionals and loops',
            'Read unfamiliar code and explain what each block does',
        ],
        problems: makeProblems('syntax-basics', [
            { id: 'calculator', title: 'Build a mini calculator', difficulty: 'Easy' },
            { id: 'scope-trace', title: 'Trace variable scope in nested blocks', difficulty: 'Easy' },
            { id: 'menu-loop', title: 'Create a menu-driven console loop', difficulty: 'Easy' },
        ]),
    },
    {
        id: 'types-variables',
        name: 'Type Systems & Variables',
        category: 'Language Foundations',
        difficulty: 'Easy',
        roadmapPath: '/roadmap/language',
        description: 'Understand primitive types, reference types, mutability, nullability, and casting rules.',
        theory: `Every language answers the same questions differently: what is a value, what is a reference, and when is an operation safe?

Typed languages help you model intent. Dynamically typed languages demand stronger runtime discipline.

Once you understand mutability, references, and coercion, many "weird bugs" stop looking weird.`,
        examples: [
            'Choose the right representation for IDs, money, dates, and booleans',
            'Avoid accidental mutation in shared objects',
            'Spot unsafe casts and null-handling issues early',
        ],
        problems: makeProblems('types-variables', [
            { id: 'type-model', title: 'Model a user profile with safe types', difficulty: 'Easy' },
            { id: 'nullable-flow', title: 'Refactor nullable logic into guarded branches', difficulty: 'Easy' },
            { id: 'immutability', title: 'Eliminate accidental shared-state mutation', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'control-flow',
        name: 'Control Flow & Iteration',
        category: 'Language Foundations',
        difficulty: 'Easy',
        roadmapPath: '/roadmap/language',
        description: 'Master branching, looping, early returns, pattern matching, and guard clauses.',
        theory: `Control flow is where readability lives or dies.

Good control flow reduces nesting, makes edge cases explicit, and keeps the happy path obvious. The goal is not to use every construct, but to choose the clearest one for the job.`,
        examples: [
            'Replace deeply nested conditionals with early exits',
            'Use loops and iterators appropriately',
            'Express branching logic clearly with switch or pattern matching constructs',
        ],
        problems: makeProblems('control-flow', [
            { id: 'auth-branching', title: 'Clean up a nested authorization flow', difficulty: 'Easy' },
            { id: 'retry-loop', title: 'Implement bounded retry logic', difficulty: 'Medium' },
            { id: 'pattern-match', title: 'Route events with match or switch logic', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'collections-core',
        name: 'Collections Core',
        category: 'Language Foundations',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/language',
        description: 'Work confidently with strings, arrays, maps, sets, iterators, and collection utilities.',
        theory: `Collections are where most business logic happens.

Once you know the strengths of sequential containers, associative containers, and immutable transformations, you can write code that is both clearer and faster.`,
        examples: [
            'Pick lists versus maps based on access patterns',
            'Transform data without over-mutating it',
            'Use set membership and grouping to simplify logic',
        ],
        problems: makeProblems('collections-core', [
            { id: 'frequency-counter', title: 'Count frequencies from raw input', difficulty: 'Easy' },
            { id: 'group-records', title: 'Group records by status and owner', difficulty: 'Medium' },
            { id: 'dedupe-pipeline', title: 'Build a de-duplication pipeline', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'functions-modules',
        name: 'Functions & Modules',
        category: 'Language Architecture',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/language',
        description: 'Break programs into composable functions, reusable modules, and maintainable package boundaries.',
        theory: `Function design is about boundaries: what a unit needs, what it returns, and what side effects it owns.

Modules should group concepts that change together. If you get this right, features become easier to extend and test.`,
        examples: [
            'Separate pure transformation logic from I/O',
            'Design small modules with clear ownership',
            'Refactor long functions into composable units',
        ],
        problems: makeProblems('functions-modules', [
            { id: 'extract-service', title: 'Refactor a long handler into service functions', difficulty: 'Medium' },
            { id: 'module-boundary', title: 'Split a file into reusable modules', difficulty: 'Medium' },
            { id: 'pure-logic', title: 'Isolate pure domain logic from side effects', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'oop-design',
        name: 'Objects & Abstractions',
        category: 'Language Architecture',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/language',
        description: 'Use classes, interfaces, composition, and polymorphism to model systems without overengineering.',
        theory: `Object-oriented design is useful when it helps encode behavior and invariants.

The core decision is often composition versus inheritance. Prefer the shape that makes change safer and testing easier.`,
        examples: [
            'Model domain entities with clear responsibilities',
            'Use interfaces to decouple higher-level logic',
            'Favor composition for flexible behavior',
        ],
        problems: makeProblems('oop-design', [
            { id: 'payment-strategy', title: 'Implement a payment strategy abstraction', difficulty: 'Medium' },
            { id: 'inventory-model', title: 'Design an inventory domain model', difficulty: 'Medium' },
            { id: 'composition-refactor', title: 'Replace brittle inheritance with composition', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'error-handling',
        name: 'Errors, Exceptions & Validation',
        category: 'Language Architecture',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/language',
        description: 'Handle failures explicitly, validate inputs early, and surface useful errors to callers.',
        theory: `Great error handling makes the system predictable.

That means distinguishing programmer mistakes from runtime failures, preserving context, and failing at the right boundary. Validation should make invalid states hard to represent.`,
        examples: [
            'Map low-level failures to user-facing messages',
            'Validate request data before domain logic runs',
            'Preserve stack traces and structured context',
        ],
        problems: makeProblems('error-handling', [
            { id: 'request-validation', title: 'Add validation to a request pipeline', difficulty: 'Easy' },
            { id: 'error-wrapper', title: 'Wrap infrastructure errors with domain context', difficulty: 'Medium' },
            { id: 'result-flow', title: 'Refactor exception-heavy flow into explicit results', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'memory-model',
        name: 'Memory Model & Resource Lifetime',
        category: 'Runtime Systems',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/language',
        description: 'Learn how stack, heap, allocation, GC, ownership, and resource cleanup affect correctness and performance.',
        theory: `You do not need to be writing C++ to benefit from memory-model knowledge.

Understanding allocation behavior helps with performance, leaks, stale references, and concurrency safety. It also improves your intuition for why some code feels "expensive."`,
        examples: [
            'Track object lifetime across function boundaries',
            'Avoid leaks and dangling resources',
            'Reason about allocation-heavy hotspots',
        ],
        problems: makeProblems('memory-model', [
            { id: 'resource-cleanup', title: 'Guarantee cleanup for file and network handles', difficulty: 'Medium' },
            { id: 'copy-vs-reference', title: 'Debug a copy-versus-reference bug', difficulty: 'Medium' },
            { id: 'allocation-hotspot', title: 'Reduce unnecessary allocations in a hot path', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'concurrency-core',
        name: 'Threads, Async & Concurrency',
        category: 'Runtime Systems',
        difficulty: 'Hard',
        roadmapPath: '/roadmap/language',
        description: 'Coordinate concurrent work safely using threads, async tasks, channels, locks, and cancellation.',
        theory: `Concurrency is about coordination, not speed alone.

You need a model for shared state, task ownership, cancellation, and failure propagation. Good concurrent code is explicit about who owns what and when work can stop.`,
        examples: [
            'Choose between async I/O and background threads',
            'Prevent race conditions around shared state',
            'Build cancellable, timeout-aware workflows',
        ],
        problems: makeProblems('concurrency-core', [
            { id: 'worker-pool', title: 'Implement a bounded worker pool', difficulty: 'Hard' },
            { id: 'async-timeout', title: 'Build async fetch with timeout and cancellation', difficulty: 'Hard' },
            { id: 'safe-cache', title: 'Protect a shared in-memory cache from races', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'testing-debugging',
        name: 'Testing & Debugging',
        category: 'Engineering Craftsmanship',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/language',
        description: 'Write unit tests, integration tests, and debugging workflows that make change safe.',
        theory: `Testing is feedback architecture.

The best tests explain behavior, isolate the right boundary, and stay cheap to maintain. Debugging skill comes from narrowing the search space quickly and forming strong hypotheses.`,
        examples: [
            'Write tests around behavior rather than implementation details',
            'Use logs, breakpoints, and assertions to isolate faults',
            'Build confidence before refactoring',
        ],
        problems: makeProblems('testing-debugging', [
            { id: 'unit-suite', title: 'Add unit tests for parsing logic', difficulty: 'Easy' },
            { id: 'integration-flow', title: 'Test a service with database and HTTP boundaries', difficulty: 'Medium' },
            { id: 'bug-hunt', title: 'Diagnose a flaky async test', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'tooling-build',
        name: 'Tooling, Build & Packaging',
        category: 'Engineering Craftsmanship',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/language',
        description: 'Use formatters, linters, build tools, package managers, and runtime environments effectively.',
        theory: `Language mastery includes its tooling ecosystem.

Teams move faster when formatting, linting, packaging, and build steps are predictable. Good tooling choices reduce cognitive load and keep local and CI behavior aligned.`,
        examples: [
            'Set up reproducible local environments',
            'Automate lint, format, and test checks',
            'Publish packages or binaries consistently',
        ],
        problems: makeProblems('tooling-build', [
            { id: 'project-setup', title: 'Bootstrap a project with lint and format rules', difficulty: 'Easy' },
            { id: 'ci-checks', title: 'Add build and test checks to CI', difficulty: 'Medium' },
            { id: 'package-release', title: 'Prepare a reusable package for release', difficulty: 'Medium' },
        ]),
    },
    {
        id: 'python-core',
        name: 'Pythonic Patterns',
        category: 'Specialized Tracks',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/language',
        description: 'Learn iterators, context managers, comprehensions, typing, and packaging in modern Python.',
        theory: `Python rewards readability, batteries-included thinking, and strong use of the standard library.

The jump from beginner to professional Python comes from writing explicit, typed, maintainable code instead of clever one-offs.`,
        examples: [
            'Use context managers for resource safety',
            'Model data with dataclasses and type hints',
            'Favor iterables and generators for streaming workflows',
        ],
        problems: makeProblems('python-core', [
            { id: 'context-manager', title: 'Write a custom context manager', difficulty: 'Medium' },
            { id: 'typed-service', title: 'Refactor a script into typed service modules', difficulty: 'Medium' },
            { id: 'generator-pipeline', title: 'Build a streaming ETL generator pipeline', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'java-core',
        name: 'Java & JVM Design',
        category: 'Specialized Tracks',
        difficulty: 'Medium',
        roadmapPath: '/roadmap/language',
        description: 'Build fluency with the JVM, collections, generics, exceptions, and modern Java application structure.',
        theory: `Java shines when clarity, tooling, and long-lived maintainability matter.

Understanding the JVM, generics, and the standard library helps you write code that scales with both traffic and team size.`,
        examples: [
            'Use generics safely without raw types',
            'Design layered applications with strong contracts',
            'Leverage the JDK collections and concurrency APIs',
        ],
        problems: makeProblems('java-core', [
            { id: 'generic-cache', title: 'Create a generic cache interface', difficulty: 'Medium' },
            { id: 'stream-refactor', title: 'Refactor loops into readable stream pipelines', difficulty: 'Medium' },
            { id: 'executor-service', title: 'Build a background task processor with executors', difficulty: 'Hard' },
        ]),
    },
    {
        id: 'cpp-core',
        name: 'C++ STL & Resource Safety',
        category: 'Specialized Tracks',
        difficulty: 'Hard',
        roadmapPath: '/roadmap/language',
        description: 'Use STL containers, RAII, smart pointers, references, and value semantics to write safe modern C++.',
        theory: `Modern C++ is powerful because it gives you control without requiring manual chaos.

RAII, move semantics, and STL fluency let you write high-performance code that is still maintainable. Resource safety is not optional here; it is the language.`,
        examples: [
            'Use smart pointers instead of raw ownership',
            'Pick the right STL container for access patterns',
            'Apply value semantics and moves deliberately',
        ],
        problems: makeProblems('cpp-core', [
            { id: 'raii-wrapper', title: 'Build an RAII wrapper for a file handle', difficulty: 'Hard' },
            { id: 'stl-choice', title: 'Optimize a feature by changing STL container choice', difficulty: 'Medium' },
            { id: 'move-semantics', title: 'Refactor copies into efficient move-aware code', difficulty: 'Hard' },
        ]),
    },
];
