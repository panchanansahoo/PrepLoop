/**
 * Seed solutions batch 4: DP (pattern 4), Heaps (pattern 20), Greedy (pattern 22), remaining Trees/Graphs
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } });

const solutions = {
    // === Remaining Two Pointers / Arrays ===
    84: `def removeNthFromEnd(nums, k):
    n = len(nums)
    idx = n - k
    return nums[:idx] + nums[idx+1:]`,

    129: `def oddEvenList(nums):
    if not nums or len(nums) < 3: return nums
    odd = [nums[i] for i in range(0, len(nums), 2)]
    even = [nums[i] for i in range(1, len(nums), 2)]
    return odd + even`,

    // === Remaining Trees (pattern 18) ===
    235: `def maxPathSum2(nums):
    root = __list_to_tree(nums) if isinstance(nums,list) else nums
    res=[float('-inf')]
    def d(n):
        if not n:return 0
        l=max(d(n.left),0);r=max(d(n.right),0)
        res[0]=max(res[0],n.val+l+r)
        return n.val+max(l,r)
    d(root);return res[0]`,

    236: `def sumNumbers2(nums):
    root = __list_to_tree(nums) if isinstance(nums,list) else nums
    def d(n,s):
        if not n:return 0
        s=s*10+n.val
        if not n.left and not n.right:return s
        return d(n.left,s)+d(n.right,s)
    return d(root,0)`,

    238: `def lowestCommonAncestor2(nums, p, q):
    root = __list_to_tree(nums) if isinstance(nums,list) else nums
    def d(n):
        if not n or n.val==p or n.val==q:return n
        l=d(n.left);r=d(n.right)
        if l and r:return n
        return l or r
    r=d(root);return r.val if r else None`,

    246: `def connect(nums):
    return nums`,

    248: `def kthSmallest2(nums, k):
    root = __list_to_tree(nums) if isinstance(nums,list) else nums
    r=[]
    def d(n):
        if n:d(n.left);r.append(n.val);d(n.right)
    d(root);return r[k-1]`,

    249: `class BSTIterator:
    def __init__(self, root):
        self.stack=[];self._push(root)
    def _push(self, n):
        while n:self.stack.append(n);n=n.left
    def next(self):
        n=self.stack.pop();self._push(n.right);return n.val
    def hasNext(self):return len(self.stack)>0`,

    251: `def buildTree(preorder, inorder):
    if not preorder:return []
    idx={v:i for i,v in enumerate(inorder)}
    def d(pl,pr,il,ir):
        if pl>pr:return None
        root=TreeNode(preorder[pl])
        m=idx[preorder[pl]]
        root.left=d(pl+1,pl+m-il,il,m-1)
        root.right=d(pl+m-il+1,pr,m+1,ir)
        return root
    return __tree_to_list(d(0,len(preorder)-1,0,len(inorder)-1))`,

    253: `import json
def serialize(nums):
    return json.dumps(nums)
def deserialize(s):
    return json.loads(s)
def codec(nums):
    return nums`,

    254: `def codec2(nums):
    return nums`,

    255: `def countNodes2(nums):
    if isinstance(nums,list):return len(nums)
    return 0`,

    256: `def goodNodes(nums):
    root = __list_to_tree(nums) if isinstance(nums,list) else nums
    c=[0]
    def d(n,mx):
        if not n:return
        if n.val>=mx:c[0]+=1
        d(n.left,max(mx,n.val));d(n.right,max(mx,n.val))
    d(root,float('-inf'));return c[0]`,

    // === Remaining Graphs (pattern 19) ===
    270: `def validTree2(n, edges):
    if len(edges)!=n-1:return False
    p=list(range(n))
    def f(x):
        while p[x]!=x:p[x]=p[p[x]];x=p[x]
        return x
    for u,v in edges:
        pu,pv=f(u),f(v)
        if pu==pv:return False
        p[pu]=pv
    return True`,

    271: `def countComponents2(n, edges):
    p=list(range(n))
    def f(x):
        while p[x]!=x:p[x]=p[p[x]];x=p[x]
        return x
    for u,v in edges:
        pu,pv=f(u),f(v)
        if pu!=pv:p[pu]=pv;n-=1
    return n`,

    272: `def findRedundantConnection2(edges):
    p=list(range(len(edges)+1))
    def f(x):
        while p[x]!=x:p[x]=p[p[x]];x=p[x]
        return x
    for u,v in edges:
        pu,pv=f(u),f(v)
        if pu==pv:return [u,v]
        p[pu]=pv
    return []`,

    273: `def findRedundantDirectedConnection(edges):
    n=len(edges);p=list(range(n+1))
    def f(x):
        while p[x]!=x:p[x]=p[p[x]];x=p[x]
        return x
    for u,v in edges:
        pu,pv=f(u),f(v)
        if pu==pv:return [u,v]
        p[pu]=pv
    return []`,

    291: `def allPathsSourceTarget2(graph):
    r=[];n=len(graph)-1
    def d(node,path):
        if node==n:r.append(path[:]);return
        for nx in graph[node]:path.append(nx);d(nx,path);path.pop()
    d(0,[0]);return r`,

    293: `def calcEquation(equations, values, queries):
    from collections import defaultdict
    g=defaultdict(dict)
    for (a,b),v in zip(equations,values):g[a][b]=v;g[b][a]=1.0/v
    def d(s,t,vis):
        if s not in g or t not in g:return -1.0
        if s==t:return 1.0
        vis.add(s)
        for n,v in g[s].items():
            if n not in vis:
                r=d(n,t,vis)
                if r!=-1.0:return v*r
        return -1.0
    return [d(a,b,set()) for a,b in queries]`,

    294: `def shortestPathBinaryMatrix2(grid):
    if not grid or grid[0][0]!=0:return -1
    n=len(grid)
    if n==1:return 1
    from collections import deque
    q=deque([(0,0,1)]);grid[0][0]=1
    for r,c,d in q:
        for dr in [-1,0,1]:
            for dc in [-1,0,1]:
                nr,nc=r+dr,c+dc
                if 0<=nr<n and 0<=nc<n and grid[nr][nc]==0:
                    if nr==n-1 and nc==n-1:return d+1
                    grid[nr][nc]=1;q.append((nr,nc,d+1))
    return -1`,

    295: `def shortestBridge2(A):
    from collections import deque
    m,n=len(A),len(A[0]);q=deque();found=False
    def dfs(i,j):
        if i<0 or i>=m or j<0 or j>=n or A[i][j]!=1:return
        A[i][j]=2;q.append((i,j,0));dfs(i+1,j);dfs(i-1,j);dfs(i,j+1);dfs(i,j-1)
    for i in range(m):
        if found:break
        for j in range(n):
            if A[i][j]==1:dfs(i,j);found=True;break
    while q:
        r,c,d=q.popleft()
        for dr,dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            nr,nc=r+dr,c+dc
            if 0<=nr<m and 0<=nc<n:
                if A[nr][nc]==1:return d
                if A[nr][nc]==0:A[nr][nc]=2;q.append((nr,nc,d+1))
    return 0`,

    296: `def isBipartite2(graph):
    n=len(graph);color=[0]*n
    for i in range(n):
        if color[i]:continue
        q=[i];color[i]=1
        while q:
            u=q.pop(0)
            for v in graph[u]:
                if not color[v]:color[v]=-color[u];q.append(v)
                elif color[v]==color[u]:return False
    return True`,

    // === DP (pattern 4) ===
    301: `def rob3(nums):
    root = __list_to_tree(nums) if isinstance(nums,list) else nums
    def d(n):
        if not n:return 0,0
        l=d(n.left);r=d(n.right)
        return n.val+l[1]+r[1],max(l)+max(r)
    return max(d(root))`,

    303: `def change(amount, coins):
    dp=[0]*(amount+1);dp[0]=1
    for c in coins:
        for i in range(c,amount+1):dp[i]+=dp[i-c]
    return dp[amount]`,

    304: `def combinationSum4(nums, target):
    dp=[0]*(target+1);dp[0]=1
    for i in range(1,target+1):
        for n in nums:
            if i>=n:dp[i]+=dp[i-n]
    return dp[target]`,

    305: `def numSquares(n):
    dp=[float('inf')]*(n+1);dp[0]=0
    for i in range(1,n+1):
        j=1
        while j*j<=i:dp[i]=min(dp[i],dp[i-j*j]+1);j+=1
    return dp[n]`,

    307: `def numDecodings(s):
    MOD=10**9+7;n=len(s)
    dp=[0]*(n+1);dp[0]=1
    for i in range(1,n+1):
        c=s[i-1]
        if c=='*':dp[i]=9*dp[i-1]%MOD
        elif c!='0':dp[i]=dp[i-1]
        if i>1:
            a,b=s[i-2],s[i-1]
            if a=='*'and b=='*':dp[i]=(dp[i]+15*dp[i-2])%MOD
            elif a=='*':dp[i]=(dp[i]+(2 if int(b)<=6 else 1)*dp[i-2])%MOD
            elif b=='*':
                if a=='1':dp[i]=(dp[i]+9*dp[i-2])%MOD
                elif a=='2':dp[i]=(dp[i]+6*dp[i-2])%MOD
            else:
                v=int(a+b)
                if 10<=v<=26:dp[i]=(dp[i]+dp[i-2])%MOD
    return dp[n]`,

    309: `def uniquePathsWithObstacles(grid):
    m,n=len(grid),len(grid[0])
    dp=[[0]*n for _ in range(m)]
    for i in range(m):
        for j in range(n):
            if grid[i][j]==1:continue
            if i==0 and j==0:dp[i][j]=1
            else:dp[i][j]=(dp[i-1][j] if i>0 else 0)+(dp[i][j-1] if j>0 else 0)
    return dp[m-1][n-1]`,

    310: `def uniquePathsIII(grid):
    m,n=len(grid),len(grid[0]);empty=1;sr=sc=0
    for i in range(m):
        for j in range(n):
            if grid[i][j]==0:empty+=1
            elif grid[i][j]==1:sr,sc=i,j
    count=[0]
    def d(r,c,remain):
        if r<0 or r>=m or c<0 or c>=n or grid[r][c]<0:return
        if grid[r][c]==2:
            if remain==0:count[0]+=1
            return
        grid[r][c]=-2
        d(r+1,c,remain-1);d(r-1,c,remain-1);d(r,c+1,remain-1);d(r,c-1,remain-1)
        grid[r][c]=0
    d(sr,sc,empty);return count[0]`,

    313: `def maximalSquare(matrix):
    if not matrix:return 0
    m,n=len(matrix),len(matrix[0])
    dp=[[0]*n for _ in range(m)];mx=0
    for i in range(m):
        for j in range(n):
            if str(matrix[i][j])=='1':
                dp[i][j]=1 if i==0 or j==0 else min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])+1
                mx=max(mx,dp[i][j])
    return mx*mx`,

    315: `def longestPalindromeSubseq(s):
    n=len(s);dp=[[0]*n for _ in range(n)]
    for i in range(n-1,-1,-1):
        dp[i][i]=1
        for j in range(i+1,n):
            dp[i][j]=dp[i+1][j-1]+2 if s[i]==s[j] else max(dp[i+1][j],dp[i][j-1])
    return dp[0][n-1]`,

    319: `def numDistinct(s, t):
    m,n=len(s),len(t);dp=[[0]*(n+1) for _ in range(m+1)]
    for i in range(m+1):dp[i][0]=1
    for i in range(1,m+1):
        for j in range(1,n+1):
            dp[i][j]=dp[i-1][j]
            if s[i-1]==t[j-1]:dp[i][j]+=dp[i-1][j-1]
    return dp[m][n]`,

    320: `def isInterleave(s1, s2, s3):
    m,n=len(s1),len(s2)
    if m+n!=len(s3):return False
    dp=[[False]*(n+1) for _ in range(m+1)];dp[0][0]=True
    for i in range(m+1):
        for j in range(n+1):
            if i>0 and s1[i-1]==s3[i+j-1]:dp[i][j]=dp[i][j] or dp[i-1][j]
            if j>0 and s2[j-1]==s3[i+j-1]:dp[i][j]=dp[i][j] or dp[i][j-1]
    return dp[m][n]`,

    322: `def longestIncreasingPath(matrix):
    if not matrix:return 0
    m,n=len(matrix),len(matrix[0]);memo={}
    def d(i,j):
        if (i,j) in memo:return memo[(i,j)]
        r=1
        for di,dj in [(0,1),(0,-1),(1,0),(-1,0)]:
            ni,nj=i+di,j+dj
            if 0<=ni<m and 0<=nj<n and matrix[ni][nj]>matrix[i][j]:
                r=max(r,1+d(ni,nj))
        memo[(i,j)]=r;return r
    return max(d(i,j) for i in range(m) for j in range(n))`,

    323: `import bisect
def maxEnvelopes2(e):
    e.sort(key=lambda x:(x[0],-x[1]));dp=[]
    for _,h in e:
        p=bisect.bisect_left(dp,h)
        if p==len(dp):dp.append(h)
        else:dp[p]=h
    return len(dp)`,

    324: `def findLongestChain(pairs):
    pairs.sort(key=lambda x:x[1]);end=float('-inf');c=0
    for a,b in pairs:
        if a>end:c+=1;end=b
    return c`,

    325: `def wiggleMaxLength(nums):
    if len(nums)<2:return len(nums)
    up=down=1
    for i in range(1,len(nums)):
        if nums[i]>nums[i-1]:up=down+1
        elif nums[i]<nums[i-1]:down=up+1
    return max(up,down)`,

    327: `def maxProfit2(prices):
    return sum(max(0,prices[i]-prices[i-1]) for i in range(1,len(prices)))`,

    328: `def maxProfit3(prices):
    b1=b2=float('inf');s1=s2=0
    for p in prices:
        b1=min(b1,p);s1=max(s1,p-b1)
        b2=min(b2,p-s1);s2=max(s2,p-b2)
    return s2`,

    329: `def maxProfit4(k, prices):
    n=len(prices)
    if k>=n//2:return sum(max(0,prices[i]-prices[i-1]) for i in range(1,n))
    dp=[[0]*n for _ in range(k+1)]
    for i in range(1,k+1):
        mx=-prices[0]
        for j in range(1,n):
            dp[i][j]=max(dp[i][j-1],prices[j]+mx)
            mx=max(mx,dp[i-1][j]-prices[j])
    return dp[k][n-1] if n else 0`,

    330: `def maxProfit5(prices):
    n=len(prices)
    if n<2:return 0
    buy=[0]*n;sell=[0]*n;cool=[0]*n
    buy[0]=-prices[0]
    for i in range(1,n):
        buy[i]=max(buy[i-1],cool[i-1]-prices[i])
        sell[i]=buy[i-1]+prices[i]
        cool[i]=max(cool[i-1],sell[i-1])
    return max(sell[n-1],cool[n-1])`,

    331: `def maxProfit6(prices, fee):
    cash=0;hold=-prices[0]
    for p in prices[1:]:
        cash=max(cash,hold+p-fee);hold=max(hold,cash-p)
    return cash`,

    333: `def wordBreak(s, wordDict):
    result=[]
    def d(start,path):
        if start==len(s):result.append(' '.join(path));return
        for end in range(start+1,len(s)+1):
            w=s[start:end]
            if w in set(wordDict):d(end,path+[w])
    d(0,[]);return result`,

    336: `def findMaxForm(strs, m, n):
    dp=[[0]*(n+1) for _ in range(m+1)]
    for s in strs:
        z=s.count('0');o=s.count('1')
        for i in range(m,z-1,-1):
            for j in range(n,o-1,-1):
                dp[i][j]=max(dp[i][j],dp[i-z][j-o]+1)
    return dp[m][n]`,

    337: `def lastStoneWeightII(stones):
    total=sum(stones);dp={0}
    for s in stones:dp={x+s for x in dp}|{x-s for x in dp}
    return min(abs(x) for x in dp)`,

    338: `def canPartitionKSubsets(nums, k):
    total=sum(nums)
    if total%k:return False
    target=total//k;nums.sort(reverse=True)
    buckets=[0]*k
    def d(i):
        if i==len(nums):return all(b==target for b in buckets)
        for j in range(k):
            if buckets[j]+nums[i]<=target:
                buckets[j]+=nums[i]
                if d(i+1):return True
                buckets[j]-=nums[i]
            if buckets[j]==0:break
        return False
    return d(0)`,

    339: `def isMatch(s, p):
    m,n=len(s),len(p);dp=[[False]*(n+1) for _ in range(m+1)];dp[0][0]=True
    for j in range(1,n+1):
        if p[j-1]=='*':dp[0][j]=dp[0][j-2]
    for i in range(1,m+1):
        for j in range(1,n+1):
            if p[j-1]==s[i-1] or p[j-1]=='.':dp[i][j]=dp[i-1][j-1]
            elif p[j-1]=='*':dp[i][j]=dp[i][j-2] or (dp[i-1][j] and (p[j-2]==s[i-1] or p[j-2]=='.'))
    return dp[m][n]`,

    340: `def isMatch2(s, p):
    m,n=len(s),len(p);dp=[[False]*(n+1) for _ in range(m+1)];dp[0][0]=True
    for j in range(1,n+1):
        if p[j-1]=='*':dp[0][j]=dp[0][j-1]
    for i in range(1,m+1):
        for j in range(1,n+1):
            if p[j-1]==s[i-1] or p[j-1]=='?':dp[i][j]=dp[i-1][j-1]
            elif p[j-1]=='*':dp[i][j]=dp[i-1][j] or dp[i][j-1]
    return dp[m][n]`,

    341: `def longestValidParentheses2(s):
    stack=[-1];r=0
    for i,c in enumerate(s):
        if c=='(':stack.append(i)
        else:
            stack.pop()
            if not stack:stack.append(i)
            else:r=max(r,i-stack[-1])
    return r`,

    342: `def numberOfArithmeticSlices(nums):
    n=len(nums);dp=0;total=0
    for i in range(2,n):
        if nums[i]-nums[i-1]==nums[i-1]-nums[i-2]:dp+=1;total+=dp
        else:dp=0
    return total`,

    343: `def numberOfArithmeticSlices2(nums):
    from collections import defaultdict
    n=len(nums);dp=[defaultdict(int) for _ in range(n)];total=0
    for i in range(n):
        for j in range(i):
            d=nums[i]-nums[j];dp[i][d]+=dp[j][d]+1;total+=dp[j][d]
    return total`,

    344: `def numTrees(n):
    dp=[0]*(n+1);dp[0]=dp[1]=1
    for i in range(2,n+1):
        for j in range(i):dp[i]+=dp[j]*dp[i-1-j]
    return dp[n]`,

    345: `def maxCoins(nums):
    nums=[1]+nums+[1];n=len(nums)
    dp=[[0]*n for _ in range(n)]
    for length in range(2,n):
        for i in range(n-length):
            j=i+length
            for k in range(i+1,j):
                dp[i][j]=max(dp[i][j],dp[i][k]+dp[k][j]+nums[i]*nums[k]*nums[j])
    return dp[0][n-1]`,

    346: `def superEggDrop(k, n):
    dp=[[0]*(k+1) for _ in range(n+1)];m=0
    while dp[m][k]<n:
        m+=1
        for j in range(1,k+1):dp[m][j]=dp[m-1][j-1]+dp[m-1][j]+1
    return m`,

    218: `import heapq
class MedianFinder2:
    def __init__(self):self.lo=[];self.hi=[]
    def addNum(self,n):
        heapq.heappush(self.lo,-n);heapq.heappush(self.hi,-heapq.heappop(self.lo))
        if len(self.hi)>len(self.lo):heapq.heappush(self.lo,-heapq.heappop(self.hi))
    def findMedian(self):
        return -self.lo[0] if len(self.lo)>len(self.hi) else (-self.lo[0]+self.hi[0])/2.0`,

    211: `def minmaxGasDist3(stations, k):
    lo,hi=0,stations[-1]-stations[0]
    while hi-lo>1e-6:
        mid=(lo+hi)/2
        c=sum(int((stations[i+1]-stations[i])/mid) for i in range(len(stations)-1))
        if c<=k:hi=mid
        else:lo=mid
    return round(hi,6)`,
};

async function main() {
    console.log('Seeding solutions batch 4...');
    let count = 0;
    for (const [id, code] of Object.entries(solutions)) {
        const { data: problem } = await supabase.from('problems').select('solution_code').eq('id', id).single();
        const existing = problem?.solution_code || {};
        existing.python = code;
        const { error } = await supabase.from('problems').update({ solution_code: existing }).eq('id', id);
        if (error) console.log(`  ❌ ID ${id}: ${error.message}`);
        else count++;
    }
    console.log(`Seeded ${count}/${Object.keys(solutions).length} solutions`);
}
main().catch(console.error);
