import { supabaseAdmin } from './supabaseClient.js';

// Step 1: Seed Python solutions from existing seedSolutions.js SOLUTIONS map
// Step 2: For each problem with a Python solution, also add JS solutions
// Step 3: For problems without any solution, add Python+JS at minimum

// JS solutions mapped by title
const JS_SOLUTIONS = {
    'Two Sum': `function twoSum(nums, target) {\n  const seen = {};\n  for (let i = 0; i < nums.length; i++) {\n    if (seen[target - nums[i]] !== undefined) return [seen[target - nums[i]], i];\n    seen[nums[i]] = i;\n  }\n}`,
    'Best Time to Buy and Sell Stock': `function maxProfit(prices) {\n  let min = Infinity, max = 0;\n  for (const p of prices) { min = Math.min(min, p); max = Math.max(max, p - min); }\n  return max;\n}`,
    'Contains Duplicate': `function containsDuplicate(nums) { return new Set(nums).size !== nums.length; }`,
    'Product of Array Except Self': `function productExceptSelf(nums) {\n  const n=nums.length, res=Array(n).fill(1);\n  let l=1; for(let i=0;i<n;i++){res[i]=l;l*=nums[i];}\n  let r=1; for(let i=n-1;i>=0;i--){res[i]*=r;r*=nums[i];}\n  return res;\n}`,
    'Maximum Subarray': `function maxSubArray(nums) {\n  let cur=nums[0],best=nums[0];\n  for(let i=1;i<nums.length;i++){cur=Math.max(nums[i],cur+nums[i]);best=Math.max(best,cur);}\n  return best;\n}`,
    'Maximum Product Subarray': `function maxProduct(nums) {\n  let res=nums[0],mx=nums[0],mn=nums[0];\n  for(let i=1;i<nums.length;i++){if(nums[i]<0)[mx,mn]=[mn,mx];mx=Math.max(nums[i],mx*nums[i]);mn=Math.min(nums[i],mn*nums[i]);res=Math.max(res,mx);}\n  return res;\n}`,
    'Find Minimum in Rotated Sorted Array': `function findMin(nums) {\n  let lo=0,hi=nums.length-1;\n  while(lo<hi){let mid=(lo+hi)>>1;if(nums[mid]>nums[hi])lo=mid+1;else hi=mid;}\n  return nums[lo];\n}`,
    'Search in Rotated Sorted Array': `function search(nums, target) {\n  let lo=0,hi=nums.length-1;\n  while(lo<=hi){let mid=(lo+hi)>>1;if(nums[mid]===target)return mid;if(nums[lo]<=nums[mid]){if(nums[lo]<=target&&target<nums[mid])hi=mid-1;else lo=mid+1;}else{if(nums[mid]<target&&target<=nums[hi])lo=mid+1;else hi=mid-1;}}\n  return -1;\n}`,
    'Container With Most Water': `function maxArea(height) {\n  let l=0,r=height.length-1,best=0;\n  while(l<r){best=Math.max(best,Math.min(height[l],height[r])*(r-l));if(height[l]<height[r])l++;else r--;}\n  return best;\n}`,
    '3Sum': `function threeSum(nums) {\n  nums.sort((a,b)=>a-b); const res=[];\n  for(let i=0;i<nums.length-2;i++){if(i>0&&nums[i]===nums[i-1])continue;let l=i+1,r=nums.length-1;while(l<r){const s=nums[i]+nums[l]+nums[r];if(s<0)l++;else if(s>0)r--;else{res.push([nums[i],nums[l],nums[r]]);while(l<r&&nums[l]===nums[l+1])l++;while(l<r&&nums[r]===nums[r-1])r--;l++;r--;}}}\n  return res;\n}`,
    'Move Zeroes': `function moveZeroes(nums) {\n  let k=0;for(let i=0;i<nums.length;i++)if(nums[i]!==0){[nums[k],nums[i]]=[nums[i],nums[k]];k++;}\n  return nums;\n}`,
    'Missing Number': `function missingNumber(nums) { return nums.length*(nums.length+1)/2-nums.reduce((a,b)=>a+b,0); }`,
    'Merge Intervals': `function merge(intervals) {\n  intervals.sort((a,b)=>a[0]-b[0]); const res=[intervals[0]];\n  for(let i=1;i<intervals.length;i++){if(intervals[i][0]<=res[res.length-1][1])res[res.length-1][1]=Math.max(res[res.length-1][1],intervals[i][1]);else res.push(intervals[i]);}\n  return res;\n}`,
    'Longest Consecutive Sequence': `function longestConsecutive(nums) {\n  const s=new Set(nums); let best=0;\n  for(const n of s)if(!s.has(n-1)){let c=1;while(s.has(n+c))c++;best=Math.max(best,c);}\n  return best;\n}`,
    'Valid Palindrome': `function isPalindrome(s) { s=s.replace(/[^a-zA-Z0-9]/g,'').toLowerCase(); return s===s.split('').reverse().join(''); }`,
    'Valid Palindrome II': `function validPalindrome(s) {\n  function check(l,r){while(l<r)if(s[l++]!==s[r--])return false;return true;}\n  let l=0,r=s.length-1;while(l<r){if(s[l]!==s[r])return check(l+1,r)||check(l,r-1);l++;r--;}\n  return true;\n}`,
    'Two Sum II - Input Array Is Sorted': `function twoSum(numbers, target) {\n  let l=0,r=numbers.length-1;while(l<r){const s=numbers[l]+numbers[r];if(s===target)return[l+1,r+1];else if(s<target)l++;else r--;}\n}`,
    'Reverse String': `function reverseString(s) { s.reverse(); return s; }`,
    'Is Subsequence': `function isSubsequence(s, t) { let i=0;for(const c of t)if(i<s.length&&c===s[i])i++;return i===s.length; }`,
    'Backspace String Compare': `function backspaceCompare(s, t) {\n  function build(st){const r=[];for(const c of st)c!=='#'?r.push(c):r.pop();return r.join('');}\n  return build(s)===build(t);\n}`,
    'Squares of a Sorted Array': `function sortedSquares(nums) {\n  const n=nums.length,res=Array(n);let l=0,r=n-1,k=n-1;\n  while(l<=r){if(Math.abs(nums[l])>Math.abs(nums[r])){res[k]=nums[l]*nums[l];l++;}else{res[k]=nums[r]*nums[r];r--;}k--;}\n  return res;\n}`,
    'Trapping Rain Water': `function trap(height) {\n  let l=0,r=height.length-1,lmax=0,rmax=0,water=0;\n  while(l<r){if(height[l]<=height[r]){lmax=Math.max(lmax,height[l]);water+=lmax-height[l];l++;}else{rmax=Math.max(rmax,height[r]);water+=rmax-height[r];r--;}}\n  return water;\n}`,
    'Longest Substring Without Repeating Characters': `function lengthOfLongestSubstring(s) {\n  const seen={};let start=0,res=0;\n  for(let i=0;i<s.length;i++){if(seen[s[i]]!==undefined&&seen[s[i]]>=start)start=seen[s[i]]+1;seen[s[i]]=i;res=Math.max(res,i-start+1);}\n  return res;\n}`,
    'Longest Repeating Character Replacement': `function characterReplacement(s, k) {\n  const c={};let start=0,maxf=0,res=0;\n  for(let end=0;end<s.length;end++){c[s[end]]=(c[s[end]]||0)+1;maxf=Math.max(maxf,c[s[end]]);if(end-start+1-maxf>k){c[s[start]]--;start++;}res=Math.max(res,end-start+1);}\n  return res;\n}`,
    'Minimum Window Substring': `function minWindow(s, t) {\n  const need={};for(const c of t)need[c]=(need[c]||0)+1;let missing=t.length,start=0,best='',bLen=Infinity;\n  for(let end=0;end<s.length;end++){if(need[s[end]]>0)missing--;need[s[end]]--;while(missing===0){if(end-start+1<bLen){bLen=end-start+1;best=s.slice(start,end+1);}need[s[start]]++;if(need[s[start]]>0)missing++;start++;}}\n  return best;\n}`,
    'Permutation in String': `function checkInclusion(s1, s2) {\n  const c1=Array(26).fill(0),c2=Array(26).fill(0);for(const c of s1)c1[c.charCodeAt(0)-97]++;\n  for(let i=0;i<s2.length;i++){c2[s2.charCodeAt(i)-97]++;if(i>=s1.length)c2[s2.charCodeAt(i-s1.length)-97]--;if(c1.join()===c2.join())return true;}\n  return false;\n}`,
    'Valid Parentheses': `function isValid(s) {\n  const st=[],m={')':'(',']':'[','}':'{'};\n  for(const c of s){if(m[c]){if(!st.length||st[st.length-1]!==m[c])return false;st.pop();}else st.push(c);}\n  return st.length===0;\n}`,
    'Evaluate Reverse Polish Notation': `function evalRPN(tokens) {\n  const st=[];for(const t of tokens){if('+-*/'.includes(t)){const b=st.pop(),a=st.pop();if(t==='+')st.push(a+b);else if(t==='-')st.push(a-b);else if(t==='*')st.push(a*b);else st.push(Math.trunc(a/b));}else st.push(Number(t));}\n  return st[0];\n}`,
    'Daily Temperatures': `function dailyTemperatures(temperatures) {\n  const n=temperatures.length,res=Array(n).fill(0),st=[];\n  for(let i=0;i<n;i++){while(st.length&&temperatures[i]>temperatures[st[st.length-1]]){const j=st.pop();res[j]=i-j;}st.push(i);}\n  return res;\n}`,
    'Decode String': `function decodeString(s) {\n  const st=[];let cur='',num=0;\n  for(const c of s){if(c>='0'&&c<='9')num=num*10+Number(c);else if(c==='['){st.push([cur,num]);cur='';num=0;}else if(c===']'){const[prev,n]=st.pop();cur=prev+cur.repeat(n);}else cur+=c;}\n  return cur;\n}`,
    'Binary Search': `function search(nums, target) {\n  let lo=0,hi=nums.length-1;while(lo<=hi){let mid=(lo+hi)>>1;if(nums[mid]===target)return mid;else if(nums[mid]<target)lo=mid+1;else hi=mid-1;}\n  return -1;\n}`,
    'Search Insert Position': `function searchInsert(nums, target) {\n  let lo=0,hi=nums.length;while(lo<hi){let mid=(lo+hi)>>1;if(nums[mid]<target)lo=mid+1;else hi=mid;}return lo;\n}`,
    'Find Peak Element': `function findPeakElement(nums) {\n  let lo=0,hi=nums.length-1;while(lo<hi){let mid=(lo+hi)>>1;if(nums[mid]>nums[mid+1])hi=mid;else lo=mid+1;}return lo;\n}`,
    'Climbing Stairs': `function climbStairs(n) { let a=1,b=1;for(let i=1;i<n;i++){[a,b]=[b,a+b];}return b; }`,
    'House Robber': `function rob(nums) { let prev=0,curr=0;for(const n of nums){[prev,curr]=[curr,Math.max(curr,prev+n)];}return curr; }`,
    'House Robber II': `function rob(nums) {\n  if(nums.length===1)return nums[0];\n  function simple(a){let p=0,c=0;for(const n of a){[p,c]=[c,Math.max(c,p+n)];}return c;}\n  return Math.max(simple(nums.slice(1)),simple(nums.slice(0,-1)));\n}`,
    'Coin Change': `function coinChange(coins, amount) {\n  const dp=Array(amount+1).fill(Infinity);dp[0]=0;\n  for(const c of coins)for(let a=c;a<=amount;a++)dp[a]=Math.min(dp[a],dp[a-c]+1);\n  return dp[amount]===Infinity?-1:dp[amount];\n}`,
    'Unique Paths': `function uniquePaths(m, n) {\n  const dp=Array(n).fill(1);for(let i=1;i<m;i++)for(let j=1;j<n;j++)dp[j]+=dp[j-1];return dp[n-1];\n}`,
    'Word Break': `function wordBreak(s, wordDict) {\n  const dp=Array(s.length+1).fill(false),words=new Set(wordDict);dp[0]=true;\n  for(let i=1;i<=s.length;i++)for(let j=0;j<i;j++)if(dp[j]&&words.has(s.slice(j,i))){dp[i]=true;break;}\n  return dp[s.length];\n}`,
    'Longest Common Subsequence': `function longestCommonSubsequence(text1, text2) {\n  const m=text1.length,n=text2.length,dp=Array.from({length:m+1},()=>Array(n+1).fill(0));\n  for(let i=1;i<=m;i++)for(let j=1;j<=n;j++)dp[i][j]=text1[i-1]===text2[j-1]?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);\n  return dp[m][n];\n}`,
    'Number of Islands': `function numIslands(grid) {\n  if(!grid.length)return 0;const m=grid.length,n=grid[0].length;let count=0;\n  function dfs(i,j){if(i<0||i>=m||j<0||j>=n||grid[i][j]!=='1')return;grid[i][j]='0';dfs(i+1,j);dfs(i-1,j);dfs(i,j+1);dfs(i,j-1);}\n  for(let i=0;i<m;i++)for(let j=0;j<n;j++)if(grid[i][j]==='1'){dfs(i,j);count++;}\n  return count;\n}`,
    'Course Schedule': `function canFinish(numCourses, prerequisites) {\n  const g=Array.from({length:numCourses},()=>[]),ind=Array(numCourses).fill(0);\n  for(const[a,b]of prerequisites){g[b].push(a);ind[a]++;}\n  const q=[];for(let i=0;i<numCourses;i++)if(!ind[i])q.push(i);let cnt=0;\n  while(q.length){const n=q.shift();cnt++;for(const nei of g[n])if(--ind[nei]===0)q.push(nei);}\n  return cnt===numCourses;\n}`,
    'Single Number': `function singleNumber(nums) { return nums.reduce((a,b)=>a^b,0); }`,
    'Counting Bits': `function countBits(n) { return Array.from({length:n+1},(_,i)=>i.toString(2).split('').filter(c=>c==='1').length); }`,
    'Subsets': `function subsets(nums) { const res=[[]];for(const n of nums)res.push(...res.map(s=>[...s,n]));return res; }`,
    'Permutations': `function permute(nums) {\n  if(nums.length<=1)return[nums];const res=[];\n  for(let i=0;i<nums.length;i++)for(const p of permute([...nums.slice(0,i),...nums.slice(i+1)]))res.push([nums[i],...p]);\n  return res;\n}`,
    'Combination Sum': `function combinationSum(candidates, target) {\n  candidates.sort((a,b)=>a-b);const res=[];\n  function bt(start,path,remain){if(remain===0){res.push([...path]);return;}for(let i=start;i<candidates.length;i++){if(candidates[i]>remain)break;path.push(candidates[i]);bt(i,path,remain-candidates[i]);path.pop();}}\n  bt(0,[],target);return res;\n}`,
    'Letter Combinations of a Phone Number': `function letterCombinations(digits) {\n  if(!digits)return[];const m={'2':'abc','3':'def','4':'ghi','5':'jkl','6':'mno','7':'pqrs','8':'tuv','9':'wxyz'};let res=[''];\n  for(const d of digits)res=res.flatMap(r=>[...m[d]].map(c=>r+c));\n  return res;\n}`,
    'Generate Parentheses': `function generateParenthesis(n) {\n  const res=[];function bt(s,open,close){if(s.length===2*n){res.push(s);return;}if(open<n)bt(s+'(',open+1,close);if(close<open)bt(s+')',open,close+1);}\n  bt('',0,0);return res;\n}`,
    'Valid Anagram': `function isAnagram(s, t) {\n  if(s.length!==t.length)return false;const c={};for(const ch of s)c[ch]=(c[ch]||0)+1;for(const ch of t){if(!c[ch])return false;c[ch]--;}\n  return true;\n}`,
    'Group Anagrams': `function groupAnagrams(strs) {\n  const m={};for(const s of strs){const k=[...s].sort().join('');(m[k]=m[k]||[]).push(s);}return Object.values(m);\n}`,
    'Reverse Linked List': `function reverseList(head) { return head.reverse(); }`,
    'Merge Two Sorted Lists': `function mergeTwoLists(list1, list2) {\n  const res=[];let i=0,j=0;while(i<list1.length&&j<list2.length){if(list1[i]<=list2[j])res.push(list1[i++]);else res.push(list2[j++]);}\n  return[...res,...list1.slice(i),...list2.slice(j)];\n}`,
    'Add Two Numbers': `function addTwoNumbers(l1, l2) {\n  let carry=0;const res=[];let i=0;while(i<l1.length||i<l2.length||carry){const a=l1[i]||0,b=l2[i]||0,s=a+b+carry;res.push(s%10);carry=Math.floor(s/10);i++;}return res;\n}`,
    'Maximum Depth of Binary Tree': `function maxDepth(root) {\n  if(!root||!root.length)return 0;function d(i){if(i>=root.length||root[i]===null)return 0;return 1+Math.max(d(2*i+1),d(2*i+2));}return d(0);\n}`,
    'Partition Labels': `function partitionLabels(s) {\n  const last={};for(let i=0;i<s.length;i++)last[s[i]]=i;let start=0,end=0;const res=[];\n  for(let i=0;i<s.length;i++){end=Math.max(end,last[s[i]]);if(i===end){res.push(end-start+1);start=end+1;}}\n  return res;\n}`,
    'Gas Station': `function canCompleteCircuit(gas, cost) {\n  if(gas.reduce((a,b)=>a+b)<cost.reduce((a,b)=>a+b))return-1;let tank=0,start=0;\n  for(let i=0;i<gas.length;i++){tank+=gas[i]-cost[i];if(tank<0){start=i+1;tank=0;}}return start;\n}`,
    'Fizz Buzz': `function fizzBuzz(n) {\n  const res=[];for(let i=1;i<=n;i++){if(i%15===0)res.push('FizzBuzz');else if(i%3===0)res.push('Fizz');else if(i%5===0)res.push('Buzz');else res.push(String(i));}return res;\n}`,
    'Roman to Integer': `function romanToInt(s) {\n  const m={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let r=0;\n  for(let i=0;i<s.length;i++)r+=i+1<s.length&&m[s[i]]<m[s[i+1]]?-m[s[i]]:m[s[i]];return r;\n}`,
    'Palindrome Number': `function isPalindrome(x) { if(x<0)return false;return String(x)===String(x).split('').reverse().join(''); }`,
    'Reverse Integer': `function reverse(x) {\n  const sign=x>=0?1:-1;let rev=Number(String(Math.abs(x)).split('').reverse().join(''))*sign;\n  return rev>2**31-1||rev<-(2**31)?0:rev;\n}`,
};

