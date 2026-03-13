import { supabaseAdmin } from '../db/supabaseClient.js';

// This script auto-generates JS/Java/C++ solutions from Python solutions
// for problems that are missing multi-language support.
// It handles common algorithmic patterns by translating Python idioms.

function pythonToJS(pyCode, fnName) {
    if (!pyCode) return null;
    // For class-based problems
    if (pyCode.includes('class ')) {
        const className = pyCode.match(/class\s+(\w+)/)?.[1] || 'Solution';
        // Return a basic JS class wrapper
        return null; // Skip class-based - these need manual handling
    }
    // Very basic translation - for simple function-based problems
    let js = pyCode
        .replace(/def\s+(\w+)\(self,?\s*/g, 'function $1(')
        .replace(/def\s+(\w+)\(/g, 'function $1(')
        .replace(/:\s*$/gm, ' {')
        .replace(/\bNone\b/g, 'null')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/\blen\((\w+)\)/g, '$1.length')
        .replace(/\band\b/g, '&&')
        .replace(/\bor\b/g, '||')
        .replace(/\bnot\b/g, '!')
        .replace(/\belif\b/g, 'else if')
        .replace(/\bfloat\('inf'\)/g, 'Infinity')
        .replace(/\bfloat\('-inf'\)/g, '-Infinity');
    return null; // Auto-translation is too error-prone, skip
}

// Instead, let's create a comprehensive lookup of solutions
// This is the remaining 249 problems that need JS/Java/C++ solutions

const solutions = {
    // Sliding Window & Hash
    88: { // Longest Repeating Character Replacement
        javascript: `function characterReplacement(s, k) {\n    const count = new Array(26).fill(0);\n    let l = 0, maxCount = 0, res = 0;\n    for (let r = 0; r < s.length; r++) {\n        count[s.charCodeAt(r) - 65]++;\n        maxCount = Math.max(maxCount, count[s.charCodeAt(r) - 65]);\n        while (r - l + 1 - maxCount > k) { count[s.charCodeAt(l) - 65]--; l++; }\n        res = Math.max(res, r - l + 1);\n    }\n    return res;\n}`,
        java: `class Solution {\n    public int characterReplacement(String s, int k) {\n        int[] count = new int[26];\n        int l = 0, maxCount = 0, res = 0;\n        for (int r = 0; r < s.length(); r++) {\n            count[s.charAt(r) - 'A']++;\n            maxCount = Math.max(maxCount, count[s.charAt(r) - 'A']);\n            while (r - l + 1 - maxCount > k) count[s.charAt(l++) - 'A']--;\n            res = Math.max(res, r - l + 1);\n        }\n        return res;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    int characterReplacement(string s, int k) {\n        int count[26] = {}, l = 0, maxCount = 0, res = 0;\n        for (int r = 0; r < s.size(); r++) {\n            count[s[r]-'A']++;\n            maxCount = max(maxCount, count[s[r]-'A']);\n            while (r-l+1-maxCount > k) count[s[l++]-'A']--;\n            res = max(res, r-l+1);\n        }\n        return res;\n    }\n};`
    },
    94: { // Minimum Size Subarray Sum
        javascript: `function minSubArrayLen(target, nums) {\n    let l = 0, sum = 0, res = Infinity;\n    for (let r = 0; r < nums.length; r++) {\n        sum += nums[r];\n        while (sum >= target) { res = Math.min(res, r - l + 1); sum -= nums[l++]; }\n    }\n    return res === Infinity ? 0 : res;\n}`,
        java: `class Solution {\n    public int minSubArrayLen(int target, int[] nums) {\n        int l = 0, sum = 0, res = Integer.MAX_VALUE;\n        for (int r = 0; r < nums.length; r++) {\n            sum += nums[r];\n            while (sum >= target) { res = Math.min(res, r - l + 1); sum -= nums[l++]; }\n        }\n        return res == Integer.MAX_VALUE ? 0 : res;\n    }\n}`,
        cpp: `class Solution {\npublic:\n    int minSubArrayLen(int target, vector<int>& nums) {\n        int l = 0, sum = 0, res = INT_MAX;\n        for (int r = 0; r < nums.size(); r++) {\n            sum += nums[r];\n            while (sum >= target) { res = min(res, r - l + 1); sum -= nums[l++]; }\n        }\n        return res == INT_MAX ? 0 : res;\n    }\n};`
    },
    101: { javascript: `function numberOfSubarrays(nums, k) {\n    let l=0,odd=0,res=0,count=0;\n    for(let r=0;r<nums.length;r++){\n        if(nums[r]%2===1){odd++;count=0;}\n        while(odd===k){count++;if(nums[l]%2===1)odd--;l++;}\n        res+=count;\n    }\n    return res;\n}`, java: `class Solution { public int numberOfSubarrays(int[] nums, int k) { return atMost(nums,k)-atMost(nums,k-1); } int atMost(int[] nums,int k){int l=0,r=0,res=0; for(;r<nums.length;r++){if(nums[r]%2==1)k--;while(k<0){if(nums[l]%2==1)k++;l++;}res+=r-l+1;} return res;} }`, cpp: `class Solution { public: int numberOfSubarrays(vector<int>& nums, int k) { return atMost(nums,k)-atMost(nums,k-1); } int atMost(vector<int>& nums,int k){int l=0,res=0; for(int r=0;r<nums.size();r++){if(nums[r]%2==1)k--;while(k<0){if(nums[l]%2==1)k++;l++;}res+=r-l+1;} return res;} };` },
    104: { javascript: `function maxSatisfied(customers, grumpy, minutes) {\n    let base=0;\n    for(let i=0;i<customers.length;i++) if(!grumpy[i]) base+=customers[i];\n    let extra=0,maxExtra=0;\n    for(let i=0;i<customers.length;i++){\n        if(grumpy[i]) extra+=customers[i];\n        if(i>=minutes&&grumpy[i-minutes]) extra-=customers[i-minutes];\n        maxExtra=Math.max(maxExtra,extra);\n    }\n    return base+maxExtra;\n}`, java: `class Solution { public int maxSatisfied(int[] c, int[] g, int m) { int base=0; for(int i=0;i<c.length;i++) if(g[i]==0) base+=c[i]; int extra=0,maxE=0; for(int i=0;i<c.length;i++){if(g[i]==1)extra+=c[i];if(i>=m&&g[i-m]==1)extra-=c[i-m];maxE=Math.max(maxE,extra);} return base+maxE; } }`, cpp: `class Solution { public: int maxSatisfied(vector<int>& c, vector<int>& g, int m) { int base=0; for(int i=0;i<c.size();i++) if(!g[i]) base+=c[i]; int extra=0,maxE=0; for(int i=0;i<c.size();i++){if(g[i])extra+=c[i];if(i>=m&&g[i-m])extra-=c[i-m];maxE=max(maxE,extra);} return base+maxE; } };` },
    106: { javascript: `function numOfSubarrays(arr, k, threshold) {\n    let sum=0,count=0;\n    for(let i=0;i<arr.length;i++){\n        sum+=arr[i];\n        if(i>=k) sum-=arr[i-k];\n        if(i>=k-1 && sum/k>=threshold) count++;\n    }\n    return count;\n}`, java: `class Solution { public int numOfSubarrays(int[] arr, int k, int threshold) { int sum=0,count=0; for(int i=0;i<arr.length;i++){sum+=arr[i];if(i>=k)sum-=arr[i-k];if(i>=k-1&&sum/k>=threshold)count++;} return count; } }`, cpp: `class Solution { public: int numOfSubarrays(vector<int>& arr, int k, int threshold) { int sum=0,count=0; for(int i=0;i<arr.size();i++){sum+=arr[i];if(i>=k)sum-=arr[i-k];if(i>=k-1&&sum/k>=threshold)count++;} return count; } };` },
    107: { javascript: `function numSubarraysWithSum(nums, goal) {\n    const atMost=(g)=>{if(g<0)return 0;let l=0,s=0,r=0,res=0;for(;r<nums.length;r++){s+=nums[r];while(s>g)s-=nums[l++];res+=r-l+1;}return res;};\n    return atMost(goal)-atMost(goal-1);\n}`, java: `class Solution { public int numSubarraysWithSum(int[] nums, int goal) { return atMost(nums,goal)-atMost(nums,goal-1); } int atMost(int[] nums,int g){if(g<0)return 0;int l=0,s=0,res=0;for(int r=0;r<nums.length;r++){s+=nums[r];while(s>g)s-=nums[l++];res+=r-l+1;}return res;} }`, cpp: `class Solution { public: int numSubarraysWithSum(vector<int>& nums, int goal) { return atMost(nums,goal)-atMost(nums,goal-1); } int atMost(vector<int>& nums,int g){if(g<0)return 0;int l=0,s=0,res=0;for(int r=0;r<nums.size();r++){s+=nums[r];while(s>g)s-=nums[l++];res+=r-l+1;}return res;} };` },
    113: { javascript: `function containsNearbyAlmostDuplicate(nums, indexDiff, valueDiff) {\n    const set = new Map();\n    const getId = (x) => Math.floor(x / (valueDiff + 1));\n    for (let i = 0; i < nums.length; i++) {\n        const id = getId(nums[i]);\n        if (set.has(id)) return true;\n        if (set.has(id-1) && Math.abs(nums[i]-set.get(id-1)) <= valueDiff) return true;\n        if (set.has(id+1) && Math.abs(nums[i]-set.get(id+1)) <= valueDiff) return true;\n        set.set(id, nums[i]);\n        if (i >= indexDiff) set.delete(getId(nums[i-indexDiff]));\n    }\n    return false;\n}`, java: `class Solution { public boolean containsNearbyAlmostDuplicate(int[] nums, int indexDiff, int valueDiff) { TreeSet<Long> set = new TreeSet<>(); for(int i=0;i<nums.length;i++){Long ceil=set.ceiling((long)nums[i]-valueDiff); if(ceil!=null&&ceil<=nums[i]+valueDiff) return true; set.add((long)nums[i]); if(i>=indexDiff) set.remove((long)nums[i-indexDiff]);} return false; } }`, cpp: `class Solution { public: bool containsNearbyAlmostDuplicate(vector<int>& nums, int indexDiff, int valueDiff) { set<long> s; for(int i=0;i<nums.size();i++){auto it=s.lower_bound((long)nums[i]-valueDiff); if(it!=s.end()&&*it<=(long)nums[i]+valueDiff) return true; s.insert(nums[i]); if(i>=indexDiff) s.erase(nums[i-indexDiff]);} return false; } };` },
    115: { javascript: `function largestVariance(s) {\n    let res=0;\n    for(let a=0;a<26;a++) for(let b=0;b<26;b++) if(a!==b) {\n        let cnt1=0,cnt2=0,hadB=false;\n        for(const c of s) {\n            const ci=c.charCodeAt(0)-97;\n            if(ci===a)cnt1++; else if(ci===b){cnt2++;hadB=true;}\n            if(cnt1<cnt2){cnt1=cnt2=0;hadB=false;}\n            if(hadB) res=Math.max(res,cnt1-cnt2);\n        }\n    }\n    return res;\n}`, java: `class Solution { public int largestVariance(String s) { int res=0; for(int a=0;a<26;a++) for(int b=0;b<26;b++) if(a!=b){int c1=0,c2=0;boolean hadB=false; for(char c:s.toCharArray()){int ci=c-'a';if(ci==a)c1++;else if(ci==b){c2++;hadB=true;}if(c1<c2){c1=c2=0;hadB=false;}if(hadB)res=Math.max(res,c1-c2);}} return res; } }`, cpp: `class Solution { public: int largestVariance(string s) { int res=0; for(int a=0;a<26;a++) for(int b=0;b<26;b++) if(a!=b){int c1=0,c2=0;bool hadB=false; for(char c:s){int ci=c-'a';if(ci==a)c1++;else if(ci==b){c2++;hadB=true;}if(c1<c2){c1=c2=0;hadB=false;}if(hadB)res=max(res,c1-c2);}} return res; } };` },
    116: { javascript: `function maxScore(cardPoints, k) {\n    let total=cardPoints.reduce((a,b)=>a+b),n=cardPoints.length,windowSize=n-k;\n    let windowSum=0,minWindow=Infinity;\n    for(let i=0;i<n;i++){windowSum+=cardPoints[i];if(i>=windowSize)windowSum-=cardPoints[i-windowSize];if(i>=windowSize-1)minWindow=Math.min(minWindow,windowSum);}\n    return total-minWindow;\n}`, java: `class Solution { public int maxScore(int[] c, int k) { int n=c.length,total=0; for(int x:c) total+=x; int ws=n-k,wSum=0,minW=Integer.MAX_VALUE; for(int i=0;i<n;i++){wSum+=c[i];if(i>=ws)wSum-=c[i-ws];if(i>=ws-1)minW=Math.min(minW,wSum);} return total-minW; } }`, cpp: `class Solution { public: int maxScore(vector<int>& c, int k) { int n=c.size(),total=accumulate(c.begin(),c.end(),0),ws=n-k,wSum=0,minW=INT_MAX; for(int i=0;i<n;i++){wSum+=c[i];if(i>=ws)wSum-=c[i-ws];if(i>=ws-1)minW=min(minW,wSum);} return total-minW; } };` },
};

async function run() {
    console.log('Adding multi-language solutions - Batch 2...\n');
    let updated = 0, failed = 0;
    for (const [id, langSolutions] of Object.entries(solutions)) {
        const { data: problem } = await supabaseAdmin.from('problems').select('solution_code').eq('id', parseInt(id)).single();
        if (!problem) { console.log(`  Problem #${id} not found`); continue; }
        const merged = { ...(problem.solution_code || {}), ...langSolutions };
        const { error } = await supabaseAdmin.from('problems').update({ solution_code: merged }).eq('id', parseInt(id));
        if (error) { console.error(`  ❌ #${id}: ${error.message}`); failed++; }
        else { updated++; }
    }
    console.log(`Done: ${updated} updated, ${failed} failed`);
}
run();
