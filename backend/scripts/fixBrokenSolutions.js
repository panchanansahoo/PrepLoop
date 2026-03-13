/**
 * Fix all broken solutions and null test cases in Supabase
 * 
 * 1. Replaces 14 single-line syntax error solutions with proper multi-line Python
 * 2. Removes test cases with null expected output from all problems
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

// =====================================================
// 1. Fix 14 syntax error solutions (single-line → multi-line)
// =====================================================
const fixedSolutions = {
    // ID 20: Next Permutation
    20: `class Solution:
    def nextPermutation(self, nums):
        n = len(nums)
        i = n - 2
        while i >= 0 and nums[i] >= nums[i + 1]:
            i -= 1
        if i >= 0:
            j = n - 1
            while nums[j] <= nums[i]:
                j -= 1
            nums[i], nums[j] = nums[j], nums[i]
        left, right = i + 1, n - 1
        while left < right:
            nums[left], nums[right] = nums[right], nums[left]
            left += 1
            right -= 1`,

    // ID 24: Merge Sorted Array
    24: `class Solution:
    def merge(self, nums1, m, nums2, n):
        nums1[:] = sorted(nums1[:m] + nums2[:n])`,

    // ID 34: Find First and Last Position of Element
    34: `class Solution:
    def searchRange(self, nums, target):
        def find_first():
            left, right = 0, len(nums) - 1
            result = -1
            while left <= right:
                mid = (left + right) // 2
                if nums[mid] == target:
                    result = mid
                    right = mid - 1
                elif nums[mid] < target:
                    left = mid + 1
                else:
                    right = mid - 1
            return result

        def find_last():
            left, right = 0, len(nums) - 1
            result = -1
            while left <= right:
                mid = (left + right) // 2
                if nums[mid] == target:
                    result = mid
                    left = mid + 1
                elif nums[mid] < target:
                    left = mid + 1
                else:
                    right = mid - 1
            return result

        first = find_first()
        last = find_last()
        return [first, last]`,

    // ID 35: Search a 2D Matrix
    35: `class Solution:
    def searchMatrix(self, matrix, target):
        if not matrix or not matrix[0]:
            return False
        m, n = len(matrix), len(matrix[0])
        left, right = 0, m * n - 1
        while left <= right:
            mid = (left + right) // 2
            mid_val = matrix[mid // n][mid % n]
            if mid_val == target:
                return True
            elif mid_val < target:
                left = mid + 1
            else:
                right = mid - 1
        return False`,

    // ID 41: Wiggle Sort II
    41: `class Solution:
    def wiggleSort(self, nums):
        arr = sorted(nums)
        mid = (len(nums) - 1) // 2
        j, k = mid, len(nums) - 1
        result = [0] * len(nums)
        for i in range(len(nums)):
            if i % 2 == 0:
                result[i] = arr[j]
                j -= 1
            else:
                result[i] = arr[k]
                k -= 1
        nums[:] = result`,

    // ID 44: Find All Numbers Disappeared in Array
    44: `class Solution:
    def findDisappearedNumbers(self, nums):
        mark = [0] * len(nums)
        for i in nums:
            mark[i - 1] = -1
        return [i + 1 for i, m in enumerate(mark) if m != -1]`,

    // ID 48: Plus One
    48: `class Solution:
    def plusOne(self, digits):
        num = int(''.join(map(str, digits))) + 1
        return [int(i) for i in str(num)]`,

    // ID 51: Non-overlapping Intervals
    51: `class Solution:
    def eraseOverlapIntervals(self, intervals):
        intervals.sort(key=lambda x: x[1])
        end = intervals[0][1]
        count = 0
        for i in range(1, len(intervals)):
            if intervals[i][0] >= end:
                end = intervals[i][1]
            else:
                count += 1
        return count`,

    // ID 74: Assign Cookies
    74: `class Solution:
    def findContentChildren(self, g, s):
        g.sort()
        s.sort()
        child = cookie = 0
        while child < len(g) and cookie < len(s):
            if s[cookie] >= g[child]:
                child += 1
            cookie += 1
        return child`,

    // ID 174: All O'one Data Structure (pattern 17)
    // Need to find the actual ID - let me query it

    // ID for Count of Smaller Numbers After Self (pattern 3)
    // Has syntax error: `left[0][1)` instead of `left[0][1]`

    // ID for Recover Binary Search Tree (pattern 18)
    // Has `self-node1` instead of `self.node1`

    // ID for Pacific Atlantic Water Flow (pattern 19)
    // Single-line class definition

    // ID for Find if Path Exists in Graph (pattern 19)
    // Single-line class definition
};

async function fixSyntaxErrors() {
    console.log('\n=== Phase 2: Fixing Syntax Error Solutions ===\n');

    // First, let's find the remaining IDs by checking runtime_error problems
    const { data: problems } = await supabase
        .from('problems')
        .select('id, title, solution_code')
        .in('id', [20, 24, 34, 35, 41, 44, 48, 51, 74]);

    let fixed = 0;
    for (const p of problems || []) {
        const sol = fixedSolutions[p.id];
        if (!sol) continue;

        const existingSol = p.solution_code || {};
        existingSol.python = sol;

        const { error } = await supabase
            .from('problems')
            .update({ solution_code: existingSol })
            .eq('id', p.id);

        if (error) {
            console.log(`  ❌ ${p.title}: ${error.message}`);
        } else {
            console.log(`  ✅ Fixed: ${p.title}`);
            fixed++;
        }
    }

    // Now find and fix the remaining runtime error solutions
    // Query all problems and check which ones have single-line class definitions
    const { data: allProblems } = await supabase
        .from('problems')
        .select('id, title, solution_code, test_cases, starter_code');

    for (const p of allProblems || []) {
        if (fixedSolutions[p.id]) continue; // Already handled
        const sol = p.solution_code?.python;
        if (!sol) continue;

        // Check if it's a single-line class definition that would cause syntax error
        if (sol.includes('class Solution:') && !sol.includes('\n')) {
            console.log(`  ⚠️  Single-line solution found: ${p.title} (ID: ${p.id})`);

            // Try to auto-fix by adding newlines after colons and semicolons
            let fixedCode = autoFormatSingleLine(sol, p);
            if (fixedCode) {
                const existingSol = p.solution_code || {};
                existingSol.python = fixedCode;

                const { error } = await supabase
                    .from('problems')
                    .update({ solution_code: existingSol })
                    .eq('id', p.id);

                if (error) {
                    console.log(`    ❌ Failed to fix: ${error.message}`);
                } else {
                    console.log(`    ✅ Auto-fixed`);
                    fixed++;
                }
            }
        }
    }

    console.log(`\n  Total fixed: ${fixed}`);
    return fixed;
}

function autoFormatSingleLine(code, problem) {
    // Attempt to rewrite common single-line class patterns into multiline
    // This is best-effort; we provide manual overrides where possible

    const manualFixes = {
        // All O'one Data Structure - too complex for auto-fix, provide manual
        "All O'one Data Structure": `class Solution:
    def __init__(self):
        self.d = {}
        self.min_val = 0
        self.max_val = 0
    
    def inc(self, key):
        self.d[key] = self.d.get(key, 0) + 1
        self.max_val = max(self.max_val, self.d[key])
        if self.min_val == 0:
            self.min_val = 1
    
    def dec(self, key):
        if key in self.d:
            self.d[key] -= 1
            if self.d[key] == 0:
                del self.d[key]
    
    def getMaxKey(self):
        if not self.d:
            return ""
        return max(self.d, key=self.d.get)
    
    def getMinKey(self):
        if not self.d:
            return ""
        return min(self.d, key=self.d.get)`,

        "Count of Smaller Numbers After Self": `class Solution:
    def countSmaller(self, nums):
        def merge_sort(arr):
            if len(arr) <= 1:
                return arr
            mid = len(arr) // 2
            left = merge_sort(arr[:mid])
            right = merge_sort(arr[mid:])
            result = []
            i = j = 0
            while i < len(left) and j < len(right):
                if left[i][1] <= right[j][1]:
                    counts[left[i][0]] += j
                    result.append(left[i])
                    i += 1
                else:
                    result.append(right[j])
                    j += 1
            while i < len(left):
                counts[left[i][0]] += j
                result.append(left[i])
                i += 1
            while j < len(right):
                result.append(right[j])
                j += 1
            return result
        
        counts = [0] * len(nums)
        indexed = [(i, v) for i, v in enumerate(nums)]
        merge_sort(indexed)
        return counts`,

        "Recover Binary Search Tree": `class Solution:
    def recoverTree(self, root):
        self.first = None
        self.second = None
        self.prev = TreeNode(float('-inf'))
        
        def inorder(node):
            if not node:
                return
            inorder(node.left)
            if self.prev.val > node.val:
                if not self.first:
                    self.first = self.prev
                self.second = node
            self.prev = node
            inorder(node.right)
        
        inorder(root)
        if self.first and self.second:
            self.first.val, self.second.val = self.second.val, self.first.val`,

        "Pacific Atlantic Water Flow": `class Solution:
    def pacificAtlantic(self, heights):
        if not heights:
            return []
        H, W = len(heights), len(heights[0])
        pacific = set()
        atlantic = set()
        
        def dfs(r, c, reachable, prev_height):
            if (r, c) in reachable or r < 0 or c < 0 or r >= H or c >= W or heights[r][c] < prev_height:
                return
            reachable.add((r, c))
            for dr, dc in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                dfs(r + dr, c + dc, reachable, heights[r][c])
        
        for i in range(H):
            dfs(i, 0, pacific, heights[i][0])
            dfs(i, W - 1, atlantic, heights[i][W - 1])
        for j in range(W):
            dfs(0, j, pacific, heights[0][j])
            dfs(H - 1, j, atlantic, heights[H - 1][j])
        
        return [list(x) for x in pacific & atlantic]`,

        "Find if Path Exists in Graph": `class Solution:
    def validPath(self, n, edges, source, destination):
        from collections import defaultdict, deque
        graph = defaultdict(list)
        for u, v in edges:
            graph[u].append(v)
            graph[v].append(u)
        visited = set()
        queue = deque([source])
        visited.add(source)
        while queue:
            node = queue.popleft()
            if node == destination:
                return True
            for neighbor in graph[node]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        return False`,
    };

    if (manualFixes[problem.title]) {
        return manualFixes[problem.title];
    }

    return null;
}

// =====================================================
// 2. Fix test cases with null expected output
// =====================================================
async function fixNullTestCases() {
    console.log('\n=== Phase 3: Fixing Null Expected Test Cases ===\n');

    const { data: problems } = await supabase
        .from('problems')
        .select('id, title, test_cases');

    let fixed = 0;
    for (const p of problems || []) {
        if (!p.test_cases || !Array.isArray(p.test_cases)) continue;

        const originalLen = p.test_cases.length;
        const cleanedTCs = p.test_cases.filter(tc => tc.output !== null && tc.output !== undefined);

        if (cleanedTCs.length < originalLen && cleanedTCs.length > 0) {
            const { error } = await supabase
                .from('problems')
                .update({ test_cases: cleanedTCs })
                .eq('id', p.id);

            if (error) {
                console.log(`  ❌ ${p.title}: ${error.message}`);
            } else {
                console.log(`  ✅ ${p.title}: removed ${originalLen - cleanedTCs.length} null TCs (${cleanedTCs.length} remaining)`);
                fixed++;
            }
        }
    }

    console.log(`\n  Total fixed: ${fixed}`);
    return fixed;
}

// =====================================================
// Main
// =====================================================
async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('   Fix Broken Solutions & Null Test Cases');
    console.log('═══════════════════════════════════════════════════');

    const syntaxFixed = await fixSyntaxErrors();
    const nullFixed = await fixNullTestCases();

    console.log('\n═══════════════════════════════════════════════════');
    console.log(`   Done! Syntax fixes: ${syntaxFixed}, Null TC fixes: ${nullFixed}`);
    console.log('═══════════════════════════════════════════════════\n');
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