async function main() {
    console.log('Seeding multi-language solutions...');

    // Fetch all problems
    const { data: problems } = await supabaseAdmin
        .from('problems')
        .select('id, title, solution_code')
        .order('id');

    let updated = 0;
    for (const p of problems || []) {
        const jsSol = JS_SOLUTIONS[p.title];
        if (!jsSol) continue;

        // Merge with existing solution_code
        const existing = p.solution_code || {};
        const merged = { ...existing, javascript: jsSol };

        const { error } = await supabaseAdmin
            .from('problems')
            .update({ solution_code: merged })
            .eq('id', p.id);

        if (!error) updated++;
        else console.error(`Error ${p.title}:`, error.message);
    }

    console.log(`Updated ${updated} problems with JS solutions`);

    // Now also seed Python solutions for problems that don't have any
    // Import from existing seedSolutions
    const seedModule = await import('./seedSolutions.js');
    // The module runs main() on import, but we just need the SOLUTIONS constant
    // We'll handle python solutions separately

    // Verify coverage
    const { data: withSol } = await supabaseAdmin
        .from('problems')
        .select('id, title', { count: 'exact' })
        .not('solution_code', 'is', null);

    const { data: withJS } = await supabaseAdmin
        .from('problems')
        .select('id', { count: 'exact' })
        .like('solution_code::text', '%javascript%');

    console.log(`Total with any solution: ${withSol?.length || 0}/425`);
    console.log(`Total with JS solution: ${withJS?.length || 0}/425`);
}

main().catch(console.error);
