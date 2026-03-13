import { Globe, Server, Cloud, Code, Database, Cpu, Shield, Smartphone, PenTool, Radio } from 'lucide-react';

export const dailyChallenges = [
    {
        id: 'google',
        name: 'Google',
        type: 'Product',
        icon: Globe,
        color: 'text-blue-400',
        dsa: [
            { title: 'Two Sum', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/', internalId: 1, type: 'dsa' },
            { title: 'Median of Two Sorted Arrays', difficulty: 'Hard', url: 'https://leetcode.com/problems/median-of-two-sorted-arrays/', internalId: 211, type: 'dsa' },
            { title: 'Longest Palindromic Substring', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-palindromic-substring/', internalId: 308, type: 'dsa' },
            { title: 'Container With Most Water', difficulty: 'Medium', url: 'https://leetcode.com/problems/container-with-most-water/', internalId: 9, type: 'dsa' },
            { title: 'Merge k Sorted Lists', difficulty: 'Hard', url: 'https://leetcode.com/problems/merge-k-sorted-lists/', internalId: 444, type: 'dsa' },
        ],
        sql: [
            { title: 'Big Countries', difficulty: 'Easy', url: 'https://leetcode.com/problems/big-countries/', internalId: 'sql-101', type: 'sql' },
            { title: 'Second Highest Salary', difficulty: 'Medium', url: 'https://leetcode.com/problems/second-highest-salary/', internalId: 'sql-102', type: 'sql' },
            { title: 'Nth Highest Salary', difficulty: 'Medium', url: 'https://leetcode.com/problems/nth-highest-salary/', internalId: 'sql-103', type: 'sql' },
            { title: 'Rank Scores', difficulty: 'Medium', url: 'https://leetcode.com/problems/rank-scores/', internalId: 'sql-104', type: 'sql' },
            { title: 'Consecutive Numbers', difficulty: 'Medium', url: 'https://leetcode.com/problems/consecutive-numbers/', internalId: 'sql-105', type: 'sql' },
        ]
    },
    {
        id: 'microsoft',
        name: 'Microsoft',
        type: 'Product',
        icon: Server,
        color: 'text-sky-400',
        dsa: [
            { title: 'Valid Parentheses', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-parentheses/', internalId: 151, type: 'dsa' },
            { title: 'Merge Two Sorted Lists', difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-two-sorted-lists/', internalId: 132, type: 'dsa' },
            { title: 'Group Anagrams', difficulty: 'Medium', url: 'https://leetcode.com/problems/group-anagrams/', internalId: 426, type: 'dsa' },
            { title: 'Spiral Matrix', difficulty: 'Medium', url: 'https://leetcode.com/problems/spiral-matrix/', internalId: 24, type: 'dsa' },
            { title: 'Reverse Nodes in k-Group', difficulty: 'Hard', url: 'https://leetcode.com/problems/reverse-nodes-in-k-group/', internalId: 128, type: 'dsa' },
        ],
        sql: [
            { title: 'Combine Two Tables', difficulty: 'Easy', url: 'https://leetcode.com/problems/combine-two-tables/', internalId: 'sql-106', type: 'sql' },
            { title: 'Employees Earning More Than Their Managers', difficulty: 'Easy', url: 'https://leetcode.com/problems/employees-earning-more-than-their-managers/', internalId: 'sql-107', type: 'sql' },
            { title: 'Duplicate Emails', difficulty: 'Easy', url: 'https://leetcode.com/problems/duplicate-emails/', internalId: 'sql-108', type: 'sql' },
            { title: 'Department Top Three Salaries', difficulty: 'Hard', url: 'https://leetcode.com/problems/department-top-three-salaries/', internalId: 'sql-109', type: 'sql' },
            { title: 'Trips and Users', difficulty: 'Hard', url: 'https://leetcode.com/problems/trips-and-users/', internalId: 'sql-110', type: 'sql' },
        ]
    },
    {
        id: 'amazon',
        name: 'Amazon',
        type: 'Product',
        icon: Cloud,
        color: 'text-orange-400',
        dsa: [
            { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', internalId: 81, type: 'dsa' },
            { title: '3Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/3sum/', internalId: 10, type: 'dsa' },
            { title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', url: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', internalId: 320, type: 'dsa' },
            { title: 'Word Ladder', difficulty: 'Hard', url: 'https://leetcode.com/problems/word-ladder/', internalId: 281, type: 'dsa' },
            { title: 'LRU Cache', difficulty: 'Medium', url: 'https://leetcode.com/problems/lru-cache/', internalId: 144, type: 'dsa' },
        ],
        sql: [
            { title: 'Delete Duplicate Emails', difficulty: 'Easy', url: 'https://leetcode.com/problems/delete-duplicate-emails/', internalId: 'sql-111', type: 'sql' },
            { title: 'Rising Temperature', difficulty: 'Easy', url: 'https://leetcode.com/problems/rising-temperature/', internalId: 'sql-112', type: 'sql' },
            { title: 'Game Play Analysis I', difficulty: 'Easy', url: 'https://leetcode.com/problems/game-play-analysis-i/', internalId: 'sql-113', type: 'sql' },
            { title: 'Market Analysis I', difficulty: 'Medium', url: 'https://leetcode.com/problems/market-analysis-i/', internalId: 'sql-114', type: 'sql' },
            { title: 'Capital Gain/Loss', difficulty: 'Medium', url: 'https://leetcode.com/problems/capital-gainloss/', internalId: 'sql-115', type: 'sql' },
        ]
    },
    {
        id: 'tcs',
        name: 'TCS',
        type: 'Service',
        icon: Code,
        color: 'text-indigo-400',
        dsa: [
            { title: 'Reverse Integer', difficulty: 'Medium', url: 'https://leetcode.com/problems/reverse-integer/', internalId: 427, type: 'dsa' },
            { title: 'Palindrome Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/palindrome-number/', internalId: 428, type: 'dsa' },
            { title: 'Fibonacci Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/fibonacci-number/', internalId: 429, type: 'dsa' },
            { title: 'Climbing Stairs', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/', internalId: 291, type: 'dsa' },
            { title: 'Power of Two', difficulty: 'Easy', url: 'https://leetcode.com/problems/power-of-two/', internalId: 430, type: 'dsa' },
        ],
        sql: [
            { title: 'Select All', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/select-all-sql/problem', internalId: 'sql-116', type: 'sql' },
            { title: 'Revising the Select Query I', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/revising-the-select-query/problem', internalId: 'sql-117', type: 'sql' },
            { title: 'Japanese Cities Names', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/japanese-cities-name/problem', internalId: 'sql-118', type: 'sql' },
            { title: 'Weather Observation Station 1', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/weather-observation-station-1/problem', internalId: 'sql-119', type: 'sql' },
            { title: 'Employee Salaries', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/salary-of-employees/problem', internalId: 'sql-120', type: 'sql' },
        ]
    },
    {
        id: 'infosys',
        name: 'Infosys',
        type: 'Service',
        icon: Cpu,
        color: 'text-blue-600',
        dsa: [
            { title: 'Maximum Subarray', difficulty: 'Medium', url: 'https://leetcode.com/problems/maximum-subarray/', internalId: 5, type: 'dsa' },
            { title: 'Move Zeroes', difficulty: 'Easy', url: 'https://leetcode.com/problems/move-zeroes/', internalId: 41, type: 'dsa' },
            { title: 'Missing Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/missing-number/', internalId: 37, type: 'dsa' },
            { title: 'Single Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/single-number/', internalId: 431, type: 'dsa' },
            { title: 'Intersection of Two Arrays', difficulty: 'Easy', url: 'https://leetcode.com/problems/intersection-of-two-arrays/', internalId: 69, type: 'dsa' },
        ],
        sql: [
            { title: 'Higher Than 75 Marks', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/more-than-75-marks/problem', internalId: 'sql-121', type: 'sql' },
            { title: 'Employee Names', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/name-of-employees/problem', internalId: 'sql-122', type: 'sql' },
            { title: 'Top Earners', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/earnings-of-employees/problem', internalId: 'sql-123', type: 'sql' },
            { title: 'Weather Observation Station 3', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/weather-observation-station-3/problem', internalId: 'sql-124', type: 'sql' },
            { title: 'Occupations', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/occupations/problem', internalId: 'sql-125', type: 'sql' },
        ]
    },
    {
        id: 'wipro',
        name: 'Wipro',
        type: 'Service',
        icon: Database,
        color: 'text-green-500',
        dsa: [
            { title: 'Valid Anagram', difficulty: 'Easy', url: 'https://leetcode.com/problems/valid-anagram/', internalId: 432, type: 'dsa' },
            { title: 'First Unique Character in a String', difficulty: 'Easy', url: 'https://leetcode.com/problems/first-unique-character-in-a-string/', internalId: 433, type: 'dsa' },
            { title: 'Reverse String', difficulty: 'Easy', url: 'https://leetcode.com/problems/reverse-string/', internalId: 55, type: 'dsa' },
            { title: 'Fizz Buzz', difficulty: 'Easy', url: 'https://leetcode.com/problems/fizz-buzz/', internalId: 434, type: 'dsa' },
            { title: 'Majority Element', difficulty: 'Easy', url: 'https://leetcode.com/problems/majority-element/', internalId: 21, type: 'dsa' },
        ],
        sql: [
            { title: 'Average Population of Each Continent', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/average-population-of-each-continent/problem', internalId: 'sql-126', type: 'sql' },
            { title: 'The Report', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/the-report/problem', internalId: 'sql-127', type: 'sql' },
            { title: 'Population Census', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/asian-population/problem', internalId: 'sql-128', type: 'sql' },
            { title: 'African Cities', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/african-cities/problem', internalId: 'sql-129', type: 'sql' },
            { title: 'Type of Triangle', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/what-type-of-triangle/problem', internalId: 'sql-130', type: 'sql' },
        ]
    },
    {
        id: 'accenture',
        name: 'Accenture',
        type: 'Service',
        icon: Shield,
        color: 'text-purple-500',
        dsa: [
            { title: 'Count Primes', difficulty: 'Medium', url: 'https://leetcode.com/problems/count-primes/', internalId: 435, type: 'dsa' },
            { title: 'Rat in a Maze', difficulty: 'Medium', url: 'https://www.geeksforgeeks.org/problems/rat-in-a-maze-problem/1', internalId: 436, type: 'dsa' },
            { title: 'Find Duplicate Number', difficulty: 'Medium', url: 'https://leetcode.com/problems/find-the-duplicate-number/', internalId: 114, type: 'dsa' },
            { title: 'Rotate Image', difficulty: 'Medium', url: 'https://leetcode.com/problems/rotate-image/', internalId: 23, type: 'dsa' },
            { title: 'Set Matrix Zeroes', difficulty: 'Medium', url: 'https://leetcode.com/problems/set-matrix-zeroes/', internalId: 26, type: 'dsa' },
        ],
        sql: [
            { title: 'Binary Tree Nodes', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/binary-search-tree-1/problem', internalId: 'sql-131', type: 'sql' },
            { title: 'New Companies', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/the-company/problem', internalId: 'sql-132', type: 'sql' },
            { title: 'Weather Observation Station 18', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/weather-observation-station-18/problem', internalId: 'sql-133', type: 'sql' },
            { title: 'The PADS', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/the-pads/problem', internalId: 'sql-134', type: 'sql' },
            { title: 'Symmetric Pairs', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/symmetric-pairs/problem', internalId: 'sql-135', type: 'sql' },
        ]
    },
     {
        id: 'cognizant',
        name: 'Cognizant',
        type: 'Service',
        icon: Smartphone,
        color: 'text-teal-400',
        dsa: [
            { title: 'Binary Search', difficulty: 'Easy', url: 'https://leetcode.com/problems/binary-search/', internalId: 181, type: 'dsa' },
            { title: 'Search Insert Position', difficulty: 'Easy', url: 'https://leetcode.com/problems/search-insert-position/', internalId: 182, type: 'dsa' },
            { title: 'Merge Sorted Array', difficulty: 'Easy', url: 'https://leetcode.com/problems/merge-sorted-array/', internalId: 18, type: 'dsa' },
            { title: 'Pascal Triangle', difficulty: 'Easy', url: 'https://leetcode.com/problems/pascals-triangle/', internalId: 437, type: 'dsa' },
            { title: 'Remove Duplicates from Sorted Array', difficulty: 'Easy', url: 'https://leetcode.com/problems/remove-duplicates-from-sorted-array/', internalId: 12, type: 'dsa' },
        ],
        sql: [
            { title: 'Challenges', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/challenges/problem', internalId: 'sql-136', type: 'sql' },
            { title: 'Contest Leaderboard', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/contest-leaderboard/problem', internalId: 'sql-137', type: 'sql' },
            { title: 'Project Planning', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/projects/problem', internalId: 'sql-138', type: 'sql' },
            { title: 'Placements', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/placements/problem', internalId: 'sql-139', type: 'sql' },
            { title: 'Symmetric Pairs', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/symmetric-pairs/problem', internalId: 'sql-140', type: 'sql' },
        ]
    },
    {
        id: 'capgemini',
        name: 'Capgemini',
        type: 'Service',
        icon: PenTool,
        color: 'text-blue-500',
        dsa: [
            { title: 'Length of Last Word', difficulty: 'Easy', url: 'https://leetcode.com/problems/length-of-last-word/', internalId: 438, type: 'dsa' },
            { title: 'Plus One', difficulty: 'Easy', url: 'https://leetcode.com/problems/plus-one/', internalId: 42, type: 'dsa' },
            { title: 'Sqrt(x)', difficulty: 'Easy', url: 'https://leetcode.com/problems/sqrtx/', internalId: 184, type: 'dsa' },
            { title: 'Happy Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/happy-number/', internalId: 115, type: 'dsa' },
            { title: 'Remove Linked List Elements', difficulty: 'Easy', url: 'https://leetcode.com/problems/remove-linked-list-elements/', internalId: 439, type: 'dsa' },
        ],
        sql: [
            { title: 'Draw The Triangle 1', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/draw-the-triangle-1/problem', internalId: 'sql-141', type: 'sql' },
            { title: 'Draw The Triangle 2', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/draw-the-triangle-2/problem', internalId: 'sql-142', type: 'sql' },
            { title: 'Print Prime Numbers', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/print-prime-numbers/problem', internalId: 'sql-143', type: 'sql' },
            { title: 'Weather Observation Station 20', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/weather-observation-station-20/problem', internalId: 'sql-144', type: 'sql' },
            { title: 'Interviews', difficulty: 'Hard', url: 'https://www.hackerrank.com/challenges/interviews/problem', internalId: 'sql-145', type: 'sql' },
        ]
    },
    {
        id: 'hcl',
        name: 'HCL',
        type: 'Service',
        icon: Radio,
        color: 'text-pink-500',
        dsa: [
            { title: 'Factorial Trailing Zeroes', difficulty: 'Medium', url: 'https://leetcode.com/problems/factorial-trailing-zeroes/', internalId: 440, type: 'dsa' },
            { title: 'Excel Sheet Column Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/excel-sheet-column-number/', internalId: 441, type: 'dsa' },
            { title: 'Isomorphic Strings', difficulty: 'Easy', url: 'https://leetcode.com/problems/isomorphic-strings/', internalId: 442, type: 'dsa' },
            { title: 'Contains Duplicate', difficulty: 'Easy', url: 'https://leetcode.com/problems/contains-duplicate/', internalId: 3, type: 'dsa' },
            { title: 'Power of Three', difficulty: 'Easy', url: 'https://leetcode.com/problems/power-of-three/', internalId: 443, type: 'dsa' },
        ],
        sql: [
            { title: '15 Days of Learning SQL', difficulty: 'Hard', url: 'https://www.hackerrank.com/challenges/15-days-of-learning-sql/problem', internalId: 'sql-146', type: 'sql' },
            { title: 'SQL Project Planning', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/sql-projects/problem', internalId: 'sql-147', type: 'sql' },
            { title: 'Ollivander\'s Inventory', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/harry-potter-and-wands/problem', internalId: 'sql-148', type: 'sql' },
            { title: 'Top Competitors', difficulty: 'Medium', url: 'https://www.hackerrank.com/challenges/full-score/problem', internalId: 'sql-149', type: 'sql' },
            { title: 'The Blunder', difficulty: 'Easy', url: 'https://www.hackerrank.com/challenges/the-blunder/problem', internalId: 'sql-150', type: 'sql' },
        ]
    }
];
