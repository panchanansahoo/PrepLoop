// ─── Interview Modes Data ───────────────────────────────────────────────────
// Central data for Debugging Interview, Code Review, Live Coding Copilot,
// and Interview-to-Learning link modules.

// ─── BUG CATEGORIES ─────────────────────────────────────────────────────────
export const BUG_CATEGORIES = [
  { id: 'off-by-one', label: 'Off-by-One', icon: '🎯', color: '#f59e0b' },
  { id: 'null-ref', label: 'Null Reference', icon: '💀', color: '#ef4444' },
  { id: 'infinite-loop', label: 'Infinite Loop', icon: '🔄', color: '#8b5cf6' },
  { id: 'wrong-ds', label: 'Wrong Data Structure', icon: '📦', color: '#3b82f6' },
  { id: 'logic-error', label: 'Logic Error', icon: '🧩', color: '#ec4899' },
  { id: 'edge-case', label: 'Unhandled Edge Case', icon: '🧊', color: '#06b6d4' },
  { id: 'concurrency', label: 'Race Condition', icon: '🏎️', color: '#f97316' },
  { id: 'memory-leak', label: 'Memory / Resource Leak', icon: '💧', color: '#14b8a6' },
];

// ─── DEBUGGING CHALLENGES ───────────────────────────────────────────────────
export const DEBUGGING_CHALLENGES = [
  // ── Python ────
  {
    id: 'dbg-py-001',
    language: 'python',
    title: 'Binary Search — Off-by-One',
    difficulty: 'Easy',
    bugCategory: 'off-by-one',
    description: 'This binary search should return the index of a target value in a sorted array, or -1 if not found. It has a subtle off-by-one bug that causes it to miss certain elements.',
    brokenCode: `def binary_search(arr, target):
    left, right = 0, len(arr)
    while left < right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid
        else:
            right = mid
    return -1

# Test: binary_search([1,3,5,7,9], 7) should return 3
# Bug: infinite loop or misses elements`,
    fixedCode: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
    explanation: 'Three bugs: (1) right should be len(arr)-1 for inclusive bounds, (2) the while condition should be <= not <, (3) left should advance to mid+1 and right to mid-1 to avoid infinite loops.',
    hints: ['Check the initial bounds — is right pointing past the array?', 'What happens when left==right? Should the loop still run?', 'If arr[mid] < target, does left=mid actually make progress?'],
    relatedConceptId: 'binary-search',
    errorLines: [2, 3, 7, 9],
  },
  {
    id: 'dbg-py-002',
    language: 'python',
    title: 'Two Sum — Wrong Return',
    difficulty: 'Easy',
    bugCategory: 'logic-error',
    description: 'This Two Sum implementation should return indices of two numbers that add up to the target. It has a logic error in how it checks and stores values.',
    brokenCode: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        seen[num] = i
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
    return []

# Test: two_sum([2,7,11,15], 9) should return [0,1]
# Bug: can return same index twice`,
    fixedCode: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    explanation: 'The bug is that we store the current number BEFORE checking for its complement. This means when target=6 and num=3, it finds itself as the complement. The fix is to check for complement first, then store.',
    hints: ['What if the array is [3,3] and target is 6?', 'When should you add the number to the dictionary?'],
    relatedConceptId: 'hash-map',
    errorLines: [4, 5, 6],
  },
  {
    id: 'dbg-py-003',
    language: 'python',
    title: 'Merge Sorted Lists — Missing Tail',
    difficulty: 'Medium',
    bugCategory: 'edge-case',
    description: 'Merging two sorted linked lists. The function drops the remaining nodes when one list is exhausted.',
    brokenCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def merge_two_lists(l1, l2):
    dummy = ListNode(0)
    curr = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            curr.next = l1
            l1 = l1.next
        else:
            curr.next = l2
            l2 = l2.next
        curr = curr.next
    # Bug: remaining nodes are lost
    return dummy.next`,
    fixedCode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def merge_two_lists(l1, l2):
    dummy = ListNode(0)
    curr = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            curr.next = l1
            l1 = l1.next
        else:
            curr.next = l2
            l2 = l2.next
        curr = curr.next
    curr.next = l1 if l1 else l2
    return dummy.next`,
    explanation: 'After the while loop, one of the lists may still have remaining nodes. We need to append the remaining list to curr. The fix is: curr.next = l1 if l1 else l2.',
    hints: ['What happens when one list is longer than the other?', 'After the while loop, are all nodes accounted for?'],
    relatedConceptId: 'linked-list',
    errorLines: [18],
  },
  {
    id: 'dbg-py-004',
    language: 'python',
    title: 'LRU Cache — Stale Ordering',
    difficulty: 'Hard',
    bugCategory: 'logic-error',
    description: 'This LRU Cache does not properly update access order when an existing key is retrieved.',
    brokenCode: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key in self.cache:
            return self.cache[key]
        return -1

    def put(self, key, value):
        if key in self.cache:
            self.cache[key] = value
        else:
            if len(self.cache) >= self.capacity:
                self.cache.popitem(last=False)
            self.cache[key] = value`,
    fixedCode: `from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]
        return -1

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
            self.cache[key] = value
        else:
            if len(self.cache) >= self.capacity:
                self.cache.popitem(last=False)
            self.cache[key] = value`,
    explanation: 'In get(), accessing a key should mark it as recently used by calling move_to_end(). In put(), updating an existing key should also move it to the end. Without these, the eviction order is wrong.',
    hints: ['What does "least recently used" mean for both reads and writes?', 'Does OrderedDict track access or insertion order?'],
    relatedConceptId: 'lru-cache',
    errorLines: [10, 15],
  },

  // ── JavaScript ────
  {
    id: 'dbg-js-001',
    language: 'javascript',
    title: 'Debounce — Lost Context',
    difficulty: 'Medium',
    bugCategory: 'logic-error',
    description: 'This debounce function loses the correct `this` context and arguments when the debounced function is finally called.',
    brokenCode: `function debounce(fn, delay) {
  let timer;
  return function() {
    clearTimeout(timer);
    timer = setTimeout(function() {
      fn();
    }, delay);
  };
}

// Usage: const debouncedSearch = debounce(search, 300);
// Bug: 'this' context and arguments are lost`,
    fixedCode: `function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}`,
    explanation: 'Two bugs: (1) The inner function doesn\'t capture arguments — use rest params (...args). (2) The setTimeout callback uses a regular function so \'this\' is lost — use an arrow function and fn.apply(this, args).',
    hints: ['How does setTimeout affect the value of `this`?', 'Are the original arguments passed through?'],
    relatedConceptId: 'closures',
    errorLines: [3, 5, 6],
  },
  {
    id: 'dbg-js-002',
    language: 'javascript',
    title: 'Promise.all — Silent Failures',
    difficulty: 'Medium',
    bugCategory: 'edge-case',
    description: 'This parallel API fetcher silently swallows errors, returning partial results without the caller knowing.',
    brokenCode: `async function fetchAllUsers(userIds) {
  const results = [];
  const promises = userIds.map(async (id) => {
    try {
      const res = await fetch(\`/api/users/\${id}\`);
      const data = await res.json();
      results.push(data);
    } catch (e) {
      // silently ignore
    }
  });
  await Promise.all(promises);
  return results;
}
// Bug: results order doesn't match input order
// Bug: errors are silently swallowed`,
    fixedCode: `async function fetchAllUsers(userIds) {
  const promises = userIds.map(async (id) => {
    const res = await fetch(\`/api/users/\${id}\`);
    if (!res.ok) throw new Error(\`Failed to fetch user \${id}: \${res.status}\`);
    return res.json();
  });

  const results = await Promise.allSettled(promises);
  return results.map((r, i) => ({
    userId: userIds[i],
    status: r.status,
    data: r.status === 'fulfilled' ? r.value : null,
    error: r.status === 'rejected' ? r.reason.message : null,
  }));
}`,
    explanation: 'Three bugs: (1) push() doesn\'t preserve order — map index should be used. (2) Errors are silently caught. (3) res.ok is not checked. Fix: use Promise.allSettled, return structured results with status.',
    hints: ['Does Array.push inside async callbacks preserve order?', 'Should the caller know if some fetches failed?'],
    relatedConceptId: 'async-patterns',
    errorLines: [2, 7, 9],
  },
  {
    id: 'dbg-js-003',
    language: 'javascript',
    title: 'Deep Clone — Circular Reference Crash',
    difficulty: 'Hard',
    bugCategory: 'infinite-loop',
    description: 'This deep clone function crashes with a stack overflow on objects with circular references.',
    brokenCode: `function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  
  const clone = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  return clone;
}
// const a = { x: 1 }; a.self = a;
// deepClone(a) -> stack overflow!`,
    fixedCode: `function deepClone(obj, seen = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return seen.get(obj);
  
  if (Array.isArray(obj)) {
    const arrClone = [];
    seen.set(obj, arrClone);
    obj.forEach((item, i) => { arrClone[i] = deepClone(item, seen); });
    return arrClone;
  }
  
  const clone = {};
  seen.set(obj, clone);
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clone[key] = deepClone(obj[key], seen);
    }
  }
  return clone;
}`,
    explanation: 'Circular references cause infinite recursion. The fix is to use a WeakMap to track already-cloned objects. Before recursing, check if we\'ve seen the object; if so, return the cached clone.',
    hints: ['What happens when obj.self === obj?', 'How can you detect you\'ve already visited an object?'],
    relatedConceptId: 'recursion',
    errorLines: [1, 3, 8],
  },

  // ── Java ────
  {
    id: 'dbg-java-001',
    language: 'java',
    title: 'ConcurrentModificationException',
    difficulty: 'Medium',
    bugCategory: 'concurrency',
    description: 'This code throws ConcurrentModificationException when removing elements from a list during iteration.',
    brokenCode: `import java.util.*;

public class FilterUsers {
    public static List<String> removeInactive(List<String> users) {
        for (String user : users) {
            if (user.startsWith("inactive_")) {
                users.remove(user);
            }
        }
        return users;
    }
    // Test: removeInactive(Arrays.asList("active_alice","inactive_bob"))
    // Throws ConcurrentModificationException
}`,
    fixedCode: `import java.util.*;

public class FilterUsers {
    public static List<String> removeInactive(List<String> users) {
        Iterator<String> it = users.iterator();
        while (it.hasNext()) {
            if (it.next().startsWith("inactive_")) {
                it.remove();
            }
        }
        return users;
    }
    // Alternative: users.removeIf(u -> u.startsWith("inactive_"));
}`,
    explanation: 'Enhanced for-loop uses an Iterator internally. Calling list.remove() during iteration invalidates the iterator. Use Iterator.remove() directly, or use List.removeIf() for a cleaner solution.',
    hints: ['Can you modify a collection while looping over it?', 'What class actually powers the for-each loop?'],
    relatedConceptId: 'iterators',
    errorLines: [5, 7],
  },

  // ── C++ ────
  {
    id: 'dbg-cpp-001',
    language: 'cpp',
    title: 'Use-After-Free — Dangling Iterator',
    difficulty: 'Hard',
    bugCategory: 'memory-leak',
    description: 'This code uses an iterator after the vector has been modified, causing undefined behavior.',
    brokenCode: `#include <vector>
#include <iostream>
using namespace std;

void removeEvens(vector<int>& nums) {
    for (auto it = nums.begin(); it != nums.end(); ++it) {
        if (*it % 2 == 0) {
            nums.erase(it);
        }
    }
}
// Test: {1,2,3,4,5} -> should be {1,3,5}
// Bug: iterator invalidated after erase`,
    fixedCode: `#include <vector>
#include <iostream>
using namespace std;

void removeEvens(vector<int>& nums) {
    for (auto it = nums.begin(); it != nums.end(); ) {
        if (*it % 2 == 0) {
            it = nums.erase(it);
        } else {
            ++it;
        }
    }
}
// Or use erase-remove idiom:
// nums.erase(remove_if(nums.begin(), nums.end(), 
//     [](int n){ return n%2==0; }), nums.end());`,
    explanation: 'vector::erase invalidates the iterator and all iterators after it. The fix is to use the return value of erase (which is the next valid iterator) and only increment when not erasing.',
    hints: ['What does erase() return?', 'Is it safe to use ++it after erasing?'],
    relatedConceptId: 'iterators',
    errorLines: [6, 8],
  },
];

