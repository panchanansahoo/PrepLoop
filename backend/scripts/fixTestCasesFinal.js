/**
 * Fix Test Cases - Final Pass (v3)
 * Solutions are standalone functions, NOT class Solution.
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { executeCode } from '../utils/executeCode.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const HELPERS = `import json, copy

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class Node:
    def __init__(self, val=0, neighbors=None, next=None, left=None, right=None, random=None):
        self.val = val
        self.neighbors = neighbors if neighbors is not None else []
        self.next = next; self.left = left; self.right = right; self.random = random

def list_to_linked(arr):
    if not arr: return None
    head = ListNode(arr[0])
    cur = head
    for v in arr[1:]:
        cur.next = ListNode(v)
        cur = cur.next
    return head

def linked_to_list(head):
    r = []
    seen = set()
    while head and id(head) not in seen:
        seen.add(id(head))
        r.append(head.val)
        head = head.next
    return r

def list_to_tree(arr):
    if not arr or arr[0] is None: return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while queue and i < len(arr):
        node = queue.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

def tree_to_list(root):
    if not root: return []
    r = []
    q = [root]
    while q:
        n = q.pop(0)
        if n:
            r.append(n.val)
            q.append(n.left)
            q.append(n.right)
        else:
            r.append(None)
    while r and r[-1] is None:
        r.pop()
    return r

def find_node(root, val):
    if not root: return None
    if root.val == val: return root
    l = find_node(root.left, val)
    if l: return l
    return find_node(root.right, val)

__tree_to_list = tree_to_list
__list_to_tree = list_to_tree
__linked_to_list = linked_to_list
__list_to_linked = list_to_linked

`;

const PROBLEMS = {
    58: {
        inputs: [[[1, 2, 3, 3, 4, 4, 5]], [[1, 1, 1, 2, 3]], [[1, 1]]],
        postCode: `
results = []
for inp in [[1,2,3,3,4,4,5],[1,1,1,2,3],[1,1]]:
    try:
        head = list_to_linked(inp)
        r = deleteDuplicates(head)
        results.append({"success": True, "output": linked_to_list(r)})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
    182: {
        inputs: [['()'], ['(())'], ['()()']],
        postCode: `
results = []
for inp in ["()", "(())", "()()"]:
    try:
        r = scoreOfParentheses(inp)
        results.append({"success": True, "output": r})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
    224: {
        inputs: [[[4, 2, 7, 1, 3, 6, 9]], [[2, 1, 3]], [[1]]],
        postCode: `
results = []
for inp in [[4,2,7,1,3,6,9],[2,1,3],[1]]:
    try:
        root = list_to_tree(inp)
        r = invertTree(root)
        results.append({"success": True, "output": tree_to_list(r)})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
    230: {
        inputs: [[[1, 3, 2, 5], [2, 1, 3, null, 4, null, 7]], [[1], [1, 2]], [[1, 2, 3], [1]]],
        postCode: `
results = []
for inp in [[[1,3,2,5],[2,1,3,None,4,None,7]], [[1],[1,2]], [[1,2,3],[1]]]:
    try:
        t1 = list_to_tree(inp[0]); t2 = list_to_tree(inp[1])
        r = mergeTrees(t1, t2)
        results.append({"success": True, "output": tree_to_list(r)})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
    237: {
        inputs: [[[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 8], [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 4], [[2, 1], 2, 1]],
        postCode: `
results = []
for inp in [[[6,2,8,0,4,7,9,None,None,3,5], 2, 8], [[6,2,8,0,4,7,9,None,None,3,5], 2, 4], [[2,1], 2, 1]]:
    try:
        root = list_to_tree(inp[0])
        p = find_node(root, inp[1]); q = find_node(root, inp[2])
        r = lowestCommonAncestor(root, p, q)
        results.append({"success": True, "output": r.val if r else None})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
    251: {
        inputs: [[[3, 9, 20, 15, 7], [9, 3, 15, 20, 7]], [[-1], [-1]], [[1, 2], [2, 1]]],
        postCode: `
results = []
for inp in [[[3,9,20,15,7],[9,3,15,20,7]], [[-1],[-1]], [[1,2],[2,1]]]:
    try:
        r = buildTree(inp[0], inp[1])
        results.append({"success": True, "output": tree_to_list(r)})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
    252: {
        inputs: [[[9, 3, 15, 20, 7], [9, 15, 7, 20, 3]], [[-1], [-1]], [[2, 1], [2, 1]]],
        postCode: `
results = []
for inp in [[[9,3,15,20,7],[9,15,7,20,3]], [[-1],[-1]], [[2,1],[2,1]]]:
    try:
        r = buildTree(inp[0], inp[1])
        results.append({"success": True, "output": tree_to_list(r)})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
    257: {
        inputs: [[[5, 3, 6, 2, 4, null, 7], 3], [[5, 3, 6, 2, 4, null, 7], 0], [[0], 0]],
        postCode: `
results = []
for inp in [[[5,3,6,2,4,None,7], 3], [[5,3,6,2,4,None,7], 0], [[0], 0]]:
    try:
        root = list_to_tree(inp[0])
        r = deleteNode(root, inp[1])
        results.append({"success": True, "output": tree_to_list(r)})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
    355: {
        inputs: [['23'], ['2'], ['']],
        postCode: `
results = []
for inp in ["23", "2", ""]:
    try:
        r = letterCombinations(inp)
        results.append({"success": True, "output": r})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
    369: {
        inputs: [['112358'], ['199100199'], ['123']],
        postCode: `
results = []
for inp in ["112358", "199100199", "123"]:
    try:
        r = isAdditiveNumber(inp)
        results.append({"success": True, "output": r})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
    373: {
        inputs: [['123', 6], ['232', 8], ['105', 5]],
        postCode: `
results = []
for inp in [["123", 6], ["232", 8], ["105", 5]]:
    try:
        r = addOperators(inp[0], inp[1])
        results.append({"success": True, "output": r})
    except Exception as e:
        results.append({"success": False, "error": str(e)})
print("__OUTPUTS__" + json.dumps(results))
`
    },
};

async function main() {
    const ids = Object.keys(PROBLEMS).map(Number);
    console.log(`Fixing ${ids.length} remaining problems...`);

    const { data: problems, error } = await supabase
        .from('problems')
        .select('id, title, solution_code')
        .in('id', ids)
        .order('id');

    if (error) { console.error('Fetch error:', error.message); return; }
    console.log(`Fetched ${problems.length} problems\n`);

    let fixed = 0, failed = 0;

    for (const p of problems) {
        console.log(`Processing ${p.id}: ${p.title}...`);
        const config = PROBLEMS[p.id];
        const solCode = p.solution_code?.python;
        if (!solCode) { console.log('  No Python solution'); failed++; continue; }

        // Build: helpers + solution code + test runner
        const fullCode = HELPERS + solCode + '\n\n' + config.postCode;

        const execResult = await executeCode(fullCode, 'python');

        if (!execResult.success) {
            console.log('  Execution failed:', (execResult.error || '').substring(0, 300));
            failed++;
            continue;
        }

        const marker = '__OUTPUTS__';
        const idx = execResult.output.indexOf(marker);
        if (idx === -1) {
            console.log('  No output marker.');
            failed++;
            continue;
        }

        let results;
        try {
            results = JSON.parse(execResult.output.substring(idx + marker.length));
        } catch (e) {
            console.log('  Parse error:', e.message);
            failed++;
            continue;
        }

        const newTestCases = [];
        for (let j = 0; j < results.length; j++) {
            const res = results[j];
            if (res.success) {
                newTestCases.push({ input: config.inputs[j], output: res.output });
            } else {
                console.log(`  TC ${j + 1} failed: ${res.error}`);
            }
        }

        if (newTestCases.length === 0) {
            console.log('  No valid test cases');
            failed++;
            continue;
        }

        const { error: updateErr } = await supabase.from('problems').update({ test_cases: newTestCases }).eq('id', p.id);
        if (updateErr) {
            console.log('  Update error:', updateErr.message);
            failed++;
        } else {
            console.log(`  ✓ Fixed with ${newTestCases.length} test cases`);
            fixed++;
        }
    }

    console.log(`\n=== FINAL PASS v3 RESULTS ===`);
    console.log(`Fixed:  ${fixed}`);
    console.log(`Failed: ${failed}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
