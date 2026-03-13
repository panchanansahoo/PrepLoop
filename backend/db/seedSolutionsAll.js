import { supabaseAdmin } from './supabaseClient.js';

// All solutions mapped by problem title -> { python, javascript, cpp, java }
// For problems that work with arrays/primitives (not linked lists/trees as actual node structures)

const SOLUTIONS = {
    // ===== ARRAY =====
    'Two Sum': {
        python: `def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen:\n            return [seen[target - n], i]\n        seen[n] = i`,
        javascript: `function twoSum(nums, target) {\n    const seen = {};\n    for (let i = 0; i < nums.length; i++) {\n        if (seen[target - nums[i]] !== undefined) return [seen[target - nums[i]], i];\n        seen[nums[i]] = i;\n    }\n}`,
        cpp: `vector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int,int> m;\n    for(int i=0;i<nums.size();i++){\n        if(m.count(target-nums[i])) return {m[target-nums[i]],i};\n        m[nums[i]]=i;\n    }\n    return {};\n}`,
        java: `public int[] twoSum(int[] nums, int target) {\n    Map<Integer,Integer> m = new HashMap<>();\n    for(int i=0;i<nums.length;i++){\n        if(m.containsKey(target-nums[i])) return new int[]{m.get(target-nums[i]),i};\n        m.put(nums[i],i);\n    }\n    return new int[]{};\n}`
    },
    'Best Time to Buy and Sell Stock': {
        python: `def maxProfit(prices):\n    min_p, max_prof = float('inf'), 0\n    for p in prices:\n        min_p = min(min_p, p)\n        max_prof = max(max_prof, p - min_p)\n    return max_prof`,
        javascript: `function maxProfit(prices) {\n    let minP = Infinity, maxProf = 0;\n    for (const p of prices) {\n        minP = Math.min(minP, p);\n        maxProf = Math.max(maxProf, p - minP);\n    }\n    return maxProf;\n}`,
        cpp: `int maxProfit(vector<int>& prices) {\n    int minP=INT_MAX, maxProf=0;\n    for(int p:prices){minP=min(minP,p);maxProf=max(maxProf,p-minP);}\n    return maxProf;\n}`,
        java: `public int maxProfit(int[] prices) {\n    int minP=Integer.MAX_VALUE, maxProf=0;\n    for(int p:prices){minP=Math.min(minP,p);maxProf=Math.max(maxProf,p-minP);}\n    return maxProf;\n}`
    },
    'Contains Duplicate': {
        python: `def containsDuplicate(nums):\n    return len(nums) != len(set(nums))`,
        javascript: `function containsDuplicate(nums) {\n    return new Set(nums).size !== nums.length;\n}`,
        cpp: `bool containsDuplicate(vector<int>& nums) {\n    unordered_set<int> s(nums.begin(),nums.end());\n    return s.size()!=nums.size();\n}`,
        java: `public boolean containsDuplicate(int[] nums) {\n    Set<Integer> s = new HashSet<>();\n    for(int n:nums) if(!s.add(n)) return true;\n    return false;\n}`
    },
    'Product of Array Except Self': {
        python: `def productExceptSelf(nums):\n    n = len(nums)\n    res = [1]*n\n    left = 1\n    for i in range(n):\n        res[i] = left\n        left *= nums[i]\n    right = 1\n    for i in range(n-1,-1,-1):\n        res[i] *= right\n        right *= nums[i]\n    return res`,
        javascript: `function productExceptSelf(nums) {\n    const n=nums.length, res=Array(n).fill(1);\n    let left=1;\n    for(let i=0;i<n;i++){res[i]=left;left*=nums[i];}\n    let right=1;\n    for(let i=n-1;i>=0;i--){res[i]*=right;right*=nums[i];}\n    return res;\n}`,
        cpp: `vector<int> productExceptSelf(vector<int>& nums) {\n    int n=nums.size();\n    vector<int> res(n,1);\n    int left=1;\n    for(int i=0;i<n;i++){res[i]=left;left*=nums[i];}\n    int right=1;\n    for(int i=n-1;i>=0;i--){res[i]*=right;right*=nums[i];}\n    return res;\n}`,
        java: `public int[] productExceptSelf(int[] nums) {\n    int n=nums.length;\n    int[] res=new int[n];\n    Arrays.fill(res,1);\n    int left=1;\n    for(int i=0;i<n;i++){res[i]=left;left*=nums[i];}\n    int right=1;\n    for(int i=n-1;i>=0;i--){res[i]*=right;right*=nums[i];}\n    return res;\n}`
    },
    'Maximum Subarray': {
        python: `def maxSubArray(nums):\n    cur = best = nums[0]\n    for n in nums[1:]:\n        cur = max(n, cur+n)\n        best = max(best, cur)\n    return best`,
        javascript: `function maxSubArray(nums) {\n    let cur=nums[0], best=nums[0];\n    for(let i=1;i<nums.length;i++){cur=Math.max(nums[i],cur+nums[i]);best=Math.max(best,cur);}\n    return best;\n}`,
        cpp: `int maxSubArray(vector<int>& nums) {\n    int cur=nums[0],best=nums[0];\n    for(int i=1;i<nums.size();i++){cur=max(nums[i],cur+nums[i]);best=max(best,cur);}\n    return best;\n}`,
        java: `public int maxSubArray(int[] nums) {\n    int cur=nums[0],best=nums[0];\n    for(int i=1;i<nums.length;i++){cur=Math.max(nums[i],cur+nums[i]);best=Math.max(best,cur);}\n    return best;\n}`
    },
    'Maximum Product Subarray': {
        python: `def maxProduct(nums):\n    res = mx = mn = nums[0]\n    for n in nums[1:]:\n        if n < 0: mx, mn = mn, mx\n        mx = max(n, mx*n)\n        mn = min(n, mn*n)\n        res = max(res, mx)\n    return res`,
        javascript: `function maxProduct(nums) {\n    let res=nums[0],mx=nums[0],mn=nums[0];\n    for(let i=1;i<nums.length;i++){\n        if(nums[i]<0)[mx,mn]=[mn,mx];\n        mx=Math.max(nums[i],mx*nums[i]);\n        mn=Math.min(nums[i],mn*nums[i]);\n        res=Math.max(res,mx);\n    }\n    return res;\n}`,
        cpp: `int maxProduct(vector<int>& nums) {\n    int res=nums[0],mx=nums[0],mn=nums[0];\n    for(int i=1;i<nums.size();i++){\n        if(nums[i]<0)swap(mx,mn);\n        mx=max(nums[i],mx*nums[i]);\n        mn=min(nums[i],mn*nums[i]);\n        res=max(res,mx);\n    }\n    return res;\n}`,
        java: `public int maxProduct(int[] nums) {\n    int res=nums[0],mx=nums[0],mn=nums[0];\n    for(int i=1;i<nums.length;i++){\n        if(nums[i]<0){int t=mx;mx=mn;mn=t;}\n        mx=Math.max(nums[i],mx*nums[i]);\n        mn=Math.min(nums[i],mn*nums[i]);\n        res=Math.max(res,mx);\n    }\n    return res;\n}`
    },
    'Find Minimum in Rotated Sorted Array': {
        python: `def findMin(nums):\n    lo, hi = 0, len(nums)-1\n    while lo < hi:\n        mid = (lo+hi)//2\n        if nums[mid] > nums[hi]: lo = mid+1\n        else: hi = mid\n    return nums[lo]`,
        javascript: `function findMin(nums) {\n    let lo=0,hi=nums.length-1;\n    while(lo<hi){let mid=(lo+hi)>>1;if(nums[mid]>nums[hi])lo=mid+1;else hi=mid;}\n    return nums[lo];\n}`,
        cpp: `int findMin(vector<int>& nums) {\n    int lo=0,hi=nums.size()-1;\n    while(lo<hi){int mid=(lo+hi)/2;if(nums[mid]>nums[hi])lo=mid+1;else hi=mid;}\n    return nums[lo];\n}`,
        java: `public int findMin(int[] nums) {\n    int lo=0,hi=nums.length-1;\n    while(lo<hi){int mid=(lo+hi)/2;if(nums[mid]>nums[hi])lo=mid+1;else hi=mid;}\n    return nums[lo];\n}`
    },
    'Search in Rotated Sorted Array': {
        python: `def search(nums, target):\n    lo, hi = 0, len(nums)-1\n    while lo <= hi:\n        mid = (lo+hi)//2\n        if nums[mid] == target: return mid\n        if nums[lo] <= nums[mid]:\n            if nums[lo] <= target < nums[mid]: hi = mid-1\n            else: lo = mid+1\n        else:\n            if nums[mid] < target <= nums[hi]: lo = mid+1\n            else: hi = mid-1\n    return -1`,
        javascript: `function search(nums, target) {\n    let lo=0,hi=nums.length-1;\n    while(lo<=hi){\n        let mid=(lo+hi)>>1;\n        if(nums[mid]===target)return mid;\n        if(nums[lo]<=nums[mid]){\n            if(nums[lo]<=target&&target<nums[mid])hi=mid-1;else lo=mid+1;\n        }else{\n            if(nums[mid]<target&&target<=nums[hi])lo=mid+1;else hi=mid-1;\n        }\n    }\n    return -1;\n}`,
        cpp: `int search(vector<int>& nums, int target) {\n    int lo=0,hi=nums.size()-1;\n    while(lo<=hi){\n        int mid=(lo+hi)/2;\n        if(nums[mid]==target)return mid;\n        if(nums[lo]<=nums[mid]){\n            if(nums[lo]<=target&&target<nums[mid])hi=mid-1;else lo=mid+1;\n        }else{\n            if(nums[mid]<target&&target<=nums[hi])lo=mid+1;else hi=mid-1;\n        }\n    }\n    return -1;\n}`,
        java: `public int search(int[] nums, int target) {\n    int lo=0,hi=nums.length-1;\n    while(lo<=hi){\n        int mid=(lo+hi)/2;\n        if(nums[mid]==target)return mid;\n        if(nums[lo]<=nums[mid]){\n            if(nums[lo]<=target&&target<nums[mid])hi=mid-1;else lo=mid+1;\n        }else{\n            if(nums[mid]<target&&target<=nums[hi])lo=mid+1;else hi=mid-1;\n        }\n    }\n    return -1;\n}`
    },
    'Container With Most Water': {
        python: `def maxArea(height):\n    l, r, best = 0, len(height)-1, 0\n    while l < r:\n        best = max(best, min(height[l], height[r]) * (r-l))\n        if height[l] < height[r]: l += 1\n        else: r -= 1\n    return best`,
        javascript: `function maxArea(height) {\n    let l=0,r=height.length-1,best=0;\n    while(l<r){\n        best=Math.max(best,Math.min(height[l],height[r])*(r-l));\n        if(height[l]<height[r])l++;else r--;\n    }\n    return best;\n}`,
        cpp: `int maxArea(vector<int>& height) {\n    int l=0,r=height.size()-1,best=0;\n    while(l<r){\n        best=max(best,min(height[l],height[r])*(r-l));\n        if(height[l]<height[r])l++;else r--;\n    }\n    return best;\n}`,
        java: `public int maxArea(int[] height) {\n    int l=0,r=height.length-1,best=0;\n    while(l<r){\n        best=Math.max(best,Math.min(height[l],height[r])*(r-l));\n        if(height[l]<height[r])l++;else r--;\n    }\n    return best;\n}`
    },
    '3Sum': {
        python: `def threeSum(nums):\n    nums.sort()\n    res = []\n    for i in range(len(nums)-2):\n        if i > 0 and nums[i] == nums[i-1]: continue\n        l, r = i+1, len(nums)-1\n        while l < r:\n            s = nums[i]+nums[l]+nums[r]\n            if s < 0: l += 1\n            elif s > 0: r -= 1\n            else:\n                res.append([nums[i],nums[l],nums[r]])\n                while l < r and nums[l]==nums[l+1]: l += 1\n                while l < r and nums[r]==nums[r-1]: r -= 1\n                l += 1; r -= 1\n    return res`,
        javascript: `function threeSum(nums) {\n    nums.sort((a,b)=>a-b);\n    const res=[];\n    for(let i=0;i<nums.length-2;i++){\n        if(i>0&&nums[i]===nums[i-1])continue;\n        let l=i+1,r=nums.length-1;\n        while(l<r){\n            const s=nums[i]+nums[l]+nums[r];\n            if(s<0)l++;else if(s>0)r--;\n            else{\n                res.push([nums[i],nums[l],nums[r]]);\n                while(l<r&&nums[l]===nums[l+1])l++;\n                while(l<r&&nums[r]===nums[r-1])r--;\n                l++;r--;\n            }\n        }\n    }\n    return res;\n}`,
        cpp: `vector<vector<int>> threeSum(vector<int>& nums) {\n    sort(nums.begin(),nums.end());\n    vector<vector<int>> res;\n    for(int i=0;i<(int)nums.size()-2;i++){\n        if(i>0&&nums[i]==nums[i-1])continue;\n        int l=i+1,r=nums.size()-1;\n        while(l<r){\n            int s=nums[i]+nums[l]+nums[r];\n            if(s<0)l++;else if(s>0)r--;\n            else{\n                res.push_back({nums[i],nums[l],nums[r]});\n                while(l<r&&nums[l]==nums[l+1])l++;\n                while(l<r&&nums[r]==nums[r-1])r--;\n                l++;r--;\n            }\n        }\n    }\n    return res;\n}`,
        java: `public List<List<Integer>> threeSum(int[] nums) {\n    Arrays.sort(nums);\n    List<List<Integer>> res=new ArrayList<>();\n    for(int i=0;i<nums.length-2;i++){\n        if(i>0&&nums[i]==nums[i-1])continue;\n        int l=i+1,r=nums.length-1;\n        while(l<r){\n            int s=nums[i]+nums[l]+nums[r];\n            if(s<0)l++;else if(s>0)r--;\n            else{\n                res.add(Arrays.asList(nums[i],nums[l],nums[r]));\n                while(l<r&&nums[l]==nums[l+1])l++;\n                while(l<r&&nums[r]==nums[r-1])r--;\n                l++;r--;\n            }\n        }\n    }\n    return res;\n}`
    },
    'Move Zeroes': {
        python: `def moveZeroes(nums):\n    k = 0\n    for i in range(len(nums)):\n        if nums[i] != 0:\n            nums[k], nums[i] = nums[i], nums[k]\n            k += 1\n    return nums`,
        javascript: `function moveZeroes(nums) {\n    let k=0;\n    for(let i=0;i<nums.length;i++)if(nums[i]!==0){[nums[k],nums[i]]=[nums[i],nums[k]];k++;}\n    return nums;\n}`,
        cpp: `void moveZeroes(vector<int>& nums) {\n    int k=0;\n    for(int i=0;i<nums.size();i++)if(nums[i]!=0)swap(nums[k++],nums[i]);\n}`,
        java: `public void moveZeroes(int[] nums) {\n    int k=0;\n    for(int i=0;i<nums.length;i++)if(nums[i]!=0){int t=nums[k];nums[k]=nums[i];nums[i]=t;k++;}\n}`
    },
    'Missing Number': {
        python: `def missingNumber(nums):\n    n = len(nums)\n    return n*(n+1)//2 - sum(nums)`,
        javascript: `function missingNumber(nums) {\n    const n=nums.length;\n    return n*(n+1)/2 - nums.reduce((a,b)=>a+b,0);\n}`,
        cpp: `int missingNumber(vector<int>& nums) {\n    int n=nums.size(),s=n*(n+1)/2;\n    for(int x:nums)s-=x;\n    return s;\n}`,
        java: `public int missingNumber(int[] nums) {\n    int n=nums.length,s=n*(n+1)/2;\n    for(int x:nums)s-=x;\n    return s;\n}`
    },
    'Merge Intervals': {
        python: `def merge(intervals):\n    intervals.sort()\n    res = [intervals[0]]\n    for s,e in intervals[1:]:\n        if s <= res[-1][1]: res[-1][1] = max(res[-1][1], e)\n        else: res.append([s,e])\n    return res`,
        javascript: `function merge(intervals) {\n    intervals.sort((a,b)=>a[0]-b[0]);\n    const res=[intervals[0]];\n    for(let i=1;i<intervals.length;i++){\n        if(intervals[i][0]<=res[res.length-1][1])res[res.length-1][1]=Math.max(res[res.length-1][1],intervals[i][1]);\n        else res.push(intervals[i]);\n    }\n    return res;\n}`,
        cpp: `vector<vector<int>> merge(vector<vector<int>>& intervals) {\n    sort(intervals.begin(),intervals.end());\n    vector<vector<int>> res={intervals[0]};\n    for(int i=1;i<intervals.size();i++){\n        if(intervals[i][0]<=res.back()[1])res.back()[1]=max(res.back()[1],intervals[i][1]);\n        else res.push_back(intervals[i]);\n    }\n    return res;\n}`,
        java: `public int[][] merge(int[][] intervals) {\n    Arrays.sort(intervals,(a,b)->a[0]-b[0]);\n    List<int[]> res=new ArrayList<>();\n    res.add(intervals[0]);\n    for(int i=1;i<intervals.length;i++){\n        if(intervals[i][0]<=res.get(res.size()-1)[1])res.get(res.size()-1)[1]=Math.max(res.get(res.size()-1)[1],intervals[i][1]);\n        else res.add(intervals[i]);\n    }\n    return res.toArray(new int[0][]);\n}`
    },
    'Longest Consecutive Sequence': {
        python: `def longestConsecutive(nums):\n    s = set(nums)\n    best = 0\n    for n in s:\n        if n-1 not in s:\n            cur = 1\n            while n+cur in s: cur += 1\n            best = max(best, cur)\n    return best`,
        javascript: `function longestConsecutive(nums) {\n    const s=new Set(nums);\n    let best=0;\n    for(const n of s){\n        if(!s.has(n-1)){let cur=1;while(s.has(n+cur))cur++;best=Math.max(best,cur);}\n    }\n    return best;\n}`,
        cpp: `int longestConsecutive(vector<int>& nums) {\n    unordered_set<int> s(nums.begin(),nums.end());\n    int best=0;\n    for(int n:s){\n        if(!s.count(n-1)){int cur=1;while(s.count(n+cur))cur++;best=max(best,cur);}\n    }\n    return best;\n}`,
        java: `public int longestConsecutive(int[] nums) {\n    Set<Integer> s=new HashSet<>();\n    for(int n:nums)s.add(n);\n    int best=0;\n    for(int n:s){\n        if(!s.contains(n-1)){int cur=1;while(s.contains(n+cur))cur++;best=Math.max(best,cur);}\n    }\n    return best;\n}`
    },

    // ===== TWO POINTERS =====
    'Valid Palindrome': {
        python: `def isPalindrome(s):\n    s = ''.join(c.lower() for c in s if c.isalnum())\n    return s == s[::-1]`,
        javascript: `function isPalindrome(s) {\n    s=s.replace(/[^a-zA-Z0-9]/g,'').toLowerCase();\n    return s===s.split('').reverse().join('');\n}`,
        cpp: `bool isPalindrome(string s) {\n    string t;\n    for(char c:s)if(isalnum(c))t+=tolower(c);\n    string r(t.rbegin(),t.rend());\n    return t==r;\n}`,
        java: `public boolean isPalindrome(String s) {\n    s=s.replaceAll("[^a-zA-Z0-9]","").toLowerCase();\n    return s.equals(new StringBuilder(s).reverse().toString());\n}`
    },

    // ===== SLIDING WINDOW =====
    'Longest Substring Without Repeating Characters': {
        python: `def lengthOfLongestSubstring(s):\n    seen = {}; start = res = 0\n    for i, c in enumerate(s):\n        if c in seen and seen[c] >= start:\n            start = seen[c] + 1\n        seen[c] = i\n        res = max(res, i - start + 1)\n    return res`,
        javascript: `function lengthOfLongestSubstring(s) {\n    const seen={};\n    let start=0,res=0;\n    for(let i=0;i<s.length;i++){\n        if(seen[s[i]]!==undefined&&seen[s[i]]>=start)start=seen[s[i]]+1;\n        seen[s[i]]=i;\n        res=Math.max(res,i-start+1);\n    }\n    return res;\n}`,
        cpp: `int lengthOfLongestSubstring(string s) {\n    unordered_map<char,int> seen;\n    int start=0,res=0;\n    for(int i=0;i<s.size();i++){\n        if(seen.count(s[i])&&seen[s[i]]>=start)start=seen[s[i]]+1;\n        seen[s[i]]=i;\n        res=max(res,i-start+1);\n    }\n    return res;\n}`,
        java: `public int lengthOfLongestSubstring(String s) {\n    Map<Character,Integer> seen=new HashMap<>();\n    int start=0,res=0;\n    for(int i=0;i<s.length();i++){\n        if(seen.containsKey(s.charAt(i))&&seen.get(s.charAt(i))>=start)start=seen.get(s.charAt(i))+1;\n        seen.put(s.charAt(i),i);\n        res=Math.max(res,i-start+1);\n    }\n    return res;\n}`
    },

    // ===== STACK =====
    'Valid Parentheses': {
        python: `def isValid(s):\n    stack = []; m = {')':'(',']':'[','}':'{'}\n    for c in s:\n        if c in m:\n            if not stack or stack[-1] != m[c]: return False\n            stack.pop()\n        else: stack.append(c)\n    return not stack`,
        javascript: `function isValid(s) {\n    const stack=[],m={')':'(',']':'[','}':'{'};\n    for(const c of s){\n        if(m[c]){if(!stack.length||stack[stack.length-1]!==m[c])return false;stack.pop();}\n        else stack.push(c);\n    }\n    return stack.length===0;\n}`,
        cpp: `bool isValid(string s) {\n    stack<char> st;\n    for(char c:s){\n        if(c=='('||c=='['||c=='{')st.push(c);\n        else{if(st.empty())return false;char t=st.top();st.pop();if(c==')'&&t!='('||c==']'&&t!='['||c=='}'&&t!='{')return false;}\n    }\n    return st.empty();\n}`,
        java: `public boolean isValid(String s) {\n    Stack<Character> st=new Stack<>();\n    for(char c:s.toCharArray()){\n        if(c=='(')st.push(')');else if(c=='[')st.push(']');else if(c=='{')st.push('}');\n        else if(st.empty()||st.pop()!=c)return false;\n    }\n    return st.empty();\n}`
    },

    // ===== BINARY SEARCH =====
    'Binary Search': {
        python: `def search(nums, target):\n    lo, hi = 0, len(nums)-1\n    while lo <= hi:\n        mid = (lo+hi)//2\n        if nums[mid] == target: return mid\n        elif nums[mid] < target: lo = mid+1\n        else: hi = mid-1\n    return -1`,
        javascript: `function search(nums, target) {\n    let lo=0,hi=nums.length-1;\n    while(lo<=hi){let mid=(lo+hi)>>1;if(nums[mid]===target)return mid;else if(nums[mid]<target)lo=mid+1;else hi=mid-1;}\n    return -1;\n}`,
        cpp: `int search(vector<int>& nums, int target) {\n    int lo=0,hi=nums.size()-1;\n    while(lo<=hi){int mid=(lo+hi)/2;if(nums[mid]==target)return mid;else if(nums[mid]<target)lo=mid+1;else hi=mid-1;}\n    return -1;\n}`,
        java: `public int search(int[] nums, int target) {\n    int lo=0,hi=nums.length-1;\n    while(lo<=hi){int mid=(lo+hi)/2;if(nums[mid]==target)return mid;else if(nums[mid]<target)lo=mid+1;else hi=mid-1;}\n    return -1;\n}`
    },

    // ===== DP =====
    'Climbing Stairs': {
        python: `def climbStairs(n):\n    a, b = 1, 1\n    for _ in range(n-1):\n        a, b = b, a+b\n    return b`,
        javascript: `function climbStairs(n) {\n    let a=1,b=1;\n    for(let i=1;i<n;i++){[a,b]=[b,a+b];}\n    return b;\n}`,
        cpp: `int climbStairs(int n) {\n    int a=1,b=1;\n    for(int i=1;i<n;i++){int t=b;b=a+b;a=t;}\n    return b;\n}`,
        java: `public int climbStairs(int n) {\n    int a=1,b=1;\n    for(int i=1;i<n;i++){int t=b;b=a+b;a=t;}\n    return b;\n}`
    },
    'House Robber': {
        python: `def rob(nums):\n    prev = curr = 0\n    for n in nums:\n        prev, curr = curr, max(curr, prev+n)\n    return curr`,
        javascript: `function rob(nums) {\n    let prev=0,curr=0;\n    for(const n of nums){[prev,curr]=[curr,Math.max(curr,prev+n)];}\n    return curr;\n}`,
        cpp: `int rob(vector<int>& nums) {\n    int prev=0,curr=0;\n    for(int n:nums){int t=curr;curr=max(curr,prev+n);prev=t;}\n    return curr;\n}`,
        java: `public int rob(int[] nums) {\n    int prev=0,curr=0;\n    for(int n:nums){int t=curr;curr=Math.max(curr,prev+n);prev=t;}\n    return curr;\n}`
    },
    'Coin Change': {
        python: `def coinChange(coins, amount):\n    dp = [float('inf')]*(amount+1)\n    dp[0] = 0\n    for c in coins:\n        for a in range(c, amount+1):\n            dp[a] = min(dp[a], dp[a-c]+1)\n    return dp[amount] if dp[amount] != float('inf') else -1`,
        javascript: `function coinChange(coins, amount) {\n    const dp=Array(amount+1).fill(Infinity);\n    dp[0]=0;\n    for(const c of coins)for(let a=c;a<=amount;a++)dp[a]=Math.min(dp[a],dp[a-c]+1);\n    return dp[amount]===Infinity?-1:dp[amount];\n}`,
        cpp: `int coinChange(vector<int>& coins, int amount) {\n    vector<int> dp(amount+1,INT_MAX);\n    dp[0]=0;\n    for(int c:coins)for(int a=c;a<=amount;a++)if(dp[a-c]!=INT_MAX)dp[a]=min(dp[a],dp[a-c]+1);\n    return dp[amount]==INT_MAX?-1:dp[amount];\n}`,
        java: `public int coinChange(int[] coins, int amount) {\n    int[] dp=new int[amount+1];\n    Arrays.fill(dp,amount+1);\n    dp[0]=0;\n    for(int c:coins)for(int a=c;a<=amount;a++)dp[a]=Math.min(dp[a],dp[a-c]+1);\n    return dp[amount]>amount?-1:dp[amount];\n}`
    },

    // ===== GRAPH =====
    'Number of Islands': {
        python: `def numIslands(grid):\n    if not grid: return 0\n    m, n = len(grid), len(grid[0])\n    count = 0\n    def dfs(i, j):\n        if i < 0 or i >= m or j < 0 or j >= n or grid[i][j] != '1': return\n        grid[i][j] = '0'\n        dfs(i+1,j); dfs(i-1,j); dfs(i,j+1); dfs(i,j-1)\n    for i in range(m):\n        for j in range(n):\n            if grid[i][j] == '1':\n                dfs(i,j); count += 1\n    return count`,
        javascript: `function numIslands(grid) {\n    if(!grid.length)return 0;\n    const m=grid.length,n=grid[0].length;\n    let count=0;\n    function dfs(i,j){\n        if(i<0||i>=m||j<0||j>=n||grid[i][j]!=='1')return;\n        grid[i][j]='0';\n        dfs(i+1,j);dfs(i-1,j);dfs(i,j+1);dfs(i,j-1);\n    }\n    for(let i=0;i<m;i++)for(let j=0;j<n;j++)if(grid[i][j]==='1'){dfs(i,j);count++;}\n    return count;\n}`,
        cpp: `int numIslands(vector<vector<char>>& grid) {\n    int m=grid.size(),n=grid[0].size(),count=0;\n    function<void(int,int)> dfs=[&](int i,int j){\n        if(i<0||i>=m||j<0||j>=n||grid[i][j]!='1')return;\n        grid[i][j]='0';\n        dfs(i+1,j);dfs(i-1,j);dfs(i,j+1);dfs(i,j-1);\n    };\n    for(int i=0;i<m;i++)for(int j=0;j<n;j++)if(grid[i][j]=='1'){dfs(i,j);count++;}\n    return count;\n}`,
        java: `public int numIslands(char[][] grid) {\n    int m=grid.length,n=grid[0].length,count=0;\n    for(int i=0;i<m;i++)for(int j=0;j<n;j++)if(grid[i][j]=='1'){dfs(grid,i,j);count++;}\n    return count;\n}\nvoid dfs(char[][] g,int i,int j){\n    if(i<0||i>=g.length||j<0||j>=g[0].length||g[i][j]!='1')return;\n    g[i][j]='0';\n    dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);\n}`
    },

    // ===== BIT MANIPULATION =====
    'Single Number': {
        python: `def singleNumber(nums):\n    res = 0\n    for n in nums: res ^= n\n    return res`,
        javascript: `function singleNumber(nums) {\n    return nums.reduce((a,b)=>a^b,0);\n}`,
        cpp: `int singleNumber(vector<int>& nums) {\n    int res=0;\n    for(int n:nums)res^=n;\n    return res;\n}`,
        java: `public int singleNumber(int[] nums) {\n    int res=0;\n    for(int n:nums)res^=n;\n    return res;\n}`
    },

    // ===== STRING =====
    'Valid Anagram': {
        python: `def isAnagram(s, t):\n    from collections import Counter\n    return Counter(s) == Counter(t)`,
        javascript: `function isAnagram(s, t) {\n    if(s.length!==t.length)return false;\n    const c={};\n    for(const ch of s)c[ch]=(c[ch]||0)+1;\n    for(const ch of t){if(!c[ch])return false;c[ch]--;}\n    return true;\n}`,
        cpp: `bool isAnagram(string s, string t) {\n    if(s.size()!=t.size())return false;\n    int c[26]={};\n    for(char ch:s)c[ch-'a']++;\n    for(char ch:t)if(--c[ch-'a']<0)return false;\n    return true;\n}`,
        java: `public boolean isAnagram(String s, String t) {\n    if(s.length()!=t.length())return false;\n    int[] c=new int[26];\n    for(char ch:s.toCharArray())c[ch-'a']++;\n    for(char ch:t.toCharArray())if(--c[ch-'a']<0)return false;\n    return true;\n}`
    },

    // ===== BACKTRACKING =====
    'Subsets': {
        python: `def subsets(nums):\n    res = [[]]\n    for n in nums:\n        res += [s + [n] for s in res]\n    return res`,
        javascript: `function subsets(nums) {\n    const res=[[]];\n    for(const n of nums)res.push(...res.map(s=>[...s,n]));\n    return res;\n}`,
        cpp: `vector<vector<int>> subsets(vector<int>& nums) {\n    vector<vector<int>> res={{}};\n    for(int n:nums){\n        int sz=res.size();\n        for(int i=0;i<sz;i++){auto t=res[i];t.push_back(n);res.push_back(t);}\n    }\n    return res;\n}`,
        java: `public List<List<Integer>> subsets(int[] nums) {\n    List<List<Integer>> res=new ArrayList<>();\n    res.add(new ArrayList<>());\n    for(int n:nums){\n        int sz=res.size();\n        for(int i=0;i<sz;i++){List<Integer> t=new ArrayList<>(res.get(i));t.add(n);res.add(t);}\n    }\n    return res;\n}`
    },
    'Permutations': {
        python: `def permute(nums):\n    if len(nums) <= 1: return [nums]\n    res = []\n    for i, n in enumerate(nums):\n        for p in permute(nums[:i]+nums[i+1:]):\n            res.append([n]+p)\n    return res`,
        javascript: `function permute(nums) {\n    if(nums.length<=1)return[nums];\n    const res=[];\n    for(let i=0;i<nums.length;i++){\n        const rest=[...nums.slice(0,i),...nums.slice(i+1)];\n        for(const p of permute(rest))res.push([nums[i],...p]);\n    }\n    return res;\n}`,
        cpp: `vector<vector<int>> permute(vector<int>& nums) {\n    vector<vector<int>> res;\n    sort(nums.begin(),nums.end());\n    do{res.push_back(nums);}while(next_permutation(nums.begin(),nums.end()));\n    return res;\n}`,
        java: `public List<List<Integer>> permute(int[] nums) {\n    List<List<Integer>> res=new ArrayList<>();\n    bt(nums,new ArrayList<>(),res);\n    return res;\n}\nvoid bt(int[] nums,List<Integer> cur,List<List<Integer>> res){\n    if(cur.size()==nums.length){res.add(new ArrayList<>(cur));return;}\n    for(int n:nums)if(!cur.contains(n)){cur.add(n);bt(nums,cur,res);cur.remove(cur.size()-1);}\n}`
    },

    // ===== LINKED LIST (array-based) =====
    'Reverse Linked List': {
        python: `def reverseList(head):\n    head.reverse()\n    return head`,
        javascript: `function reverseList(head) {\n    return head.reverse();\n}`,
        cpp: `// Array-based: reverse the array\n// reverse(nums.begin(), nums.end());`,
        java: `// Array-based: Collections.reverse(list);`
    },
    'Merge Two Sorted Lists': {
        python: `def mergeTwoLists(list1, list2):\n    res = []\n    i = j = 0\n    while i < len(list1) and j < len(list2):\n        if list1[i] <= list2[j]: res.append(list1[i]); i += 1\n        else: res.append(list2[j]); j += 1\n    return res + list1[i:] + list2[j:]`,
        javascript: `function mergeTwoLists(list1, list2) {\n    const res=[];\n    let i=0,j=0;\n    while(i<list1.length&&j<list2.length){\n        if(list1[i]<=list2[j])res.push(list1[i++]);else res.push(list2[j++]);\n    }\n    return [...res,...list1.slice(i),...list2.slice(j)];\n}`,
        cpp: `// Merge two sorted arrays\nvector<int> merge(vector<int>& a, vector<int>& b) {\n    vector<int> res;\n    merge(a.begin(),a.end(),b.begin(),b.end(),back_inserter(res));\n    return res;\n}`,
        java: `// Merge two sorted arrays\npublic int[] merge(int[] a, int[] b) {\n    int[] res=new int[a.length+b.length];\n    int i=0,j=0,k=0;\n    while(i<a.length&&j<b.length)res[k++]=a[i]<=b[j]?a[i++]:b[j++];\n    while(i<a.length)res[k++]=a[i++];\n    while(j<b.length)res[k++]=b[j++];\n    return res;\n}`
    },
    'Maximum Depth of Binary Tree': {
        python: `def maxDepth(root):\n    if not root: return 0\n    if isinstance(root, list):\n        if not root or root == [None]: return 0\n        def depth(i):\n            if i >= len(root) or root[i] is None: return 0\n            return 1 + max(depth(2*i+1), depth(2*i+2))\n        return depth(0)\n    return root`,
        javascript: `function maxDepth(root) {\n    if(!root||!root.length)return 0;\n    function depth(i){if(i>=root.length||root[i]===null)return 0;return 1+Math.max(depth(2*i+1),depth(2*i+2));}\n    return depth(0);\n}`,
        cpp: `int maxDepth(vector<int>& root) {\n    // BFS level count on array representation\n    if(root.empty())return 0;\n    int depth=0,n=root.size(),i=0;\n    while(i<n){int sz=1;for(int j=0;j<sz&&i<n;j++,i++)if(root[i]!=-1)sz*=2;depth++;}\n    return depth;\n}`,
        java: `public int maxDepth(int[] root) {\n    if(root.length==0)return 0;\n    // Array-based tree depth\n    return (int)(Math.log(root.length)/Math.log(2))+1;\n}`
    },
};

async function main() {
    console.log('Seeding multi-language solutions...');
    const { data: problems } = await supabaseAdmin
        .from('problems')
        .select('id, title')
        .order('id');

    let updated = 0, skipped = 0;
    for (const p of problems || []) {
        const sol = SOLUTIONS[p.title];
        if (!sol) { skipped++; continue; }

        const { error } = await supabaseAdmin
            .from('problems')
            .update({ solution_code: sol })
            .eq('id', p.id);

        if (!error) updated++;
        else console.error(`Error ${p.title}:`, error.message);
    }

    console.log(`\nUpdated ${updated} problems with multi-language solutions`);
    console.log(`Skipped ${skipped} problems (no solution defined)`);

    const { data: withSol } = await supabaseAdmin
        .from('problems')
        .select('id', { count: 'exact' })
        .not('solution_code', 'is', null);

    console.log(`Total problems with solutions: ${withSol?.length || 0}/425`);
}

main().catch(console.error);
