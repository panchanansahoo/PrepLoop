/**
 * Seed solutions batch 5: Backtracking (21), Heaps (20), Tries (25), Greedy (22)
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
    // === BACKTRACKING (pattern 21) ===
    348: `def subsetsWithDup(nums):
    nums.sort();result=[]
    def d(start,path):
        result.append(path[:])
        for i in range(start,len(nums)):
            if i>start and nums[i]==nums[i-1]:continue
            path.append(nums[i]);d(i+1,path);path.pop()
    d(0,[]);return result`,

    350: `def permuteUnique(nums):
    nums.sort();result=[];used=[False]*len(nums)
    def d(path):
        if len(path)==len(nums):result.append(path[:]);return
        for i in range(len(nums)):
            if used[i]:continue
            if i>0 and nums[i]==nums[i-1] and not used[i-1]:continue
            used[i]=True;path.append(nums[i]);d(path);path.pop();used[i]=False
    d([]);return result`,

    352: `def combinationSum2(candidates, target):
    candidates.sort();result=[]
    def d(start,t,path):
        if t==0:result.append(path[:]);return
        for i in range(start,len(candidates)):
            if candidates[i]>t:break
            if i>start and candidates[i]==candidates[i-1]:continue
            path.append(candidates[i]);d(i+1,t-candidates[i],path);path.pop()
    d(0,target,[]);return result`,

    353: `def combinationSum3(k, n):
    result=[]
    def d(start,remaining,path):
        if len(path)==k:
            if remaining==0:result.append(path[:])
            return
        for i in range(start,10):
            if i>remaining:break
            path.append(i);d(i+1,remaining-i,path);path.pop()
    d(1,n,[]);return result`,

    354: `def combine(n, k):
    result=[]
    def d(start,path):
        if len(path)==k:result.append(path[:]);return
        for i in range(start,n+1):
            path.append(i);d(i+1,path);path.pop()
    d(1,[]);return result`,

    357: `def partition(s):
    result=[]
    def is_pal(s):return s==s[::-1]
    def d(start,path):
        if start==len(s):result.append(path[:]);return
        for end in range(start+1,len(s)+1):
            if is_pal(s[start:end]):
                path.append(s[start:end]);d(end,path);path.pop()
    d(0,[]);return result`,

    358: `def minCut(s):
    n=len(s);dp=[0]*n;pal=[[False]*n for _ in range(n)]
    for i in range(n):
        mn=i
        for j in range(i+1):
            if s[j]==s[i] and (i-j<2 or pal[j+1][i-1]):
                pal[j][i]=True;mn=0 if j==0 else min(mn,dp[j-1]+1)
        dp[i]=mn
    return dp[n-1]`,

    360: `def wordSearch(board, words):
    result=set()
    from collections import defaultdict
    trie={}
    for w in words:
        node=trie
        for c in w:node=node.setdefault(c,{})
        node['#']=w
    m,n=len(board),len(board[0])
    def d(i,j,node):
        c=board[i][j]
        if c not in node:return
        node=node[c]
        if '#' in node:result.add(node['#'])
        board[i][j]='$'
        for di,dj in [(0,1),(0,-1),(1,0),(-1,0)]:
            ni,nj=i+di,j+dj
            if 0<=ni<m and 0<=nj<n and board[ni][nj]!='$':d(ni,nj,node)
        board[i][j]=c
    for i in range(m):
        for j in range(n):d(i,j,trie)
    return list(result)`,

    361: `def solveNQueens(n):
    result=[];board=[['.']*n for _ in range(n)]
    cols=set();d1=set();d2=set()
    def d(r):
        if r==n:result.append([''.join(row) for row in board]);return
        for c in range(n):
            if c in cols or r-c in d1 or r+c in d2:continue
            board[r][c]='Q';cols.add(c);d1.add(r-c);d2.add(r+c)
            d(r+1)
            board[r][c]='.';cols.discard(c);d1.discard(r-c);d2.discard(r+c)
    d(0);return result`,

    362: `def totalNQueens(n):
    count=[0];cols=set();d1=set();d2=set()
    def d(r):
        if r==n:count[0]+=1;return
        for c in range(n):
            if c in cols or r-c in d1 or r+c in d2:continue
            cols.add(c);d1.add(r-c);d2.add(r+c);d(r+1)
            cols.discard(c);d1.discard(r-c);d2.discard(r+c)
    d(0);return count[0]`,

    363: `def solveSudoku(board):
    def solve():
        for i in range(9):
            for j in range(9):
                if board[i][j]=='.':
                    for c in '123456789':
                        if valid(i,j,c):
                            board[i][j]=c
                            if solve():return True
                            board[i][j]='.'
                    return False
        return True
    def valid(r,c,ch):
        for i in range(9):
            if board[r][i]==ch:return False
            if board[i][c]==ch:return False
            if board[3*(r//3)+i//3][3*(c//3)+i%3]==ch:return False
        return True
    solve();return board`,

    364: `def isValidSudoku(board):
    seen=set()
    for i in range(9):
        for j in range(9):
            if board[i][j]!='.':
                v=board[i][j]
                if (i,v) in seen or (v,j) in seen or (i//3,j//3,v) in seen:return False
                seen.add((i,v));seen.add((v,j));seen.add((i//3,j//3,v))
    return True`,

    365: `def letterCasePermutation(s):
    result=[]
    def d(i,path):
        if i==len(s):result.append(''.join(path));return
        if s[i].isalpha():
            path.append(s[i].lower());d(i+1,path);path.pop()
            path.append(s[i].upper());d(i+1,path);path.pop()
        else:path.append(s[i]);d(i+1,path);path.pop()
    d(0,[]);return result`,

    366: `def countArrangement(n):
    count=[0];visited=[False]*(n+1)
    def d(pos):
        if pos>n:count[0]+=1;return
        for i in range(1,n+1):
            if not visited[i] and (i%pos==0 or pos%i==0):
                visited[i]=True;d(pos+1);visited[i]=False
    d(1);return count[0]`,

    367: `def makesquare(matchsticks):
    total=sum(matchsticks)
    if total%4:return False
    side=total//4;matchsticks.sort(reverse=True);sides=[0]*4
    def d(i):
        if i==len(matchsticks):return all(s==side for s in sides)
        for j in range(4):
            if sides[j]+matchsticks[i]<=side:
                sides[j]+=matchsticks[i]
                if d(i+1):return True
                sides[j]-=matchsticks[i]
            if sides[j]==0:break
        return False
    return d(0)`,

    368: `def splitIntoFibonacci(num):
    result=[]
    def d(i,path):
        if i==len(num) and len(path)>=3:result.extend(path);return True
        for j in range(i+1,len(num)+1):
            if num[i]=='0' and j>i+1:break
            v=int(num[i:j])
            if v>2**31-1:break
            if len(path)>=2 and v>path[-1]+path[-2]:break
            if len(path)<2 or v==path[-1]+path[-2]:
                if d(j,path+[v]):return True
        return False
    d(0,[]);return result`,

    369: `def isAdditiveNumber(num):
    def d(i,path):
        if i==len(num) and len(path)>=3:return True
        for j in range(i+1,len(num)+1):
            if num[i]=='0' and j>i+1:break
            v=int(num[i:j])
            if len(path)>=2 and v!=path[-1]+path[-2]:
                if v>path[-1]+path[-2]:break
                continue
            if d(j,path+[v]):return True
        return False
    return d(0,[])`,

    370: `def restoreIpAddresses(s):
    result=[]
    def d(start,parts):
        if len(parts)==4:
            if start==len(s):result.append('.'.join(parts))
            return
        for l in range(1,4):
            if start+l>len(s):break
            seg=s[start:start+l]
            if (seg[0]=='0' and l>1) or int(seg)>255:continue
            d(start+l,parts+[seg])
    d(0,[]);return result`,

    371: `def getFactors(n):
    result=[]
    def d(n,start,path):
        if path:result.append(path+[n])
        i=start
        while i*i<=n:
            if n%i==0:d(n//i,i,path+[i])
            i+=1
    d(n,2,[]);return result`,

    372: `def removeInvalidParentheses(s):
    result=set()
    def valid(s):
        c=0
        for ch in s:
            if ch=='(':c+=1
            elif ch==')':c-=1
            if c<0:return False
        return c==0
    lr=rr=0
    for c in s:
        if c=='(':lr+=1
        elif c==')':
            if lr>0:lr-=1
            else:rr+=1
    def d(i,l,r,lr,rr,path):
        if i==len(s):
            if lr==0 and rr==0:result.add(''.join(path))
            return
        if s[i]=='(' and lr>0:d(i+1,l,r,lr-1,rr,path)
        if s[i]==')' and rr>0:d(i+1,l,r,lr,rr-1,path)
        path.append(s[i])
        if s[i]=='(':d(i+1,l+1,r,lr,rr,path)
        elif s[i]==')' and l>r:d(i+1,l,r+1,lr,rr,path)
        else:d(i+1,l,r,lr,rr,path)
        path.pop()
    d(0,0,0,lr,rr,[]);return list(result)`,

    373: `def addOperators(num, target):
    result=[]
    def d(i,path,val,prev):
        if i==len(num):
            if val==target:result.append(path)
            return
        for j in range(i+1,len(num)+1):
            s=num[i:j];n=int(s)
            if len(s)>1 and s[0]=='0':break
            if i==0:d(j,s,n,n)
            else:
                d(j,path+'+'+s,val+n,n)
                d(j,path+'-'+s,val-n,-n)
                d(j,path+'*'+s,val-prev+prev*n,prev*n)
    d(0,'',0,0);return result`,

    374: `def numberOfPatterns(m, n):
    skip=[[0]*10 for _ in range(10)]
    skip[1][3]=skip[3][1]=2;skip[1][7]=skip[7][1]=4;skip[3][9]=skip[9][3]=6
    skip[7][9]=skip[9][7]=8;skip[1][9]=skip[9][1]=skip[3][7]=skip[7][3]=5
    skip[2][8]=skip[8][2]=skip[4][6]=skip[6][4]=5
    visited=[False]*10;count=[0]
    def d(cur,remaining):
        if remaining==0:count[0]+=1;return
        visited[cur]=True
        for i in range(1,10):
            if not visited[i] and (skip[cur][i]==0 or visited[skip[cur][i]]):
                d(i,remaining-1)
        visited[cur]=False
    total=0
    for l in range(m,n+1):
        count=[0];d(1,l-1);total+=count[0]*4
        count=[0];d(2,l-1);total+=count[0]*4
        count=[0];d(5,l-1);total+=count[0]
    return total`,

    375: `def generateAbbreviations(word):
    result=[]
    def d(i,path,count):
        if i==len(word):
            result.append(path+(str(count) if count else ''))
            return
        d(i+1,path,count+1)
        d(i+1,path+(str(count) if count else '')+word[i],0)
    d(0,'',0);return result`,

    376: `def abbreviateWord(word):
    if len(word)<=2:return word
    return word[0]+str(len(word)-2)+word[-1]`,

    // === HEAPS (pattern 20) ===
    378: `import heapq
def kthSmallest3(matrix, k):
    return sorted(x for row in matrix for x in row)[k-1]`,

    380: `def topKFrequent(words, k):
    from collections import Counter
    c=Counter(words)
    return sorted(c.keys(),key=lambda w:(-c[w],w))[:k]`,

    381: `def kClosest(points, k):
    points.sort(key=lambda p:p[0]**2+p[1]**2)
    return points[:k]`,

    382: `import heapq
def kSmallestPairs(nums1, nums2, k):
    if not nums1 or not nums2:return []
    heap=[(nums1[i]+nums2[0],i,0) for i in range(min(k,len(nums1)))]
    heapq.heapify(heap);result=[]
    while heap and len(result)<k:
        _,i,j=heapq.heappop(heap)
        result.append([nums1[i],nums2[j]])
        if j+1<len(nums2):heapq.heappush(heap,(nums1[i]+nums2[j+1],i,j+1))
    return result`,

    383: `def kthSmallestPrimeFraction(arr, k):
    import heapq
    heap=[(arr[0]/arr[j],0,j) for j in range(1,len(arr))]
    heapq.heapify(heap)
    for _ in range(k):
        _,i,j=heapq.heappop(heap)
        if i+1<j:heapq.heappush(heap,(arr[i+1]/arr[j],i+1,j))
    return [arr[i],arr[j]]`,

    384: `def reorganizeString(s):
    from collections import Counter
    c=Counter(s);n=len(s)
    if max(c.values())>(n+1)//2:return ""
    result=['']*n;idx=0
    for ch,cnt in sorted(c.items(),key=lambda x:-x[1]):
        for _ in range(cnt):
            result[idx]=ch;idx+=2
            if idx>=n:idx=1
    return ''.join(result)`,

    385: `def rearrangeString(s, k):
    if k<=1:return s
    from collections import Counter
    import heapq
    c=Counter(s);heap=[(-cnt,ch) for ch,cnt in c.items()]
    heapq.heapify(heap);result=[];queue=[]
    while heap:
        cnt,ch=heapq.heappop(heap)
        result.append(ch);queue.append((cnt+1,ch))
        if len(queue)>=k:
            prev=queue.pop(0)
            if prev[0]<0:heapq.heappush(heap,prev)
    return ''.join(result) if len(result)==len(s) else ""`,

    387: `import heapq
def mergeKLists2(lists):
    result=[]
    for lst in lists:result.extend(lst)
    return sorted(result)`,

    388: `import heapq
class MedianFinder3:
    def __init__(self):self.lo=[];self.hi=[]
    def addNum(self,n):
        heapq.heappush(self.lo,-n);heapq.heappush(self.hi,-heapq.heappop(self.lo))
        if len(self.hi)>len(self.lo):heapq.heappush(self.lo,-heapq.heappop(self.hi))
    def findMedian(self):
        return -self.lo[0] if len(self.lo)>len(self.hi) else (-self.lo[0]+self.hi[0])/2.0`,

    389: `import heapq
def medianSlidingWindow(nums, k):
    from sortedcontainers import SortedList
    sl=SortedList();result=[]
    for i,v in enumerate(nums):
        sl.add(v)
        if len(sl)>k:sl.remove(nums[i-k])
        if len(sl)==k:
            if k%2:result.append(sl[k//2])
            else:result.append((sl[k//2-1]+sl[k//2])/2.0)
    return result`,

    390: `import heapq
def findMaximizedCapital(k, w, profits, capital):
    projects=sorted(zip(capital,profits))
    heap=[];i=0
    for _ in range(k):
        while i<len(projects) and projects[i][0]<=w:
            heapq.heappush(heap,-projects[i][1]);i+=1
        if not heap:break
        w-=heapq.heappop(heap)
    return w`,

    391: `import heapq
def furthestBuilding(heights, bricks, ladders):
    heap=[]
    for i in range(len(heights)-1):
        d=heights[i+1]-heights[i]
        if d<=0:continue
        heapq.heappush(heap,d)
        if len(heap)>ladders:bricks-=heapq.heappop(heap)
        if bricks<0:return i
    return len(heights)-1`,

    392: `import heapq
def minimizeDeviation(nums):
    heap=[];mn=float('inf')
    for n in nums:
        if n%2:n*=2
        heap.append(-n);mn=min(mn,n)
    heapq.heapify(heap);result=float('inf')
    while True:
        mx=-heapq.heappop(heap)
        result=min(result,mx-mn)
        if mx%2:break
        mx//=2;mn=min(mn,mx);heapq.heappush(heap,-mx)
    return result`,

    393: `def minMeetingRooms(intervals):
    import heapq
    if not intervals:return 0
    intervals.sort();heap=[intervals[0][1]]
    for i in range(1,len(intervals)):
        if intervals[i][0]>=heap[0]:heapq.heappop(heap)
        heapq.heappush(heap,intervals[i][1])
    return len(heap)`,

    394: `def minMeetingRooms3(n, meetings):
    meetings.sort()
    import heapq
    rooms=[]
    for s,e in meetings:
        if rooms and rooms[0]<=s:heapq.heappop(rooms)
        heapq.heappush(rooms,e)
    return len(rooms)`,

    395: `def assignTasks(servers, tasks):
    import heapq
    free=[(s,i) for i,s in enumerate(servers)]
    heapq.heapify(free);busy=[];result=[]
    for t in range(len(tasks)):
        while busy and busy[0][0]<=t:
            _,s,i=heapq.heappop(busy)
            heapq.heappush(free,(s,i))
        if free:
            s,i=heapq.heappop(free)
            result.append(i)
            heapq.heappush(busy,(t+tasks[t],s,i))
        else:
            time,s,i=heapq.heappop(busy)
            result.append(i)
            heapq.heappush(busy,(time+tasks[t],s,i))
    return result`,

    396: `import heapq
def kSmallestPairs2(nums1, nums2, k):
    if not nums1 or not nums2:return []
    heap=[(nums1[0]+nums2[j],0,j) for j in range(min(k,len(nums2)))]
    heapq.heapify(heap);result=[]
    while heap and len(result)<k:
        _,i,j=heapq.heappop(heap)
        result.append(nums1[i]+nums2[j])
        if i+1<len(nums1):heapq.heappush(heap,(nums1[i+1]+nums2[j],i+1,j))
    return result`,

    // === GREEDY (pattern 22) ===
    416: `def reconstructQueue(people):
    people.sort(key=lambda x:(-x[0],x[1]))
    result=[]
    for p in people:result.insert(p[1],p)
    return result`,

    419: `def findMinArrowShots(points):
    points.sort(key=lambda x:x[1])
    arrows=1;end=points[0][1]
    for s,e in points[1:]:
        if s>end:arrows+=1;end=e
    return arrows`,

    420: `def removeDuplicateLetters(s):
    last={c:i for i,c in enumerate(s)}
    stack=[];seen=set()
    for i,c in enumerate(s):
        if c in seen:continue
        while stack and c<stack[-1] and i<last[stack[-1]]:
            seen.discard(stack.pop())
        stack.append(c);seen.add(c)
    return ''.join(stack)`,

    421: `def maxNumber(nums1, nums2, k):
    def max_subseq(nums,k):
        stack=[]
        for i,v in enumerate(nums):
            while stack and stack[-1]<v and len(stack)+len(nums)-i>k:stack.pop()
            if len(stack)<k:stack.append(v)
        return stack
    def merge(a,b):
        result=[]
        while a or b:
            if a>=b:result.append(a[0]);a=a[1:]
            else:result.append(b[0]);b=b[1:]
        return result
    best=[]
    for i in range(max(0,k-len(nums2)),min(k,len(nums1))+1):
        c=merge(max_subseq(nums1,i),max_subseq(nums2,k-i))
        best=max(best,c)
    return best`,

    422: `def largestNumber(nums):
    from functools import cmp_to_key
    nums=[str(n) for n in nums]
    nums.sort(key=cmp_to_key(lambda a,b:1 if a+b<b+a else -1))
    result=''.join(nums)
    return '0' if result[0]=='0' else result`,

    423: `def maximumSwap(num):
    digits=list(str(num));n=len(digits);last={int(d):i for i,d in enumerate(digits)}
    for i,d in enumerate(digits):
        for k in range(9,int(d),-1):
            if last.get(k,0)>i:
                digits[i],digits[last[k]]=digits[last[k]],digits[i]
                return int(''.join(digits))
    return num`,

    425: `def minDeletions(s):
    from collections import Counter
    freq=sorted(Counter(s).values(),reverse=True)
    deletions=0;prev=freq[0]
    for i in range(1,len(freq)):
        if freq[i]>=prev:
            target=max(0,prev-1);deletions+=freq[i]-target;freq[i]=target
        prev=freq[i]
    return deletions`,

    426: `def minSetSize(arr):
    from collections import Counter
    freq=sorted(Counter(arr).values(),reverse=True)
    total=0;n=len(arr)
    for i,f in enumerate(freq):
        total+=f
        if total>=n//2:return i+1
    return len(freq)`,

    427: `def maximumUnits(boxTypes, truckSize):
    boxTypes.sort(key=lambda x:-x[1])
    units=0
    for boxes,u in boxTypes:
        take=min(boxes,truckSize)
        units+=take*u;truckSize-=take
        if truckSize==0:break
    return units`,

    428: `def bagOfTokensScore(tokens, power):
    tokens.sort();l=0;r=len(tokens)-1;score=0;mx=0
    while l<=r:
        if power>=tokens[l]:power-=tokens[l];l+=1;score+=1;mx=max(mx,score)
        elif score>0:power+=tokens[r];r-=1;score-=1
        else:break
    return mx`,

    430: `def brokenCalc(startValue, target):
    ops=0
    while target>startValue:
        if target%2:target+=1
        else:target//=2
        ops+=1
    return ops+startValue-target`,

    431: `def advantageCount(nums1, nums2):
    sorted1=sorted(nums1);n=len(nums2)
    idx=sorted(range(n),key=lambda i:nums2[i])
    result=[0]*n;lo=0;hi=n-1
    for v in sorted1:
        if v>nums2[idx[lo]]:result[idx[lo]]=v;lo+=1
        else:result[idx[hi]]=v;hi-=1
    return result`,

    // === TRIES (pattern 25) ===
    397: `class Trie:
    def __init__(self):self.root={}
    def insert(self,word):
        node=self.root
        for c in word:node=node.setdefault(c,{})
        node['#']=True
    def search(self,word):
        node=self.root
        for c in word:
            if c not in node:return False
            node=node[c]
        return '#' in node
    def startsWith(self,prefix):
        node=self.root
        for c in prefix:
            if c not in node:return False
            node=node[c]
        return True`,

    398: `class WordDictionary:
    def __init__(self):self.root={}
    def addWord(self,word):
        node=self.root
        for c in word:node=node.setdefault(c,{})
        node['#']=True
    def search(self,word):
        def d(node,i):
            if i==len(word):return '#' in node
            if word[i]=='.':return any(d(node[c],i+1) for c in node if c!='#')
            if word[i] not in node:return False
            return d(node[word[i]],i+1)
        return d(self.root,0)`,

    399: `def suggestedProducts(products, searchWord):
    products.sort();result=[]
    for i in range(1,len(searchWord)+1):
        prefix=searchWord[:i]
        matches=[p for p in products if p.startswith(prefix)]
        result.append(matches[:3])
    return result`,

    400: `def replaceWords(dictionary, sentence):
    trie={}
    for w in dictionary:
        node=trie
        for c in w:node=node.setdefault(c,{})
        node['#']=w
    result=[]
    for word in sentence.split():
        node=trie;replaced=False
        for c in word:
            if c not in node:break
            node=node[c]
            if '#' in node:result.append(node['#']);replaced=True;break
        if not replaced:result.append(word)
    return ' '.join(result)`,

    401: `class MagicDictionary:
    def __init__(self):self.words=[]
    def buildDict(self,d):self.words=d
    def search(self,w):
        for word in self.words:
            if len(word)!=len(w):continue
            diff=sum(1 for a,b in zip(word,w) if a!=b)
            if diff==1:return True
        return False`,

    402: `def palindromePairs(words):
    d={w[::-1]:i for i,w in enumerate(words)};result=[]
    for i,w in enumerate(words):
        for j in range(len(w)+1):
            left,right=w[:j],w[j:]
            if left in d and d[left]!=i and right==right[::-1]:
                result.append([i,d[left]])
            if j>0 and right in d and d[right]!=i and left==left[::-1]:
                result.append([d[right],i])
    return result`,

    403: `def findWords(board, words):
    trie={}
    for w in words:
        node=trie
        for c in w:node=node.setdefault(c,{})
        node['#']=w
    m,n=len(board),len(board[0]);result=set()
    def d(i,j,node):
        c=board[i][j]
        if c not in node:return
        node=node[c]
        if '#' in node:result.add(node['#'])
        board[i][j]='$'
        for di,dj in [(0,1),(0,-1),(1,0),(-1,0)]:
            ni,nj=i+di,j+dj
            if 0<=ni<m and 0<=nj<n and board[ni][nj]!='$':d(ni,nj,node)
        board[i][j]=c
    for i in range(m):
        for j in range(n):d(i,j,trie)
    return list(result)`,

    404: `class AutocompleteSystem:
    def __init__(self,sentences,times):
        self.freq={s:t for s,t in zip(sentences,times)};self.prefix=''
    def input(self,c):
        if c=='#':
            self.freq[self.prefix]=self.freq.get(self.prefix,0)+1;self.prefix='';return []
        self.prefix+=c
        matches=[(s,t) for s,t in self.freq.items() if s.startswith(self.prefix)]
        matches.sort(key=lambda x:(-x[1],x[0]))
        return [s for s,t in matches[:3]]`,

    405: `class StreamChecker:
    def __init__(self,words):
        self.trie={};self.stream=[]
        for w in words:
            node=self.trie
            for c in reversed(w):node=node.setdefault(c,{})
            node['#']=True
    def query(self,letter):
        self.stream.append(letter);node=self.trie
        for c in reversed(self.stream):
            if c not in node:return False
            node=node[c]
            if '#' in node:return True
        return False`,

    406: `def findAllConcatenatedWordsInADict(words):
    wordSet=set(words);result=[]
    def can(word):
        for i in range(1,len(word)):
            if word[:i] in wordSet and (word[i:] in wordSet or can(word[i:])):return True
        return False
    for w in words:
        if w and can(w):result.append(w)
    return result`,

    407: `def wordSquares(words):
    from collections import defaultdict
    prefix_map=defaultdict(list)
    for w in words:
        for i in range(len(w)):prefix_map[w[:i+1]].append(w)
    n=len(words[0]);result=[]
    def d(square):
        if len(square)==n:result.append(square[:]);return
        i=len(square);prefix=''.join(row[i] for row in square)
        for w in prefix_map.get(prefix,[]):
            square.append(w);d(square);square.pop()
    for w in words:d([w])
    return result`,

    408: `def findMaximumXOR(nums):
    mx=0;mask=0
    for i in range(31,-1,-1):
        mask|=1<<i;prefixes={n&mask for n in nums}
        candidate=mx|(1<<i)
        if any(candidate^p in prefixes for p in prefixes):mx=candidate
    return mx`,

    409: `def maximizeXor(nums, queries):
    nums.sort();result=[0]*len(queries)
    for i,(x,m) in sorted(enumerate(queries),key=lambda x:x[1][1]):
        ans=-1
        for n in nums:
            if n>m:break
            ans=max(ans,x^n)
        result[i]=ans
    return result`,

    410: `class MapSum:
    def __init__(self):self.map={};self.trie={}
    def insert(self,key,val):
        diff=val-self.map.get(key,0);self.map[key]=val
        node=self.trie
        for c in key:
            node=node.setdefault(c,{'$':0})
            node['$']+=diff
    def sum(self,prefix):
        node=self.trie
        for c in prefix:
            if c not in node:return 0
            node=node[c]
        return node.get('$',0)`,

    411: `def longestWord(words):
    words.sort();wordSet=set(['']);result=''
    for w in words:
        if w[:-1] in wordSet:
            wordSet.add(w)
            if len(w)>len(result):result=w
    return result`,
};

async function main() {
    console.log('Seeding solutions batch 5 (Backtracking + Heaps + Tries + Greedy)...');
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
