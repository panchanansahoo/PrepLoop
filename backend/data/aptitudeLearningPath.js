// Comprehensive Aptitude Learning Path with In-Depth Theory

export const aptitudeLearningPath = {
  id: 'aptitude',
  title: 'Complete Aptitude Mastery Path',
  slug: 'aptitude',
  description: 'Master Quantitative Aptitude, Logical Reasoning, Verbal Ability, and Technical Aptitude for placements and competitive exams',
  duration: '10-14 weeks',
  difficulty: 'All Levels',
  totalModules: 5,
  color: '#f59e0b',
  icon: 'Brain',
  
  overview: {
    objectives: [
      'Master quantitative concepts and shortcuts',
      'Develop logical reasoning and problem-solving skills',
      'Improve verbal communication and comprehension',
      'Master technical aptitude fundamentals',
      'Score 90%+ in company aptitude tests',
      'Build speed and accuracy through practice',
      'Learn time-management strategies'
    ],
    prerequisites: [
      'Basic arithmetic and algebra knowledge',
      'English language proficiency',
      'Computer science fundamentals (for technical aptitude)',
      'Logical thinking ability'
    ],
    outcomes: [
      'Solve complex aptitude problems in minimal time',
      'Understand underlying concepts, not just formulas',
      'Ace aptitude rounds at any company',
      'Prepare for competitive exams (CAT, GATE, GMAT)',
      'Develop critical thinking and analytical skills',
      'Build confidence for high-pressure exams'
    ],
    skillsGained: [
      'Numerical Problem Solving',
      'Logical Reasoning',
      'Communication Skills',
      'Critical Thinking',
      'Time Management',
      'Pattern Recognition',
      'Data Interpretation',
      'Technical Knowledge'
    ]
  },

  studyPlan: {
    beginner: {
      duration: '14 weeks',
      hoursPerWeek: '8-10 hours',
      approach: 'Focus on concept clarity, then practice basic problems',
      weeklyGoals: 'Complete 1 module section, solve 30-40 problems'
    },
    intermediate: {
      duration: '10 weeks',
      hoursPerWeek: '10-12 hours',
      approach: 'Mix concept review with medium and hard problems',
      weeklyGoals: 'Complete 1-2 module sections, solve 50-60 problems'
    },
    advanced: {
      duration: '6-8 weeks',
      hoursPerWeek: '12-14 hours',
      approach: 'Focus on speed, tricks, and tough problems',
      weeklyGoals: 'Review all modules, solve 70-80 problems with time limits'
    }
  },

  modules: [
    {
      id: 1,
      slug: 'quantitative-fundamentals',
      title: 'Quantitative Aptitude - Fundamentals',
      description: 'Master numbers, percentages, ratios, averages, and basic mathematical operations',
      difficulty: 'Beginner to Intermediate',
      estimatedTime: '3 weeks',
      problemCount: 150,
      topics: [
        'Number Systems',
        'HCF and LCM',
        'Percentages',
        'Profit & Loss',
        'Ratio & Proportion',
        'Averages & Mixtures',
        'Simple & Compound Interest',
        'Speed, Time & Distance'
      ],
      theory: {
        numberSystems: `
NUMBER SYSTEMS DEEP DIVE:

FUNDAMENTAL CONCEPTS:

1. DIVISIBILITY RULES:
A quick way to check if number is divisible by another without division.

By 2: Last digit is even (0, 2, 4, 6, 8)
By 3: Sum of digits divisible by 3. Example: 315 → 3+1+5=9, divisible by 3
By 4: Last 2 digits form number divisible by 4. Example: 316 → 16 divisible by 4
By 5: Last digit is 0 or 5
By 6: Divisible by both 2 and 3
By 7: No simple rule, must divide
By 8: Last 3 digits form number divisible by 8
By 9: Sum of digits divisible by 9. Example: 999 → 9+9+9=27, divisible by 9
By 11: Alternating sum is divisible by 11. Example: 121 → |1-2+1|=0, divisible by 11

2. HCF (Highest Common Factor) & LCM (Least Common Multiple):

HCF: Largest number that divides both numbers
Example: HCF(12, 18) = 6
- 12 = 2² × 3
- 18 = 2 × 3²
- Common: 2¹ × 3¹ = 6

LCM: Smallest number divisible by both
Example: LCM(12, 18) = 36
- 12 = 2² × 3
- 18 = 2 × 3²
- All: 2² × 3² = 36

RELATIONSHIP: HCF × LCM = Product of two numbers
HCF(12,18) × LCM(12,18) = 6 × 36 = 12 × 18 ✓

3. PRIME NUMBERS & FACTORIZATION:
Prime: Divisible only by 1 and itself (2, 3, 5, 7, 11, 13, 17, 19, 23, ...)

Every number has unique prime factorization.
Example: 360 = 2³ × 3² × 5

APPLICATIONS:
- Count divisors: (a+1)(b+1)(c+1)... where exponents are a, b, c
- Example: 360 = 2³ × 3² × 5¹ has (3+1)(2+1)(1+1) = 24 divisors

4. UNIT DIGIT CYCLES:
Powers follow repeating pattern in unit digit.

2: 2, 4, 8, 6, 2, 4, 8, 6... (cycle of 4)
3: 3, 9, 7, 1, 3, 9, 7, 1... (cycle of 4)
4: 4, 6, 4, 6... (cycle of 2)
5: Always 5
6: Always 6
7: 7, 9, 3, 1, 7, 9, 3, 1... (cycle of 4)
8: 8, 4, 2, 6, 8, 4, 2, 6... (cycle of 4)
9: 9, 1, 9, 1... (cycle of 2)

To find 2⁹⁸ unit digit: 98 ÷ 4 = 24 remainder 2 → 2² = 4 unit digit
        `,
        percentages: `
PERCENTAGES & PROFIT-LOSS:

CORE FORMULA:
Percentage = (Part / Whole) × 100
Increase% = [(New - Old) / Old] × 100
Decrease% = [(Old - New) / Old] × 100

PROFIT & LOSS:
Profit = Selling Price - Cost Price
Profit% = (Profit / CP) × 100
Selling Price = CP × (1 + Profit%/100)

Loss% = (Loss / CP) × 100
Selling Price = CP × (1 - Loss%/100)

DISCOUNTS:
Discount% = (Discount Amount / Marked Price) × 100
Selling Price = MP × (1 - Discount%/100)

SUCCESSIVE CHANGES (Multiple discounts/increases):
If discount d₁ and d₂ applied:
Total change = -d₁ - d₂ + (d₁ × d₂)/100
OR: Final = Original × (1 - d₁/100) × (1 - d₂/100)

Example: 20% discount, then 10% discount
Final = Original × 0.8 × 0.9 = Original × 0.72
Effective discount = 28% (not 30%)

TRADE DISCOUNT vs CASH DISCOUNT:
Trade discount: Given at purchase (on MRP)
Cash discount: Given on payment (on invoice)
Both reduce actual payment

IMPORTANT PATTERNS:
1. Profit% = 50%, then SP = 1.5 CP
2. If two items: one at P% profit, other at P% loss → Overall loss
3. Equal price sale: If cost prices different, there's a loss
4. Marked Price = CP / (1 - Discount%/100)
5. If cost increases by x%, new quantity = old quantity × [100/(100+x)]
        `,
        ratioProportions: `
RATIO & PROPORTION THEORY:

RATIO: Relationship between two quantities
a:b = a/b
Can be simplified by dividing by GCD

PROPORTION: Equality of two ratios
a:b = c:d means a/b = c/d
OR: ad = bc (cross multiplication)

TYPES:

1. DIRECT PROPORTION:
If a:b = c:d, then:
a + c : b + d = a : b = c : d = (a+c) : (b+d)

Example: Divide 100 in ratio 3:7
First part = 100 × 3/(3+7) = 30
Second part = 100 × 7/10 = 70

2. INVERSE/INDIRECT PROPORTION:
a ∝ 1/b means a × b = constant
If 2 workers complete in 10 days, 5 workers complete in 2×10/5 = 4 days

3. COMPOUND PROPORTION:
If a ∝ b and c ∝ d
Then ac ∝ bd

Example: Wage ∝ hours worked AND Wage ∝ experience
If John (10 hrs, 5 yrs) earns 500
And Mary works (20 hrs, 10 yrs)
Mary earns = 500 × (20/10) × (10/5) = 500 × 2 × 2 = 2000

APPLICATIONS:

MIXTURE PROBLEMS:
When mixing liquids/materials with different concentrations.

Alligation Rule: (Higher concentration - Average) : (Average - Lower concentration)

Example: Mix 7 liters of 30% solution with 5 liters of 40% solution
Average = (7×30 + 5×40)/(7+5) = 410/12 ≈ 34.17%

SHARING PROFITS:
Profit shared in ratio of capital invested and time invested
Profit ratio = (Capital₁ × Time₁) : (Capital₂ × Time₂)
        `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Number Systems Complete Course',
          duration: '60 min',
          description: 'All number system concepts with tricks and shortcuts',
          difficulty: 'Beginner'
        },
        {
          type: 'article',
          title: 'Percentages and Profit-Loss Masterclass',
          duration: '50 min',
          description: 'Every type of percentage problem with formula'
        },
        {
          type: 'article',
          title: 'Ratio & Proportion Patterns',
          duration: '45 min',
          description: 'Key patterns and their applications'
        }
      ],
      keyTopics: [
        { title: 'Division by HCF', difficulty: 'Easy', frequency: 'Common' },
        { title: 'Profit-Loss-Discount combination', difficulty: 'Medium', frequency: 'Common' },
        { title: 'Mixture Problems', difficulty: 'Medium', frequency: 'Moderate' },
        { title: 'Ratio sharing in partnerships', difficulty: 'Medium', frequency: 'Moderate' }
      ],
      commonMistakes: [
        'Confusing profit% with total profit',
        'Not simplifying ratios before using formulas',
        'Applying successive discounts additively instead of multiplicatively',
        'Forgetting to convert percentages properly'
      ],
      tips: [
        'Always reduce ratios to simplest form first',
        'For multiple changes: multiply factors, not add percentages',
        'Marked Price = CP / (1 - Discount%) - derives all discount problems',
        'In alligation, multiply concentration by quantity, not just concentration'
      ]
    },
    {
      id: 2,
      slug: 'quantitative-advanced',
      title: 'Quantitative Aptitude - Advanced',
      description: 'Master time & work, probability, permutations, data interpretation',
      difficulty: 'Intermediate to Advanced',
      estimatedTime: '2-3 weeks',
      problemCount: 120,
      topics: [
        'Time & Work',
        'Pipes & Cisterns',
        'Probability',
        'Permutations & Combinations',
        'Data Interpretation',
        'Clock & Calendar',
        'Ages Problem',
        'Progression (AP, GP)'
      ],
      theory: {
        timeWork: `
TIME & WORK FUNDAMENTALS:

CORE CONCEPT:
If A completes work in n days, A's 1 day work = 1/n

WORK = RATE × TIME

BASIC FORMULA:
Time = Work / Rate
Rate = Work / Time
Work = Rate × Time

COMBINED WORK:
If A completes in a days, B in b days
Combined rate = 1/a + 1/b
Time together = ab/(a+b)

Example: A completes in 12 days, B in 18 days
Combined = (12×18)/(12+18) = 216/30 = 7.2 days

WORK DISTRIBUTION:
If A, B, C complete work in x, y, z days
Work ratio = 1/x : 1/y : 1/z

Example: A (12 days), B (18 days), C (36 days)
Ratio = 1/12 : 1/18 : 1/36 = 3:2:1
If 600 units work: A gets 600×3/6 = 300, B gets 200, C gets 100

WAGES DISTRIBUTION:
Wages distributed in ratio of work done = ratio of rates

MAN-DAYS CONCEPT:
Work = Number of people × Number of days × Hours per day

If work is M man-days, then:
- 2 people complete in M/2 days
- M/3 people complete in 3 days
- Double people, half time

PIPE PROBLEMS:
Inlet pipe: Fills tank (positive)
Outlet pipe: Empties tank (negative)
Rate = Fraction of tank per hour

If inlet fills in x hours, empties in y hours
Working together: 1/x - 1/y = net rate
        `,
        probability: `
PROBABILITY CONCEPTS:

BASIC DEFINITION:
P(Event) = Favorable Outcomes / Total Outcomes

PROPERTIES:
- 0 ≤ P(Event) ≤ 1
- P(Event) + P(Not Event) = 1
- Certain event: P = 1
- Impossible event: P = 0

TYPES OF EVENTS:

1. INDEPENDENT EVENTS:
Occurrence of one doesn't affect other
P(A and B) = P(A) × P(B)
Example: Coin tosses, dice rolls

2. DEPENDENT EVENTS:
Occurrence of one affects other
P(A and B) = P(A) × P(B|A)

Example: Drawing cards without replacement
P(2 red cards) = (26/52) × (25/51)

3. MUTUALLY EXCLUSIVE EVENTS:
Cannot occur together
P(A or B) = P(A) + P(B)
Example: Rolling die, getting 1 or 2

COMBINED PROBABILITY:
P(A or B) = P(A) + P(B) - P(A and B)

Example: Probability of drawing red or king from deck
P(Red) = 26/52, P(King) = 4/52, P(Red King) = 2/52
P(Red or King) = 26/52 + 4/52 - 2/52 = 28/52

CONDITIONAL PROBABILITY:
P(A|B) = P(A and B) / P(B)

Bayes' Theorem Application:
P(A|B) = P(B|A) × P(A) / P(B)
        `,
        permutations: `
PERMUTATIONS & COMBINATIONS:

PERMUTATION: 
Order matters. Arrangement of objects.
Selecting 3 from 5 people for positions 1st, 2nd, 3rd

nPr = n! / (n-r)!

Example: 5P3 = 5!/(5-3)! = 5!/2! = 5×4×3 = 60 ways

COMBINATION:
Order doesn't matter. Selection of objects.
Selecting 3 people from 5 for a committee (roles don't matter)

nCr = n! / (r! × (n-r)!)

Example: 5C3 = 5!/(3!×2!) = (5×4)/(2×1) = 10 ways

RELATIONSHIP:
nPr = nCr × r!

Because each combination can be arranged in r! ways.

KEY PATTERNS:

1. CIRCULAR ARRANGEMENTS:
People sitting around table (relative positions matter)
= (n-1)!

Example: 5 people around table = 4! = 24 arrangements

2. IDENTICAL OBJECTS:
Arranging n objects where some are identical
= n! / (n₁! × n₂! × ... × nₓ!)

Example: Letters in "APPLE" (2 P's) = 5! / 2! = 60

3. DISTRIBUTION PROBLEMS:
Distribute m identical items among n people
= n+m-1 Cm

Example: Distribute 5 identical candies to 3 children
= C(3+5-1, 5) = C(7,5) = 21 ways

4. SELECTION & ARRANGEMENT:
First select nCr ways, then arrange r! ways
Total = nCr × r! = nPr (as expected)
        `
      },
      studyMaterials: [
        {
          type: 'video',
          title: 'Time & Work Masterclass',
          duration: '50 min',
          description: 'All variations of time & work problems'
        },
        {
          type: 'article',
          title: 'Probability from Basics to Advanced',
          duration: '55 min',
          description: 'Concepts and common probability patterns'
        },
        {
          type: 'article',
          title: 'Permutations & Combinations Guide',
          duration: '60 min',
          description: 'Every type of counting problem with patterns'
        }
      ],
      keyTopics: [
        { title: 'Combined work problems', difficulty: 'Medium', frequency: 'Very Common' },
        { title: 'Pipe & cistern variations', difficulty: 'Medium', frequency: 'Common' },
        { title: 'Probability with conditions', difficulty: 'Hard', frequency: 'Moderate' },
        { title: 'Circular arrangements', difficulty: 'Medium', frequency: 'Moderate' }
      ],
      commonMistakes: [
        'Adding rates instead of work fractions',
        'Forgetting negative rates for outlet pipes',
        'Confusing permutations with combinations',
        'Not accounting for identical objects in arrangements'
      ],
      tips: [
        'Work problems: Always use fractions of work (1/n), not absolute days',
        'Probability: P(A or B) = P(A) + P(B) - P(A and B), not just sum',
        'Counting: When order matters use P, when it doesn\'t use C',
        'Circular: Fix one person to break rotational equivalence'
      ]
    },
    {
      id: 3,
      slug: 'logical-reasoning',
      title: 'Logical Reasoning & Puzzles',
      description: 'Master blood relations, coding-decoding, syllogisms, seating arrangements, and puzzles',
      difficulty: 'Intermediate to Advanced',
      estimatedTime: '2-3 weeks',
      problemCount: 100,
      topics: [
        'Blood Relations',
        'Coding-Decoding',
        'Syllogisms',
        'Seating Arrangements',
        'Direction Sense',
        'Puzzles & Games',
        'Logical Deduction',
        'Analytical Reasoning'
      ],
      theory: {
        bloodRelations: `
BLOOD RELATIONS FUNDAMENTALS:

KEY TERMS:
- Relation: Connection through blood or marriage
- Direct: Straight line (parent-child, grandparent-grandchild)
- Collateral: Siblings, cousins, aunts, uncles

BASIC RELATIONS:
From A's perspective:
- Mother: Female parent
- Father: Male parent
- Brother: Same parents, male
- Sister: Same parents, female
- Son: Male child
- Daughter: Female child
- Grandfather: Father's or mother's father
- Grandmother: Father's or mother's mother
- Uncle: Father's or mother's brother
- Aunt: Father's or mother's sister
- Cousin: Child of uncle or aunt (same generation, not sibling)
- Nephew: Male child of sibling
- Niece: Female child of sibling

MARRIAGE RELATIONS:
- Husband: Spouse (male)
- Wife: Spouse (female)
- Father-in-law: Father of spouse or parent of spouse
- Mother-in-law: Mother of spouse
- Brother-in-law: Spouse's brother or sister's husband
- Sister-in-law: Spouse's sister or brother's wife

KEY PATTERNS:
1. "Mother's brother" = Uncle
2. "Father's sister" = Aunt
3. "Mother's father" = Paternal grandfather (could be maternal too)
4. Cousin's cousin = Could be sibling, cousin, or stranger

SOLVING APPROACH:
1. Draw family tree diagram
2. Trace the given relations
3. Find the final relation by path

Key insight: Often confuse "relation of relation"
Example: "A's mother's brother's daughter" = Cousin
        `,
        codingDecoding: `
CODING-DECODING PATTERNS:

TYPES:

1. LETTER SHIFTING:
Each letter shifted by fixed positions
Example: A→B, B→C (shift by 1)
CAT → DBS

TO SOLVE:
- Identify shift pattern
- Apply consistently

2. POSITION BASED:
Position of letter matters
Example: Reverse order
CAT → TAC

3. SUBSTITUTION CIPHER:
Each letter maps to different letter consistently
A→Z, B→Y, C→X, etc.

TO SOLVE:
- Find pattern from examples
- Apply to decode

4. NUMBER-LETTER CODING:
Letters represented by numbers
A=1, B=2, ..., Z=26

Example: CAT = 3-1-20

5. SYMBOLIC CODING:
Letters replaced by symbols
A=@, B=#, C=$, etc.

COMMON PATTERNS:
- Reverse alphabet: A↔Z, B↔Y, etc.
- Keyboard shift: QWERTY pattern
- Mathematical: Letter × 2, then add position
- Word reversal: READ → DAER

KEY INSIGHT:
Always look for one consistent rule that applies to all examples.
If rule doesn't work for one example, that's your clue to pattern change.
        `,
        syllogisms: `
SYLLOGISM BASICS:

STRUCTURE:
Major Premise: Statement about all/some of a category
Minor Premise: Statement about something in that category
Conclusion: Derived statement

Example:
Major: All humans are mortal
Minor: Socrates is human
Conclusion: Socrates is mortal

TYPES OF STATEMENTS:

1. UNIVERSAL AFFIRMATIVE (A):
All S are P (All cows are animals)

2. UNIVERSAL NEGATIVE (E):
No S are P (No dogs are cats)

3. PARTICULAR AFFIRMATIVE (I):
Some S are P (Some tables are brown)

4. PARTICULAR NEGATIVE (O):
Some S are not P (Some students are not engineers)

RULES FOR VALID CONCLUSION:

1. Middle term must be distributed at least once in premises
2. If term distributed in conclusion, must be distributed in premise
3. From two negative premises, no valid conclusion
4. If one premise negative, conclusion must be negative
5. If one premise particular, conclusion must be particular
6. If both premises particular, no valid conclusion

DISTRIBUTION RULE:
- Universal statements (All, No): Subject distributed
- Affirmative statements (All, Some): Predicate NOT distributed
- Negative statements (No, Some not): Predicate distributed

Example: "All cows are animals" (A)
- Cows (distributed) - specific group
- Animals (not distributed) - larger group

Venn Diagram Method:
Draw circles for each term (S, M, P)
- All S are M: S circle inside M circle
- No S are M: Circles don't overlap
- Some S are M: Circles overlap with mark in overlap
Check if conclusion region is marked
        `
      },
      studyMaterials: [
        {
          type: 'article',
          title: 'Blood Relations Complete Guide',
          duration: '40 min',
          description: 'All types with examples and family trees'
        },
        {
          type: 'article',
          title: 'Coding-Decoding Patterns',
          duration: '35 min',
          description: 'Every pattern type with examples'
        },
        {
          type: 'article',
          title: 'Syllogisms & Logical Deduction',
          duration: '50 min',
          description: 'Rules, patterns, and Venn diagram method'
        }
      ],
      keyTopics: [
        { title: 'Complex family trees', difficulty: 'Medium', frequency: 'Very Common' },
        { title: 'Multi-level coding', difficulty: 'Medium', frequency: 'Common' },
        { title: 'Syllogism validity', difficulty: 'Hard', frequency: 'Common' },
        { title: 'Seating arrangements (circular)', difficulty: 'Hard', frequency: 'Common' }
      ],
      commonMistakes: [
        'Missing middle generations in family trees',
        'Assuming single shift in coding (patterns change)',
        'Not following distribution rule in syllogisms',
        'Confusing "some" with "all" in statements'
      ],
      tips: [
        'Draw family tree for complex relations',
        'Check if coding pattern changes mid-way',
        'Distribution: Universal (subject), Negative (predicate)',
        'Seating: Fix one person, arrange others relatively'
      ]
    },
    {
      id: 4,
      slug: 'verbal-ability',
      title: 'Verbal Ability & Comprehension',
      description: 'Master grammar, vocabulary, comprehension, and communication skills',
      difficulty: 'Beginner to Intermediate',
      estimatedTime: '2 weeks',
      problemCount: 80,
      topics: [
        'Parts of Speech',
        'Tenses & Agreement',
        'Sentence Correction',
        'Vocabulary & Usage',
        'Reading Comprehension',
        'Paragraph Completion',
        'Critical Reasoning'
      ],
      theory: {
        grammar: `
ESSENTIAL GRAMMAR RULES:

SUBJECT-VERB AGREEMENT:
Singular subject → Singular verb
Plural subject → Plural verb

Examples:
✓ The student is studying (singular)
✓ The students are studying (plural)
✗ The student are studying (wrong)

SPECIAL CASES:
- "Neither...nor" → Verb agrees with nearer subject
  Neither John nor the students are ready
- "Either...or" → Same rule
- Collective nouns (team, group) → Usually singular if acting as one
  The team is playing (one unit)
- Plural nouns with singular meaning → Singular verb
  Mathematics is difficult

TENSE USAGE:

PRESENT SIMPLE:
Use for: Habits, facts, permanent states, general truths
Structure: V1 (base form)
Example: He goes to office daily

PRESENT CONTINUOUS:
Use for: Actions happening now, temporary states
Structure: am/is/are + V-ing
Example: He is going home right now

PAST SIMPLE:
Use for: Completed actions at specific time
Structure: V2 (past form) or irregular forms
Example: He went home yesterday

PAST CONTINUOUS:
Use for: Actions going on in past when something happened
Structure: was/were + V-ing
Example: When the phone rang, I was studying

PRESENT PERFECT:
Use for: Actions starting in past, continuing/recently completed
Structure: have/has + V3 (past participle)
Example: I have studied for 5 years

SEQUENCE OF TENSES:
- If main clause past → dependent clause must be past or past perfect
- Past Perfect: had + V3 (for earlier time in past)
  He had completed work when I arrived

ARTICLES:

A/AN: Indefinite, use before:
- Singular countable when first mentioned
- Before words starting with consonant sound (a book)
- Before words starting with vowel sound (an apple)

THE: Definite, use for:
- Specific/known items
- Superlatives (the best)
- Unique things (the sun)
- Second mention

NO ARTICLE:
- Plural when general
- Uncountable nouns
- Abstract nouns (honesty, courage)
- Proper nouns (generally)
        `,
        readingComprehension: `
READING COMPREHENSION STRATEGY:

BEFORE READING:
1. Read the question first (know what to look for)
2. Identify question type (main idea, detail, inference, tone)

DURING READING:
1. Skim first time for main idea
2. Read carefully for details
3. Mark key points
4. Identify author's tone and purpose

IDENTIFYING MAIN IDEA:
- Central point passage revolves around
- Often in first or last paragraph
- Supported by all other sentences

FINDING SUPPORTING DETAILS:
- Specific facts, examples, statistics
- Often marked by: because, since, for example
- Answer "Who, What, When, Where, Why, How"

INFERENCE QUESTIONS:
- Not explicitly stated but logically follows
- Look for evidence in passage
- Don't over-infer beyond what text suggests

TONE & PURPOSE:

TONE: Author's attitude
- Positive: hopeful, optimistic, appreciative
- Negative: critical, sarcastic, bitter
- Neutral: objective, informative

PURPOSE: Why author wrote
- To inform: Provide information
- To persuade: Change opinion
- To entertain: Amuse or engage
- To explain: Clarify concept

ANSWERING TECHNIQUE:
1. Go back to passage for exact support
2. Eliminate obviously wrong answers first
3. Choose answer most supported by text
4. Don't use outside knowledge

KEY MISTAKE:
Reading passage without knowing question first wastes time
Always know what you're looking for before you read!
        `
      },
      studyMaterials: [
        {
          type: 'article',
          title: 'Grammar Essentials',
          duration: '45 min',
          description: 'Core rules with examples'
        },
        {
          type: 'article',
          title: 'Vocabulary Building for Aptitude',
          duration: '40 min',
          description: 'Essential words and usage'
        },
        {
          type: 'article',
          title: 'Reading Comprehension Mastery',
          duration: '50 min',
          description: 'Strategies for all question types'
        }
      ],
      keyTopics: [
        { title: 'Subject-Verb agreement', difficulty: 'Easy', frequency: 'Very Common' },
        { title: 'Tense selection', difficulty: 'Medium', frequency: 'Common' },
        { title: 'Inference in comprehension', difficulty: 'Hard', frequency: 'Very Common' },
        { title: 'Word meaning in context', difficulty: 'Medium', frequency: 'Common' }
      ],
      commonMistakes: [
        'Ignoring subject when compound (both A and B are...)',
        'Using wrong tense in complex sentences',
        'Over-inferencing beyond text support',
        'Using vocabulary from general knowledge in comprehension'
      ],
      tips: [
        'Locate subject before choosing verb (often subject is not first word)',
        'Consistency: If sentence start in past, maintain tense',
        'Comprehension: Answer only from passage, use surface meaning',
        'Vocabulary: Always look for context to determine meaning, not just dictionary'
      ]
    },
    {
      id: 5,
      slug: 'technical-aptitude',
      title: 'Technical Aptitude & CS Fundamentals',
      description: 'Master OS, DBMS, Networks, OOP concepts, and DSA basics for technical exams',
      difficulty: 'Intermediate to Advanced',
      estimatedTime: '3 weeks',
      problemCount: 100,
      topics: [
        'Operating Systems',
        'Database Management Systems',
        'Computer Networks',
        'Object-Oriented Programming',
        'Data Structures Basics',
        'Algorithms Basics',
        'Number Systems in Computing',
        'Boolean Logic & Digital Logic'
      ],
      theory: {
        operatingSystems: `
OPERATING SYSTEMS FUNDAMENTALS:

CORE CONCEPTS:

PROCESS vs THREAD:
Process: Independent program instance with own memory
- Process ID (PID)
- Own memory space
- Heavy to create/switch
- More isolated

Thread: Lightweight unit of process
- Shares process memory
- Light to create/switch
- All threads in process share data
- Can corrupt each other's data

CONTEXT SWITCHING:
When OS switches from one process to another
- Current state saved (registers, memory pointers)
- Another process state loaded
- Time-consuming (expensive in terms of CPU cycles)

CPU SCHEDULING ALGORITHMS:

FIFO (First In First Out):
- Process arrives, goes to end of queue
- executes to completion
- Fair but poor response time

SHORTEST JOB FIRST:
- Shortest process runs first
- Minimizes average waiting time
- But starvation possible (long jobs wait forever)

ROUND ROBIN:
- Each process gets time slice (quantum)
- If not complete, goes to end of queue
- Fair, good response time
- More context switches = overhead

PRIORITY BASED:
- Higher priority runs first
- Can use preemption or non-preemption

PROCESS STATES:
New → Ready → Running → Waiting → Terminated
- Ready: In queue, waiting for CPU
- Running: Executing on CPU
- Waiting: Waiting for I/O or resource

DEADLOCK:
Situation where processes wait for resources held by other processes

CONDITIONS (all must be true):
1. Mutual exclusion: Resource not shareable
2. Hold and wait: Process holding resource can request others
3. No preemption: Resource cannot be taken forcibly
4. Circular wait: Chain of processes waiting

PREVENTION: Break one condition (remove circular wait most practical)
        `,
        databases: `
DATABASE FUNDAMENTALS:

RELATIONAL MODEL:
Data organized in tables (relations)
- Row: Record (entity instance)
- Column: Attribute (property)
- Relationships maintained through foreign keys

KEYS:

PRIMARY KEY:
- Uniquely identifies each record
- Cannot be NULL
- Single or composite (multiple columns)
- Enforces entity integrity

FOREIGN KEY:
- References primary key in another table
- Maintains referential integrity
- Allows relationships between tables

CANDIDATE KEY:
- Could be primary key (unique + not null)
- Table can have multiple candidates

NORMAL FORMS (Normalization):

1NF (First Normal Form):
- All attributes atomic (indivisible)
- No repeating groups
- Each cell has single value

2NF (Second Normal Form):
- Must be in 1NF
- All non-key attributes fully dependent on entire primary key
- Remove partial dependencies

3NF (Third Normal Form):
- Must be in 2NF
- No transitive dependencies
- Non-key attributes depend only on primary key

BOYCE-CODD NORMAL FORM:
- Stricter form of 3NF
- Every determinant must be a candidate key

DENORMALIZATION:
Intentionally adding redundancy
- Improves query performance
- Increases storage, reduces flexibility
- Used in data warehouses

JOINS:

INNER JOIN: Matching records from both tables
OUTER JOIN: All records one table + matching from other
LEFT JOIN: All from left + matching from right
RIGHT JOIN: All from right + matching from left
FULL JOIN: All records from both tables
        `,
        networks: `
COMPUTER NETWORKS ESSENTIALS:

OSI MODEL (7 Layers):

7. APPLICATION: HTTP, FTP, DNS, Email
6. PRESENTATION: Encryption, compression, translation
5. SESSION: Manages sessions, authentication
4. TRANSPORT: TCP (reliable), UDP (fast), Ports
3. NETWORK: IP, Routing, Logical addressing
2. DATA LINK: MAC address, Switching, Frames
1. PHYSICAL: Cables, signals, electromagnetic

MODELS TO REMEMBER:
- Each layer adds headers (encapsulation)
- Layer 7 has data
- Layer 4 breaks into segments
- Layer 3 breaks into packets
- Layer 2 breaks into frames

TCP/IP BASICS:

IP ADDRESS:
- 32 bits (IPv4): 4 octets (0-255 each)
- Example: 192.168.1.1

SUBNET MASK:
- Determines network and host portions
- 255.255.255.0 means first 3 octets are network
- Example: 192.168.1.x (where x is host)

PORTS:
- 0-1023: Well-known (HTTP 80, HTTPS 443, FTP 21)
- 1024-49151: Registered
- 49152-65535: Dynamic/Private

TCP vs UDP:

TCP (Transmission Control Protocol):
- Connection-oriented (handshake required)
- Reliable (all packets guaranteed to arrive in order)
- Slower but safe
- Use: Email, Web, File transfer

UDP (User Datagram Protocol):
- Connectionless (no handshake)
- Unreliable (packets may be lost)
- Faster
- Use: Streaming, VoIP, Online games

ROUTING:
- IP packets routed based on destination IP
- Routers use routing tables
- Default route catches unmatched addresses

DNS (Domain Name System):
- Translates domain names to IP addresses
- example.com → 93.184.216.34
- Distributed, hierarchical system
        `
      },
      studyMaterials: [
        {
          type: 'article',
          title: 'Operating Systems Concepts',
          duration: '60 min',
          description: 'All core OS concepts with examples'
        },
        {
          type: 'article',
          title: 'Database Design & Normalization',
          duration: '50 min',
          description: 'From basics to 3NF with examples'
        },
        {
          type: 'article',
          title: 'Computer Networks Overview',
          duration: '45 min',
          description: 'OSI model, TCP/IP, and key concepts'
        }
      ],
      keyTopics: [
        { title: 'Process scheduling', difficulty: 'Medium', frequency: 'Common' },
        { title: 'Database normalization', difficulty: 'Medium', frequency: 'Common' },
        { title: 'OSI model layers', difficulty: 'Easy', frequency: 'Very Common' },
        { title: 'Deadlock detection', difficulty: 'Hard', frequency: 'Moderate' }
      ],
      commonMistakes: [
        'Confusing process context with memory context',
        'Not understanding why normalization matters',
        'Mixing up OSI layers in their function',
        'Confusing TCP reliability with UDP guarantees'
      ],
      tips: [
        'Scheduling: SHORTEST JOB FIRST minimizes average waiting time',
        'Normalization: Remove repeating groups (1NF), then partial dependencies (2NF), then transitive dependencies (3NF)',
        'OSI: Remember "Please Do Not Throw Sausage Pizza Away" for layers 7-1',
        'TCP vs UDP: TCP for reliability, UDP for speed'
      ]
    }
  ],

    theoryCompanion: {
    examStrategy: `
  APTITUDE EXAM STRATEGY FRAMEWORK:

  1. SECTION ORDERING:
  - Start with strongest section to build momentum
  - Delay high-time-cost puzzles until quick-win questions are done

  2. QUESTION TRIAGE MODEL:
  - A: Solvable in <45 seconds
  - B: Solvable in 60-90 seconds with focused work
  - C: Uncertain/high-computation; skip and revisit

  3. ACCURACY-FIRST RULE:
  - Attempt fewer with high confidence rather than random broad attempts
  - Especially critical when negative marking exists

  4. REVIEW WINDOW:
  - Reserve final 8-12 minutes for marked questions and error checks

  5. PERFORMANCE LOOP:
  - Mock -> analyze error type -> targeted drill -> retest
    `,
    quantitativeDepth: `
  QUANTITATIVE REASONING DEPTH:

  1. RATE-BASED THINKING:
  - Time/work and speed/distance problems reduce to rates and units
  - Keep units consistent before formula application

  2. PERCENTAGE TRANSFORMATIONS:
  - Convert percentage operations to multipliers for faster chaining
  - Example: +20% then -10% => x1.2 x0.9

  3. RATIO AS SCALING TOOL:
  - Normalize quantities to common ratio base before substitution

  4. NUMBER SYSTEM SHORTCUTS:
  - Last digit cycles, modular arithmetic, divisibility filters

  5. APPROXIMATION CONTROL:
  - Use controlled approximation in DI when answer choices are well separated
    `,
    reasoningDepth: `
  LOGICAL REASONING DEPTH:

  1. CONSTRAINT MODELING:
  - Convert verbal puzzle statements into formal constraints
  - Track absolute vs relative positions explicitly

  2. CASE SPLITTING:
  - Split only on high-impact uncertain constraints
  - Avoid combinatorial explosion with early contradiction pruning

  3. DEDUCTIVE ORDER:
  - Start with strongest constraints (fixed positions, exclusivity, direction)
  - Add weaker constraints after anchor placement

  4. SYLLOGISM RIGOR:
  - Use distribution rules and Venn semantics, not language intuition

  5. ERROR PATTERNS:
  - Over-assuming unstated relations
  - Mixing necessity and possibility conclusions
    `,
    verbalDepth: `
  VERBAL ABILITY DEPTH:

  1. GRAMMAR DECISION TREE:
  - Identify clause structure first, then apply agreement/tense rules

  2. CONTEXTUAL VOCABULARY:
  - Prefer in-passage meaning over dictionary default sense

  3. RC COMPREHENSION LAYERS:
  - Layer 1: Main idea
  - Layer 2: Supporting claims/evidence
  - Layer 3: Author tone and intent

  4. INFERENCE DISCIPLINE:
  - Choose the option most supported, not most interesting

  5. TIME EFFICIENCY:
  - Question-first skim can reduce rereads in long passages
    `,
    technicalAptitudeDepth: `
  TECHNICAL APTITUDE DEPTH:

  1. OS/DBMS/CN CORE-FIRST:
  - Master high-frequency fundamentals before edge-case trivia

  2. CONCEPT LINKING:
  - Example: Process scheduling affects latency; normalization affects write complexity

  3. COMPARISON TABLES:
  - TCP vs UDP, process vs thread, 2NF vs 3NF style contrasts boost recall

  4. QUESTION ELIMINATION:
  - Eliminate options violating first principles

  5. REVISION BLOCKS:
  - Rotate concise concept cards daily for retention
    `,
    speedMathToolkit: `
  SPEED MATH TOOLKIT:

  1. FRACTION-TO-PERCENT QUICK MAP:
  1/2=50%, 1/3=33.33%, 1/4=25%, 1/5=20%, 1/8=12.5%

  2. SQUARE/CUBE MEMORY BANDS:
  - Memorize squares up to 40 and cubes up to 20

  3. MULTIPLICATION SHORTCUTS:
  - Use distributive split: 48x25 = 48x(100/4)

  4. RATIO NORMALIZATION:
  - Convert ratios to least common base before operations

  5. ESTIMATION WINDOWS:
  - Use bounds to eliminate impossible options quickly
    `,
    errorAnalytics: `
  ERROR ANALYTICS MODEL:

  CLASSIFY EVERY WRONG ANSWER AS:
  1. Conceptual gap
  2. Calculation slip
  3. Misread condition
  4. Time-pressure guess
  5. Over-attempt decision error

  TRACK WEEKLY:
  - Accuracy by section
  - Average time per correct answer
  - Skip quality (questions skipped that were actually easy)

  ACTION RULE:
  - If conceptual errors dominate: revisit theory
  - If slips dominate: slow down and add checkpoint calculations
  - If time errors dominate: triage and pacing drills
    `,
    interviewAndTestBlueprint: `
  PLACEMENT TEST BLUEPRINT:

  1. Pre-test warmup:
  - 10-15 quick mixed questions to activate speed and confidence

  2. In-test protocol:
  - Read precisely, classify quickly, decide attempt/skip early

  3. Post-test analysis:
  - Re-solve all incorrect and skipped questions without time limit

  4. Weekly cycle:
  - 3 sectional tests + 1 full mock + 1 deep review session

  5. Final-week strategy:
  - Focus on high-yield formulas, recurring patterns, and error-prone topics
    `
    },

  resources: {
    formula_sheets: {
      quantitative: [
        'All number system divisibility rules',
        'Percentage & profit-loss formulas',
        'Ratio proportion alligation method',
        'time work combined rate formula',
        'Simple & compound interest formulas',
        'Speed distance time conversions',
        'Permutation & combination formulas'
      ],
      reasoning: [
        'Blood relation terms',
        'Syllogism rules & distribution',
        'Coding patterns',
        'Direction terms & orientations'
      ],
      technical: [
        'OSI model layers',
        'TCP/IP basics',
        'Process states',
        'Normalization rules'
      ]
    },
    websites: [
      {
        name: 'Aptitude Questions',
        url: 'https://www.indiabix.com',
        type: 'Practice',
        description: 'Huge repository of aptitude questions'
      },
      {
        name: 'GeeksforGeeks Aptitude',
        url: 'https://www.geeksforgeeks.org/category/aptitude/',
        type: 'Learning',
        description: 'Detailed concepts and solutions'
      }
    ]
  },

  tips: {
    general: [
      'Understand concepts, don\'t just memorize formulas',
      'Practice regularly - aptitude is all about pattern recognition',
      'Take mock tests with strict time limits',
      'Analyze mistakes - they reveal weak areas',
      'Learn shortcuts and tricks for speed',
      'Start with easy problems to build confidence'
    ],
    timeManagement: [
      'Attempt easy questions first (30 seconds each)',
      'Medium questions: 60-70 seconds each',
      'Skip hard questions initially, return if time left',
      'Don\'t spend >2 minutes on single question',
      'Allocate 1 minute per mark generally'
    ],
    beforeExam: [
      'Sleep well (tired brain makes silly mistakes)',
      'Practice similar tests 2-3 days before',
      'Review key formulas night before',
      'Stay confident (you\'ve prepared enough)',
      'Eat light breakfast (too full = lethargic)'
    ],
    duringExam: [
      'Read questions carefully (don\'t miss keywords)',
      'Don\'t second-guess (go with instinct)',
      'Mark unsure questions, don\'t waste time',
      'Check negative marking rules before attempting',
      'Mental calculation > calculator for simple math'
    ]
  },

  progressTracking: {
    milestones: [
      { week: 2, target: 'Complete all number system patterns' },
      { week: 4, target: 'Master percentages and profit-loss' },
      { week: 6, target: 'Comfortable with time & work problems' },
      { week: 8, target: 'Pass quantitative section mock test' },
      { week: 10, target: 'Complete logical reasoning section' },
      { week: 12, target: 'Improve reading comprehension speed' },
      { week: 14, target: 'Score 85%+ in full mock test' }
    ],
    assessments: [
      'Weekly topic-wise quizzes',
      'Bi-weekly sectional tests',
      'Full-length mock tests every 2 weeks',
      'Final section mastery test before exam'
    ]
  },

  faqs: [
    {
      question: 'How much time needed to prepare for aptitude?',
      answer: 'Depends on your level. Beginners: 10-14 weeks. Intermediate: 6-8 weeks. Advanced: 4-6 weeks. 2-3 hours daily minimum.'
    },
    {
      question: 'Should I memorize all formulas?',
      answer: 'No. Understand derivations of 3-4 key formulas in each topic. Shortcuts can be learned with practice.'
    },
    {
      question: 'Which topic to start with?',
      answer: 'Start with Quantitative fundamentals (number systems, percentages). This builds confidence and is most frequently asked.'
    },
    {
      question: 'How to improve speed without losing accuracy?',
      answer: 'Practice, practice, practice! Also learn shortcuts and tricks. Do time-limit practice tests. Speed comes with familiarity.'
    }
  ]
};

export default aptitudeLearningPath;