// ─── CODE REVIEW SCENARIOS ─────────────────────────────────────────────────
export const CODE_REVIEW_SCENARIOS = [
  {
    id: 'cr-001',
    title: 'User Authentication Endpoint',
    domain: 'backend',
    difficulty: 'Medium',
    language: 'javascript',
    description: 'Review this Express.js login endpoint for security, error handling, and code quality issues.',
    code: `app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await db.query('SELECT * FROM users WHERE email = "' + email + '"');
  
  if (user.length === 0) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  if (user[0].password === password) {
    const token = jwt.sign({ id: user[0].id, role: user[0].role }, 'my-secret-key');
    res.json({ token, user: user[0] });
  } else {
    res.status(401).json({ error: 'Wrong password' });
  }
});`,
    issues: [
      { line: 4, severity: 'critical', type: 'security', description: 'SQL injection vulnerability — string concatenation in query', suggestion: 'Use parameterized queries: db.query("SELECT * FROM users WHERE email = ?", [email])' },
      { line: 9, severity: 'critical', type: 'security', description: 'Plain text password comparison — no hashing', suggestion: 'Use bcrypt.compare(password, user[0].password_hash)' },
      { line: 10, severity: 'critical', type: 'security', description: 'Hardcoded JWT secret', suggestion: 'Use environment variable: process.env.JWT_SECRET' },
      { line: 11, severity: 'major', type: 'security', description: 'Returns entire user object including password', suggestion: 'Destructure and return only safe fields: { id, email, name }' },
      { line: 6, severity: 'major', type: 'security', description: 'Error message reveals whether email exists (user enumeration)', suggestion: 'Use generic message: "Invalid credentials"' },
      { line: 13, severity: 'major', type: 'security', description: 'Different error messages for email vs password leaks info', suggestion: 'Same generic error for both cases' },
      { line: 1, severity: 'minor', type: 'quality', description: 'No input validation for email/password', suggestion: 'Validate with express-validator or joi' },
      { line: 1, severity: 'minor', type: 'quality', description: 'No try/catch for database errors', suggestion: 'Wrap in try/catch, return 500 on DB errors' },
      { line: 10, severity: 'minor', type: 'quality', description: 'No token expiry set', suggestion: 'Add expiresIn: jwt.sign({...}, secret, { expiresIn: "1h" })' },
    ],
    modelReviewSummary: 'This endpoint has 3 critical security vulnerabilities (SQL injection, plain-text passwords, hardcoded secrets) and several information-leaking error messages. The code works functionally but would be a serious security risk in production.',
    aiQuestions: [
      'What would happen if an attacker sends email = `" OR 1=1 --"` ?',
      'Why is comparing passwords directly a bad practice?',
      'What information does the error message on line 6 reveal to an attacker?',
      'How would you handle token expiration and refresh?',
      'What happens if the database query throws an error?',
    ],
  },
  {
    id: 'cr-002',
    title: 'React Component — User Profile Card',
    domain: 'frontend',
    difficulty: 'Easy',
    language: 'javascript',
    description: 'Review this React component for performance, accessibility, and code quality.',
    code: `import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('/api/users/' + userId).then(r => r.json()).then(setUser);
    fetch('/api/users/' + userId + '/posts').then(r => r.json()).then(setPosts);
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div onClick={() => window.location.href = '/users/' + userId}>
      <img src={user?.avatar} />
      <h2>{user?.name}</h2>
      <p>Joined: {user && formatDate(user.joinedAt)}</p>
      <div>
        {posts.map(post => (
          <div>
            <h3>{post.title}</h3>
            <p>{post.body.substring(0, 100)}...</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
    issues: [
      { line: 10, severity: 'critical', type: 'performance', description: 'Missing dependency array in useEffect — causes infinite re-renders', suggestion: 'Add [userId] as dependency: useEffect(() => {...}, [userId])' },
      { line: 8, severity: 'major', type: 'quality', description: 'No error handling on fetch calls', suggestion: 'Add .catch() or try/catch, show error state' },
      { line: 19, severity: 'major', type: 'accessibility', description: 'Using onClick on a div for navigation — not keyboard accessible', suggestion: 'Use <Link> or <a> tag for navigation' },
      { line: 20, severity: 'major', type: 'accessibility', description: 'Image without alt text', suggestion: 'Add alt={`${user.name} avatar`}' },
      { line: 25, severity: 'minor', type: 'quality', description: 'Missing key prop on mapped elements', suggestion: 'Add key={post.id} to the mapped div' },
      { line: 27, severity: 'minor', type: 'quality', description: 'No null check on post.body — will crash if body is undefined', suggestion: 'Add optional chaining: post.body?.substring(0, 100)' },
      { line: 12, severity: 'nit', type: 'quality', description: 'formatDate is recreated on every render', suggestion: 'Move outside component or memoize with useCallback' },
    ],
    modelReviewSummary: 'Critical performance bug (infinite re-renders from missing useEffect deps), accessibility issues, and no error handling. Clean structure but needs defensive coding.',
    aiQuestions: [
      'What happens if you open DevTools network tab with this component?',
      'How would a screen reader user navigate this component?',
      'What happens if the API returns an error?',
      'Why is the list rendering without a key a problem?',
    ],
  },
  {
    id: 'cr-003',
    title: 'Database Query — Analytics Report',
    domain: 'database',
    difficulty: 'Hard',
    language: 'javascript',
    description: 'Review this analytics query builder for performance and correctness at scale.',
    code: `async function getAnalyticsReport(startDate, endDate, filters) {
  const users = await db.query('SELECT * FROM users');
  
  let report = [];
  for (const user of users) {
    const orders = await db.query(
      'SELECT * FROM orders WHERE user_id = ' + user.id +
      ' AND created_at BETWEEN "' + startDate + '" AND "' + endDate + '"'
    );
    
    let totalSpend = 0;
    for (const order of orders) {
      const items = await db.query('SELECT * FROM order_items WHERE order_id = ' + order.id);
      for (const item of items) {
        totalSpend += item.price * item.quantity;
      }
    }
    
    if (totalSpend > 0) {
      report.push({
        userId: user.id,
        name: user.name,
        email: user.email,
        totalSpend,
        orderCount: orders.length,
        avgOrderValue: totalSpend / orders.length
      });
    }
  }
  
  report.sort((a, b) => b.totalSpend - a.totalSpend);
  return report;
}`,
    issues: [
      { line: 2, severity: 'critical', type: 'performance', description: 'SELECT * FROM users loads entire user table into memory', suggestion: 'Add WHERE clause, pagination, or stream results' },
      { line: 6, severity: 'critical', type: 'performance', description: 'N+1 query problem — one query per user inside a loop', suggestion: 'Use a single JOIN query or batch IDs' },
      { line: 13, severity: 'critical', type: 'performance', description: 'N+1 within N+1 — triple nested queries (users × orders × items)', suggestion: 'Single query with JOINs: users JOIN orders JOIN order_items' },
      { line: 7, severity: 'critical', type: 'security', description: 'SQL injection via string concatenation', suggestion: 'Use parameterized queries' },
      { line: 2, severity: 'major', type: 'quality', description: 'SELECT * fetches unnecessary columns', suggestion: 'Select only needed columns: id, name, email' },
      { line: 26, severity: 'minor', type: 'quality', description: 'Division by zero if orders.length is 0', suggestion: 'Already guarded by totalSpend > 0, but add explicit check' },
      { line: 31, severity: 'minor', type: 'performance', description: 'Sorting in JS instead of DB', suggestion: 'Use ORDER BY in SQL for better performance at scale' },
    ],
    modelReviewSummary: 'Catastrophic N+1+1 query pattern that will be O(users × orders) database round trips. At scale (100k users, 10 orders each), this generates ~1 million queries. Must be refactored to a single JOIN query.',
    aiQuestions: [
      'How many database queries does this execute for 1000 users with 10 orders each?',
      'How would you rewrite this as a single SQL query?',
      'What happens when this runs against a production database with 1M users?',
      'Is the sort at the end efficient? Where should it happen?',
    ],
  },
  {
    id: 'cr-004',
    title: 'Rate Limiter Implementation',
    domain: 'backend',
    difficulty: 'Hard',
    language: 'javascript',
    description: 'Review this token bucket rate limiter for correctness, thread safety, and edge cases.',
    code: `class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.limits = {};
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(clientId) {
    const now = Date.now();
    
    if (!this.limits[clientId]) {
      this.limits[clientId] = { count: 1, startTime: now };
      return true;
    }

    const client = this.limits[clientId];
    
    if (now - client.startTime > this.windowMs) {
      client.count = 1;
      client.startTime = now;
      return true;
    }

    client.count++;
    return client.count <= this.maxRequests;
  }
}

// Usage: const limiter = new RateLimiter(100, 60000);
// limiter.isAllowed('user-123')`,
    issues: [
      { line: 3, severity: 'critical', type: 'performance', description: 'Memory leak — old client entries are never cleaned up', suggestion: 'Add periodic cleanup with setInterval or LRU eviction' },
      { line: 23, severity: 'major', type: 'quality', description: 'Count incremented before check — client gets maxRequests+1 passes', suggestion: 'Check first, then increment: if (client.count >= max) return false; client.count++; return true;' },
      { line: 8, severity: 'major', type: 'quality', description: 'Fixed window limit — allows 2x burst at boundary', suggestion: 'Use sliding window or sliding window log algorithm' },
      { line: 1, severity: 'minor', type: 'quality', description: 'No way to reset or remove a specific client', suggestion: 'Add reset(clientId) and clear() methods' },
      { line: 17, severity: 'nit', type: 'quality', description: 'Magic number comparison could be clearer', suggestion: 'Extract as isWindowExpired() helper method' },
    ],
    modelReviewSummary: 'Working basic rate limiter but has a memory leak (stale clients never removed), off-by-one in the count check, and the fixed-window approach allows burst attacks at window boundaries.',
    aiQuestions: [
      'What happens after 1 million unique clients use this rate limiter?',
      'If the window is 1 minute, can a client send 200 requests in 2 seconds at the boundary?',
      'How would you make this work across multiple server instances?',
    ],
  },
];

// ─── SCORING RUBRICS ────────────────────────────────────────────────────────
export const SCORING_RUBRICS = {
  liveCoding: {
    axes: [
      { id: 'syntax', label: 'Syntax Quality', weight: 0.2, icon: '🎯', color: '#22c55e', description: 'Variable naming, formatting, bracket hygiene, code style' },
      { id: 'testDiscipline', label: 'Test Discipline', weight: 0.25, icon: '🧪', color: '#3b82f6', description: 'Writing tests, edge case coverage, assertion patterns' },
      { id: 'complexity', label: 'Complexity Thinking', weight: 0.30, icon: '🧠', color: '#8b5cf6', description: 'Algorithm choice, time/space analysis, optimization' },
      { id: 'debugging', label: 'Debugging Behavior', weight: 0.25, icon: '🐛', color: '#f59e0b', description: 'Systematic debugging, console/log placement, error handling' },
    ],
  },
  debugging: {
    axes: [
      { id: 'bugId', label: 'Bug Identification', weight: 0.30, icon: '🔍', color: '#ef4444', description: 'Correctly identified the root cause' },
      { id: 'fixQuality', label: 'Fix Quality', weight: 0.30, icon: '🔧', color: '#22c55e', description: 'Fix is correct, minimal, and doesn\'t introduce new bugs' },
      { id: 'optimization', label: 'Optimization', weight: 0.20, icon: '⚡', color: '#f59e0b', description: 'Improved performance or code quality beyond the fix' },
      { id: 'explanation', label: 'Explanation Clarity', weight: 0.20, icon: '💬', color: '#3b82f6', description: 'Clear, structured explanation of the bug and fix' },
    ],
  },
  codeReview: {
    axes: [
      { id: 'coverage', label: 'Issue Coverage', weight: 0.30, icon: '🎯', color: '#22c55e', description: 'Percentage of issues found' },
      { id: 'severity', label: 'Severity Accuracy', weight: 0.25, icon: '⚠️', color: '#f59e0b', description: 'Correctly prioritized critical vs minor issues' },
      { id: 'communication', label: 'Communication', weight: 0.25, icon: '💬', color: '#3b82f6', description: 'Clear, constructive feedback with suggestions' },
      { id: 'depth', label: 'Technical Depth', weight: 0.20, icon: '🧠', color: '#8b5cf6', description: 'Understanding of underlying systems and tradeoffs' },
    ],
  },
};

// ─── CONCEPT → LEARNING PATH MAPPING ────────────────────────────────────────
export const CONCEPT_LEARNING_MAP = {
  'binary-search': { path: '/dsa-path/binary-search', label: 'Binary Search', category: 'DSA', practiceIds: ['binary-search', 'search-in-rotated-sorted-array'] },
  'hash-map': { path: '/dsa-path/hash-tables', label: 'Hash Maps & Sets', category: 'DSA', practiceIds: ['two-sum', 'group-anagrams'] },
  'linked-list': { path: '/dsa-path/linked-lists', label: 'Linked Lists', category: 'DSA', practiceIds: ['merge-two-sorted-lists', 'reverse-linked-list'] },
  'lru-cache': { path: '/dsa-path/design', label: 'LRU Cache Design', category: 'DSA', practiceIds: ['lru-cache'] },
  'closures': { path: '/technical-path/javascript-fundamentals', label: 'Closures & Scope', category: 'Technical', practiceIds: [] },
  'async-patterns': { path: '/technical-path/async-programming', label: 'Async Patterns', category: 'Technical', practiceIds: [] },
  'recursion': { path: '/dsa-path/recursion', label: 'Recursion & Backtracking', category: 'DSA', practiceIds: ['permutations', 'subsets'] },
  'iterators': { path: '/technical-path/java-collections', label: 'Iterators & Collections', category: 'Technical', practiceIds: [] },
  'sql-injection': { path: '/technical-path/web-security', label: 'SQL Injection Prevention', category: 'Security', practiceIds: [] },
  'n-plus-one': { path: '/technical-path/database-optimization', label: 'N+1 Query Problem', category: 'Database', practiceIds: [] },
  'rate-limiting': { path: '/system-design/rate-limiter', label: 'Rate Limiting Patterns', category: 'System Design', practiceIds: [] },
  'trees': { path: '/dsa-path/trees', label: 'Trees & BST', category: 'DSA', practiceIds: ['validate-bst', 'level-order-traversal'] },
  'graphs': { path: '/dsa-path/graphs', label: 'Graph Algorithms', category: 'DSA', practiceIds: ['number-of-islands', 'course-schedule'] },
  'dynamic-programming': { path: '/dsa-path/dynamic-programming', label: 'Dynamic Programming', category: 'DSA', practiceIds: ['climbing-stairs', 'longest-common-subsequence'] },
  'sliding-window': { path: '/dsa-path/sliding-window', label: 'Sliding Window', category: 'DSA', practiceIds: ['max-subarray', 'minimum-window-substring'] },
  'two-pointers': { path: '/dsa-path/two-pointers', label: 'Two Pointers', category: 'DSA', practiceIds: ['container-with-most-water', 'three-sum'] },
  'stacks-queues': { path: '/dsa-path/stacks-queues', label: 'Stacks & Queues', category: 'DSA', practiceIds: ['valid-parentheses', 'min-stack'] },
  'sorting': { path: '/dsa-path/sorting', label: 'Sorting Algorithms', category: 'DSA', practiceIds: ['merge-sort', 'quick-sort'] },
  'system-design-basics': { path: '/system-design/fundamentals', label: 'System Design Fundamentals', category: 'System Design', practiceIds: [] },
  'caching': { path: '/system-design/caching', label: 'Caching Strategies', category: 'System Design', practiceIds: [] },
  'load-balancing': { path: '/system-design/load-balancing', label: 'Load Balancing', category: 'System Design', practiceIds: [] },
  'message-queues': { path: '/system-design/message-queues', label: 'Message Queues', category: 'System Design', practiceIds: [] },
};
