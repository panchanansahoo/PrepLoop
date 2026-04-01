import{j as m}from"./vendor-richtext-CSQPGedM.js";import{r as w}from"./vendor-react-DI4irv9A.js";import{G as ne,A as se}from"./GraphVisualizer-9mJBb3ob.js";import{A as ae}from"./arrow-left-B08JJfsP.js";import{c as oe,a as B,P as le,S as ue,r as W,g as ce,C as me}from"./index-CNIs3x7e.js";import{P as de}from"./pause-D8MkxdqO.js";import{S as ge}from"./skip-forward-Bj4MUjuc.js";import{R as he}from"./rotate-ccw-CfdfvdxX.js";import"./vendor-reactflow-DuZ3O1to.js";/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fe=oe("SkipBack",[["polygon",{points:"19 20 9 12 19 4 19 20",key:"o2sva"}],["line",{x1:"5",x2:"5",y1:"19",y2:"5",key:"1ocqjk"}]]);function pe(i){const e=[...i],r=e.length,s=[{array:[...e],highlights:[],sorted:[],message:"Move Zeroes: move all 0s to end while maintaining order of non-zero elements."}];let n=0;for(let t=0;t<r;t++)s.push({array:[...e],highlights:[t,n],comparing:!0,message:`Checking index ${t}: value = ${e[t]}`}),e[t]!==0&&(t!==n&&([e[t],e[n]]=[e[n],e[t]],s.push({array:[...e],highlights:[t,n],swapping:!0,message:`Non-zero ${e[n]} → swap to position ${n}`})),n++);return s.push({array:[...e],highlights:[],sorted:Array.from({length:r},(t,a)=>a),message:`✅ All zeroes moved to end: [${e.join(", ")}]`}),s}function ye(i,e){const r=[...i],s=r.length;e=e%s;const n=[{array:[...r],highlights:[],message:`Rotate Array by k=${e} positions using reverse approach.`}];function t(a,o,l,u){for(;o<l;)n.push({array:[...a],highlights:[o,l],comparing:!0,message:`${u}: swap indices ${o} and ${l}`}),[a[o],a[l]]=[a[l],a[o]],n.push({array:[...a],highlights:[o,l],swapping:!0,message:`Swapped ${a[l]} ↔ ${a[o]}`}),o++,l--}return n.push({array:[...r],highlights:Array.from({length:s},(a,o)=>o),message:"Step 1: Reverse entire array"}),t(r,0,s-1,"Reverse all"),n.push({array:[...r],highlights:Array.from({length:e},(a,o)=>o),message:`Step 2: Reverse first ${e} elements`}),t(r,0,e-1,"Reverse first k"),n.push({array:[...r],highlights:Array.from({length:s-e},(a,o)=>e+o),message:`Step 3: Reverse remaining ${s-e} elements`}),t(r,e,s-1,"Reverse rest"),n.push({array:[...r],highlights:[],sorted:Array.from({length:s},(a,o)=>o),message:`✅ Array rotated by ${e}: [${r.join(", ")}]`}),n}function xe(i){const e=[...i].sort((n,t)=>n-t),r=[{array:[...e],highlights:[],message:"Remove Duplicates from Sorted Array: keep unique elements in-place."}];if(e.length===0)return r;let s=0;for(let n=1;n<e.length;n++)r.push({array:[...e],highlights:[s,n],left:s,right:n,comparing:!0,message:`Compare a[${s}]=${e[s]} with a[${n}]=${e[n]}`}),e[n]!==e[s]?(s++,e[s]=e[n],r.push({array:[...e],highlights:[s],sorted:Array.from({length:s+1},(t,a)=>a),message:`Unique! Place ${e[s]} at index ${s}`})):r.push({array:[...e],highlights:[n],message:`Duplicate ${e[n]} — skip`});return r.push({array:[...e],sorted:Array.from({length:s+1},(n,t)=>t),message:`✅ ${s+1} unique elements: [${e.slice(0,s+1).join(", ")}]`}),r}function ve(i){const e=[...i],r=[{array:[...e],highlights:[],message:"Buy & Sell Stock: find max profit from single buy-sell transaction."}];let s=e[0],n=0,t=0,a=0,o=0;r.push({array:[...e],highlights:[0],message:`Day 0: price = ${e[0]}. Set as min buy price.`});for(let l=1;l<e.length;l++){const u=e[l]-s;r.push({array:[...e],highlights:[t,l],comparing:!0,message:`Day ${l}: price=${e[l]}, profit if sell = ${e[l]} - ${s} = ${u}`}),u>n&&(n=u,o=t,a=l,r.push({array:[...e],highlights:[o,a],sorted:[o,a],message:`New max profit = ${n}! Buy day ${o}, sell day ${a}`})),e[l]<s&&(s=e[l],t=l,r.push({array:[...e],highlights:[l],message:`New min price = ${e[l]} at day ${l}`}))}return r.push({array:[...e],highlights:[o,a],sorted:[o,a],message:`✅ Max profit = ${n} (buy at ${e[o]} on day ${o}, sell at ${e[a]} on day ${a})`}),r}function we(i){const e=[...i],r=e.length,s=new Array(r).fill(1),n=[{array:[...e],result:[...s],highlights:[],message:"Product Except Self: compute product of all elements except self without division."}];let t=1;for(let o=0;o<r;o++)s[o]=t,n.push({array:[...e],result:[...s],highlights:[o],message:`Left pass: result[${o}] = ${t} (prefix product)`}),t*=e[o];let a=1;for(let o=r-1;o>=0;o--)s[o]*=a,n.push({array:[...e],result:[...s],highlights:[o],message:`Right pass: result[${o}] *= ${a} = ${s[o]} (suffix product)`}),a*=e[o];return n.push({array:[...e],result:[...s],sorted:Array.from({length:r},(o,l)=>l),message:`✅ Result: [${s.join(", ")}]`}),n}function je(i){const e=[...i],r=new Set,s=[{array:[...e],highlights:[],message:"Contains Duplicate: check if any value appears at least twice."}];for(let n=0;n<e.length;n++){if(r.has(e[n])){const t=e.indexOf(e[n]);return s.push({array:[...e],highlights:[t,n],swapping:!0,message:`✅ Duplicate found! ${e[n]} at index ${t} and ${n}`}),s}r.add(e[n]),s.push({array:[...e],highlights:[n],checked:Array.from(r).map(t=>e.indexOf(t)),message:`Index ${n}: ${e[n]} — not seen before. Set: {${Array.from(r).join(", ")}}`})}return s.push({array:[...e],sorted:Array.from({length:e.length},(n,t)=>t),message:"✅ No duplicates found!"}),s}function be(i){const e=[...i];let r=e[0],s=1;const n=[{array:[...e],highlights:[0],message:`Majority Element (Boyer-Moore): candidate = ${e[0]}, count = 1`}];for(let t=1;t<e.length;t++)s===0?(r=e[t],s=1,n.push({array:[...e],highlights:[t],message:`Count hit 0 — new candidate: ${e[t]}`})):e[t]===r?(s++,n.push({array:[...e],highlights:[t],comparing:!0,message:`${e[t]} == candidate ${r} → count = ${s}`})):(s--,n.push({array:[...e],highlights:[t],swapping:!0,message:`${e[t]} != candidate ${r} → count = ${s}`}));return n.push({array:[...e],highlights:e.map((t,a)=>t===r?a:-1).filter(t=>t>=0),sorted:e.map((t,a)=>t===r?a:-1).filter(t=>t>=0),message:`✅ Majority element = ${r}`}),n}function ke(i){const e=[...i];let r=1/0,s=1/0;const n=[{array:[...e],highlights:[],message:"Increasing Triplet: find i < j < k where a[i] < a[j] < a[k]."}];for(let t=0;t<e.length;t++)if(e[t]<=r)r=e[t],n.push({array:[...e],highlights:[t],message:`Update first = ${r}`});else if(e[t]<=s)s=e[t],n.push({array:[...e],highlights:[t],comparing:!0,message:`Update second = ${s} (first = ${r})`});else return n.push({array:[...e],highlights:[t],sorted:[t],swapping:!0,message:`✅ Found triplet! first=${r}, second=${s}, third=${e[t]}`}),n;return n.push({array:[...e],message:"❌ No increasing triplet found."}),n}function Se(i){const e=[...i],r=e.length,s=[{array:[...e],highlights:[],message:"First Missing Positive: place each number at its correct index (1→idx 0, 2→idx 1...)."}];for(let n=0;n<r;n++)for(;e[n]>0&&e[n]<=r&&e[e[n]-1]!==e[n];){const t=e[n]-1;s.push({array:[...e],highlights:[n,t],comparing:!0,message:`${e[n]} should be at index ${t} — swap`}),[e[n],e[t]]=[e[t],e[n]],s.push({array:[...e],highlights:[n,t],swapping:!0,message:`Swapped. Array: [${e.join(", ")}]`})}for(let n=0;n<r;n++)if(e[n]!==n+1)return s.push({array:[...e],highlights:[n],sorted:Array.from({length:r},(t,a)=>a).filter(t=>e[t]===t+1),message:`✅ First missing positive = ${n+1} (index ${n} has ${e[n]})`}),s;return s.push({array:[...e],sorted:Array.from({length:r},(n,t)=>t),message:`✅ First missing positive = ${r+1}`}),s}function $e(i){const e=(typeof i=="string"?i:"racecar").toLowerCase().replace(/[^a-z0-9]/g,""),r=e.split(""),s=[{array:r,highlights:[],message:`Valid Palindrome: check "${e}" from both ends.`}];let n=0,t=r.length-1;for(;n<t;){if(r[n]===r[t])s.push({array:r,highlights:[n,t],sorted:[n,t],left:n,right:t,message:`'${r[n]}' == '${r[t]}' ✓ — move inward`});else return s.push({array:r,highlights:[n,t],swapping:!0,left:n,right:t,message:`'${r[n]}' != '${r[t]}' ✗ — NOT a palindrome!`}),s;n++,t--}return s.push({array:r,sorted:Array.from({length:r.length},(a,o)=>o),message:`✅ "${e}" IS a palindrome!`}),s}function Me(i){const e=(i==null?void 0:i.s)||"ace",r=(i==null?void 0:i.t)||"abcde",s=e.split(""),n=r.split(""),t=[{array:n,highlights:[],message:`Is Subsequence: is "${e}" a subsequence of "${r}"?`}];let a=0;for(let o=0;o<n.length&&a<s.length;o++)n[o]===s[a]?(t.push({array:n,highlights:[o],sorted:[o],message:`'${n[o]}' matches s[${a}]='${s[a]}' ✓`}),a++):t.push({array:n,highlights:[o],message:`'${n[o]}' ≠ s[${a}]='${s[a]}' — skip`});return a===s.length?t.push({array:n,sorted:Array.from({length:n.length},(o,l)=>l),message:`✅ "${e}" IS a subsequence of "${r}"`}):t.push({array:n,message:`❌ "${e}" is NOT a subsequence of "${r}"`}),t}function _e(i){const e=typeof i=="string"?i:"the sky is blue",r=e.trim().split(/\s+/),s=[{array:[...r],highlights:[],message:`Reverse Words: "${e}" → reverse word order.`}];let n=0,t=r.length-1;for(;n<t;)s.push({array:[...r],highlights:[n,t],comparing:!0,message:`Swap "${r[n]}" ↔ "${r[t]}"`}),[r[n],r[t]]=[r[t],r[n]],s.push({array:[...r],highlights:[n,t],swapping:!0,message:`Result: [${r.join(", ")}]`}),n++,t--;return s.push({array:[...r],sorted:Array.from({length:r.length},(a,o)=>o),message:`✅ Result: "${r.join(" ")}"`}),s}function Ae(i){const e=i||["flower","flow","flight"],r=e[0].split(""),s=[{array:r,highlights:[],message:`Longest Common Prefix: compare ${e.length} strings character by character.`}];let n="";for(let t=0;t<r.length;t++){const a=r[t];let o=!0;for(let l=1;l<e.length;l++)if(t>=e[l].length||e[l][t]!==a){o=!1,s.push({array:r,highlights:[t],swapping:!0,message:`'${a}' at pos ${t}: mismatch with "${e[l]}". Stop!`});break}if(!o)break;n+=a,s.push({array:r,highlights:[t],sorted:Array.from({length:t+1},(l,u)=>u),message:`'${a}' matches in all strings. Prefix so far: "${n}"`})}return s.push({array:r,sorted:Array.from({length:n.length},(t,a)=>a),message:`✅ Longest common prefix: "${n}"`}),s}function Ie(i){const e=i||["eat","tea","tan","ate","nat","bat"],r=[...e],s=[{array:r,highlights:[],message:`Group Anagrams: group ${e.length} strings by sorted characters.`}],n={};for(let o=0;o<r.length;o++){const l=r[o].split("").sort().join("");n[l]||(n[l]=[]),n[l].push(o);const u=n[l];s.push({array:r,highlights:u,message:`"${r[o]}" → sorted key "${l}". Group: [${u.map(c=>r[c]).join(", ")}]`})}const t=Object.values(n),a=t.flat();return s.push({array:r,sorted:a,message:`✅ ${t.length} groups: ${t.map(o=>"["+o.map(l=>r[l]).join(", ")+"]").join(", ")}`}),s}function qe(i){const e=[...i],r=new Set(e),s=[{array:[...e],highlights:[],message:"Longest Consecutive Sequence: find longest streak using HashSet."}];let n=0,t=0;for(let a=0;a<e.length;a++)if(!r.has(e[a]-1)){let o=1,l=e[a];for(s.push({array:[...e],highlights:[a],message:`${e[a]} is a sequence start (no ${e[a]-1} in set)`});r.has(l+1);){l++,o++;const u=e.indexOf(l);u>=0&&s.push({array:[...e],highlights:[u],comparing:!0,message:`${l} found! Streak length = ${o}`})}o>n&&(n=o,t=e[a])}return s.push({array:[...e],sorted:Array.from({length:e.length},(a,o)=>o).filter(a=>e[a]>=t&&e[a]<t+n),message:`✅ Longest consecutive: ${n} (${t} to ${t+n-1})`}),s}function ze(i,e){const r=[...i];e=e||3;const s=[{array:[...r],highlights:[],message:`Contains Duplicate II: find duplicate within distance k=${e}.`}],n=new Map;for(let t=0;t<r.length;t++){if(n.has(r[t])&&t-n.get(r[t])<=e)return s.push({array:[...r],highlights:[n.get(r[t]),t],swapping:!0,message:`✅ ${r[t]} found at ${n.get(r[t])} and ${t}, distance = ${t-n.get(r[t])} ≤ ${e}`}),s;n.set(r[t],t),s.push({array:[...r],highlights:[t],checked:[t],message:`Index ${t}: ${r[t]} → stored in map`})}return s.push({array:[...r],message:`❌ No duplicates within distance ${e}`}),s}function Le(i){const e=(i==null?void 0:i.ransomNote)||"aab",r=(i==null?void 0:i.magazine)||"aabbc",s=r.split(""),n=[{array:s,highlights:[],message:`Ransom Note: can "${e}" be made from "${r}"?`}],t={};for(const a of r)t[a]=(t[a]||0)+1;n.push({array:s,message:`Magazine freq: ${JSON.stringify(t)}`});for(let a=0;a<e.length;a++){const o=e[a];if(!t[o]||t[o]<=0)return n.push({array:s,highlights:[],swapping:!0,message:`❌ No '${o}' left — cannot construct ransom note`}),n;t[o]--;const l=s.indexOf(o);n.push({array:s,highlights:l>=0?[l]:[],sorted:[l],message:`Need '${o}' — found! Remaining: ${t[o]}`})}return n.push({array:s,sorted:Array.from({length:s.length},(a,o)=>o),message:`✅ Can construct "${e}" from "${r}"`}),n}function Ne(i){const e=(i==null?void 0:i.s)||"egg",r=(i==null?void 0:i.t)||"add",s=e.split(""),n=[{array:s,highlights:[],message:`Isomorphic Strings: is "${e}" → "${r}" a valid mapping?`}],t={},a={};for(let o=0;o<e.length;o++){if(t[e[o]]&&t[e[o]]!==r[o])return n.push({array:s,highlights:[o],swapping:!0,message:`❌ '${e[o]}' already maps to '${t[e[o]]}', not '${r[o]}'`}),n;if(a[r[o]]&&a[r[o]]!==e[o])return n.push({array:s,highlights:[o],swapping:!0,message:`❌ '${r[o]}' already mapped from '${a[r[o]]}', not '${e[o]}'`}),n;t[e[o]]=r[o],a[r[o]]=e[o],n.push({array:s,highlights:[o],sorted:[o],message:`'${e[o]}' ↔ '${r[o]}' ✓ Mapping: ${JSON.stringify(t)}`})}return n.push({array:s,sorted:Array.from({length:s.length},(o,l)=>l),message:`✅ "${e}" and "${r}" ARE isomorphic!`}),n}function Oe(i){const e=[...i],r={};let s=0;const n=[{array:[...e],highlights:[],message:"Number of Good Pairs: count pairs (i,j) where a[i] == a[j] and i < j."}];for(let t=0;t<e.length;t++){const a=r[e[t]]||0;s+=a,r[e[t]]=a+1,n.push({array:[...e],highlights:[t],message:`Index ${t}: ${e[t]} seen ${a} times before → +${a} pairs. Total = ${s}`})}return n.push({array:[...e],sorted:Array.from({length:e.length},(t,a)=>a),message:`✅ Total good pairs = ${s}`}),n}function Pe(i){const e=[...i].sort((n,t)=>n-t),r=[{array:[...e],highlights:[],message:"3Sum: find all triplets that sum to 0 in sorted array."}],s=[];for(let n=0;n<e.length-2;n++){if(n>0&&e[n]===e[n-1])continue;let t=n+1,a=e.length-1;for(r.push({array:[...e],highlights:[n],message:`Fix a[${n}]=${e[n]}, search pairs in [${t}..${a}]`});t<a;){const o=e[n]+e[t]+e[a];if(r.push({array:[...e],highlights:[n,t,a],comparing:!0,left:t,right:a,message:`${e[n]}+${e[t]}+${e[a]}=${o}`}),o===0){for(s.push([e[n],e[t],e[a]]),r.push({array:[...e],highlights:[n,t,a],sorted:[n,t,a],message:`✓ Found triplet [${e[n]},${e[t]},${e[a]}]!`});t<a&&e[t]===e[t+1];)t++;for(;t<a&&e[a]===e[a-1];)a--;t++,a--}else o<0?t++:a--}}return r.push({array:[...e],message:`✅ Found ${s.length} triplet(s): ${s.map(n=>"["+n+"]").join(", ")}`}),r}function Te(i){const e=[...i],r=[{array:[...e],highlights:[],message:"Container With Most Water: maximize area between two lines."}];let s=0,n=e.length-1,t=0;for(;s<n;){const a=Math.min(e[s],e[n])*(n-s),o=a>t;o&&(t=a),r.push({array:[...e],highlights:[s,n],left:s,right:n,comparing:!0,message:`Area = min(${e[s]},${e[n]}) × ${n-s} = ${a}${o?" ★ New max!":""}. Max = ${t}`}),e[s]<e[n]?(r.push({array:[...e],highlights:[s],message:"Left shorter → move left pointer right"}),s++):(r.push({array:[...e],highlights:[n],message:"Right shorter → move right pointer left"}),n--)}return r.push({array:[...e],sorted:Array.from({length:e.length},(a,o)=>o),message:`✅ Max water area = ${t}`}),r}function Ce(i){const e=[...i];let r=0,s=e.length-1,n=0,t=0,a=0;const o=[{array:[...e],highlights:[],message:"Trapping Rain Water: compute water trapped using two pointers."}];for(;r<s;)e[r]<=e[s]?(e[r]>=n?n=e[r]:a+=n-e[r],o.push({array:[...e],highlights:[r,s],left:r,right:s,message:`Left: h=${e[r]}, lMax=${n}, water at ${r} = ${Math.max(0,n-e[r])}. Total = ${a}`}),r++):(e[s]>=t?t=e[s]:a+=t-e[s],o.push({array:[...e],highlights:[r,s],left:r,right:s,message:`Right: h=${e[s]}, rMax=${t}, water at ${s} = ${Math.max(0,t-e[s])}. Total = ${a}`}),s--);return o.push({array:[...e],sorted:Array.from({length:e.length},(l,u)=>u),message:`✅ Total trapped water = ${a}`}),o}function Ee(i){const e=(i==null?void 0:i.nums1)||[1,2,3,0,0,0],r=(i==null?void 0:i.nums2)||[2,5,6],s=(i==null?void 0:i.m)||3,n=[...e],t=r.length,a=[{array:[...n],highlights:[],message:`Merge Sorted Array: merge [${n.slice(0,s)}] and [${r}] in-place from end.`}];let o=s-1,l=t-1,u=s+t-1;for(;o>=0&&l>=0;)n[o]>r[l]?(n[u]=n[o],a.push({array:[...n],highlights:[o,u],swapping:!0,message:`a[${o}]=${n[o]} > b[${l}]=${r[l]} → place ${n[o]} at ${u}`}),o--):(n[u]=r[l],a.push({array:[...n],highlights:[u],comparing:!0,message:`b[${l}]=${r[l]} ≥ a[${o}]=${n[o]} → place ${r[l]} at ${u}`}),l--),u--;for(;l>=0;)n[u]=r[l],a.push({array:[...n],highlights:[u],message:`Copy remaining b[${l}]=${r[l]} at ${u}`}),l--,u--;return a.push({array:[...n],sorted:Array.from({length:n.length},(c,d)=>d),message:`✅ Merged: [${n.join(", ")}]`}),a}function Re(i,e){const r=[...i];e=e||7;let s=0,n=0;const t=new Map([[0,1]]),a=[{array:[...r],highlights:[],message:`Subarray Sum = ${e}: use prefix sum + hash map.`}];for(let o=0;o<r.length;o++){n+=r[o];const l=n-e;t.has(l)?(s+=t.get(l),a.push({array:[...r],highlights:[o],sorted:[o],message:`prefixSum=${n}, need=${l} found! count += ${t.get(l)} → ${s}`})):a.push({array:[...r],highlights:[o],message:`prefixSum=${n}, need=${l} not in map`}),t.set(n,(t.get(n)||0)+1)}return a.push({array:[...r],message:`✅ ${s} subarrays sum to ${e}`}),a}function Fe(i){const e=[...i];let r=0,s=0;const n=new Map([[0,-1]]),t=[{array:[...e],highlights:[],message:"Contiguous Array: find longest subarray with equal 0s and 1s."}];for(let a=0;a<e.length;a++)if(r+=e[a]===1?1:-1,n.has(r)){const o=a-n.get(r);o>s&&(s=o),t.push({array:[...e],highlights:[a],comparing:!0,message:`Count=${r} seen at ${n.get(r)}. Length = ${o}. Max = ${s}`})}else n.set(r,a),t.push({array:[...e],highlights:[a],message:`Count=${r} first seen at index ${a}`});return t.push({array:[...e],message:`✅ Longest balanced subarray length = ${s}`}),t}function De(i){const e=typeof i=="string"?i:"abcabcbb",r=e.split(""),s=[{array:r,highlights:[],message:`Longest Substring Without Repeating: "${e}"`}],n=new Map;let t=0,a=0,o=0;for(let l=0;l<r.length;l++){n.has(r[l])&&n.get(r[l])>=a&&(a=n.get(r[l])+1,s.push({array:r,highlights:[l],swapping:!0,windowStart:a,windowEnd:l,message:`'${r[l]}' duplicate! Move start to ${a}`})),n.set(r[l],l);const u=l-a+1;u>t&&(t=u,o=a);const c=Array.from({length:l-a+1},(d,h)=>a+h);s.push({array:r,highlights:c,windowStart:a,windowEnd:l,message:`Window [${a}..${l}] = "${e.slice(a,l+1)}", len=${u}, max=${t}`})}return s.push({array:r,sorted:Array.from({length:t},(l,u)=>o+u),message:`✅ Longest = ${t}: "${e.slice(o,o+t)}"`}),s}function Be(i){const e=(i==null?void 0:i.s1)||"ab",r=(i==null?void 0:i.s2)||"eidbaooo",s=r.split(""),n=[{array:s,highlights:[],message:`Permutation in String: does "${r}" contain a permutation of "${e}"?`}],t={};for(const u of e)t[u]=(t[u]||0)+1;const a={};let o=0;const l=Object.keys(t).length;for(let u=0;u<s.length;u++){a[s[u]]=(a[s[u]]||0)+1,t[s[u]]&&a[s[u]]===t[s[u]]&&o++;const c=u-e.length+1;if(c>=0){const d=Array.from({length:e.length},(h,f)=>c+f);if(o===l)return n.push({array:s,highlights:d,sorted:d,message:`✅ Permutation found at [${c}..${u}]: "${r.slice(c,u+1)}"`}),n;n.push({array:s,highlights:d,windowStart:c,windowEnd:u,message:`Window [${c}..${u}]: "${r.slice(c,u+1)}" — ${o}/${l} chars matched`}),t[s[c]]&&a[s[c]]===t[s[c]]&&o--,a[s[c]]--}}return n.push({array:s,message:`❌ No permutation of "${e}" found in "${r}"`}),n}function We(i,e){const r=[...i];e=e||2;let s=0,n=0,t=0;const a=[{array:[...r],highlights:[],message:`Max Consecutive Ones III: max 1s with at most ${e} flips.`}];for(let o=0;o<r.length;o++){for(r[o]===0&&n++;n>e;)r[s]===0&&n--,s++;const l=o-s+1;l>t&&(t=l);const u=Array.from({length:o-s+1},(c,d)=>s+d);a.push({array:[...r],highlights:u,windowStart:s,windowEnd:o,message:`Window [${s}..${o}], zeros=${n}, len=${l}, max=${t}`})}return a.push({array:[...r],sorted:Array.from({length:r.length},(o,l)=>l),message:`✅ Max consecutive 1s (with ${e} flips) = ${t}`}),a}function He(i){const e=[...i];let r=e[0],s=e[0],n=e[0];const t=[{array:[...e],highlights:[0],message:"Max Product Subarray: track both max and min products (negatives can flip)."}];for(let a=1;a<e.length;a++){const o=[e[a],e[a]*r,e[a]*s],l=Math.max(...o),u=Math.min(...o);r=l,s=u,r>n&&(n=r),t.push({array:[...e],highlights:[a],message:`a[${a}]=${e[a]}: maxP=${r}, minP=${s}, result=${n}`})}return t.push({array:[...e],sorted:Array.from({length:e.length},(a,o)=>o),message:`✅ Maximum product subarray = ${n}`}),t}function Ge(i){const e=typeof i=="string"?i:"({[]})",r=e.split(""),s=[],n={")":"(","}":"{","]":"["},t=[{array:r,highlights:[],stack:[],message:`Valid Parentheses: check if "${e}" is balanced.`}];for(let a=0;a<r.length;a++)if("({[".includes(r[a]))s.push(r[a]),t.push({array:r,highlights:[a],stack:[...s],message:`Push '${r[a]}'. Stack: [${s.join(", ")}]`});else{if(s.length===0||s[s.length-1]!==n[r[a]])return t.push({array:r,highlights:[a],stack:[...s],swapping:!0,message:`❌ '${r[a]}' has no matching pair!`}),t;s.pop(),t.push({array:r,highlights:[a],stack:[...s],sorted:[a],message:`Pop matching '${n[r[a]]}'. Stack: [${s.join(", ")}]`})}return s.length===0?t.push({array:r,sorted:Array.from({length:r.length},(a,o)=>o),message:`✅ "${e}" is VALID!`}):t.push({array:r,stack:[...s],message:`❌ Stack not empty: [${s.join(", ")}]`}),t}function Ue(i){const e=[...i],r=new Array(e.length).fill(0),s=[],n=[{array:[...e],result:[...r],stack:[],highlights:[],message:"Daily Temperatures: days until warmer using monotonic stack."}];for(let t=0;t<e.length;t++){for(;s.length>0&&e[t]>e[s[s.length-1]];){const a=s.pop();r[a]=t-a,n.push({array:[...e],result:[...r],stack:[...s],highlights:[a,t],message:`Day ${t} (${e[t]}) > Day ${a} (${e[a]}): wait ${r[a]} days`})}s.push(t),n.push({array:[...e],result:[...r],stack:[...s],highlights:[t],message:`Push day ${t} (${e[t]}). Stack: [${s.map(a=>e[a]).join(", ")}]`})}return n.push({array:[...e],result:[...r],sorted:Array.from({length:e.length},(t,a)=>a),message:`✅ Result: [${r.join(", ")}]`}),n}function Ve(i){const e=i||["2","1","+","3","*"],r=[...e],s=[],n=[{array:r,stack:[],highlights:[],message:`Evaluate RPN: ${e.join(" ")}`}];for(let t=0;t<r.length;t++)if(["+","-","*","/"].includes(r[t])){const a=s.pop(),o=s.pop();let l;r[t]==="+"?l=o+a:r[t]==="-"?l=o-a:r[t]==="*"?l=o*a:l=Math.trunc(o/a),s.push(l),n.push({array:r,stack:[...s],highlights:[t],message:`${o} ${r[t]} ${a} = ${l}. Stack: [${s.join(", ")}]`})}else s.push(parseInt(r[t])),n.push({array:r,stack:[...s],highlights:[t],message:`Push ${r[t]}. Stack: [${s.join(", ")}]`});return n.push({array:r,stack:[...s],sorted:Array.from({length:r.length},(t,a)=>a),message:`✅ Result = ${s[0]}`}),n}function Xe(i){const e=[...i,0],r=[];let s=0;const n=[{array:[...i],highlights:[],message:"Largest Rectangle in Histogram: monotonic stack approach."}];for(let t=0;t<e.length;t++){for(;r.length>0&&e[t]<e[r[r.length-1]];){const a=e[r.pop()],o=r.length===0?t:t-r[r.length-1]-1,l=a*o;l>s&&(s=l),n.push({array:[...i],highlights:[t],message:`Pop h=${a}, w=${o}, area=${l}. Max=${s}`})}r.push(t),t<i.length&&n.push({array:[...i],highlights:[t],stack:[...r],message:`Push idx ${t} (h=${i[t]}). Stack heights: [${r.map(a=>e[a]).join(",")}]`})}return n.push({array:[...i],sorted:Array.from({length:i.length},(t,a)=>a),message:`✅ Largest rectangle = ${s}`}),n}function Ke(i,e){const r=[...i];e=e||3;const s=[],n=[],t=[{array:[...r],highlights:[],message:`Sliding Window Maximum: max in each window of size ${e}.`}];for(let a=0;a<r.length;a++){for(;n.length>0&&n[0]<a-e+1;)n.shift();for(;n.length>0&&r[n[n.length-1]]<r[a];)n.pop();if(n.push(a),a>=e-1){s.push(r[n[0]]);const o=Array.from({length:e},(l,u)=>a-e+1+u);t.push({array:[...r],highlights:o,windowStart:a-e+1,windowEnd:a,message:`Window [${a-e+1}..${a}]: max = ${r[n[0]]}. Result: [${s.join(", ")}]`})}else t.push({array:[...r],highlights:[a],message:`Building window: added ${r[a]}`})}return t.push({array:[...r],sorted:Array.from({length:r.length},(a,o)=>o),message:`✅ Window maxes: [${s.join(", ")}]`}),t}function Ze(i,e){const r=[...i];e=e||5;const s=[{array:[...r],highlights:[],message:`Search Insert Position: find index for ${e} in sorted array.`}];let n=0,t=r.length-1;for(;n<=t;){const a=Math.floor((n+t)/2);if(s.push({array:[...r],highlights:[a],left:n,right:t,mid:a,message:`mid=${a}, a[mid]=${r[a]} vs target=${e}`}),r[a]===e)return s.push({array:[...r],highlights:[a],found:a,message:`✅ Found at index ${a}!`}),s;r[a]<e?n=a+1:t=a-1}return s.push({array:[...r],highlights:[n],sorted:[n],message:`✅ Insert at index ${n}`}),s}function Je(i,e){const r=[...i];e=e||0;const s=[{array:[...r],highlights:[],message:`Search in Rotated Sorted Array: find ${e} using modified binary search.`}];let n=0,t=r.length-1;for(;n<=t;){const a=Math.floor((n+t)/2);if(s.push({array:[...r],highlights:[a],left:n,right:t,mid:a,message:`mid=${a}, a[mid]=${r[a]}`}),r[a]===e)return s.push({array:[...r],found:a,highlights:[a],message:`✅ Found ${e} at index ${a}!`}),s;r[n]<=r[a]?e>=r[n]&&e<r[a]?(t=a-1,s.push({array:[...r],highlights:[n,a],message:"Left sorted, target in left half"})):(n=a+1,s.push({array:[...r],highlights:[a,t],message:"Left sorted, target in right half"})):e>r[a]&&e<=r[t]?(n=a+1,s.push({array:[...r],highlights:[a,t],message:"Right sorted, target in right half"})):(t=a-1,s.push({array:[...r],highlights:[n,a],message:"Right sorted, target in left half"}))}return s.push({array:[...r],message:`❌ ${e} not found.`}),s}function Qe(i){const e=[...i],r=[{array:[...e],highlights:[],message:"Find Peak Element: binary search for local maximum."}];let s=0,n=e.length-1;for(;s<n;){const t=Math.floor((s+n)/2);r.push({array:[...e],highlights:[t,t+1],left:s,right:n,mid:t,comparing:!0,message:`mid=${t}: ${e[t]} vs ${e[t+1]}`}),e[t]>e[t+1]?(n=t,r.push({array:[...e],highlights:[t],message:"Descending → peak is left (or at mid)"})):(s=t+1,r.push({array:[...e],highlights:[t+1],message:"Ascending → peak is right"}))}return r.push({array:[...e],highlights:[s],sorted:[s],found:s,message:`✅ Peak at index ${s}, value = ${e[s]}`}),r}function Ye(i){const e=[...i],r=[{array:[...e],highlights:[],message:"Find Minimum in Rotated Sorted Array."}];let s=0,n=e.length-1;for(;s<n;){const t=Math.floor((s+n)/2);r.push({array:[...e],highlights:[t],left:s,right:n,mid:t,message:`mid=${t}, a[mid]=${e[t]}, a[hi]=${e[n]}`}),e[t]>e[n]?(s=t+1,r.push({array:[...e],message:"a[mid] > a[hi] → min in right half"})):(n=t,r.push({array:[...e],message:"a[mid] ≤ a[hi] → min in left half (incl mid)"}))}return r.push({array:[...e],highlights:[s],sorted:[s],found:s,message:`✅ Minimum = ${e[s]} at index ${s}`}),r}function er(i){const e=i||[[1,2,3],[4,5,6],[7,8,9]],r=e.flat(),s=[],n=[{array:r,highlights:[],message:`Spiral Matrix: traverse ${e.length}×${e[0].length} matrix in spiral order.`}];let t=0,a=e.length-1,o=0,l=e[0].length-1;const u=e[0].length;for(;t<=a&&o<=l;){for(let c=o;c<=l;c++)s.push(e[t][c]),n.push({array:r,highlights:[t*u+c],sorted:s.map((d,h)=>{const f=e.findIndex(x=>x.includes(s[h]));return f>=0?f*u+e[f].indexOf(s[h]):0}),message:`→ [${t}][${c}] = ${e[t][c]}`});t++;for(let c=t;c<=a;c++)s.push(e[c][l]),n.push({array:r,highlights:[c*u+l],message:`↓ [${c}][${l}] = ${e[c][l]}`});if(l--,t<=a){for(let c=l;c>=o;c--)s.push(e[a][c]),n.push({array:r,highlights:[a*u+c],message:`← [${a}][${c}] = ${e[a][c]}`});a--}if(o<=l){for(let c=a;c>=t;c--)s.push(e[c][o]),n.push({array:r,highlights:[c*u+o],message:`↑ [${c}][${o}] = ${e[c][o]}`});o++}}return n.push({array:r,sorted:Array.from({length:r.length},(c,d)=>d),message:`✅ Spiral order: [${s.join(", ")}]`}),n}function rr(i){const e=i||[[1,1,1],[1,0,1],[1,1,1]],r=e.flat(),s=e.length,n=e[0].length,t=[{array:[...r],highlights:[],message:"Set Matrix Zeroes: zero out rows and columns containing 0."}],a=new Set,o=new Set;for(let u=0;u<s;u++)for(let c=0;c<n;c++)e[u][c]===0&&(a.add(u),o.add(c),t.push({array:[...r],highlights:[u*n+c],swapping:!0,message:`Found 0 at [${u}][${c}] → mark row ${u}, col ${c}`}));const l=r.map((u,c)=>{const d=Math.floor(c/n),h=c%n;return a.has(d)||o.has(h)?0:u});return t.push({array:l,sorted:Array.from({length:r.length},(u,c)=>c),message:`✅ Zeroed rows: {${[...a]}}, cols: {${[...o]}}`}),t}function tr(i){const e=i||[[1,2,3],[4,5,6],[7,8,9]],r=e.length,s=e.flat(),n=[{array:[...s],highlights:[],message:"Rotate Image 90°: transpose then reverse each row."}];for(let t=0;t<r;t++)for(let a=t+1;a<r;a++)[e[t][a],e[a][t]]=[e[a][t],e[t][a]],n.push({array:e.flat(),highlights:[t*r+a,a*r+t],swapping:!0,message:`Transpose: swap [${t}][${a}] ↔ [${a}][${t}]`});for(let t=0;t<r;t++)e[t].reverse(),n.push({array:e.flat(),highlights:Array.from({length:r},(a,o)=>t*r+o),message:`Reverse row ${t}: [${e[t].join(",")}]`});return n.push({array:e.flat(),sorted:Array.from({length:s.length},(t,a)=>a),message:"✅ Image rotated 90° clockwise!"}),n}function ir(i){const e=[...i],r=[],s=[{array:[...e],result:[],current:[],message:`Permutations of [${e.join(", ")}]`}];function n(t,a){if(a.length===0){r.push([...t]),s.push({array:[...e],result:r.map(o=>[...o]),current:[...t],highlights:t.map(o=>e.indexOf(o)),message:`✓ Permutation: [${t.join(", ")}]`});return}for(let o=0;o<a.length;o++)t.push(a[o]),s.push({array:[...e],result:r.map(l=>[...l]),current:[...t],highlights:[e.indexOf(a[o])],message:`Choose ${a[o]}`}),n(t,[...a.slice(0,o),...a.slice(o+1)]),t.pop()}return n([],e),s.push({array:[...e],result:r.map(t=>[...t]),message:`✅ ${r.length} permutations generated!`}),s}function nr(i){const e=[...i];let r=0,s=0,n=0;const t=[{array:[...e],highlights:[0],message:"Jump Game II: min jumps to reach end. Start at index 0."}];for(let a=0;a<e.length-1&&(n=Math.max(n,a+e[a]),t.push({array:[...e],highlights:[a],comparing:!0,message:`Index ${a}: can jump to ${a+e[a]}, farthest = ${n}`}),!(a===s&&(r++,s=n,t.push({array:[...e],highlights:[a],sorted:[a],swapping:!0,message:`Jump #${r}! New boundary = ${s}`}),s>=e.length-1)));a++);return t.push({array:[...e],sorted:Array.from({length:e.length},(a,o)=>o),message:`✅ Minimum jumps = ${r}`}),t}function sr(i){const e=(i==null?void 0:i.gas)||[1,2,3,4,5],r=(i==null?void 0:i.cost)||[3,4,5,1,2],s=e.map((l,u)=>l-r[u]),n=[{array:[...s],highlights:[],message:`Gas Station: net gain at each station: [${s.join(", ")}]`}];let t=0,a=0,o=0;for(let l=0;l<s.length;l++)t+=s[l],a+=s[l],n.push({array:[...s],highlights:[l],message:`Station ${l}: net=${s[l]}, tank=${a}, total=${t}`}),a<0&&(o=l+1,a=0,n.push({array:[...s],highlights:[l],swapping:!0,message:`Tank < 0! Reset. Try starting from ${o}`}));return t>=0?n.push({array:[...s],sorted:[o],highlights:[o],message:`✅ Start at station ${o}`}):n.push({array:[...s],message:"❌ Impossible — total net < 0"}),n}function ar(i){const e=[...i],r=e.length,s=new Array(r).fill(1),n=[{array:[...e],result:[...s],highlights:[],message:"LIS: dp[i] = length of LIS ending at i."}];for(let a=1;a<r;a++)for(let o=0;o<a;o++)e[o]<e[a]&&s[o]+1>s[a]&&(s[a]=s[o]+1,n.push({array:[...e],result:[...s],highlights:[o,a],message:`a[${o}]=${e[o]} < a[${a}]=${e[a]}: dp[${a}] = ${s[a]}`}));const t=Math.max(...s);return n.push({array:[...e],result:[...s],sorted:s.map((a,o)=>a===t?o:-1).filter(a=>a>=0),message:`✅ LIS length = ${t}`}),n}function or(i){const e=[...i],r=e.length;if(r===0)return[{array:[],message:"Empty array"}];const s=new Array(r).fill(0);s[0]=e[0],r>1&&(s[1]=Math.max(e[0],e[1]));const n=[{array:[...e],result:[...s],highlights:[0],message:`House Robber: dp[0]=${s[0]}${r>1?", dp[1]="+s[1]:""}`}];for(let t=2;t<r;t++)s[t]=Math.max(s[t-1],s[t-2]+e[t]),n.push({array:[...e],result:[...s],highlights:[t],message:`dp[${t}] = max(dp[${t-1}]=${s[t-1]}, dp[${t-2}]+${e[t]}=${s[t-2]+e[t]}) = ${s[t]}`});return n.push({array:[...e],result:[...s],sorted:Array.from({length:r},(t,a)=>a),message:`✅ Max loot = ${s[r-1]}`}),n}function lr(i){const e=(i==null?void 0:i.coins)||[1,5,10,25],r=(i==null?void 0:i.amount)||30,s=new Array(r+1).fill(1/0);s[0]=0;const n=[{array:s.slice(0,Math.min(r+1,31)),highlights:[0],message:`Coin Change: min coins for amount ${r}. Coins: [${e.join(",")}]`}];for(const t of e)for(let a=t;a<=r;a++)s[a-t]+1<s[a]&&(s[a]=s[a-t]+1,a<=30&&n.push({array:s.slice(0,Math.min(r+1,31)),highlights:[a],message:`dp[${a}] = dp[${a-t}]+1 = ${s[a]} using coin ${t}`}));return n.push({array:s.slice(0,Math.min(r+1,31)),sorted:[r<=30?r:0],message:`✅ Min coins for ${r} = ${s[r]===1/0?"impossible":s[r]}`}),n}function ur(i){const e=(i==null?void 0:i.s1)||"abcde",r=(i==null?void 0:i.s2)||"ace",s=e.length,n=r.length,t=Array(s+1).fill(null).map(()=>Array(n+1).fill(0)),a=[{array:e.split(""),message:`LCS of "${e}" and "${r}"`}];for(let o=1;o<=s;o++)for(let l=1;l<=n;l++)e[o-1]===r[l-1]?(t[o][l]=t[o-1][l-1]+1,a.push({array:e.split(""),highlights:[o-1],sorted:[o-1],message:`'${e[o-1]}'='${r[l-1]}': dp[${o}][${l}]=${t[o][l]}`})):t[o][l]=Math.max(t[o-1][l],t[o][l-1]);return a.push({array:e.split(""),message:`✅ LCS length = ${t[s][n]}`}),a}function cr(i){const e=(i==null?void 0:i.s1)||"horse",r=(i==null?void 0:i.s2)||"ros",s=e.length,n=r.length,t=Array(s+1).fill(null).map((o,l)=>{const u=Array(n+1).fill(0);return u[0]=l,u});for(let o=0;o<=n;o++)t[0][o]=o;const a=[{array:e.split(""),message:`Edit Distance: "${e}" → "${r}"`}];for(let o=1;o<=s;o++)for(let l=1;l<=n;l++)e[o-1]===r[l-1]?(t[o][l]=t[o-1][l-1],a.push({array:e.split(""),highlights:[o-1],sorted:[o-1],message:`'${e[o-1]}'='${r[l-1]}': no op, dp[${o}][${l}]=${t[o][l]}`})):(t[o][l]=1+Math.min(t[o-1][l],t[o][l-1],t[o-1][l-1]),a.push({array:e.split(""),highlights:[o-1],message:`'${e[o-1]}'≠'${r[l-1]}': dp[${o}][${l}]=${t[o][l]}`}));return a.push({array:e.split(""),message:`✅ Edit distance = ${t[s][n]}`}),a}function mr(i){const e=(i==null?void 0:i.m)||3,r=(i==null?void 0:i.n)||7,s=Array(e).fill(null).map(()=>Array(r).fill(1)),t=[{array:[...s.flat()],highlights:[],message:`Unique Paths: ${e}×${r} grid. First row and column = 1.`}];for(let a=1;a<e;a++)for(let o=1;o<r;o++)s[a][o]=s[a-1][o]+s[a][o-1],t.push({array:s.flat(),highlights:[a*r+o],message:`dp[${a}][${o}] = ${s[a-1][o]} + ${s[a][o-1]} = ${s[a][o]}`});return t.push({array:s.flat(),sorted:[(e-1)*r+(r-1)],message:`✅ Unique paths = ${s[e-1][r-1]}`}),t}function dr(i){const e=i||[[1,3,1],[1,5,1],[4,2,1]],r=e.length,s=e[0].length,n=e.map(a=>[...a]),t=[{array:n.flat(),highlights:[0],message:`Min Path Sum: ${r}×${s} grid. Top-left to bottom-right.`}];for(let a=1;a<r;a++)n[a][0]+=n[a-1][0],t.push({array:n.flat(),highlights:[a*s],message:`dp[${a}][0] = ${n[a][0]}`});for(let a=1;a<s;a++)n[0][a]+=n[0][a-1],t.push({array:n.flat(),highlights:[a],message:`dp[0][${a}] = ${n[0][a]}`});for(let a=1;a<r;a++)for(let o=1;o<s;o++)n[a][o]+=Math.min(n[a-1][o],n[a][o-1]),t.push({array:n.flat(),highlights:[a*s+o],message:`dp[${a}][${o}] = ${e[a][o]} + min(${n[a-1][o]},${n[a][o-1]}) = ${n[a][o]}`});return t.push({array:n.flat(),sorted:[(r-1)*s+(s-1)],message:`✅ Min path sum = ${n[r-1][s-1]}`}),t}function gr(i){const e=i||[[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]],r=e.length,s=e[0].length,n=Array(r).fill(null).map(()=>Array(s).fill(!1)),t=e.flat(),a=[{array:[...t],highlights:[],message:`Number of Islands: ${r}×${s} grid. BFS/DFS to count connected 1s.`}];let o=0;function l(u,c){u<0||u>=r||c<0||c>=s||e[u][c]===0||n[u][c]||(n[u][c]=!0,a.push({array:[...t],highlights:[u*s+c],sorted:n.flat().map((d,h)=>d?h:-1).filter(d=>d>=0),message:`Visit [${u}][${c}] — part of island ${o}`}),l(u+1,c),l(u-1,c),l(u,c+1),l(u,c-1))}for(let u=0;u<r;u++)for(let c=0;c<s;c++)e[u][c]===1&&!n[u][c]&&(o++,a.push({array:[...t],highlights:[u*s+c],swapping:!0,message:`Found new island #${o} starting at [${u}][${c}]`}),l(u,c));return a.push({array:[...t],sorted:n.flat().map((u,c)=>u?c:-1).filter(u=>u>=0),message:`✅ Number of islands = ${o}`}),a}function hr(i){const e=i||[[2,1,1],[1,1,0],[0,1,1]],r=e.length,s=e[0].length,n=e.map(c=>[...c]);let t=0;const a=[];for(let c=0;c<r;c++)for(let d=0;d<s;d++)n[c][d]===2&&a.push([c,d]),n[c][d]===1&&t++;const o=[{array:n.flat(),highlights:a.map(([c,d])=>c*s+d),message:`Rotting Oranges: ${t} fresh, ${a.length} rotten initially.`}];let l=0;const u=[[1,0],[-1,0],[0,1],[0,-1]];for(;a.length>0&&t>0;){const c=a.length;l++;for(let d=0;d<c;d++){const[h,f]=a.shift();for(const[x,k]of u){const b=h+x,S=f+k;b>=0&&b<r&&S>=0&&S<s&&n[b][S]===1&&(n[b][S]=2,t--,a.push([b,S]),o.push({array:n.flat(),highlights:[b*s+S],swapping:!0,message:`Min ${l}: [${b}][${S}] rots! Fresh left: ${t}`}))}}}return o.push({array:n.flat(),sorted:Array.from({length:r*s},(c,d)=>d),message:t===0?`✅ All rotten in ${l} minutes!`:`❌ ${t} oranges can't be reached.`}),o}function fr(i){const e=[...i],r=e.length,s=[{array:[...e],highlights:[],sorted:[],message:"Heap Sort: build max-heap then extract max repeatedly."}];function n(t,a,o){let l=o,u=2*o+1,c=2*o+2;u<a&&t[u]>t[l]&&(l=u),c<a&&t[c]>t[l]&&(l=c),l!==o&&([t[o],t[l]]=[t[l],t[o]],s.push({array:[...t],highlights:[o,l],swapping:!0,message:`Heapify: swap ${t[l]} ↔ ${t[o]}`}),n(t,a,l))}for(let t=Math.floor(r/2)-1;t>=0;t--)n(e,r,t);s.push({array:[...e],highlights:[],message:`Max-heap built: [${e.join(", ")}]`});for(let t=r-1;t>0;t--)[e[0],e[t]]=[e[t],e[0]],s.push({array:[...e],highlights:[0,t],swapping:!0,sorted:Array.from({length:r-t},(a,o)=>r-1-o),message:`Extract max ${e[t]} to position ${t}`}),n(e,t,0);return s.push({array:[...e],sorted:Array.from({length:r},(t,a)=>a),message:"✅ Heap Sort complete!"}),s}function pr(i){const e=[...i],r=Math.max(...e),s=new Array(r+1).fill(0),n=[{array:[...e],highlights:[],message:`Counting Sort: count occurrences, max value = ${r}`}];for(let a=0;a<e.length;a++)s[e[a]]++,n.push({array:[...e],highlights:[a],message:`Count ${e[a]}: count[${e[a]}] = ${s[e[a]]}`});let t=0;for(let a=0;a<=r;a++)for(;s[a]>0;)e[t]=a,s[a]--,t++;return n.push({array:[...e],sorted:Array.from({length:e.length},(a,o)=>o),message:`✅ Sorted: [${e.join(", ")}]`}),n}function yr(i){const e=[...i],r=Math.max(...e),s=[{array:[...e],highlights:[],message:`Radix Sort: sort by each digit, max = ${r}`}];for(let n=1;Math.floor(r/n)>0;n*=10){const t=new Array(e.length).fill(0),a=new Array(10).fill(0);for(let o=0;o<e.length;o++)a[Math.floor(e[o]/n)%10]++;for(let o=1;o<10;o++)a[o]+=a[o-1];for(let o=e.length-1;o>=0;o--){const l=Math.floor(e[o]/n)%10;t[a[l]-1]=e[o],a[l]--}for(let o=0;o<e.length;o++)e[o]=t[o];s.push({array:[...e],highlights:Array.from({length:e.length},(o,l)=>l),message:`After sorting by ${n}s digit: [${e.join(", ")}]`})}return s.push({array:[...e],sorted:Array.from({length:e.length},(n,t)=>t),message:`✅ Radix Sort complete: [${e.join(", ")}]`}),s}function xr(i){const e=[...i];let r=0,s=0,n=e.length-1;const t=[{array:[...e],highlights:[],message:"Sort Colors (Dutch National Flag): partition into 0s, 1s, 2s."}];for(;s<=n;)e[s]===0?([e[r],e[s]]=[e[s],e[r]],t.push({array:[...e],highlights:[r,s],swapping:!0,message:`${e[r]}=0: swap to front (lo=${r})`}),r++,s++):e[s]===1?(t.push({array:[...e],highlights:[s],message:`${e[s]}=1: already in middle, skip`}),s++):([e[s],e[n]]=[e[n],e[s]],t.push({array:[...e],highlights:[s,n],swapping:!0,message:`${e[n]}=2: swap to back (hi=${n})`}),n--);return t.push({array:[...e],sorted:Array.from({length:e.length},(a,o)=>o),message:`✅ Sorted: [${e.join(", ")}]`}),t}const H=[{id:"bubble-sort",name:"Bubble Sort",category:"sorting",difficulty:"Easy",icon:"🫧",complexity:{time:"O(n²)",space:"O(1)"},description:'Repeatedly swap adjacent elements if they are in the wrong order. Like bubbles rising to the surface, the largest unsorted element "bubbles up" to its correct position after each pass.',color:"#f472b6",defaultInput:[64,34,25,12,22,11,90,45]},{id:"selection-sort",name:"Selection Sort",category:"sorting",difficulty:"Easy",icon:"👆",complexity:{time:"O(n²)",space:"O(1)"},description:"Find the minimum element from the unsorted portion and place it at the beginning. Repeat for each position until the array is sorted.",color:"#fb923c",defaultInput:[64,25,12,22,11,90,45,34]},{id:"insertion-sort",name:"Insertion Sort",category:"sorting",difficulty:"Easy",icon:"📥",complexity:{time:"O(n²)",space:"O(1)"},description:"Build the sorted array one element at a time by inserting each new element into its correct position among the already-sorted elements.",color:"#a78bfa",defaultInput:[12,11,13,5,6,7,45,22]},{id:"merge-sort",name:"Merge Sort",category:"sorting",difficulty:"Medium",icon:"🔀",complexity:{time:"O(n log n)",space:"O(n)"},description:"Divide the array in half recursively, sort each half, then merge the sorted halves back together. A classic divide-and-conquer algorithm.",color:"#34d399",defaultInput:[38,27,43,3,9,82,10,55]},{id:"quick-sort",name:"Quick Sort",category:"sorting",difficulty:"Medium",icon:"⚡",complexity:{time:"O(n log n) avg",space:"O(log n)"},description:"Pick a pivot, partition the array so elements smaller go left and larger go right, then recursively sort both partitions.",color:"#fbbf24",defaultInput:[10,80,30,90,40,50,70,60]},{id:"binary-search",name:"Binary Search",category:"searching",difficulty:"Easy",icon:"🔍",complexity:{time:"O(log n)",space:"O(1)"},description:"Search a sorted array by repeatedly dividing the search range in half. Compare the middle element with the target and eliminate half the remaining elements.",color:"#60a5fa",defaultInput:[2,5,8,12,16,23,38,56,72,91],searchTarget:23},{id:"linear-search",name:"Linear Search",category:"searching",difficulty:"Easy",icon:"📏",complexity:{time:"O(n)",space:"O(1)"},description:"Check each element one by one from left to right until the target is found or the end is reached. Simple but works on unsorted arrays.",color:"#c084fc",defaultInput:[64,34,25,12,22,11,90,45],searchTarget:22},{id:"bfs",name:"Breadth-First Search",category:"graph",difficulty:"Medium",icon:"🌊",complexity:{time:"O(V + E)",space:"O(V)"},description:"Explore all neighbors at the current depth level before moving to nodes at the next depth level. Uses a queue to track which node to visit next.",color:"#22d3ee",defaultGraph:{nodes:[0,1,2,3,4,5,6],edges:[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[3,4],[5,6]]}},{id:"dfs",name:"Depth-First Search",category:"graph",difficulty:"Medium",icon:"🏊",complexity:{time:"O(V + E)",space:"O(V)"},description:"Explore as deep as possible along each branch before backtracking. Uses a stack (or recursion) to track which node to visit next.",color:"#f97316",defaultGraph:{nodes:[0,1,2,3,4,5,6],edges:[[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[3,4],[5,6]]}},{id:"two-pointers",name:"Two Pointers",category:"two-pointers",difficulty:"Easy",icon:"↔️",complexity:{time:"O(n)",space:"O(1)"},description:"Use two pointers that converge from both ends of a sorted array to find pairs that meet a condition.",color:"#60a5fa",defaultInput:[1,3,5,7,9,11,15,20],searchTarget:16},{id:"sliding-window",name:"Sliding Window",category:"sliding-window",difficulty:"Medium",icon:"🪟",complexity:{time:"O(n)",space:"O(1)"},description:"Maintain a window of elements and slide it across the array to find optimal subarrays.",color:"#34d399",defaultInput:[2,1,5,1,3,2,8,4,3],windowSize:3},{id:"merge-intervals",name:"Merge Intervals",category:"intervals",difficulty:"Medium",icon:"🔗",complexity:{time:"O(n log n)",space:"O(n)"},description:"Sort intervals by start time, then merge overlapping ones by comparing endpoints.",color:"#f472b6",defaultInput:[[1,3],[2,6],[8,10],[15,18],[17,20]]},{id:"kadane",name:"Kadane's Algorithm",category:"kadanes",difficulty:"Medium",icon:"📈",complexity:{time:"O(n)",space:"O(1)"},description:"Find the maximum sum contiguous subarray using Kadane's approach: extend or restart at each element.",color:"#fbbf24",defaultInput:[-2,1,-3,4,-1,2,1,-5,4]},{id:"prefix-sum",name:"Prefix Sum",category:"prefix-sum",difficulty:"Easy",icon:"➕",complexity:{time:"O(n)",space:"O(n)"},description:"Build a prefix sum array for O(1) range sum queries. prefix[i] = sum of elements from 0 to i-1.",color:"#a78bfa",defaultInput:[3,1,4,1,5,9,2,6]},{id:"monotonic-stack",name:"Monotonic Stack",category:"stack",difficulty:"Medium",icon:"📚",complexity:{time:"O(n)",space:"O(n)"},description:"Maintain a stack where elements are in monotonic order to find next greater/smaller elements efficiently.",color:"#f97316",defaultInput:[4,5,2,10,8,6,11,3]},{id:"dp-fibonacci",name:"DP: Climbing Stairs",category:"dp",difficulty:"Easy",icon:"🧬",complexity:{time:"O(n)",space:"O(n)"},description:"Classic Fibonacci-style DP: number of ways to climb n stairs taking 1 or 2 steps at a time.",color:"#22d3ee",dpN:8},{id:"dp-knapsack",name:"DP: 0/1 Knapsack",category:"dp",difficulty:"Hard",icon:"🎒",complexity:{time:"O(nW)",space:"O(nW)"},description:"Given items with weights and values, find the maximum value that fits in a knapsack of capacity W.",color:"#ef4444",knapsackData:{weights:[2,3,4,5],values:[3,4,5,6],capacity:8}},{id:"backtracking",name:"Backtracking: Subsets",category:"backtracking",difficulty:"Medium",icon:"🌳",complexity:{time:"O(2^n)",space:"O(n)"},description:"Generate all subsets using the choose-explore-unchoose backtracking pattern.",color:"#c084fc",defaultInput:[1,2,3]},{id:"greedy",name:"Greedy: Activity Selection",category:"greedy",difficulty:"Medium",icon:"🏆",complexity:{time:"O(n log n)",space:"O(n)"},description:"Select maximum non-overlapping activities by always choosing the one that ends earliest.",color:"#4ade80",defaultInput:[[1,4],[3,5],[0,6],[5,7],[3,9],[5,9],[6,10],[8,11],[8,12],[2,14],[12,16]]},{id:"union-find",name:"Union-Find",category:"graph",difficulty:"Hard",icon:"🔲",complexity:{time:"O(alpha(n))",space:"O(n)"},description:"Disjoint Set Union with path compression and union by rank for efficient connectivity queries.",color:"#fb923c",defaultGraph:{nodes:[0,1,2,3,4,5],unions:[[0,1],[2,3],[1,3],[4,5],[3,5]]}},{id:"topological-sort",name:"Topological Sort",category:"graph",difficulty:"Hard",icon:"📐",complexity:{time:"O(V + E)",space:"O(V)"},description:"Kahn's algorithm: repeatedly remove nodes with 0 in-degree to produce a valid ordering of a DAG.",color:"#818cf8",defaultGraph:{nodes:[0,1,2,3,4,5],edges:[[0,2],[0,3],[1,3],[1,4],[2,5],[3,5],[4,5]],directed:!0}},{id:"bit-manipulation",name:"Bit Manipulation",category:"bit-manipulation",difficulty:"Easy",icon:"💻",complexity:{time:"O(log n)",space:"O(1)"},description:"Count set bits using bitwise AND and right shift. Also demonstrates XOR trick for finding single numbers.",color:"#e879f9",defaultInput:[42]},{id:"move-zeroes",name:"Move Zeroes",category:"array",difficulty:"Easy",icon:"0️⃣",complexity:{time:"O(n)",space:"O(1)"},description:"Move all zeroes to end while maintaining relative order of non-zero elements.",color:"#60a5fa",defaultInput:[0,1,0,3,12,0,5]},{id:"rotate-array",name:"Rotate Array",category:"array",difficulty:"Medium",icon:"🔄",complexity:{time:"O(n)",space:"O(1)"},description:"Rotate array to the right by k steps using the reverse approach.",color:"#f472b6",defaultInput:[1,2,3,4,5,6,7],rotateK:3},{id:"remove-duplicates",name:"Remove Duplicates from Sorted Array",category:"array",difficulty:"Easy",icon:"✂️",complexity:{time:"O(n)",space:"O(1)"},description:"Remove duplicates in-place from a sorted array using two pointers.",color:"#a78bfa",defaultInput:[0,0,1,1,1,2,2,3,3,4]},{id:"buy-sell-stock",name:"Best Time to Buy and Sell Stock",category:"array",difficulty:"Easy",icon:"📈",complexity:{time:"O(n)",space:"O(1)"},description:"Find the maximum profit from a single buy-sell transaction.",color:"#4ade80",defaultInput:[7,1,5,3,6,4]},{id:"product-except-self",name:"Product of Array Except Self",category:"array",difficulty:"Medium",icon:"✖️",complexity:{time:"O(n)",space:"O(n)"},description:"Compute output[i] = product of all elements except arr[i] without division.",color:"#fbbf24",defaultInput:[1,2,3,4]},{id:"contains-duplicate",name:"Contains Duplicate",category:"hash-table",difficulty:"Easy",icon:"🔍",complexity:{time:"O(n)",space:"O(n)"},description:"Check if any value appears at least twice using a hash set.",color:"#f97316",defaultInput:[1,2,3,1,5,6]},{id:"majority-element",name:"Majority Element",category:"array",difficulty:"Easy",icon:"👑",complexity:{time:"O(n)",space:"O(1)"},description:"Find the element appearing more than n/2 times using Boyer-Moore Voting.",color:"#818cf8",defaultInput:[2,2,1,1,1,2,2]},{id:"increasing-triplet",name:"Increasing Triplet Subsequence",category:"array",difficulty:"Medium",icon:"📊",complexity:{time:"O(n)",space:"O(1)"},description:"Find if there exists i < j < k such that a[i] < a[j] < a[k].",color:"#c084fc",defaultInput:[1,2,3,4,5]},{id:"first-missing-positive",name:"First Missing Positive",category:"array",difficulty:"Hard",icon:"❓",complexity:{time:"O(n)",space:"O(1)"},description:"Find the smallest missing positive integer using cyclic sort.",color:"#ef4444",defaultInput:[3,4,-1,1]},{id:"valid-palindrome",name:"Valid Palindrome",category:"string",difficulty:"Easy",icon:"🪞",complexity:{time:"O(n)",space:"O(1)"},description:"Check if a string is a palindrome considering only alphanumeric characters.",color:"#22d3ee",defaultInput:"racecar"},{id:"is-subsequence",name:"Is Subsequence",category:"string",difficulty:"Easy",icon:"📎",complexity:{time:"O(n)",space:"O(1)"},description:"Check if s is a subsequence of t by scanning with two pointers.",color:"#34d399",defaultInput:{s:"ace",t:"abcde"}},{id:"reverse-words",name:"Reverse Words in a String",category:"string",difficulty:"Medium",icon:"🔃",complexity:{time:"O(n)",space:"O(n)"},description:"Reverse the order of words in a string.",color:"#f472b6",defaultInput:"the sky is blue"},{id:"longest-common-prefix",name:"Longest Common Prefix",category:"string",difficulty:"Easy",icon:"🔤",complexity:{time:"O(n·m)",space:"O(1)"},description:"Find the longest common prefix among an array of strings.",color:"#a78bfa",defaultInput:["flower","flow","flight"]},{id:"ransom-note",name:"Ransom Note",category:"hash-table",difficulty:"Easy",icon:"✉️",complexity:{time:"O(n)",space:"O(1)"},description:"Check if ransom note can be constructed from magazine letters.",color:"#fb923c",defaultInput:{ransomNote:"aab",magazine:"aabbc"}},{id:"group-anagrams",name:"Group Anagrams",category:"hash-table",difficulty:"Medium",icon:"📦",complexity:{time:"O(n·k log k)",space:"O(n)"},description:"Group strings that are anagrams by sorting characters as keys.",color:"#818cf8",defaultInput:["eat","tea","tan","ate","nat","bat"]},{id:"longest-consecutive",name:"Longest Consecutive Sequence",category:"hash-table",difficulty:"Medium",icon:"🔗",complexity:{time:"O(n)",space:"O(n)"},description:"Find the longest sequence of consecutive integers using a HashSet.",color:"#22d3ee",defaultInput:[100,4,200,1,3,2]},{id:"contains-duplicate-ii",name:"Contains Duplicate II",category:"hash-table",difficulty:"Easy",icon:"📏",complexity:{time:"O(n)",space:"O(n)"},description:"Check if duplicate values exist within k distance of each other.",color:"#34d399",defaultInput:[1,2,3,1,2,3]},{id:"isomorphic-strings",name:"Isomorphic Strings",category:"hash-table",difficulty:"Easy",icon:"🔄",complexity:{time:"O(n)",space:"O(n)"},description:"Check if characters in s can be replaced to get t (bijection).",color:"#f97316",defaultInput:{s:"egg",t:"add"}},{id:"good-pairs",name:"Number of Good Pairs",category:"hash-table",difficulty:"Easy",icon:"🤝",complexity:{time:"O(n)",space:"O(n)"},description:"Count pairs (i,j) where nums[i] == nums[j] and i < j.",color:"#c084fc",defaultInput:[1,2,3,1,1,3]},{id:"3sum",name:"3Sum",category:"two-pointers",difficulty:"Medium",icon:"3️⃣",complexity:{time:"O(n²)",space:"O(1)"},description:"Find all unique triplets that sum to zero using sort + two pointers.",color:"#f472b6",defaultInput:[-1,0,1,2,-1,-4]},{id:"container-water",name:"Container with Most Water",category:"two-pointers",difficulty:"Medium",icon:"🏊",complexity:{time:"O(n)",space:"O(1)"},description:"Maximize water area between two vertical lines using two pointers.",color:"#60a5fa",defaultInput:[1,8,6,2,5,4,8,3,7]},{id:"trapping-rain-water",name:"Trapping Rain Water",category:"two-pointers",difficulty:"Hard",icon:"🌧️",complexity:{time:"O(n)",space:"O(1)"},description:"Compute trapped rain water using two-pointer approach with left/right max.",color:"#22d3ee",defaultInput:[0,1,0,2,1,0,1,3,2,1,2,1]},{id:"merge-sorted-array",name:"Merge Sorted Array",category:"two-pointers",difficulty:"Easy",icon:"🔀",complexity:{time:"O(m+n)",space:"O(1)"},description:"Merge two sorted arrays in-place from the end.",color:"#34d399",defaultInput:{nums1:[1,2,3,0,0,0],nums2:[2,5,6],m:3}},{id:"subarray-sum-k",name:"Subarray Sum Equals K",category:"prefix-sum",difficulty:"Medium",icon:"🎯",complexity:{time:"O(n)",space:"O(n)"},description:"Count subarrays summing to k using prefix sum + hash map.",color:"#fbbf24",defaultInput:[1,1,1,2,3]},{id:"contiguous-array",name:"Contiguous Array",category:"prefix-sum",difficulty:"Medium",icon:"⚖️",complexity:{time:"O(n)",space:"O(n)"},description:"Find longest subarray with equal 0s and 1s using running count + map.",color:"#818cf8",defaultInput:[0,1,0,0,1,1,0]},{id:"longest-substring",name:"Longest Substring Without Repeating",category:"sliding-window",difficulty:"Medium",icon:"🔤",complexity:{time:"O(n)",space:"O(min(n,m))"},description:"Find the longest substring without repeating characters.",color:"#f97316",defaultInput:"abcabcbb"},{id:"permutation-in-string",name:"Permutation in String",category:"sliding-window",difficulty:"Medium",icon:"🔀",complexity:{time:"O(n)",space:"O(1)"},description:"Check if s2 contains a permutation of s1 using a sliding window.",color:"#c084fc",defaultInput:{s1:"ab",s2:"eidbaooo"}},{id:"max-consecutive-ones",name:"Max Consecutive Ones III",category:"sliding-window",difficulty:"Medium",icon:"1️⃣",complexity:{time:"O(n)",space:"O(1)"},description:"Max consecutive 1s if you can flip at most k zeroes.",color:"#4ade80",defaultInput:[1,1,1,0,0,0,1,1,1,1,0]},{id:"max-product-subarray",name:"Maximum Product Subarray",category:"kadanes",difficulty:"Medium",icon:"✖️",complexity:{time:"O(n)",space:"O(1)"},description:"Find the contiguous subarray with the largest product, tracking both max and min.",color:"#ef4444",defaultInput:[2,3,-2,4,-1]},{id:"spiral-matrix",name:"Spiral Matrix",category:"matrix",difficulty:"Medium",icon:"🌀",complexity:{time:"O(m·n)",space:"O(1)"},description:"Traverse matrix in spiral order: right → down → left → up.",color:"#f472b6",defaultInput:[[1,2,3],[4,5,6],[7,8,9]]},{id:"rotate-image",name:"Rotate Image",category:"matrix",difficulty:"Medium",icon:"🔄",complexity:{time:"O(n²)",space:"O(1)"},description:"Rotate NxN matrix 90° clockwise: transpose then reverse each row.",color:"#60a5fa",defaultInput:[[1,2,3],[4,5,6],[7,8,9]]},{id:"set-matrix-zeroes",name:"Set Matrix Zeroes",category:"matrix",difficulty:"Medium",icon:"0️⃣",complexity:{time:"O(m·n)",space:"O(m+n)"},description:"If an element is 0, set its entire row and column to 0.",color:"#fbbf24",defaultInput:[[1,1,1],[1,0,1],[1,1,1]]},{id:"valid-parentheses",name:"Valid Parentheses",category:"stack",difficulty:"Easy",icon:"🔐",complexity:{time:"O(n)",space:"O(n)"},description:"Check if brackets are balanced using a stack.",color:"#34d399",defaultInput:"({[]})"},{id:"daily-temperatures",name:"Daily Temperatures",category:"stack",difficulty:"Medium",icon:"🌡️",complexity:{time:"O(n)",space:"O(n)"},description:"Find days until warmer temperature using monotonic stack.",color:"#f97316",defaultInput:[73,74,75,71,69,72,76,73]},{id:"eval-rpn",name:"Evaluate Reverse Polish Notation",category:"stack",difficulty:"Medium",icon:"🧮",complexity:{time:"O(n)",space:"O(n)"},description:"Evaluate postfix expression using a stack.",color:"#818cf8",defaultInput:["2","1","+","3","*"]},{id:"largest-rectangle",name:"Largest Rectangle in Histogram",category:"stack",difficulty:"Hard",icon:"📊",complexity:{time:"O(n)",space:"O(n)"},description:"Find largest rectangular area in histogram using monotonic stack.",color:"#ef4444",defaultInput:[2,1,5,6,2,3]},{id:"sliding-window-max",name:"Sliding Window Maximum",category:"queue",difficulty:"Hard",icon:"📈",complexity:{time:"O(n)",space:"O(k)"},description:"Find maximum in each sliding window using a monotonic deque.",color:"#22d3ee",defaultInput:[1,3,-1,-3,5,3,6,7]},{id:"search-insert",name:"Search Insert Position",category:"searching",difficulty:"Easy",icon:"📍",complexity:{time:"O(log n)",space:"O(1)"},description:"Find target index or insertion point in sorted array.",color:"#a78bfa",defaultInput:[1,3,5,6],searchTarget:5},{id:"search-rotated",name:"Search in Rotated Sorted Array",category:"searching",difficulty:"Medium",icon:"🔄",complexity:{time:"O(log n)",space:"O(1)"},description:"Binary search in a rotated sorted array by identifying the sorted half.",color:"#fb923c",defaultInput:[4,5,6,7,0,1,2],searchTarget:0},{id:"find-peak",name:"Find Peak Element",category:"searching",difficulty:"Medium",icon:"⛰️",complexity:{time:"O(log n)",space:"O(1)"},description:"Find a peak element using binary search on slope direction.",color:"#f472b6",defaultInput:[1,2,3,1,5,4]},{id:"find-min-rotated",name:"Find Min in Rotated Sorted Array",category:"searching",difficulty:"Medium",icon:"📉",complexity:{time:"O(log n)",space:"O(1)"},description:"Find minimum in rotated sorted array using binary search.",color:"#34d399",defaultInput:[3,4,5,1,2]},{id:"permutations",name:"Permutations",category:"backtracking",difficulty:"Medium",icon:"🔀",complexity:{time:"O(n!)",space:"O(n)"},description:"Generate all permutations using choose-recurse-unchoose pattern.",color:"#f97316",defaultInput:[1,2,3]},{id:"jump-game-ii",name:"Jump Game II",category:"greedy",difficulty:"Medium",icon:"🦘",complexity:{time:"O(n)",space:"O(1)"},description:"Minimum jumps to reach the end using greedy BFS approach.",color:"#60a5fa",defaultInput:[2,3,1,1,4]},{id:"gas-station",name:"Gas Station",category:"greedy",difficulty:"Medium",icon:"⛽",complexity:{time:"O(n)",space:"O(1)"},description:"Find starting gas station for a circular tour using net gain tracking.",color:"#fbbf24",defaultInput:{gas:[1,2,3,4,5],cost:[3,4,5,1,2]}},{id:"dp-lis",name:"Longest Increasing Subsequence",category:"dp",difficulty:"Medium",icon:"📈",complexity:{time:"O(n²)",space:"O(n)"},description:"Find the length of the longest strictly increasing subsequence.",color:"#f97316",defaultInput:[10,9,2,5,3,7,101,18]},{id:"dp-house-robber",name:"House Robber",category:"dp",difficulty:"Medium",icon:"🏠",complexity:{time:"O(n)",space:"O(n)"},description:"Max money robbing non-adjacent houses using DP.",color:"#ef4444",defaultInput:[2,7,9,3,1,8]},{id:"dp-coin-change",name:"Coin Change",category:"dp",difficulty:"Medium",icon:"🪙",complexity:{time:"O(n·amount)",space:"O(amount)"},description:"Min coins needed to make an amount using DP.",color:"#fbbf24",defaultInput:{coins:[1,5,10,25],amount:30}},{id:"dp-lcs",name:"Longest Common Subsequence",category:"dp",difficulty:"Medium",icon:"🔗",complexity:{time:"O(m·n)",space:"O(m·n)"},description:"Find length of longest common subsequence of two strings.",color:"#22d3ee",defaultInput:{s1:"abcde",s2:"ace"}},{id:"dp-edit-distance",name:"Edit Distance",category:"dp",difficulty:"Hard",icon:"✏️",complexity:{time:"O(m·n)",space:"O(m·n)"},description:"Min operations (insert/delete/replace) to convert one string to another.",color:"#c084fc",defaultInput:{s1:"horse",s2:"ros"}},{id:"dp-unique-paths",name:"Unique Paths",category:"dp",difficulty:"Medium",icon:"🗺️",complexity:{time:"O(m·n)",space:"O(m·n)"},description:"Number of unique paths from top-left to bottom-right in a grid.",color:"#34d399",defaultInput:{m:3,n:7}},{id:"dp-min-path-sum",name:"Minimum Path Sum",category:"dp",difficulty:"Medium",icon:"🛤️",complexity:{time:"O(m·n)",space:"O(1)"},description:"Find path from top-left to bottom-right minimizing sum of values.",color:"#818cf8",defaultInput:[[1,3,1],[1,5,1],[4,2,1]]},{id:"number-of-islands",name:"Number of Islands",category:"graph",difficulty:"Medium",icon:"🏝️",complexity:{time:"O(m·n)",space:"O(m·n)"},description:"Count connected components of 1s in a binary grid using DFS.",color:"#4ade80",defaultInput:[[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]},{id:"rotting-oranges",name:"Rotting Oranges",category:"graph",difficulty:"Medium",icon:"🍊",complexity:{time:"O(m·n)",space:"O(m·n)"},description:"BFS from rotten oranges to determine minutes until all are rotten.",color:"#f97316",defaultInput:[[2,1,1],[1,1,0],[0,1,1]]},{id:"heap-sort",name:"Heap Sort",category:"sorting",difficulty:"Medium",icon:"🏔️",complexity:{time:"O(n log n)",space:"O(1)"},description:"Build max-heap then repeatedly extract the maximum element.",color:"#818cf8",defaultInput:[12,11,13,5,6,7,45,22]},{id:"counting-sort",name:"Counting Sort",category:"sorting",difficulty:"Easy",icon:"🔢",complexity:{time:"O(n+k)",space:"O(k)"},description:"Sort by counting occurrences. Works for small integer ranges.",color:"#4ade80",defaultInput:[4,2,2,8,3,3,1]},{id:"radix-sort",name:"Radix Sort",category:"sorting",difficulty:"Medium",icon:"🎰",complexity:{time:"O(d·(n+k))",space:"O(n+k)"},description:"Sort integers digit by digit from least to most significant.",color:"#c084fc",defaultInput:[170,45,75,90,802,24,2,66]},{id:"sort-colors",name:"Sort Colors",category:"sorting",difficulty:"Medium",icon:"🎨",complexity:{time:"O(n)",space:"O(1)"},description:"Dutch National Flag: partition array into 0s, 1s, and 2s in one pass.",color:"#f472b6",defaultInput:[2,0,2,1,1,0]}];function vr(i){const e=[...i],r=e.length,s=[{array:[...e],highlights:[],sorted:[],message:"Starting Bubble Sort — we'll compare adjacent pairs and swap if needed.",variables:{n:r,pass:0}}];for(let n=0;n<r-1;n++){for(let t=0;t<r-n-1;t++)s.push({array:[...e],highlights:[t,t+1],comparing:!0,sorted:Array.from({length:n},(a,o)=>r-1-o),message:`Comparing ${e[t]} and ${e[t+1]}`,variables:{i:n,j:t,"arr[j]":e[t],"arr[j+1]":e[t+1],swapped:!1}}),e[t]>e[t+1]&&([e[t],e[t+1]]=[e[t+1],e[t]],s.push({array:[...e],highlights:[t,t+1],swapping:!0,sorted:Array.from({length:n},(a,o)=>r-1-o),message:`Swapped! ${e[t+1]} > ${e[t]} → moved ${e[t+1]} right`,variables:{i:n,j:t,"arr[j]":e[t],"arr[j+1]":e[t+1],swapped:!0}}));s.push({array:[...e],highlights:[],sorted:Array.from({length:n+1},(t,a)=>r-1-a),message:`Pass ${n+1} complete — ${e[r-1-n]} is in its final position`,variables:{pass:n+1,sorted:n+1}})}return s.push({array:[...e],highlights:[],sorted:Array.from({length:r},(n,t)=>t),message:"✅ Array is fully sorted!",variables:{sorted:r}}),s}function wr(i){const e=[...i],r=e.length,s=[{array:[...e],highlights:[],sorted:[],message:"Starting Selection Sort — find the minimum in unsorted portion and place it at the beginning.",variables:{n:r,sorted:0}}];for(let n=0;n<r-1;n++){let t=n;s.push({array:[...e],highlights:[n],minIndex:n,sorted:Array.from({length:n},(a,o)=>o),message:`Looking for minimum starting from index ${n}`,variables:{i:n,minIdx:t,"arr[minIdx]":e[t]}});for(let a=n+1;a<r;a++)s.push({array:[...e],highlights:[a,t],comparing:!0,minIndex:t,sorted:Array.from({length:n},(o,l)=>l),message:`Comparing ${e[a]} with current min ${e[t]}`,variables:{i:n,j:a,minIdx:t,"arr[j]":e[a],min:e[t]}}),e[a]<e[t]&&(t=a,s.push({array:[...e],highlights:[t],minIndex:t,sorted:Array.from({length:n},(o,l)=>l),message:`New minimum found: ${e[t]} at index ${t}`,variables:{i:n,j:a,minIdx:t,newMin:e[t]}}));t!==n&&([e[n],e[t]]=[e[t],e[n]],s.push({array:[...e],highlights:[n,t],swapping:!0,sorted:Array.from({length:n+1},(a,o)=>o),message:`Swapped ${e[t]} and ${e[n]} — position ${n} is now correct`,variables:{i:n,minIdx:t,swapped:!0}}))}return s.push({array:[...e],highlights:[],sorted:Array.from({length:r},(n,t)=>t),message:"✅ Array is fully sorted!",variables:{sorted:r}}),s}function jr(i){const e=[...i],r=e.length,s=[{array:[...e],highlights:[],sorted:[0],message:'Starting Insertion Sort — first element is already "sorted". Insert each next element into correct position.',variables:{n:r,sorted:1}}];for(let n=1;n<r;n++){const t=e[n];let a=n-1;for(s.push({array:[...e],highlights:[n],sorted:Array.from({length:n},(o,l)=>l),message:`Picking ${t} — inserting into sorted portion [0..${n-1}]`,variables:{i:n,key:t,j:a+1}});a>=0&&e[a]>t;)e[a+1]=e[a],s.push({array:[...e],highlights:[a,a+1],comparing:!0,sorted:Array.from({length:n},(o,l)=>l),message:`${e[a]} > ${t} — shifting ${e[a]} right`,variables:{i:n,key:t,j:a,"arr[j]":e[a],shifting:!0}}),a--;e[a+1]=t,s.push({array:[...e],highlights:[a+1],sorted:Array.from({length:n+1},(o,l)=>l),message:`Inserted ${t} at index ${a+1}`,variables:{i:n,key:t,insertAt:a+1}})}return s.push({array:[...e],highlights:[],sorted:Array.from({length:r},(n,t)=>t),message:"✅ Array is fully sorted!",variables:{sorted:r}}),s}function br(i){const e=[...i],r=[{array:[...e],highlights:[],sorted:[],ranges:[],message:"Starting Merge Sort — divide array in half recursively, then merge sorted halves."}];function s(t,a,o,l,u){const c=t.slice(a,o+1),d=t.slice(o+1,l+1);u.push({array:[...t],highlights:Array.from({length:l-a+1},(k,b)=>a+b),ranges:[{start:a,mid:o,end:l}],message:`Merging [${c.join(",")}] and [${d.join(",")}]`});let h=0,f=0,x=a;for(;h<c.length&&f<d.length;)c[h]<=d[f]?(t[x]=c[h],h++):(t[x]=d[f],f++),x++;for(;h<c.length;)t[x]=c[h],h++,x++;for(;f<d.length;)t[x]=d[f],f++,x++;u.push({array:[...t],highlights:Array.from({length:l-a+1},(k,b)=>a+b),sorted:[],message:`Merged result: [${t.slice(a,l+1).join(",")}]`})}function n(t,a,o){if(a<o){const l=Math.floor((a+o)/2);r.push({array:[...t],highlights:Array.from({length:o-a+1},(u,c)=>a+c),ranges:[{start:a,end:o}],message:`Dividing [${a}..${o}] at midpoint ${l}`}),n(t,a,l),n(t,l+1,o),s(t,a,l,o,r)}}return n(e,0,e.length-1),r.push({array:[...e],highlights:[],sorted:Array.from({length:e.length},(t,a)=>a),message:"✅ Array is fully sorted!"}),r}function kr(i){const e=[...i],r=[{array:[...e],highlights:[],sorted:[],message:"Starting Quick Sort — pick a pivot, partition around it, then recurse on both sides."}];function s(t,a,o){const l=t[o];r.push({array:[...t],highlights:[o],pivot:o,sorted:[],message:`Pivot selected: ${l} (index ${o})`});let u=a-1;for(let c=a;c<o;c++)r.push({array:[...t],highlights:[c,o],comparing:!0,pivot:o,partitionBoundary:u+1,sorted:[],message:`Comparing ${t[c]} with pivot ${l}`}),t[c]<l&&(u++,[t[u],t[c]]=[t[c],t[u]],u!==c&&r.push({array:[...t],highlights:[u,c],swapping:!0,pivot:o,partitionBoundary:u,sorted:[],message:`${t[c]} < ${l} — swapped to position ${u}`}));return[t[u+1],t[o]]=[t[o],t[u+1]],r.push({array:[...t],highlights:[u+1],pivot:u+1,sorted:[],message:`Pivot ${l} placed at final position ${u+1}`}),u+1}function n(t,a,o){if(a<o){const l=s(t,a,o);n(t,a,l-1),n(t,l+1,o)}}return n(e,0,e.length-1),r.push({array:[...e],highlights:[],sorted:Array.from({length:e.length},(t,a)=>a),message:"✅ Array is fully sorted!"}),r}function Sr(i,e){const r=[...i].sort((a,o)=>a-o),s=[{array:[...r],highlights:[],left:0,right:r.length-1,message:`Searching for ${e} in sorted array. Search range: [0..${r.length-1}]`,variables:{lo:0,hi:r.length-1,target:e}}];let n=0,t=r.length-1;for(;n<=t;){const a=Math.floor((n+t)/2);if(s.push({array:[...r],highlights:[a],left:n,right:t,mid:a,message:`Mid = ${a}, value = ${r[a]}. Comparing with target ${e}`,variables:{lo:n,hi:t,mid:a,"arr[mid]":r[a],target:e}}),r[a]===e)return s.push({array:[...r],highlights:[a],found:a,left:n,right:t,message:`✅ Found ${e} at index ${a}!`,variables:{lo:n,hi:t,mid:a,found:!0}}),s;r[a]<e?(s.push({array:[...r],highlights:[a],left:a+1,right:t,eliminated:Array.from({length:a-n+1},(o,l)=>n+l),message:`${r[a]} < ${e} — eliminate left half. New range: [${a+1}..${t}]`,variables:{lo:a+1,hi:t,action:"go right"}}),n=a+1):(s.push({array:[...r],highlights:[a],left:n,right:a-1,eliminated:Array.from({length:t-a+1},(o,l)=>a+l),message:`${r[a]} > ${e} — eliminate right half. New range: [${n}..${a-1}]`,variables:{lo:n,hi:a-1,action:"go left"}}),t=a-1)}return s.push({array:[...r],highlights:[],left:n,right:t,message:`❌ ${e} not found in the array.`,variables:{lo:n,hi:t,found:!1}}),s}function $r(i,e){const r=[...i],s=[{array:[...r],highlights:[],checked:[],message:`Searching for ${e} — checking each element from left to right.`,variables:{target:e,i:0,checked:0}}],n=[];for(let t=0;t<r.length;t++){if(n.push(t),r[t]===e)return s.push({array:[...r],highlights:[t],found:t,checked:[...n],message:`✅ Found ${e} at index ${t}!`,variables:{i:t,"arr[i]":r[t],found:!0}}),s;s.push({array:[...r],highlights:[t],checked:[...n],message:`Index ${t}: ${r[t]} ≠ ${e} — moving on`,variables:{i:t,"arr[i]":r[t],match:!1}})}return s.push({array:[...r],highlights:[],checked:[...n],message:`❌ ${e} not found after checking all ${r.length} elements.`,variables:{checked:r.length,found:!1}}),s}function Mr(i,e=0){const{nodes:r,edges:s}=i,n={};r.forEach(u=>{n[u]=[]}),s.forEach(([u,c])=>{n[u].push(c),n[c].push(u)});const t=new Set,a=[e];t.add(e);const o=[],l=[{nodes:r,edges:s,visited:[],queue:[e],current:null,order:[],message:`Starting BFS from node ${e}. Queue: [${e}]`}];for(;a.length>0;){const u=a.shift();o.push(u),l.push({nodes:r,edges:s,visited:[...t],queue:[...a],current:u,order:[...o],message:`Visiting node ${u}. Exploring neighbors: [${n[u].join(", ")}]`});for(const c of n[u].sort((d,h)=>d-h))t.has(c)||(t.add(c),a.push(c),l.push({nodes:r,edges:s,visited:[...t],queue:[...a],current:u,exploring:c,order:[...o],message:`  → Adding node ${c} to queue`}))}return l.push({nodes:r,edges:s,visited:[...t],queue:[],current:null,order:[...o],message:`✅ BFS complete! Traversal order: [${o.join(" → ")}]`}),l}function _r(i,e=0){const{nodes:r,edges:s}=i,n={};r.forEach(u=>{n[u]=[]}),s.forEach(([u,c])=>{n[u].push(c),n[c].push(u)});const t=new Set,a=[],o=[{nodes:r,edges:s,visited:[],stack:[e],current:null,order:[],message:`Starting DFS from node ${e}. Stack: [${e}]`}];function l(u,c=0){t.add(u),a.push(u);const d="  ".repeat(c);o.push({nodes:r,edges:s,visited:[...t],current:u,order:[...a],depth:c,message:`${d}Visiting node ${u} (depth ${c}). Neighbors: [${n[u].join(", ")}]`});for(const h of n[u].sort((f,x)=>f-x))t.has(h)||(o.push({nodes:r,edges:s,visited:[...t],current:u,exploring:h,order:[...a],depth:c,message:`${d}  → Going deeper to node ${h}`}),l(h,c+1),o.push({nodes:r,edges:s,visited:[...t],current:u,order:[...a],depth:c,message:`${d}  ← Backtracking to node ${u}`}))}return l(e),o.push({nodes:r,edges:s,visited:[...t],current:null,order:[...a],message:`✅ DFS complete! Traversal order: [${a.join(" → ")}]`}),o}function Ar(i,e){const r=[...i].sort((a,o)=>a-o),s=[{array:[...r],highlights:[],left:0,right:r.length-1,message:`Two Pointers: find pair summing to ${e} in sorted array`}];let n=0,t=r.length-1;for(;n<t;){const a=r[n]+r[t];if(s.push({array:[...r],highlights:[n,t],left:n,right:t,message:`Sum = ${r[n]} + ${r[t]} = ${a}, target = ${e}`}),a===e)return s.push({array:[...r],highlights:[n,t],found:!0,left:n,right:t,message:`✅ Found pair! ${r[n]} + ${r[t]} = ${e}`}),s;a<e?(s.push({array:[...r],highlights:[n],left:n+1,right:t,message:`Too small (${a} < ${e}) — move left pointer right`}),n++):(s.push({array:[...r],highlights:[t],left:n,right:t-1,message:`Too large (${a} > ${e}) — move right pointer left`}),t--)}return s.push({array:[...r],highlights:[],message:`❌ No pair found summing to ${e}`}),s}function Ir(i,e){const r=[...i],s=[{array:[...r],highlights:[],windowStart:0,windowEnd:e-1,message:`Sliding Window: find max sum subarray of size ${e}`}];let n=0;for(let o=0;o<e;o++)n+=r[o],s.push({array:[...r],highlights:Array.from({length:o+1},(l,u)=>u),windowStart:0,windowEnd:o,windowSum:n,message:`Building initial window: adding ${r[o]}, sum = ${n}`});let t=n,a=0;for(let o=e;o<r.length;o++){const l=r[o-e];n+=r[o]-l;const u=o-e+1,c=Array.from({length:e},(h,f)=>u+f),d=n>t;d&&(t=n,a=u),s.push({array:[...r],highlights:c,windowStart:u,windowEnd:o,windowSum:n,maxSum:t,removing:o-e,adding:o,message:`Slide: remove ${l}, add ${r[o]}. Sum = ${n}${d?" • New max!":""}`})}return s.push({array:[...r],highlights:Array.from({length:e},(o,l)=>a+l),windowSum:t,maxSum:t,message:`✅ Max sum subarray = ${t} at indices [${a}..${a+e-1}]`}),s}function qr(i){const e=[...i].sort((n,t)=>n[0]-t[0]),r=[{intervals:e.map(n=>({val:n,state:"default"})),merged:[],message:`Merge Intervals: ${e.length} intervals sorted by start time`}],s=[e[0]];r.push({intervals:e.map((n,t)=>({val:n,state:t===0?"current":"default"})),merged:[[...e[0]]],message:`Start with interval [${e[0]}]`});for(let n=1;n<e.length;n++){const t=s[s.length-1],a=e[n];r.push({intervals:e.map((o,l)=>({val:o,state:l===n?"comparing":l<n?"processed":"default"})),merged:s.map(o=>[...o]),message:`Comparing [${a}] with last merged [${t}]`}),a[0]<=t[1]?(t[1]=Math.max(t[1],a[1]),r.push({intervals:e.map((o,l)=>({val:o,state:l<=n?"processed":"default"})),merged:s.map(o=>[...o]),message:`Overlap! Extend to [${t[0]}, ${t[1]}]`})):(s.push([...a]),r.push({intervals:e.map((o,l)=>({val:o,state:l<=n?"processed":"default"})),merged:s.map(o=>[...o]),message:`No overlap. Add new interval [${a}]`}))}return r.push({intervals:e.map(n=>({val:n,state:"processed"})),merged:s.map(n=>[...n]),message:`✅ Result: ${s.map(n=>"["+n+"]").join(", ")}`}),r}function zr(i){const e=[...i];let r=e[0],s=e[0];const n=[{array:[...e],highlights:[0],maxSoFar:r,maxEndingHere:s,subarrayStart:0,subarrayEnd:0,message:`Start: maxEndingHere = ${e[0]}, maxSoFar = ${e[0]}`}];let t=0,a=0,o=0;for(let l=1;l<e.length;l++)e[l]>s+e[l]?(s=e[l],o=l,n.push({array:[...e],highlights:[l],maxSoFar:r,maxEndingHere:s,subarrayStart:o,subarrayEnd:l,message:`Start new subarray at ${e[l]} (better than extending ${s-e[l]} + ${e[l]})`})):(s+=e[l],n.push({array:[...e],highlights:Array.from({length:l-o+1},(u,c)=>o+c),maxSoFar:r,maxEndingHere:s,subarrayStart:o,subarrayEnd:l,message:`Extend subarray: ${s-e[l]} + ${e[l]} = ${s}`})),s>r&&(r=s,t=o,a=l,n.push({array:[...e],highlights:Array.from({length:a-t+1},(u,c)=>t+c),maxSoFar:r,maxEndingHere:s,subarrayStart:t,subarrayEnd:a,message:`New global max = ${r}!`}));return n.push({array:[...e],highlights:Array.from({length:a-t+1},(l,u)=>t+u),maxSoFar:r,maxEndingHere:s,subarrayStart:t,subarrayEnd:a,sorted:Array.from({length:a-t+1},(l,u)=>t+u),message:`✅ Max subarray sum = ${r}, subarray = [${e.slice(t,a+1)}]`}),n}function Lr(i){const e=[...i],r=[0],s=[{array:[...e],prefix:[0],highlights:[],message:"Prefix Sum: build cumulative sum array. prefix[0] = 0"}];for(let o=0;o<e.length;o++)r.push(r[o]+e[o]),s.push({array:[...e],prefix:[...r],highlights:[o],message:`prefix[${o+1}] = prefix[${o}] + arr[${o}] = ${r[o]} + ${e[o]} = ${r[o+1]}`});const n=1,t=4,a=r[t+1]-r[n];return s.push({array:[...e],prefix:[...r],highlights:Array.from({length:t-n+1},(o,l)=>n+l),message:`Range query [${n}..${t}]: prefix[${t+1}] - prefix[${n}] = ${r[t+1]} - ${r[n]} = ${a}`}),s.push({array:[...e],prefix:[...r],highlights:[],sorted:Array.from({length:e.length},(o,l)=>l),message:`✅ Complete! Prefix array: [${r.join(", ")}]`}),s}function Nr(i){const e=[...i],r=new Array(e.length).fill(-1),s=[],n=[{array:[...e],result:[...r],stack:[],highlights:[],message:"Monotonic Stack: find next greater element for each position"}];for(let t=0;t<e.length;t++){for(;s.length>0&&e[t]>e[s[s.length-1]];){const a=s.pop();r[a]=e[t],n.push({array:[...e],result:[...r],stack:[...s],highlights:[a,t],message:`Pop index ${a}: next greater of ${e[a]} is ${e[t]}. Found!`})}s.push(t),n.push({array:[...e],result:[...r],stack:[...s],highlights:[t],message:`Push index ${t} (value ${e[t]}) onto stack. Stack: [${s.map(a=>e[a]).join(", ")}]`})}return n.push({array:[...e],result:[...r],stack:[...s],highlights:[],sorted:Array.from({length:e.length},(t,a)=>a),message:`✅ Result: [${r.join(", ")}]. Remaining in stack have no next greater.`}),n}function Or(i){const e=[0,1,2],r=[{array:[...e],highlights:[],dpTable:[...e],message:"Climbing Stairs: dp[1] = 1, dp[2] = 2 (base cases)"}];for(let s=3;s<=i;s++)e[s]=e[s-1]+e[s-2],r.push({array:e.slice(1),highlights:[s-1],dpTable:[...e],dpCurrent:s,message:`dp[${s}] = dp[${s-1}] + dp[${s-2}] = ${e[s-1]} + ${e[s-2]} = ${e[s]}`});return r.push({array:e.slice(1),highlights:[i-1],dpTable:[...e],sorted:[i-1],message:`✅ Ways to climb ${i} stairs = ${e[i]}`}),r}function Pr(i){const{weights:e,values:r,capacity:s}=i,n=e.length,t=Array(n+1).fill(null).map(()=>Array(s+1).fill(0)),a=[{dpTable:t.map(o=>[...o]),weights:e,values:r,capacity:s,message:`0/1 Knapsack: ${n} items, capacity ${s}`}];for(let o=1;o<=n;o++)for(let l=0;l<=s;l++)if(t[o][l]=t[o-1][l],e[o-1]<=l){const u=t[o-1][l-e[o-1]]+r[o-1];u>t[o][l]?(t[o][l]=u,a.push({dpTable:t.map(c=>[...c]),weights:e,values:r,capacity:s,currentItem:o,currentWeight:l,action:"include",message:`Item ${o} (w=${e[o-1]}, v=${r[o-1]}): Include! dp[${o}][${l}] = ${t[o][l]}`})):a.push({dpTable:t.map(c=>[...c]),weights:e,values:r,capacity:s,currentItem:o,currentWeight:l,action:"skip",message:`Item ${o} at w=${l}: Skip (${t[o-1][l]} >= ${u})`})}return a.push({dpTable:t.map(o=>[...o]),weights:e,values:r,capacity:s,message:`✅ Max value = ${t[n][s]}`}),a}function Tr(i){const e=[...i],r=[],s=[{array:[...e],result:[],current:[],highlights:[],message:`Backtracking: generate all subsets of [${e.join(", ")}]`}];function n(t,a){r.push([...a]),s.push({array:[...e],result:r.map(o=>[...o]),current:[...a],highlights:a.map(o=>e.indexOf(o)),message:`Record subset: [${a.join(", ")}]`});for(let o=t;o<e.length;o++)a.push(e[o]),s.push({array:[...e],result:r.map(l=>[...l]),current:[...a],highlights:[o],message:`Choose ${e[o]}`}),n(o+1,a),a.pop(),s.push({array:[...e],result:r.map(l=>[...l]),current:[...a],highlights:[],message:`Un-choose ${e[o]} (backtrack)`})}return n(0,[]),s.push({array:[...e],result:r.map(t=>[...t]),current:[],highlights:[],message:`✅ All ${r.length} subsets generated!`}),s}function Cr(i){const e=i.map((t,a)=>({start:t[0],end:t[1],id:a})).sort((t,a)=>t.end-a.end),r=[{intervals:e,selected:[],message:`Activity Selection: ${e.length} activities sorted by end time`}],s=[e[0]];let n=e[0].end;r.push({intervals:e,selected:[0],current:0,message:`Select activity [${e[0].start}, ${e[0].end}] (first by end time)`});for(let t=1;t<e.length;t++){const a=e[t];a.start>=n?(s.push(a),n=a.end,r.push({intervals:e,selected:s.map((o,l)=>e.findIndex(u=>u===s[l])),current:t,message:`Select [${a.start}, ${a.end}] — starts at ${a.start} >= last end ${n-(a.end-n>0,0)}`})):r.push({intervals:e,selected:s.map((o,l)=>e.findIndex(u=>u===s[l])),current:t,skipped:!0,message:`Skip [${a.start}, ${a.end}] — overlaps with last selected`})}return r.push({intervals:e,selected:s.map((t,a)=>e.findIndex(o=>o===s[a])),message:`✅ Max non-overlapping: ${s.length} activities`}),r}function Er(i){const{nodes:e,unions:r}=i,s=[...e],n=new Array(e.length).fill(0),t=[{nodes:e,parent:[...s],rank:[...n],sets:e.map(o=>[o]),message:`Union-Find: ${e.length} nodes, each in its own set`}];function a(o){return s[o]===o?o:s[o]=a(s[o])}for(const[o,l]of r){const u=a(o),c=a(l);if(t.push({nodes:e,parent:[...s],rank:[...n],highlights:[o,l],message:`Union(${o}, ${l}): Find(${o})=${u}, Find(${l})=${c}`}),u===c){t.push({nodes:e,parent:[...s],rank:[...n],highlights:[o,l],message:"Already in same set! Skip."});continue}n[u]<n[c]?s[u]=c:n[u]>n[c]?s[c]=u:(s[c]=u,n[u]++),t.push({nodes:e,parent:[...s],rank:[...n],highlights:[o,l],message:`Union complete: parent[${n[u]>=n[c]?c:u}] = ${n[u]>=n[c]?u:c}`})}return t.push({nodes:e,parent:[...s],rank:[...n],message:"✅ Union-Find complete! Components connected."}),t}function Rr(i){const{nodes:e,edges:r}=i,s=e.length,n={},t={};e.forEach(u=>{n[u]=[],t[u]=0}),r.forEach(([u,c])=>{n[u].push(c),t[c]++});const a=[{nodes:e,edges:r,inDegree:{...t},queue:[],order:[],visited:[],message:`Topological Sort: computing in-degrees for ${s} nodes`}],o=e.filter(u=>t[u]===0);a.push({nodes:e,edges:r,inDegree:{...t},queue:[...o],order:[],visited:[],message:`Nodes with in-degree 0: [${o.join(", ")}]. Add to queue.`});const l=[];for(;o.length>0;){const u=o.shift();l.push(u),a.push({nodes:e,edges:r,inDegree:{...t},queue:[...o],order:[...l],visited:[...l],current:u,message:`Process node ${u}. Order so far: [${l.join(" → ")}]`});for(const c of n[u])t[c]--,t[c]===0&&(o.push(c),a.push({nodes:e,edges:r,inDegree:{...t},queue:[...o],order:[...l],visited:[...l],current:u,exploring:c,message:`Decrement in-degree of ${c} to ${t[c]}. Enqueue!`}))}return a.push({nodes:e,edges:r,inDegree:{...t},queue:[],order:[...l],visited:[...l],message:`✅ Topological order: [${l.join(" → ")}]`}),a}function Fr(i){const e=i[0];let r=e;const s=e.toString(2),n=[{number:e,binary:s,highlights:[],count:0,message:`Count set bits of ${e} (binary: ${s})`}];let t=0,a=0,o=r;for(;o>0;){const l=o&1;l===1&&t++,n.push({number:e,binary:s,currentBit:a,bitValue:l,count:t,remaining:o.toString(2),message:`Bit ${a}: ${l}${l===1?" (set! count="+t+")":""} | Remaining: ${o.toString(2)}`}),o>>=1,a++}return n.push({number:e,binary:s,count:t,message:`✅ ${e} has ${t} set bits. Binary: ${s}`}),n}function Dr(i,e,r={}){switch(i){case"bubble-sort":return vr(e);case"selection-sort":return wr(e);case"insertion-sort":return jr(e);case"merge-sort":return br(e);case"quick-sort":return kr(e);case"binary-search":return Sr(e,r.target??23);case"linear-search":return $r(e,r.target??22);case"bfs":return Mr(e,r.start??0);case"dfs":return _r(e,r.start??0);case"two-pointers":return Ar(e,r.target??16);case"sliding-window":return Ir(e,r.windowSize??3);case"merge-intervals":return qr(e);case"kadane":return zr(e);case"prefix-sum":return Lr(e);case"monotonic-stack":return Nr(e);case"dp-fibonacci":return Or(r.dpN??8);case"dp-knapsack":return Pr(e);case"backtracking":return Tr(e);case"greedy":return Cr(e);case"union-find":return Er(e);case"topological-sort":return Rr(e);case"bit-manipulation":return Fr(e);case"move-zeroes":return pe(e);case"rotate-array":return ye(e,r.rotateK??3);case"remove-duplicates":return xe(e);case"buy-sell-stock":return ve(e);case"product-except-self":return we(e);case"contains-duplicate":return je(e);case"majority-element":return be(e);case"increasing-triplet":return ke(e);case"first-missing-positive":return Se(e);case"valid-palindrome":return $e(e);case"is-subsequence":return Me(e);case"reverse-words":return _e(e);case"longest-common-prefix":return Ae(e);case"ransom-note":return Le(e);case"group-anagrams":return Ie(e);case"longest-consecutive":return qe(e);case"contains-duplicate-ii":return ze(e);case"isomorphic-strings":return Ne(e);case"good-pairs":return Oe(e);case"3sum":return Pe(e);case"container-water":return Te(e);case"trapping-rain-water":return Ce(e);case"merge-sorted-array":return Ee(e);case"subarray-sum-k":return Re(e,r.k??7);case"contiguous-array":return Fe(e);case"longest-substring":return De(e);case"permutation-in-string":return Be(e);case"max-consecutive-ones":return We(e,r.k??2);case"max-product-subarray":return He(e);case"valid-parentheses":return Ge(e);case"daily-temperatures":return Ue(e);case"eval-rpn":return Ve(e);case"largest-rectangle":return Xe(e);case"sliding-window-max":return Ke(e,r.windowSize??3);case"search-insert":return Ze(e,r.target??5);case"search-rotated":return Je(e,r.target??0);case"find-peak":return Qe(e);case"find-min-rotated":return Ye(e);case"spiral-matrix":return er(e);case"rotate-image":return tr(e);case"set-matrix-zeroes":return rr(e);case"permutations":return ir(e);case"jump-game-ii":return nr(e);case"gas-station":return sr(e);case"dp-lis":return ar(e);case"dp-house-robber":return or(e);case"dp-coin-change":return lr(e);case"dp-lcs":return ur(e);case"dp-edit-distance":return cr(e);case"dp-unique-paths":return mr(e);case"dp-min-path-sum":return dr(e);case"number-of-islands":return gr(e);case"rotting-oranges":return hr(e);case"heap-sort":return fr(e);case"counting-sort":return pr(e);case"radix-sort":return yr(e);case"sort-colors":return xr(e);default:return[]}}const Br={"bubble-sort":{code:`function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap adjacent elements
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
      }
    }
    // Pass complete: largest bubbled up
  }
  return arr; // Sorted!
}`,stepToLine:i=>{var e,r;return i?i.swapping?7:i.comparing?5:(e=i.message)!=null&&e.includes("Pass")?10:(r=i.message)!=null&&r.includes("fully sorted")?12:3:-1}},"selection-sort":{code:`function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j; // New minimum found
      }
    }
    // Swap minimum to position i
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr; // Sorted!
}`,stepToLine:i=>{var e,r;return i?i.swapping?11:(e=i.message)!=null&&e.includes("New minimum")?7:i.comparing?6:(r=i.message)!=null&&r.includes("fully sorted")?13:4:-1}},"insertion-sort":{code:`function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j]; // Shift right
      j--;
    }
    arr[j + 1] = key; // Insert at correct position
  }
  return arr; // Sorted!
}`,stepToLine:i=>{var e,r,s;return i?i.comparing?6:(e=i.message)!=null&&e.includes("Inserted")?9:(r=i.message)!=null&&r.includes("Picking")?3:(s=i.message)!=null&&s.includes("fully sorted")?11:2:-1}},"merge-sort":{code:`function mergeSort(arr, l, r) {
  if (l < r) {
    const mid = Math.floor((l + r) / 2);
    mergeSort(arr, l, mid);     // Sort left
    mergeSort(arr, mid + 1, r); // Sort right
    merge(arr, l, mid, r);      // Merge halves
  }
}
function merge(arr, l, m, r) {
  let left = arr.slice(l, m + 1);
  let right = arr.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) arr[k++] = left[i++];
    else arr[k++] = right[j++];
  }
  // Copy remaining elements
  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Dividing")?3:(r=i.message)!=null&&r.includes("Merging")?10:(s=i.message)!=null&&s.includes("Merged result")?14:(n=i.message)!=null&&n.includes("fully sorted")?6:1:-1}},"quick-sort":{code:`function quickSort(arr, lo, hi) {
  if (lo < hi) {
    let pi = partition(arr, lo, hi);
    quickSort(arr, lo, pi - 1);
    quickSort(arr, pi + 1, hi);
  }
}
function partition(arr, lo, hi) {
  let pivot = arr[hi]; // Choose last as pivot
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap
    }
  }
  [arr[i+1], arr[hi]] = [arr[hi], arr[i+1]];
  return i + 1; // Pivot's final position
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("Pivot selected")?9:i.swapping?14:i.comparing?12:(r=i.message)!=null&&r.includes("placed at final")?17:(s=i.message)!=null&&s.includes("fully sorted")?3:1:-1}},"binary-search":{code:`function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) {
      return mid; // Found!
    } else if (arr[mid] < target) {
      lo = mid + 1; // Search right half
    } else {
      hi = mid - 1; // Search left half
    }
  }
  return -1; // Not found
}`,stepToLine:i=>{var e,r,s,n;return i?i.found!==void 0?6:(e=i.message)!=null&&e.includes("eliminate left")?8:(r=i.message)!=null&&r.includes("eliminate right")?10:(s=i.message)!=null&&s.includes("Mid =")?4:(n=i.message)!=null&&n.includes("not found")?13:2:-1}},"linear-search":{code:`function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // Found!
    }
    // Not a match, continue
  }
  return -1; // Not found
}`,stepToLine:i=>{var e,r;return i?i.found!==void 0?4:(e=i.message)!=null&&e.includes("moving on")?6:(r=i.message)!=null&&r.includes("not found")?8:2:-1}},bfs:{code:`function bfs(graph, start) {
  let visited = new Set();
  let queue = [start];
  visited.add(start);
  while (queue.length > 0) {
    let node = queue.shift(); // Dequeue
    process(node);
    for (let neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor); // Enqueue
      }
    }
  }
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("Adding node")?11:i.exploring!==void 0?9:(r=i.message)!=null&&r.includes("Visiting")?6:(s=i.message)!=null&&s.includes("complete")?7:3:-1}},dfs:{code:`function dfs(graph, node, visited) {
  visited.add(node);
  process(node);
  for (let neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited); // Go deeper
    }
  }
  // Backtrack
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Going deeper")?6:(r=i.message)!=null&&r.includes("Backtracking")?9:(s=i.message)!=null&&s.includes("Visiting")?3:(n=i.message)!=null&&n.includes("complete")?2:1:-1}},"two-pointers":{code:`function twoSum(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    let sum = arr[left] + arr[right];
    if (sum === target) {
      return [left, right]; // Found pair!
    } else if (sum < target) {
      left++;  // Need larger sum
    } else {
      right--; // Need smaller sum
    }
  }
  return [-1, -1]; // No pair found
}`,stepToLine:i=>{var e,r,s,n;return i?i.found?6:(e=i.message)!=null&&e.includes("Too small")?8:(r=i.message)!=null&&r.includes("Too large")?10:(s=i.message)!=null&&s.includes("Sum =")?4:(n=i.message)!=null&&n.includes("No pair")?13:2:-1}},"sliding-window":{code:`function maxSumSubarray(arr, k) {
  let windowSum = 0;
  // Build first window
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  let maxSum = windowSum;
  // Slide the window
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Building")?4:(r=i.message)!=null&&r.includes("Sliding")?10:(s=i.message)!=null&&s.includes("New max")?11:(n=i.message)!=null&&n.includes("Result")?13:2:-1}},"merge-intervals":{code:`function mergeIntervals(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  let merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    let last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) {
      // Overlapping: extend end
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      // No overlap: add new interval
      merged.push(intervals[i]);
    }
  }
  return merged;
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Overlap")?8:(r=i.message)!=null&&r.includes("No overlap")?11:(s=i.message)!=null&&s.includes("Comparing")?6:(n=i.message)!=null&&n.includes("Result")?14:2:-1}},kadane:{code:`function maxSubarraySum(arr) {
  let maxSoFar = arr[0];
  let maxEndingHere = arr[0];
  for (let i = 1; i < arr.length; i++) {
    // Extend current or start new
    maxEndingHere = Math.max(
      arr[i], maxEndingHere + arr[i]
    );
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }
  return maxSoFar;
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Extend")?6:(r=i.message)!=null&&r.includes("Start new")?7:(s=i.message)!=null&&s.includes("New global")?9:(n=i.message)!=null&&n.includes("Result")?11:4:-1}},"prefix-sum":{code:`function buildPrefixSum(arr) {
  let prefix = [0];
  for (let i = 0; i < arr.length; i++) {
    prefix.push(prefix[i] + arr[i]);
  }
  return prefix;
}
// Range sum query: sum(l, r)
function rangeSum(prefix, l, r) {
  return prefix[r + 1] - prefix[l];
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("prefix[")?4:(r=i.message)!=null&&r.includes("Range query")?10:(s=i.message)!=null&&s.includes("Complete")?6:3:-1}},"monotonic-stack":{code:`function nextGreaterElement(arr) {
  let result = new Array(arr.length).fill(-1);
  let stack = []; // Monotonic decreasing
  for (let i = 0; i < arr.length; i++) {
    while (stack.length && arr[i] > arr[stack.at(-1)]) {
      let idx = stack.pop();
      result[idx] = arr[i]; // Found next greater
    }
    stack.push(i);
  }
  return result;
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Found next greater")?7:(r=i.message)!=null&&r.includes("Pop")?6:(s=i.message)!=null&&s.includes("Push")?9:(n=i.message)!=null&&n.includes("Complete")?11:5:-1}},"dp-fibonacci":{code:`function climbStairs(n) {
  if (n <= 2) return n;
  let dp = [0, 1, 2];
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
    // Ways to reach step i
  }
  return dp[n];
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("dp[")?5:(r=i.message)!=null&&r.includes("Base")?3:(s=i.message)!=null&&s.includes("Result")?8:4:-1}},"dp-knapsack":{code:`function knapsack(weights, values, W) {
  let n = weights.length;
  let dp = Array(n+1).fill(null)
    .map(() => Array(W+1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i-1][w]; // Skip item
      if (weights[i-1] <= w) {
        dp[i][w] = Math.max(
          dp[i][w],
          dp[i-1][w-weights[i-1]] + values[i-1]
        ); // Include item
      }
    }
  }
  return dp[n][W];
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("Include")?9:(r=i.message)!=null&&r.includes("Skip")?7:(s=i.message)!=null&&s.includes("Result")?17:6:-1}},backtracking:{code:`function generateSubsets(nums) {
  let result = [];
  function backtrack(start, current) {
    result.push([...current]);
    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]); // Choose
      backtrack(i + 1, current); // Explore
      current.pop();          // Un-choose
    }
  }
  backtrack(0, []);
  return result;
}`,stepToLine:i=>{var e,r,s,n,t,a;return i?(e=i.message)!=null&&e.includes("Choose")?6:(r=i.message)!=null&&r.includes("Explore")?7:(s=i.message)!=null&&s.includes("Un-choose")||(n=i.message)!=null&&n.includes("Backtrack")?8:(t=i.message)!=null&&t.includes("Record")?4:(a=i.message)!=null&&a.includes("Complete")?12:3:-1}},greedy:{code:`function activitySelection(start, end) {
  // Sort by end time
  let activities = start.map((s, i) => [s, end[i]])
    .sort((a, b) => a[1] - b[1]);
  let selected = [activities[0]];
  let lastEnd = activities[0][1];
  for (let i = 1; i < activities.length; i++) {
    if (activities[i][0] >= lastEnd) {
      selected.push(activities[i]);
      lastEnd = activities[i][1];
    }
  }
  return selected;
}`,stepToLine:i=>{var e,r,s,n,t;return i?(e=i.message)!=null&&e.includes("Select")?9:(r=i.message)!=null&&r.includes("Skip")||(s=i.message)!=null&&s.includes("Overlap")?8:(n=i.message)!=null&&n.includes("Sort")?3:(t=i.message)!=null&&t.includes("Result")?13:7:-1}},"union-find":{code:`class UnionFind {
  constructor(n) {
    this.parent = Array.from({length: n}, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  find(x) {
    if (this.parent[x] !== x)
      this.parent[x] = this.find(this.parent[x]);
    return this.parent[x]; // Path compression
  }
  union(x, y) {
    let px = this.find(x), py = this.find(y);
    if (px === py) return false;
    if (this.rank[px] < this.rank[py])
      [px, py] = [py, px]; // Union by rank
    this.parent[py] = px;
    if (this.rank[px] === this.rank[py])
      this.rank[px]++;
    return true;
  }
}`,stepToLine:i=>{var e,r,s,n,t;return i?(e=i.message)!=null&&e.includes("Find")?7:(r=i.message)!=null&&r.includes("Path compression")?8:(s=i.message)!=null&&s.includes("Union")?16:(n=i.message)!=null&&n.includes("Same set")?13:(t=i.message)!=null&&t.includes("Init")?3:11:-1}},"topological-sort":{code:`function topologicalSort(graph, n) {
  let inDegree = new Array(n).fill(0);
  for (let u = 0; u < n; u++)
    for (let v of graph[u]) inDegree[v]++;
  let queue = [];
  for (let i = 0; i < n; i++)
    if (inDegree[i] === 0) queue.push(i);
  let order = [];
  while (queue.length > 0) {
    let node = queue.shift();
    order.push(node);
    for (let neighbor of graph[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0)
        queue.push(neighbor);
    }
  }
  return order;
}`,stepToLine:i=>{var e,r,s,n,t;return i?(e=i.message)!=null&&e.includes("Enqueue")?15:(r=i.message)!=null&&r.includes("Decrement")?13:(s=i.message)!=null&&s.includes("Process")?10:(n=i.message)!=null&&n.includes("In-degree 0")?7:(t=i.message)!=null&&t.includes("Complete")?18:4:-1}},"bit-manipulation":{code:`function countSetBits(n) {
  let count = 0;
  while (n > 0) {
    count += n & 1;  // Check last bit
    n >>= 1;         // Shift right
  }
  return count;
}
// Single Number (XOR trick)
function singleNumber(nums) {
  let result = 0;
  for (let num of nums) {
    result ^= num; // XOR cancels pairs
  }
  return result;
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Bit is 1")?4:(r=i.message)!=null&&r.includes("Shift")?5:(s=i.message)!=null&&s.includes("XOR")?14:(n=i.message)!=null&&n.includes("Result")?7:3:-1}}},Wr={"bubble-sort":{javascript:`function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap adjacent elements
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
      }
    }
    // Pass complete: largest bubbled up
  }
  return arr; // Sorted!
}`,python:`def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                # Swap adjacent elements
                arr[j], arr[j+1] = arr[j+1], arr[j]

        # Pass complete: largest bubbled up

    return arr  # Sorted!`,java:`void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap adjacent elements
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
        // Pass complete: largest bubbled up
    }
    // Sorted!
}`,cpp:`void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                // Swap adjacent elements
                swap(arr[j], arr[j+1]);
            }
        }
        // Pass complete: largest bubbled up
    }
    // Sorted!
}`,stepToLine:i=>{var e,r;return i?i.swapping?7:i.comparing?5:(e=i.message)!=null&&e.includes("Pass")?10:(r=i.message)!=null&&r.includes("fully sorted")?12:3:-1}},"selection-sort":{javascript:`function selectionSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j; // New minimum found
      }
    }
    // Swap minimum to position i
    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
  }
  return arr; // Sorted!
}`,python:`def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j  # New minimum found

        # Swap minimum to position i
        arr[i], arr[min_idx] = arr[min_idx], arr[i]

    return arr  # Sorted!`,java:`void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j; // New minimum found
            }
        }
        // Swap minimum to position i
        int temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
}`,cpp:`void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j; // New minimum found
            }
        }
        // Swap minimum to position i
        swap(arr[i], arr[minIdx]);
    }
}`,stepToLine:i=>{var e,r;return i?i.swapping?11:(e=i.message)!=null&&e.includes("New minimum")?7:i.comparing?6:(r=i.message)!=null&&r.includes("fully sorted")?13:4:-1}},"insertion-sort":{javascript:`function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j]; // Shift right
      j--;
    }
    arr[j + 1] = key; // Insert
  }
  return arr; // Sorted!
}`,python:`def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]  # Shift right
            j -= 1
        arr[j + 1] = key  # Insert

    return arr  # Sorted!`,java:`void insertionSort(int[] arr) {
    for (int i = 1; i < arr.length; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j]; // Shift right
            j--;
        }
        arr[j + 1] = key; // Insert
    }
}`,cpp:`void insertionSort(vector<int>& arr) {
    for (int i = 1; i < arr.size(); i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j]; // Shift right
            j--;
        }
        arr[j + 1] = key; // Insert
    }
}`,stepToLine:i=>{var e,r,s;return i?i.comparing?6:(e=i.message)!=null&&e.includes("Inserted")?9:(r=i.message)!=null&&r.includes("Picking")?3:(s=i.message)!=null&&s.includes("fully sorted")?11:2:-1}},"merge-sort":{javascript:`function mergeSort(arr, l, r) {
  if (l < r) {
    const mid = Math.floor((l + r) / 2);
    mergeSort(arr, l, mid);     // Sort left
    mergeSort(arr, mid + 1, r); // Sort right
    merge(arr, l, mid, r);      // Merge halves
  }
}
function merge(arr, l, m, r) {
  let left = arr.slice(l, m + 1);
  let right = arr.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) arr[k++] = left[i++];
    else arr[k++] = right[j++];
  }
  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
}`,python:`def merge_sort(arr, l, r):
    if l < r:
        mid = (l + r) // 2
        merge_sort(arr, l, mid)      # Sort left
        merge_sort(arr, mid + 1, r)  # Sort right
        merge(arr, l, mid, r)        # Merge halves

def merge(arr, l, m, r):
    left = arr[l:m+1]
    right = arr[m+1:r+1]
    i = j = 0; k = l
    while i < len(left) and j < len(right):
        if left[i] <= right[j]: arr[k] = left[i]; i += 1
        else: arr[k] = right[j]; j += 1
        k += 1
    while i < len(left): arr[k] = left[i]; i += 1; k += 1
    while j < len(right): arr[k] = right[j]; j += 1; k += 1`,java:`void mergeSort(int[] arr, int l, int r) {
    if (l < r) {
        int mid = (l + r) / 2;
        mergeSort(arr, l, mid);      // Sort left
        mergeSort(arr, mid + 1, r);  // Sort right
        merge(arr, l, mid, r);       // Merge halves
    }
}
void merge(int[] arr, int l, int m, int r) {
    int[] left = Arrays.copyOfRange(arr, l, m + 1);
    int[] right = Arrays.copyOfRange(arr, m + 1, r + 1);
    int i = 0, j = 0, k = l;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) arr[k++] = left[i++];
        else arr[k++] = right[j++];
    }
    while (i < left.length) arr[k++] = left[i++];
    while (j < right.length) arr[k++] = right[j++];
}`,cpp:`void mergeSort(vector<int>& arr, int l, int r) {
    if (l < r) {
        int mid = (l + r) / 2;
        mergeSort(arr, l, mid);      // Sort left
        mergeSort(arr, mid + 1, r);  // Sort right
        merge(arr, l, mid, r);       // Merge halves
    }
}
void merge(vector<int>& arr, int l, int m, int r) {
    vector<int> left(arr.begin()+l, arr.begin()+m+1);
    vector<int> right(arr.begin()+m+1, arr.begin()+r+1);
    int i = 0, j = 0, k = l;
    while (i < left.size() && j < right.size()) {
        if (left[i] <= right[j]) arr[k++] = left[i++];
        else arr[k++] = right[j++];
    }
    while (i < left.size()) arr[k++] = left[i++];
    while (j < right.size()) arr[k++] = right[j++];
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Dividing")?3:(r=i.message)!=null&&r.includes("Merging")?10:(s=i.message)!=null&&s.includes("Merged result")?14:(n=i.message)!=null&&n.includes("fully sorted")?6:1:-1}},"quick-sort":{javascript:`function quickSort(arr, lo, hi) {
  if (lo < hi) {
    let pi = partition(arr, lo, hi);
    quickSort(arr, lo, pi - 1);
    quickSort(arr, pi + 1, hi);
  }
}
function partition(arr, lo, hi) {
  let pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i+1], arr[hi]] = [arr[hi], arr[i+1]];
  return i + 1;
}`,python:`def quick_sort(arr, lo, hi):
    if lo < hi:
        pi = partition(arr, lo, hi)
        quick_sort(arr, lo, pi - 1)
        quick_sort(arr, pi + 1, hi)

def partition(arr, lo, hi):
    pivot = arr[hi]
    i = lo - 1
    for j in range(lo, hi):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]

    arr[i+1], arr[hi] = arr[hi], arr[i+1]
    return i + 1`,java:`void quickSort(int[] arr, int lo, int hi) {
    if (lo < hi) {
        int pi = partition(arr, lo, hi);
        quickSort(arr, lo, pi - 1);
        quickSort(arr, pi + 1, hi);
    }
}
int partition(int[] arr, int lo, int hi) {
    int pivot = arr[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i+1];
    arr[i+1] = arr[hi];
    arr[hi] = temp;
    return i + 1;
}`,cpp:`void quickSort(vector<int>& arr, int lo, int hi) {
    if (lo < hi) {
        int pi = partition(arr, lo, hi);
        quickSort(arr, lo, pi - 1);
        quickSort(arr, pi + 1, hi);
    }
}
int partition(vector<int>& arr, int lo, int hi) {
    int pivot = arr[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i+1], arr[hi]);
    return i + 1;
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("Pivot selected")?9:i.swapping?14:i.comparing?12:(r=i.message)!=null&&r.includes("placed at final")?17:(s=i.message)!=null&&s.includes("fully sorted")?3:1:-1}},"binary-search":{javascript:`function binarySearch(arr, target) {
  let lo = 0, hi = arr.length - 1;
  while (lo <= hi) {
    let mid = Math.floor((lo + hi) / 2);
    if (arr[mid] === target) {
      return mid; // Found!
    } else if (arr[mid] < target) {
      lo = mid + 1; // Search right
    } else {
      hi = mid - 1; // Search left
    }
  }
  return -1; // Not found
}`,python:`def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if arr[mid] == target:
            return mid  # Found!
        elif arr[mid] < target:
            lo = mid + 1  # Search right
        else:
            hi = mid - 1  # Search left

    return -1  # Not found`,java:`int binarySearch(int[] arr, int target) {
    int lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (arr[mid] == target) {
            return mid; // Found!
        } else if (arr[mid] < target) {
            lo = mid + 1; // Search right
        } else {
            hi = mid - 1; // Search left
        }
    }
    return -1; // Not found
}`,cpp:`int binarySearch(vector<int>& arr, int target) {
    int lo = 0, hi = arr.size() - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (arr[mid] == target) {
            return mid; // Found!
        } else if (arr[mid] < target) {
            lo = mid + 1; // Search right
        } else {
            hi = mid - 1; // Search left
        }
    }
    return -1; // Not found
}`,stepToLine:i=>{var e,r,s,n;return i?i.found!==void 0?6:(e=i.message)!=null&&e.includes("eliminate left")?8:(r=i.message)!=null&&r.includes("eliminate right")?10:(s=i.message)!=null&&s.includes("Mid =")?4:(n=i.message)!=null&&n.includes("not found")?13:2:-1}},"linear-search":{javascript:`function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // Found!
    }
    // Not a match, continue
  }
  return -1; // Not found
}`,python:`def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i  # Found!
        # Not a match, continue

    return -1  # Not found`,java:`int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) {
            return i; // Found!
        }
        // Not a match, continue
    }
    return -1; // Not found
}`,cpp:`int linearSearch(vector<int>& arr, int target) {
    for (int i = 0; i < arr.size(); i++) {
        if (arr[i] == target) {
            return i; // Found!
        }
        // Not a match, continue
    }
    return -1; // Not found
}`,stepToLine:i=>{var e,r;return i?i.found!==void 0?4:(e=i.message)!=null&&e.includes("moving on")?6:(r=i.message)!=null&&r.includes("not found")?8:2:-1}},bfs:{javascript:`function bfs(graph, start) {
  let visited = new Set();
  let queue = [start];
  visited.add(start);
  while (queue.length > 0) {
    let node = queue.shift();
    process(node);
    for (let neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
}`,python:`def bfs(graph, start):
    visited = set()
    queue = [start]
    visited.add(start)
    while queue:
        node = queue.pop(0)
        process(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)`,java:`void bfs(List<List<Integer>> graph, int start) {
    Set<Integer> visited = new HashSet<>();
    Queue<Integer> queue = new LinkedList<>();
    visited.add(start);
    queue.add(start);
    while (!queue.isEmpty()) {
        int node = queue.poll();
        process(node);
        for (int neighbor : graph.get(node)) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                queue.add(neighbor);
            }
        }
    }
}`,cpp:`void bfs(vector<vector<int>>& graph, int start) {
    unordered_set<int> visited;
    queue<int> q;
    visited.insert(start);
    q.push(start);
    while (!q.empty()) {
        int node = q.front(); q.pop();
        process(node);
        for (int neighbor : graph[node]) {
            if (!visited.count(neighbor)) {
                visited.insert(neighbor);
                q.push(neighbor);
            }
        }
    }
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("Adding node")?11:i.exploring!==void 0?9:(r=i.message)!=null&&r.includes("Visiting")?6:(s=i.message)!=null&&s.includes("complete")?7:3:-1}},dfs:{javascript:`function dfs(graph, node, visited) {
  visited.add(node);
  process(node);
  for (let neighbor of graph[node]) {
    if (!visited.has(neighbor)) {
      dfs(graph, neighbor, visited);
    }
  }
  // Backtrack
}`,python:`def dfs(graph, node, visited):
    visited.add(node)
    process(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(graph, neighbor, visited)

    # Backtrack`,java:`void dfs(List<List<Integer>> graph, int node,
         Set<Integer> visited) {
    visited.add(node);
    process(node);
    for (int neighbor : graph.get(node)) {
        if (!visited.contains(neighbor)) {
            dfs(graph, neighbor, visited);
        }
    }
    // Backtrack
}`,cpp:`void dfs(vector<vector<int>>& graph, int node,
         unordered_set<int>& visited) {
    visited.insert(node);
    process(node);
    for (int neighbor : graph[node]) {
        if (!visited.count(neighbor)) {
            dfs(graph, neighbor, visited);
        }
    }
    // Backtrack
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Going deeper")?6:(r=i.message)!=null&&r.includes("Backtracking")?9:(s=i.message)!=null&&s.includes("Visiting")?3:(n=i.message)!=null&&n.includes("complete")?2:1:-1}},"two-pointers":{javascript:`function twoSum(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    let sum = arr[left] + arr[right];
    if (sum === target) {
      return [left, right]; // Found!
    } else if (sum < target) {
      left++;  // Need larger sum
    } else {
      right--; // Need smaller sum
    }
  }
  return [-1, -1]; // No pair
}`,python:`def two_sum(arr, target):
    left, right = 0, len(arr) - 1
    while left < right:
        s = arr[left] + arr[right]
        if s == target:
            return [left, right]  # Found!
        elif s < target:
            left += 1   # Need larger sum
        else:
            right -= 1  # Need smaller sum

    return [-1, -1]  # No pair`,java:`int[] twoSum(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) {
            return new int[]{left, right};
        } else if (sum < target) {
            left++;  // Need larger sum
        } else {
            right--; // Need smaller sum
        }
    }
    return new int[]{-1, -1};
}`,cpp:`pair<int,int> twoSum(vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) {
            return {left, right}; // Found!
        } else if (sum < target) {
            left++;  // Need larger sum
        } else {
            right--; // Need smaller sum
        }
    }
    return {-1, -1}; // No pair
}`,stepToLine:i=>{var e,r,s,n;return i?i.found?6:(e=i.message)!=null&&e.includes("Too small")?8:(r=i.message)!=null&&r.includes("Too large")?10:(s=i.message)!=null&&s.includes("Sum =")?4:(n=i.message)!=null&&n.includes("No pair")?13:2:-1}},"sliding-window":{javascript:`function maxSumSubarray(arr, k) {
  let windowSum = 0;
  // Build first window
  for (let i = 0; i < k; i++) {
    windowSum += arr[i];
  }
  let maxSum = windowSum;
  // Slide the window
  for (let i = k; i < arr.length; i++) {
    windowSum += arr[i] - arr[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}`,python:`def max_sum_subarray(arr, k):
    window_sum = 0
    # Build first window
    for i in range(k):
        window_sum += arr[i]

    max_sum = window_sum
    # Slide the window
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, window_sum)

    return max_sum`,java:`int maxSumSubarray(int[] arr, int k) {
    int windowSum = 0;
    // Build first window
    for (int i = 0; i < k; i++) {
        windowSum += arr[i];
    }
    int maxSum = windowSum;
    // Slide the window
    for (int i = k; i < arr.length; i++) {
        windowSum += arr[i] - arr[i - k];
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}`,cpp:`int maxSumSubarray(vector<int>& arr, int k) {
    int windowSum = 0;
    // Build first window
    for (int i = 0; i < k; i++) {
        windowSum += arr[i];
    }
    int maxSum = windowSum;
    // Slide the window
    for (int i = k; i < arr.size(); i++) {
        windowSum += arr[i] - arr[i - k];
        maxSum = max(maxSum, windowSum);
    }
    return maxSum;
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Building")?4:(r=i.message)!=null&&r.includes("Sliding")?10:(s=i.message)!=null&&s.includes("New max")?11:(n=i.message)!=null&&n.includes("Result")?13:2:-1}},"merge-intervals":{javascript:`function mergeIntervals(intervals) {
  intervals.sort((a, b) => a[0] - b[0]);
  let merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    let last = merged[merged.length - 1];
    if (intervals[i][0] <= last[1]) {
      // Overlapping: extend end
      last[1] = Math.max(last[1], intervals[i][1]);
    } else {
      // No overlap: add new interval
      merged.push(intervals[i]);
    }
  }
  return merged;
}`,python:`def merge_intervals(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for i in range(1, len(intervals)):
        last = merged[-1]
        if intervals[i][0] <= last[1]:
            # Overlapping: extend end
            last[1] = max(last[1], intervals[i][1])
        else:
            # No overlap: add new interval
            merged.append(intervals[i])

    return merged`,java:`int[][] mergeIntervals(int[][] intervals) {
    Arrays.sort(intervals, (a,b) -> a[0] - b[0]);
    List<int[]> merged = new ArrayList<>();
    merged.add(intervals[0]);
    for (int i = 1; i < intervals.length; i++) {
        int[] last = merged.get(merged.size()-1);
        if (intervals[i][0] <= last[1]) {
            // Overlapping: extend end
            last[1] = Math.max(last[1], intervals[i][1]);
        } else {
            // No overlap: add new interval
            merged.add(intervals[i]);
        }
    }
    return merged.toArray(new int[0][]);
}`,cpp:`vector<vector<int>> mergeIntervals(
        vector<vector<int>>& intervals) {
    sort(intervals.begin(), intervals.end());
    vector<vector<int>> merged = {intervals[0]};
    for (int i = 1; i < intervals.size(); i++) {
        auto& last = merged.back();
        if (intervals[i][0] <= last[1]) {
            // Overlapping: extend end
            last[1] = max(last[1], intervals[i][1]);
        } else {
            // No overlap: add new interval
            merged.push_back(intervals[i]);
        }
    }
    return merged;
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Overlap")?8:(r=i.message)!=null&&r.includes("No overlap")?11:(s=i.message)!=null&&s.includes("Comparing")?6:(n=i.message)!=null&&n.includes("Result")?14:2:-1}},kadane:{javascript:`function maxSubarraySum(arr) {
  let maxSoFar = arr[0];
  let maxEndingHere = arr[0];
  for (let i = 1; i < arr.length; i++) {
    // Extend current or start new
    maxEndingHere = Math.max(
      arr[i], maxEndingHere + arr[i]
    );
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }
  return maxSoFar;
}`,python:`def max_subarray_sum(arr):
    max_so_far = arr[0]
    max_ending_here = arr[0]
    for i in range(1, len(arr)):
        # Extend current or start new
        max_ending_here = max(
            arr[i], max_ending_here + arr[i]
        )
        max_so_far = max(max_so_far, max_ending_here)

    return max_so_far`,java:`int maxSubarraySum(int[] arr) {
    int maxSoFar = arr[0];
    int maxEndingHere = arr[0];
    for (int i = 1; i < arr.length; i++) {
        // Extend current or start new
        maxEndingHere = Math.max(
            arr[i], maxEndingHere + arr[i]
        );
        maxSoFar = Math.max(maxSoFar, maxEndingHere);
    }
    return maxSoFar;
}`,cpp:`int maxSubarraySum(vector<int>& arr) {
    int maxSoFar = arr[0];
    int maxEndingHere = arr[0];
    for (int i = 1; i < arr.size(); i++) {
        // Extend current or start new
        maxEndingHere = max(
            arr[i], maxEndingHere + arr[i]
        );
        maxSoFar = max(maxSoFar, maxEndingHere);
    }
    return maxSoFar;
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Extend")?6:(r=i.message)!=null&&r.includes("Start new")?7:(s=i.message)!=null&&s.includes("New global")?9:(n=i.message)!=null&&n.includes("Result")?11:4:-1}},"prefix-sum":{javascript:`function buildPrefixSum(arr) {
  let prefix = [0];
  for (let i = 0; i < arr.length; i++) {
    prefix.push(prefix[i] + arr[i]);
  }
  return prefix;
}
// Range sum query: sum(l, r)
function rangeSum(prefix, l, r) {
  return prefix[r + 1] - prefix[l];
}`,python:`def build_prefix_sum(arr):
    prefix = [0]
    for i in range(len(arr)):
        prefix.append(prefix[i] + arr[i])

    return prefix

# Range sum query: sum(l, r)
def range_sum(prefix, l, r):
    return prefix[r + 1] - prefix[l]`,java:`int[] buildPrefixSum(int[] arr) {
    int[] prefix = new int[arr.length + 1];
    for (int i = 0; i < arr.length; i++) {
        prefix[i+1] = prefix[i] + arr[i];
    }
    return prefix;
}
// Range sum query: sum(l, r)
int rangeSum(int[] prefix, int l, int r) {
    return prefix[r + 1] - prefix[l];
}`,cpp:`vector<int> buildPrefixSum(vector<int>& arr) {
    vector<int> prefix = {0};
    for (int i = 0; i < arr.size(); i++) {
        prefix.push_back(prefix[i] + arr[i]);
    }
    return prefix;
}
// Range sum query: sum(l, r)
int rangeSum(vector<int>& prefix, int l, int r) {
    return prefix[r + 1] - prefix[l];
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("prefix[")?4:(r=i.message)!=null&&r.includes("Range query")?10:(s=i.message)!=null&&s.includes("Complete")?6:3:-1}},"monotonic-stack":{javascript:`function nextGreaterElement(arr) {
  let result = new Array(arr.length).fill(-1);
  let stack = []; // Monotonic decreasing
  for (let i = 0; i < arr.length; i++) {
    while (stack.length && arr[i] > arr[stack.at(-1)]) {
      let idx = stack.pop();
      result[idx] = arr[i]; // Next greater
    }
    stack.push(i);
  }
  return result;
}`,python:`def next_greater_element(arr):
    result = [-1] * len(arr)
    stack = []  # Monotonic decreasing
    for i in range(len(arr)):
        while stack and arr[i] > arr[stack[-1]]:
            idx = stack.pop()
            result[idx] = arr[i]  # Next greater
        stack.append(i)

    return result`,java:`int[] nextGreaterElement(int[] arr) {
    int[] result = new int[arr.length];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < arr.length; i++) {
        while (!stack.isEmpty() && arr[i] > arr[stack.peek()]) {
            int idx = stack.pop();
            result[idx] = arr[i]; // Next greater
        }
        stack.push(i);
    }
    return result;
}`,cpp:`vector<int> nextGreaterElement(vector<int>& arr) {
    vector<int> result(arr.size(), -1);
    stack<int> stk; // Monotonic decreasing
    for (int i = 0; i < arr.size(); i++) {
        while (!stk.empty() && arr[i] > arr[stk.top()]) {
            int idx = stk.top(); stk.pop();
            result[idx] = arr[i]; // Next greater
        }
        stk.push(i);
    }
    return result;
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Found next greater")?7:(r=i.message)!=null&&r.includes("Pop")?6:(s=i.message)!=null&&s.includes("Push")?9:(n=i.message)!=null&&n.includes("Complete")?11:5:-1}},"dp-fibonacci":{javascript:`function climbStairs(n) {
  if (n <= 2) return n;
  let dp = [0, 1, 2];
  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i-1] + dp[i-2];
    // Ways to reach step i
  }
  return dp[n];
}`,python:`def climb_stairs(n):
    if n <= 2: return n
    dp = [0, 1, 2]
    for i in range(3, n + 1):
        dp.append(dp[i-1] + dp[i-2])
        # Ways to reach step i

    return dp[n]`,java:`int climbStairs(int n) {
    if (n <= 2) return n;
    int[] dp = new int[n + 1];
    dp[1] = 1; dp[2] = 2;
    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i-1] + dp[i-2];
        // Ways to reach step i
    }
    return dp[n];
}`,cpp:`int climbStairs(int n) {
    if (n <= 2) return n;
    vector<int> dp(n + 1);
    dp[1] = 1; dp[2] = 2;
    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i-1] + dp[i-2];
        // Ways to reach step i
    }
    return dp[n];
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("dp[")?5:(r=i.message)!=null&&r.includes("Base")?3:(s=i.message)!=null&&s.includes("Result")?8:4:-1}},"dp-knapsack":{javascript:`function knapsack(weights, values, W) {
  let n = weights.length;
  let dp = Array(n+1).fill(null)
    .map(() => Array(W+1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i-1][w]; // Skip
      if (weights[i-1] <= w) {
        dp[i][w] = Math.max(dp[i][w],
          dp[i-1][w-weights[i-1]] + values[i-1]
        ); // Include item
      }
    }
  }
  return dp[n][W];
}`,python:`def knapsack(weights, values, W):
    n = len(weights)
    dp = [[0] * (W+1) for _ in range(n+1)]

    for i in range(1, n+1):
        for w in range(W+1):
            dp[i][w] = dp[i-1][w]  # Skip
            if weights[i-1] <= w:
                dp[i][w] = max(dp[i][w],
                    dp[i-1][w-weights[i-1]] + values[i-1]
                )  # Include item


    return dp[n][W]`,java:`int knapsack(int[] weights, int[] values, int W) {
    int n = weights.length;
    int[][] dp = new int[n+1][W+1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i-1][w]; // Skip
            if (weights[i-1] <= w) {
                dp[i][w] = Math.max(dp[i][w],
                    dp[i-1][w-weights[i-1]] + values[i-1]
                ); // Include item
            }
        }
    }
    return dp[n][W];
}`,cpp:`int knapsack(vector<int>& weights,
             vector<int>& values, int W) {
    int n = weights.size();
    vector<vector<int>> dp(n+1, vector<int>(W+1, 0));
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i-1][w]; // Skip
            if (weights[i-1] <= w) {
                dp[i][w] = max(dp[i][w],
                    dp[i-1][w-weights[i-1]] + values[i-1]
                ); // Include item
            }
        }
    }
    return dp[n][W];
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("Include")?9:(r=i.message)!=null&&r.includes("Skip")?7:(s=i.message)!=null&&s.includes("Result")?17:6:-1}},backtracking:{javascript:`function generateSubsets(nums) {
  let result = [];
  function backtrack(start, current) {
    result.push([...current]);
    for (let i = start; i < nums.length; i++) {
      current.push(nums[i]); // Choose
      backtrack(i + 1, current); // Explore
      current.pop();          // Un-choose
    }
  }
  backtrack(0, []);
  return result;
}`,python:`def generate_subsets(nums):
    result = []
    def backtrack(start, current):
        result.append(current[:])
        for i in range(start, len(nums)):
            current.append(nums[i])  # Choose
            backtrack(i + 1, current) # Explore
            current.pop()             # Un-choose

    backtrack(0, [])
    return result`,java:`List<List<Integer>> generateSubsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    backtrack(nums, 0, new ArrayList<>(), result);
    return result;
}
void backtrack(int[] nums, int start,
               List<Integer> current,
               List<List<Integer>> result) {
    result.add(new ArrayList<>(current));
    for (int i = start; i < nums.length; i++) {
        current.add(nums[i]);         // Choose
        backtrack(nums, i+1, current, result);
        current.remove(current.size()-1); // Un-choose
    }
}`,cpp:`vector<vector<int>> generateSubsets(vector<int>& nums) {
    vector<vector<int>> result;
    vector<int> current;
    backtrack(nums, 0, current, result);
    return result;
}
void backtrack(vector<int>& nums, int start,
               vector<int>& current,
               vector<vector<int>>& result) {
    result.push_back(current);
    for (int i = start; i < nums.size(); i++) {
        current.push_back(nums[i]); // Choose
        backtrack(nums, i+1, current, result);
        current.pop_back();          // Un-choose
    }
}`,stepToLine:i=>{var e,r,s,n,t,a;return i?(e=i.message)!=null&&e.includes("Choose")?6:(r=i.message)!=null&&r.includes("Explore")?7:(s=i.message)!=null&&s.includes("Un-choose")||(n=i.message)!=null&&n.includes("Backtrack")?8:(t=i.message)!=null&&t.includes("Record")?4:(a=i.message)!=null&&a.includes("Complete")?12:3:-1}},greedy:{javascript:`function activitySelection(start, end) {
  let activities = start.map((s, i) => [s, end[i]])
    .sort((a, b) => a[1] - b[1]);
  let selected = [activities[0]];
  let lastEnd = activities[0][1];
  for (let i = 1; i < activities.length; i++) {
    if (activities[i][0] >= lastEnd) {
      selected.push(activities[i]);
      lastEnd = activities[i][1];
    }
  }
  return selected;
}`,python:`def activity_selection(start, end):
    activities = sorted(zip(start, end), key=lambda x: x[1])
    selected = [activities[0]]
    last_end = activities[0][1]
    for i in range(1, len(activities)):
        if activities[i][0] >= last_end:
            selected.append(activities[i])
            last_end = activities[i][1]


    return selected`,java:`List<int[]> activitySelection(int[] start, int[] end) {
    int[][] acts = new int[start.length][2];
    for (int i = 0; i < start.length; i++)
        acts[i] = new int[]{start[i], end[i]};
    Arrays.sort(acts, (a,b) -> a[1] - b[1]);
    List<int[]> selected = new ArrayList<>();
    selected.add(acts[0]);
    int lastEnd = acts[0][1];
    for (int i = 1; i < acts.length; i++) {
        if (acts[i][0] >= lastEnd) {
            selected.add(acts[i]);
            lastEnd = acts[i][1];
        }
    }
    return selected;
}`,cpp:`vector<pair<int,int>> activitySelection(
        vector<int>& start, vector<int>& end) {
    vector<pair<int,int>> acts;
    for (int i = 0; i < start.size(); i++)
        acts.push_back({start[i], end[i]});
    sort(acts.begin(), acts.end(),
         [](auto& a, auto& b){ return a.second < b.second; });
    vector<pair<int,int>> selected = {acts[0]};
    int lastEnd = acts[0].second;
    for (int i = 1; i < acts.size(); i++) {
        if (acts[i].first >= lastEnd) {
            selected.push_back(acts[i]);
            lastEnd = acts[i].second;
        }
    }
    return selected;
}`,stepToLine:i=>{var e,r,s,n,t;return i?(e=i.message)!=null&&e.includes("Select")?9:(r=i.message)!=null&&r.includes("Skip")||(s=i.message)!=null&&s.includes("Overlap")?8:(n=i.message)!=null&&n.includes("Sort")?3:(t=i.message)!=null&&t.includes("Result")?13:7:-1}},"union-find":{javascript:`class UnionFind {
  constructor(n) {
    this.parent = Array.from({length: n}, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  find(x) {
    if (this.parent[x] !== x)
      this.parent[x] = this.find(this.parent[x]);
    return this.parent[x]; // Path compression
  }
  union(x, y) {
    let px = this.find(x), py = this.find(y);
    if (px === py) return false;
    if (this.rank[px] < this.rank[py])
      [px, py] = [py, px];
    this.parent[py] = px;
    if (this.rank[px] === this.rank[py])
      this.rank[px]++;
    return true;
  }
}`,python:`class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]  # Path compression

    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py: return False
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        return True`,java:`class UnionFind {
    int[] parent, rank;
    UnionFind(int n) {
        parent = new int[n]; rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);
        return parent[x]; // Path compression
    }
    boolean union(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank[px] < rank[py])
            { int t = px; px = py; py = t; }
        parent[py] = px;
        if (rank[px] == rank[py]) rank[px]++;
        return true;
    }
}`,cpp:`class UnionFind {
    vector<int> parent, rank_;
public:
    UnionFind(int n) : parent(n), rank_(n, 0) {
        iota(parent.begin(), parent.end(), 0);
    }
    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);
        return parent[x]; // Path compression
    }
    bool unite(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank_[px] < rank_[py]) swap(px, py);
        parent[py] = px;
        if (rank_[px] == rank_[py]) rank_[px]++;
        return true;
    }
};`,stepToLine:i=>{var e,r,s,n,t;return i?(e=i.message)!=null&&e.includes("Find")?7:(r=i.message)!=null&&r.includes("Path compression")?8:(s=i.message)!=null&&s.includes("Union")?16:(n=i.message)!=null&&n.includes("Same set")?13:(t=i.message)!=null&&t.includes("Init")?3:11:-1}},"topological-sort":{javascript:`function topologicalSort(graph, n) {
  let inDegree = new Array(n).fill(0);
  for (let u = 0; u < n; u++)
    for (let v of graph[u]) inDegree[v]++;
  let queue = [];
  for (let i = 0; i < n; i++)
    if (inDegree[i] === 0) queue.push(i);
  let order = [];
  while (queue.length > 0) {
    let node = queue.shift();
    order.push(node);
    for (let neighbor of graph[node]) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0)
        queue.push(neighbor);
    }
  }
  return order;
}`,python:`def topological_sort(graph, n):
    in_degree = [0] * n
    for u in range(n):
        for v in graph[u]: in_degree[v] += 1
    queue = []
    for i in range(n):
        if in_degree[i] == 0: queue.append(i)
    order = []
    while queue:
        node = queue.pop(0)
        order.append(node)
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return order`,java:`List<Integer> topologicalSort(
        List<List<Integer>> graph, int n) {
    int[] inDegree = new int[n];
    for (int u = 0; u < n; u++)
        for (int v : graph.get(u)) inDegree[v]++;
    Queue<Integer> queue = new LinkedList<>();
    for (int i = 0; i < n; i++)
        if (inDegree[i] == 0) queue.add(i);
    List<Integer> order = new ArrayList<>();
    while (!queue.isEmpty()) {
        int node = queue.poll();
        order.add(node);
        for (int neighbor : graph.get(node)) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0)
                queue.add(neighbor);
        }
    }
    return order;
}`,cpp:`vector<int> topologicalSort(
        vector<vector<int>>& graph, int n) {
    vector<int> inDegree(n, 0);
    for (int u = 0; u < n; u++)
        for (int v : graph[u]) inDegree[v]++;
    queue<int> q;
    for (int i = 0; i < n; i++)
        if (inDegree[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int node = q.front(); q.pop();
        order.push_back(node);
        for (int neighbor : graph[node]) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0)
                q.push(neighbor);
        }
    }
    return order;
}`,stepToLine:i=>{var e,r,s,n,t;return i?(e=i.message)!=null&&e.includes("Enqueue")?15:(r=i.message)!=null&&r.includes("Decrement")?13:(s=i.message)!=null&&s.includes("Process")?10:(n=i.message)!=null&&n.includes("In-degree 0")?7:(t=i.message)!=null&&t.includes("Complete")?18:4:-1}},"bit-manipulation":{javascript:`function countSetBits(n) {
  let count = 0;
  while (n > 0) {
    count += n & 1;  // Check last bit
    n >>= 1;         // Shift right
  }
  return count;
}
// Single Number (XOR trick)
function singleNumber(nums) {
  let result = 0;
  for (let num of nums) {
    result ^= num; // XOR cancels pairs
  }
  return result;
}`,python:`def count_set_bits(n):
    count = 0
    while n > 0:
        count += n & 1  # Check last bit
        n >>= 1         # Shift right

    return count

# Single Number (XOR trick)
def single_number(nums):
    result = 0
    for num in nums:
        result ^= num  # XOR cancels pairs

    return result`,java:`int countSetBits(int n) {
    int count = 0;
    while (n > 0) {
        count += n & 1;  // Check last bit
        n >>= 1;         // Shift right
    }
    return count;
}
// Single Number (XOR trick)
int singleNumber(int[] nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num; // XOR cancels pairs
    }
    return result;
}`,cpp:`int countSetBits(int n) {
    int count = 0;
    while (n > 0) {
        count += n & 1;  // Check last bit
        n >>= 1;         // Shift right
    }
    return count;
}
// Single Number (XOR trick)
int singleNumber(vector<int>& nums) {
    int result = 0;
    for (int num : nums) {
        result ^= num; // XOR cancels pairs
    }
    return result;
}`,stepToLine:i=>{var e,r,s,n;return i?(e=i.message)!=null&&e.includes("Bit is 1")?4:(r=i.message)!=null&&r.includes("Shift")?5:(s=i.message)!=null&&s.includes("XOR")?14:(n=i.message)!=null&&n.includes("Result")?7:3:-1}},"move-zeroes":{javascript:`function moveZeroes(nums) {
  let w = 0;
  for (let r = 0; r < nums.length; r++) {
    if (nums[r] !== 0) {
      [nums[w], nums[r]] = [nums[r], nums[w]];
      w++;
    }
  }
}`,python:`def move_zeroes(nums):
    w = 0
    for r in range(len(nums)):
        if nums[r] != 0:
            nums[w], nums[r] = nums[r], nums[w]
            w += 1`,java:`void moveZeroes(int[] nums) {
    int w = 0;
    for (int r = 0; r < nums.length; r++) {
        if (nums[r] != 0) {
            int t = nums[w]; nums[w] = nums[r]; nums[r] = t;
            w++;
        }
    }
}`,cpp:`void moveZeroes(vector<int>& nums) {
    int w = 0;
    for (int r = 0; r < nums.size(); r++) {
        if (nums[r] != 0) {
            swap(nums[w], nums[r]);
            w++;
        }
    }
}`,stepToLine:i=>i?i.swapping?5:i.comparing?4:3:-1},"rotate-array":{javascript:`function rotate(nums, k) {
  k = k % nums.length;
  reverse(nums, 0, nums.length - 1);
  reverse(nums, 0, k - 1);
  reverse(nums, k, nums.length - 1);
}
function reverse(a, l, r) {
  while (l < r) {
    [a[l], a[r]] = [a[r], a[l]];
    l++; r--;
  }
}`,python:`def rotate(nums, k):
    k = k % len(nums)
    reverse(nums, 0, len(nums) - 1)
    reverse(nums, 0, k - 1)
    reverse(nums, k, len(nums) - 1)

def reverse(a, l, r):
    while l < r:
        a[l], a[r] = a[r], a[l]
        l += 1; r -= 1`,java:`void rotate(int[] nums, int k) {
    k = k % nums.length;
    reverse(nums, 0, nums.length - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, nums.length - 1);
}
void reverse(int[] a, int l, int r) {
    while (l < r) {
        int t = a[l]; a[l] = a[r]; a[r] = t;
        l++; r--;
    }
}`,cpp:`void rotate(vector<int>& nums, int k) {
    k = k % nums.size();
    reverse(nums.begin(), nums.end());
    reverse(nums.begin(), nums.begin() + k);
    reverse(nums.begin() + k, nums.end());
}`,stepToLine:i=>{var e;return i?i.swapping?9:(e=i.message)!=null&&e.includes("Reverse")?3:2:-1}},"remove-duplicates":{javascript:`function removeDuplicates(nums) {
  let w = 1;
  for (let r = 1; r < nums.length; r++) {
    if (nums[r] !== nums[r - 1]) {
      nums[w] = nums[r];
      w++;
    }
  }
  return w;
}`,python:`def remove_duplicates(nums):
    w = 1
    for r in range(1, len(nums)):
        if nums[r] != nums[r - 1]:
            nums[w] = nums[r]
            w += 1
    return w`,java:`int removeDuplicates(int[] nums) {
    int w = 1;
    for (int r = 1; r < nums.length; r++) {
        if (nums[r] != nums[r - 1]) {
            nums[w] = nums[r];
            w++;
        }
    }
    return w;
}`,cpp:`int removeDuplicates(vector<int>& nums) {
    int w = 1;
    for (int r = 1; r < nums.size(); r++) {
        if (nums[r] != nums[r - 1]) {
            nums[w] = nums[r];
            w++;
        }
    }
    return w;
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("unique")?5:i.comparing?4:3:-1}},"buy-sell-stock":{javascript:`function maxProfit(prices) {
  let minPrice = Infinity, maxProfit = 0;
  for (let i = 0; i < prices.length; i++) {
    if (prices[i] < minPrice) {
      minPrice = prices[i];
    } else {
      maxProfit = Math.max(maxProfit, prices[i] - minPrice);
    }
  }
  return maxProfit;
}`,python:`def max_profit(prices):
    min_price = float('inf')
    max_profit = 0
    for price in prices:
        if price < min_price:
            min_price = price
        else:
            max_profit = max(max_profit, price - min_price)
    return max_profit`,java:`int maxProfit(int[] prices) {
    int minPrice = Integer.MAX_VALUE, maxProfit = 0;
    for (int price : prices) {
        if (price < minPrice) {
            minPrice = price;
        } else {
            maxProfit = Math.max(maxProfit, price - minPrice);
        }
    }
    return maxProfit;
}`,cpp:`int maxProfit(vector<int>& prices) {
    int minPrice = INT_MAX, maxProfit = 0;
    for (int price : prices) {
        if (price < minPrice) {
            minPrice = price;
        } else {
            maxProfit = max(maxProfit, price - minPrice);
        }
    }
    return maxProfit;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("New min")?5:(r=i.message)!=null&&r.includes("profit")?7:3:-1}},"product-except-self":{javascript:`function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }
  return result;
}`,python:`def product_except_self(nums):
    n = len(nums)
    result = [1] * n
    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]
    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]
    return result`,java:`int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, 1);
    int prefix = 1;
    for (int i = 0; i < n; i++) {
        result[i] = prefix;
        prefix *= nums[i];
    }
    int suffix = 1;
    for (int i = n - 1; i >= 0; i--) {
        result[i] *= suffix;
        suffix *= nums[i];
    }
    return result;
}`,cpp:`vector<int> productExceptSelf(vector<int>& nums) {
    int n = nums.size();
    vector<int> result(n, 1);
    int prefix = 1;
    for (int i = 0; i < n; i++) {
        result[i] = prefix;
        prefix *= nums[i];
    }
    int suffix = 1;
    for (int i = n - 1; i >= 0; i--) {
        result[i] *= suffix;
        suffix *= nums[i];
    }
    return result;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("prefix")?6:(r=i.message)!=null&&r.includes("suffix")?11:3:-1}},"contains-duplicate":{javascript:`function containsDuplicate(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }
  return false;
}`,python:`def contains_duplicate(nums):
    seen = set()
    for num in nums:
        if num in seen: return True
        seen.add(num)
    return False`,java:`boolean containsDuplicate(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int num : nums) {
        if (seen.contains(num)) return true;
        seen.add(num);
    }
    return false;
}`,cpp:`bool containsDuplicate(vector<int>& nums) {
    unordered_set<int> seen;
    for (int num : nums) {
        if (seen.count(num)) return true;
        seen.insert(num);
    }
    return false;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Duplicate")?4:(r=i.message)!=null&&r.includes("Add")?5:3:-1}},"majority-element":{javascript:`function majorityElement(nums) {
  let candidate = nums[0], count = 1;
  for (let i = 1; i < nums.length; i++) {
    if (count === 0) {
      candidate = nums[i];
    }
    count += nums[i] === candidate ? 1 : -1;
  }
  return candidate;
}`,python:`def majority_element(nums):
    candidate, count = nums[0], 1
    for i in range(1, len(nums)):
        if count == 0:
            candidate = nums[i]
        count += 1 if nums[i] == candidate else -1
    return candidate`,java:`int majorityElement(int[] nums) {
    int candidate = nums[0], count = 1;
    for (int i = 1; i < nums.length; i++) {
        if (count == 0) candidate = nums[i];
        count += nums[i] == candidate ? 1 : -1;
    }
    return candidate;
}`,cpp:`int majorityElement(vector<int>& nums) {
    int candidate = nums[0], count = 1;
    for (int i = 1; i < nums.size(); i++) {
        if (count == 0) candidate = nums[i];
        count += nums[i] == candidate ? 1 : -1;
    }
    return candidate;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("New candidate")?5:(r=i.message)!=null&&r.includes("count")?6:3:-1}},"increasing-triplet":{javascript:`function increasingTriplet(nums) {
  let first = Infinity, second = Infinity;
  for (const n of nums) {
    if (n <= first) first = n;
    else if (n <= second) second = n;
    else return true;
  }
  return false;
}`,python:`def increasing_triplet(nums):
    first = second = float('inf')
    for n in nums:
        if n <= first: first = n
        elif n <= second: second = n
        else: return True
    return False`,java:`boolean increasingTriplet(int[] nums) {
    int first = Integer.MAX_VALUE, second = Integer.MAX_VALUE;
    for (int n : nums) {
        if (n <= first) first = n;
        else if (n <= second) second = n;
        else return true;
    }
    return false;
}`,cpp:`bool increasingTriplet(vector<int>& nums) {
    int first = INT_MAX, second = INT_MAX;
    for (int n : nums) {
        if (n <= first) first = n;
        else if (n <= second) second = n;
        else return true;
    }
    return false;
}`,stepToLine:i=>{var e,r,s;return i?(e=i.message)!=null&&e.includes("first")?4:(r=i.message)!=null&&r.includes("second")?5:(s=i.message)!=null&&s.includes("Found")?6:3:-1}},"first-missing-positive":{javascript:`function firstMissingPositive(nums) {
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    while (nums[i] > 0 && nums[i] <= n
           && nums[nums[i]-1] !== nums[i]) {
      [nums[i], nums[nums[i]-1]] = [nums[nums[i]-1], nums[i]];
    }
  }
  for (let i = 0; i < n; i++) {
    if (nums[i] !== i + 1) return i + 1;
  }
  return n + 1;
}`,python:`def first_missing_positive(nums):
    n = len(nums)
    for i in range(n):
        while 0 < nums[i] <= n \\
              and nums[nums[i]-1] != nums[i]:
            nums[nums[i]-1], nums[i] = nums[i], nums[nums[i]-1]
    for i in range(n):
        if nums[i] != i + 1: return i + 1
    return n + 1`,java:`int firstMissingPositive(int[] nums) {
    int n = nums.length;
    for (int i = 0; i < n; i++) {
        while (nums[i] > 0 && nums[i] <= n
               && nums[nums[i]-1] != nums[i]) {
            int t = nums[i]; nums[i] = nums[t-1]; nums[t-1] = t;
        }
    }
    for (int i = 0; i < n; i++)
        if (nums[i] != i + 1) return i + 1;
    return n + 1;
}`,cpp:`int firstMissingPositive(vector<int>& nums) {
    int n = nums.size();
    for (int i = 0; i < n; i++) {
        while (nums[i] > 0 && nums[i] <= n
               && nums[nums[i]-1] != nums[i])
            swap(nums[i], nums[nums[i]-1]);
    }
    for (int i = 0; i < n; i++)
        if (nums[i] != i + 1) return i + 1;
    return n + 1;
}`,stepToLine:i=>{var e;return i?i.swapping?6:(e=i.message)!=null&&e.includes("Scan")?9:4:-1}},"valid-palindrome":{javascript:`function isPalindrome(s) {
  s = s.replace(/[^a-z0-9]/gi,'').toLowerCase();
  let l = 0, r = s.length - 1;
  while (l < r) {
    if (s[l] !== s[r]) return false;
    l++; r--;
  }
  return true;
}`,python:`def is_palindrome(s):
    s = ''.join(c.lower() for c in s if c.isalnum())
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]: return False
        l += 1; r -= 1
    return True`,java:`boolean isPalindrome(String s) {
    s = s.replaceAll("[^a-zA-Z0-9]","").toLowerCase();
    int l = 0, r = s.length() - 1;
    while (l < r) {
        if (s.charAt(l) != s.charAt(r)) return false;
        l++; r--;
    }
    return true;
}`,cpp:`bool isPalindrome(string s) {
    string clean;
    for (char c : s) if (isalnum(c)) clean += tolower(c);
    int l = 0, r = clean.size() - 1;
    while (l < r) {
        if (clean[l] != clean[r]) return false;
        l++; r--;
    }
    return true;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Match")||(r=i.message)!=null&&r.includes("Mismatch")?5:4:-1}},"is-subsequence":{javascript:`function isSubsequence(s, t) {
  let i = 0;
  for (let j = 0; j < t.length && i < s.length; j++) {
    if (s[i] === t[j]) i++;
  }
  return i === s.length;
}`,python:`def is_subsequence(s, t):
    i = 0
    for j in range(len(t)):
        if i < len(s) and s[i] == t[j]:
            i += 1
    return i == len(s)`,java:`boolean isSubsequence(String s, String t) {
    int i = 0;
    for (int j = 0; j < t.length() && i < s.length(); j++) {
        if (s.charAt(i) == t.charAt(j)) i++;
    }
    return i == s.length();
}`,cpp:`bool isSubsequence(string s, string t) {
    int i = 0;
    for (int j = 0; j < t.size() && i < s.size(); j++) {
        if (s[i] == t[j]) i++;
    }
    return i == s.size();
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("Match")?4:3:-1}},"reverse-words":{javascript:`function reverseWords(s) {
  return s.trim().split(/\\s+/).reverse().join(' ');
}`,python:`def reverse_words(s):
    return ' '.join(s.split()[::-1])`,java:`String reverseWords(String s) {
    String[] words = s.trim().split("\\\\s+");
    Collections.reverse(Arrays.asList(words));
    return String.join(" ", words);
}`,cpp:`string reverseWords(string s) {
    istringstream iss(s);
    vector<string> words;
    string w;
    while (iss >> w) words.push_back(w);
    reverse(words.begin(), words.end());
    string res;
    for (auto& w : words) res += (res.empty()?"":' ') + w;
    return res;
}`,stepToLine:i=>i?2:-1},"longest-common-prefix":{javascript:`function longestCommonPrefix(strs) {
  if (!strs.length) return "";
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (strs[i].indexOf(prefix) !== 0) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return "";
    }
  }
  return prefix;
}`,python:`def longest_common_prefix(strs):
    if not strs: return ""
    prefix = strs[0]
    for s in strs[1:]:
        while not s.startswith(prefix):
            prefix = prefix[:-1]
            if not prefix: return ""
    return prefix`,java:`String longestCommonPrefix(String[] strs) {
    if (strs.length == 0) return "";
    String prefix = strs[0];
    for (int i = 1; i < strs.length; i++) {
        while (strs[i].indexOf(prefix) != 0) {
            prefix = prefix.substring(0, prefix.length()-1);
            if (prefix.isEmpty()) return "";
        }
    }
    return prefix;
}`,cpp:`string longestCommonPrefix(vector<string>& strs) {
    if (strs.empty()) return "";
    string prefix = strs[0];
    for (int i = 1; i < strs.size(); i++) {
        while (strs[i].find(prefix) != 0) {
            prefix = prefix.substr(0, prefix.size()-1);
            if (prefix.empty()) return "";
        }
    }
    return prefix;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Shorten")?6:(r=i.message)!=null&&r.includes("Match")?5:4:-1}},"ransom-note":{javascript:`function canConstruct(ransomNote, magazine) {
  const freq = {};
  for (const c of magazine) freq[c] = (freq[c]||0) + 1;
  for (const c of ransomNote) {
    if (!freq[c]) return false;
    freq[c]--;
  }
  return true;
}`,python:`def can_construct(ransom_note, magazine):
    freq = {}
    for c in magazine: freq[c] = freq.get(c, 0) + 1
    for c in ransom_note:
        if not freq.get(c): return False
        freq[c] -= 1
    return True`,java:`boolean canConstruct(String r, String m) {
    int[] freq = new int[26];
    for (char c : m.toCharArray()) freq[c-'a']++;
    for (char c : r.toCharArray()) {
        if (freq[c-'a'] == 0) return false;
        freq[c-'a']--;
    }
    return true;
}`,cpp:`bool canConstruct(string r, string m) {
    int freq[26] = {};
    for (char c : m) freq[c-'a']++;
    for (char c : r) {
        if (!freq[c-'a']) return false;
        freq[c-'a']--;
    }
    return true;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Build")?3:(r=i.message)!=null&&r.includes("Check")?5:4:-1}},"group-anagrams":{javascript:`function groupAnagrams(strs) {
  const map = {};
  for (const s of strs) {
    const key = [...s].sort().join('');
    (map[key] = map[key] || []).push(s);
  }
  return Object.values(map);
}`,python:`def group_anagrams(strs):
    groups = {}
    for s in strs:
        key = ''.join(sorted(s))
        groups.setdefault(key, []).append(s)
    return list(groups.values())`,java:`List<List<String>> groupAnagrams(String[] strs) {
    Map<String,List<String>> map = new HashMap<>();
    for (String s : strs) {
        char[] ca = s.toCharArray();
        Arrays.sort(ca);
        String key = new String(ca);
        map.computeIfAbsent(key, k->new ArrayList<>()).add(s);
    }
    return new ArrayList<>(map.values());
}`,cpp:`vector<vector<string>> groupAnagrams(vector<string>& strs) {
    unordered_map<string, vector<string>> map;
    for (auto& s : strs) {
        string key = s;
        sort(key.begin(), key.end());
        map[key].push_back(s);
    }
    vector<vector<string>> res;
    for (auto& [k, v] : map) res.push_back(v);
    return res;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Sort")?4:(r=i.message)!=null&&r.includes("Group")?5:3:-1}},"longest-consecutive":{javascript:`function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const n of set) {
    if (!set.has(n - 1)) {
      let len = 1;
      while (set.has(n + len)) len++;
      best = Math.max(best, len);
    }
  }
  return best;
}`,python:`def longest_consecutive(nums):
    s = set(nums)
    best = 0
    for n in s:
        if n - 1 not in s:
            length = 1
            while n + length in s: length += 1
            best = max(best, length)
    return best`,java:`int longestConsecutive(int[] nums) {
    Set<Integer> set = new HashSet<>();
    for (int n : nums) set.add(n);
    int best = 0;
    for (int n : set) {
        if (!set.contains(n - 1)) {
            int len = 1;
            while (set.contains(n + len)) len++;
            best = Math.max(best, len);
        }
    }
    return best;
}`,cpp:`int longestConsecutive(vector<int>& nums) {
    unordered_set<int> s(nums.begin(), nums.end());
    int best = 0;
    for (int n : s) {
        if (!s.count(n - 1)) {
            int len = 1;
            while (s.count(n + len)) len++;
            best = max(best, len);
        }
    }
    return best;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Start")?5:(r=i.message)!=null&&r.includes("Extend")?7:4:-1}},"contains-duplicate-ii":{javascript:`function containsNearbyDuplicate(nums, k) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (map.has(nums[i]) && i - map.get(nums[i]) <= k)
      return true;
    map.set(nums[i], i);
  }
  return false;
}`,python:`def contains_nearby_duplicate(nums, k):
    seen = {}
    for i, n in enumerate(nums):
        if n in seen and i - seen[n] <= k:
            return True
        seen[n] = i
    return False`,java:`boolean containsNearbyDuplicate(int[] nums, int k) {
    Map<Integer,Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        if (map.containsKey(nums[i]) && i - map.get(nums[i]) <= k)
            return true;
        map.put(nums[i], i);
    }
    return false;
}`,cpp:`bool containsNearbyDuplicate(vector<int>& nums, int k) {
    unordered_map<int,int> map;
    for (int i = 0; i < nums.size(); i++) {
        if (map.count(nums[i]) && i - map[nums[i]] <= k)
            return true;
        map[nums[i]] = i;
    }
    return false;
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("Duplicate")?4:3:-1}},"isomorphic-strings":{javascript:`function isIsomorphic(s, t) {
  const m1 = {}, m2 = {};
  for (let i = 0; i < s.length; i++) {
    if (m1[s[i]] !== m2[t[i]]) return false;
    m1[s[i]] = i + 1;
    m2[t[i]] = i + 1;
  }
  return true;
}`,python:`def is_isomorphic(s, t):
    m1, m2 = {}, {}
    for i in range(len(s)):
        if m1.get(s[i]) != m2.get(t[i]):
            return False
        m1[s[i]] = i + 1
        m2[t[i]] = i + 1
    return True`,java:`boolean isIsomorphic(String s, String t) {
    int[] m1 = new int[256], m2 = new int[256];
    for (int i = 0; i < s.length(); i++) {
        if (m1[s.charAt(i)] != m2[t.charAt(i)]) return false;
        m1[s.charAt(i)] = i + 1;
        m2[t.charAt(i)] = i + 1;
    }
    return true;
}`,cpp:`bool isIsomorphic(string s, string t) {
    int m1[256]={}, m2[256]={};
    for (int i = 0; i < s.size(); i++) {
        if (m1[s[i]] != m2[t[i]]) return false;
        m1[s[i]] = i + 1;
        m2[t[i]] = i + 1;
    }
    return true;
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("Map")?5:4:-1}},"good-pairs":{javascript:`function numGoodPairs(nums) {
  const freq = {};
  let count = 0;
  for (const n of nums) {
    count += freq[n] || 0;
    freq[n] = (freq[n] || 0) + 1;
  }
  return count;
}`,python:`def num_good_pairs(nums):
    freq = {}
    count = 0
    for n in nums:
        count += freq.get(n, 0)
        freq[n] = freq.get(n, 0) + 1
    return count`,java:`int numGoodPairs(int[] nums) {
    Map<Integer,Integer> freq = new HashMap<>();
    int count = 0;
    for (int n : nums) {
        count += freq.getOrDefault(n, 0);
        freq.merge(n, 1, Integer::sum);
    }
    return count;
}`,cpp:`int numGoodPairs(vector<int>& nums) {
    unordered_map<int,int> freq;
    int count = 0;
    for (int n : nums) {
        count += freq[n];
        freq[n]++;
    }
    return count;
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("pairs")?5:4:-1}},"3sum":{javascript:`function threeSum(nums) {
  nums.sort((a,b) => a - b);
  const result = [];
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i-1]) continue;
    let l = i + 1, r = nums.length - 1;
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r];
      if (s === 0) {
        result.push([nums[i], nums[l], nums[r]]);
        while (l<r && nums[l]===nums[l+1]) l++;
        l++; r--;
      } else if (s < 0) l++;
      else r--;
    }
  }
  return result;
}`,python:`def three_sum(nums):
    nums.sort()
    result = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i-1]: continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s == 0:
                result.append([nums[i], nums[l], nums[r]])
                while l<r and nums[l]==nums[l+1]: l += 1
                l += 1; r -= 1
            elif s < 0: l += 1
            else: r -= 1
    return result`,java:`List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i-1]) continue;
        int l = i+1, r = nums.length-1;
        while (l < r) {
            int s = nums[i]+nums[l]+nums[r];
            if (s == 0) {
                res.add(Arrays.asList(nums[i],nums[l],nums[r]));
                while (l<r && nums[l]==nums[l+1]) l++;
                l++; r--;
            } else if (s < 0) l++;
            else r--;
        }
    }
    return res;
}`,cpp:`vector<vector<int>> threeSum(vector<int>& nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> res;
    for (int i = 0; i < (int)nums.size()-2; i++) {
        if (i > 0 && nums[i] == nums[i-1]) continue;
        int l = i+1, r = nums.size()-1;
        while (l < r) {
            int s = nums[i]+nums[l]+nums[r];
            if (s == 0) {
                res.push_back({nums[i],nums[l],nums[r]});
                while (l<r && nums[l]==nums[l+1]) l++;
                l++; r--;
            } else if (s < 0) l++;
            else r--;
        }
    }
    return res;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Found")?10:(r=i.message)!=null&&r.includes("Sum")?8:4:-1}},"container-water":{javascript:`function maxArea(height) {
  let l = 0, r = height.length - 1, best = 0;
  while (l < r) {
    const area = Math.min(height[l], height[r]) * (r - l);
    best = Math.max(best, area);
    if (height[l] < height[r]) l++;
    else r--;
  }
  return best;
}`,python:`def max_area(height):
    l, r, best = 0, len(height)-1, 0
    while l < r:
        area = min(height[l], height[r]) * (r - l)
        best = max(best, area)
        if height[l] < height[r]: l += 1
        else: r -= 1
    return best`,java:`int maxArea(int[] h) {
    int l = 0, r = h.length-1, best = 0;
    while (l < r) {
        int area = Math.min(h[l],h[r]) * (r-l);
        best = Math.max(best, area);
        if (h[l] < h[r]) l++;
        else r--;
    }
    return best;
}`,cpp:`int maxArea(vector<int>& h) {
    int l = 0, r = h.size()-1, best = 0;
    while (l < r) {
        int area = min(h[l],h[r]) * (r-l);
        best = max(best, area);
        if (h[l] < h[r]) l++;
        else r--;
    }
    return best;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("area")?4:(r=i.message)!=null&&r.includes("Move")?6:3:-1}},"trapping-rain-water":{javascript:`function trap(height) {
  let l = 0, r = height.length - 1;
  let lMax = 0, rMax = 0, water = 0;
  while (l < r) {
    if (height[l] < height[r]) {
      lMax = Math.max(lMax, height[l]);
      water += lMax - height[l];
      l++;
    } else {
      rMax = Math.max(rMax, height[r]);
      water += rMax - height[r];
      r--;
    }
  }
  return water;
}`,python:`def trap(height):
    l, r = 0, len(height) - 1
    l_max = r_max = water = 0
    while l < r:
        if height[l] < height[r]:
            l_max = max(l_max, height[l])
            water += l_max - height[l]
            l += 1
        else:
            r_max = max(r_max, height[r])
            water += r_max - height[r]
            r -= 1
    return water`,java:`int trap(int[] h) {
    int l = 0, r = h.length-1, lMax = 0, rMax = 0, water = 0;
    while (l < r) {
        if (h[l] < h[r]) {
            lMax = Math.max(lMax, h[l]);
            water += lMax - h[l]; l++;
        } else {
            rMax = Math.max(rMax, h[r]);
            water += rMax - h[r]; r--;
        }
    }
    return water;
}`,cpp:`int trap(vector<int>& h) {
    int l = 0, r = h.size()-1, lMax = 0, rMax = 0, water = 0;
    while (l < r) {
        if (h[l] < h[r]) {
            lMax = max(lMax, h[l]);
            water += lMax - h[l]; l++;
        } else {
            rMax = max(rMax, h[r]);
            water += rMax - h[r]; r--;
        }
    }
    return water;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("water")?7:(r=i.message)!=null&&r.includes("left")?5:4:-1}},"merge-sorted-array":{javascript:`function merge(nums1, m, nums2, n) {
  let i = m - 1, j = n - 1, k = m + n - 1;
  while (i >= 0 && j >= 0) {
    if (nums1[i] > nums2[j]) nums1[k--] = nums1[i--];
    else nums1[k--] = nums2[j--];
  }
  while (j >= 0) nums1[k--] = nums2[j--];
}`,python:`def merge(nums1, m, nums2, n):
    i, j, k = m-1, n-1, m+n-1
    while i >= 0 and j >= 0:
        if nums1[i] > nums2[j]: nums1[k] = nums1[i]; i -= 1
        else: nums1[k] = nums2[j]; j -= 1
        k -= 1
    while j >= 0: nums1[k] = nums2[j]; j -= 1; k -= 1`,java:`void merge(int[] n1, int m, int[] n2, int n) {
    int i = m-1, j = n-1, k = m+n-1;
    while (i >= 0 && j >= 0) {
        if (n1[i] > n2[j]) n1[k--] = n1[i--];
        else n1[k--] = n2[j--];
    }
    while (j >= 0) n1[k--] = n2[j--];
}`,cpp:`void merge(vector<int>& n1, int m, vector<int>& n2, int n) {
    int i = m-1, j = n-1, k = m+n-1;
    while (i >= 0 && j >= 0) {
        if (n1[i] > n2[j]) n1[k--] = n1[i--];
        else n1[k--] = n2[j--];
    }
    while (j >= 0) n1[k--] = n2[j--];
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("Place")?4:3:-1}},"subarray-sum-k":{javascript:`function subarraySum(nums, k) {
  const map = new Map([[0, 1]]);
  let sum = 0, count = 0;
  for (const n of nums) {
    sum += n;
    count += map.get(sum - k) || 0;
    map.set(sum, (map.get(sum)||0) + 1);
  }
  return count;
}`,python:`def subarray_sum(nums, k):
    prefix = {0: 1}
    total = count = 0
    for n in nums:
        total += n
        count += prefix.get(total - k, 0)
        prefix[total] = prefix.get(total, 0) + 1
    return count`,java:`int subarraySum(int[] nums, int k) {
    Map<Integer,Integer> map = new HashMap<>(Map.of(0,1));
    int sum = 0, count = 0;
    for (int n : nums) {
        sum += n;
        count += map.getOrDefault(sum-k, 0);
        map.merge(sum, 1, Integer::sum);
    }
    return count;
}`,cpp:`int subarraySum(vector<int>& nums, int k) {
    unordered_map<int,int> map{{0,1}};
    int sum = 0, count = 0;
    for (int n : nums) {
        sum += n;
        count += map[sum-k];
        map[sum]++;
    }
    return count;
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("Found")?6:5:-1}},"contiguous-array":{javascript:`function findMaxLength(nums) {
  const map = new Map([[0, -1]]);
  let count = 0, best = 0;
  for (let i = 0; i < nums.length; i++) {
    count += nums[i] === 1 ? 1 : -1;
    if (map.has(count))
      best = Math.max(best, i - map.get(count));
    else map.set(count, i);
  }
  return best;
}`,python:`def find_max_length(nums):
    prefix = {0: -1}
    count = best = 0
    for i, n in enumerate(nums):
        count += 1 if n == 1 else -1
        if count in prefix:
            best = max(best, i - prefix[count])
        else: prefix[count] = i
    return best`,java:`int findMaxLength(int[] nums) {
    Map<Integer,Integer> map = new HashMap<>(Map.of(0,-1));
    int count = 0, best = 0;
    for (int i = 0; i < nums.length; i++) {
        count += nums[i] == 1 ? 1 : -1;
        if (map.containsKey(count))
            best = Math.max(best, i - map.get(count));
        else map.put(count, i);
    }
    return best;
}`,cpp:`int findMaxLength(vector<int>& nums) {
    unordered_map<int,int> map{{0,-1}};
    int count = 0, best = 0;
    for (int i = 0; i < nums.size(); i++) {
        count += nums[i] == 1 ? 1 : -1;
        if (map.count(count))
            best = max(best, i - map[count]);
        else map[count] = i;
    }
    return best;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Update")?5:(r=i.message)!=null&&r.includes("best")?7:4:-1}},"longest-substring":{javascript:`function lengthOfLongestSubstring(s) {
  const map = new Map();
  let best = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]))
      left = Math.max(left, map.get(s[right]) + 1);
    map.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,python:`def length_of_longest_substring(s):
    seen = {}
    best = left = 0
    for right, c in enumerate(s):
        if c in seen:
            left = max(left, seen[c] + 1)
        seen[c] = right
        best = max(best, right - left + 1)
    return best`,java:`int lengthOfLongestSubstring(String s) {
    Map<Character,Integer> map = new HashMap<>();
    int best = 0, left = 0;
    for (int r = 0; r < s.length(); r++) {
        if (map.containsKey(s.charAt(r)))
            left = Math.max(left, map.get(s.charAt(r))+1);
        map.put(s.charAt(r), r);
        best = Math.max(best, r-left+1);
    }
    return best;
}`,cpp:`int lengthOfLongestSubstring(string s) {
    unordered_map<char,int> map;
    int best = 0, left = 0;
    for (int r = 0; r < s.size(); r++) {
        if (map.count(s[r]))
            left = max(left, map[s[r]]+1);
        map[s[r]] = r;
        best = max(best, r-left+1);
    }
    return best;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Shrink")?6:(r=i.message)!=null&&r.includes("best")?8:4:-1}},"permutation-in-string":{javascript:`function checkInclusion(s1, s2) {
  const freq = new Array(26).fill(0);
  for (const c of s1) freq[c.charCodeAt(0)-97]++;
  let l = 0, match = 0;
  for (let r = 0; r < s2.length; r++) {
    if (--freq[s2.charCodeAt(r)-97] >= 0) match++;
    if (r - l + 1 > s1.length)
      if (++freq[s2.charCodeAt(l++)-97] > 0) match--;
    if (match === s1.length) return true;
  }
  return false;
}`,python:`def check_inclusion(s1, s2):
    from collections import Counter
    freq = Counter(s1)
    window = {}; match = 0; l = 0
    for r, c in enumerate(s2):
        window[c] = window.get(c, 0) + 1
        if window[c] == freq.get(c, 0): match += 1
        if r - l + 1 > len(s1):
            lc = s2[l]; l += 1
            if window[lc] == freq.get(lc, 0): match -= 1
            window[lc] -= 1
        if match == len(freq): return True
    return False`,java:`boolean checkInclusion(String s1, String s2) {
    int[] freq = new int[26];
    for (char c : s1.toCharArray()) freq[c-'a']++;
    int l = 0, match = 0;
    for (int r = 0; r < s2.length(); r++) {
        if (--freq[s2.charAt(r)-'a'] >= 0) match++;
        if (r-l+1 > s1.length())
            if (++freq[s2.charAt(l++)-'a'] > 0) match--;
        if (match == s1.length()) return true;
    }
    return false;
}`,cpp:`bool checkInclusion(string s1, string s2) {
    int freq[26]={};
    for (char c : s1) freq[c-'a']++;
    int l = 0, match = 0;
    for (int r = 0; r < s2.size(); r++) {
        if (--freq[s2[r]-'a'] >= 0) match++;
        if (r-l+1 > (int)s1.size())
            if (++freq[s2[l++]-'a'] > 0) match--;
        if (match == (int)s1.size()) return true;
    }
    return false;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("match")?9:(r=i.message)!=null&&r.includes("Slide")?7:5:-1}},"max-consecutive-ones":{javascript:`function longestOnes(nums, k) {
  let l = 0, zeros = 0, best = 0;
  for (let r = 0; r < nums.length; r++) {
    if (nums[r] === 0) zeros++;
    while (zeros > k) {
      if (nums[l] === 0) zeros--;
      l++;
    }
    best = Math.max(best, r - l + 1);
  }
  return best;
}`,python:`def longest_ones(nums, k):
    l = zeros = best = 0
    for r in range(len(nums)):
        if nums[r] == 0: zeros += 1
        while zeros > k:
            if nums[l] == 0: zeros -= 1
            l += 1
        best = max(best, r - l + 1)
    return best`,java:`int longestOnes(int[] nums, int k) {
    int l = 0, zeros = 0, best = 0;
    for (int r = 0; r < nums.length; r++) {
        if (nums[r] == 0) zeros++;
        while (zeros > k) {
            if (nums[l] == 0) zeros--;
            l++;
        }
        best = Math.max(best, r-l+1);
    }
    return best;
}`,cpp:`int longestOnes(vector<int>& nums, int k) {
    int l = 0, zeros = 0, best = 0;
    for (int r = 0; r < nums.size(); r++) {
        if (nums[r] == 0) zeros++;
        while (zeros > k) {
            if (nums[l] == 0) zeros--;
            l++;
        }
        best = max(best, r-l+1);
    }
    return best;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Shrink")?6:(r=i.message)!=null&&r.includes("best")?8:4:-1}},"max-product-subarray":{javascript:`function maxProduct(nums) {
  let maxP = nums[0], minP = nums[0], result = nums[0];
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < 0) [maxP, minP] = [minP, maxP];
    maxP = Math.max(nums[i], maxP * nums[i]);
    minP = Math.min(nums[i], minP * nums[i]);
    result = Math.max(result, maxP);
  }
  return result;
}`,python:`def max_product(nums):
    max_p = min_p = result = nums[0]
    for n in nums[1:]:
        if n < 0: max_p, min_p = min_p, max_p
        max_p = max(n, max_p * n)
        min_p = min(n, min_p * n)
        result = max(result, max_p)
    return result`,java:`int maxProduct(int[] nums) {
    int maxP = nums[0], minP = nums[0], result = nums[0];
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] < 0) { int t = maxP; maxP = minP; minP = t; }
        maxP = Math.max(nums[i], maxP * nums[i]);
        minP = Math.min(nums[i], minP * nums[i]);
        result = Math.max(result, maxP);
    }
    return result;
}`,cpp:`int maxProduct(vector<int>& nums) {
    int maxP = nums[0], minP = nums[0], result = nums[0];
    for (int i = 1; i < nums.size(); i++) {
        if (nums[i] < 0) swap(maxP, minP);
        maxP = max(nums[i], maxP * nums[i]);
        minP = min(nums[i], minP * nums[i]);
        result = max(result, maxP);
    }
    return result;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("product")?5:(r=i.message)!=null&&r.includes("result")?7:3:-1}},"valid-parentheses":{javascript:`function isValid(s) {
  const stack = [], map = {')':'(',']':'[','}':'{'};
  for (const c of s) {
    if ('([{'.includes(c)) stack.push(c);
    else if (stack.pop() !== map[c]) return false;
  }
  return stack.length === 0;
}`,python:`def is_valid(s):
    stack, m = [], {')':'(',']':'[','}':'{'}
    for c in s:
        if c in '([{': stack.append(c)
        elif not stack or stack.pop() != m[c]: return False
    return len(stack) == 0`,java:`boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character,Character> m = Map.of(')','(',']','[','}','{');
    for (char c : s.toCharArray()) {
        if ("([{".indexOf(c) >= 0) stack.push(c);
        else if (stack.isEmpty() || stack.pop() != m.get(c)) return false;
    }
    return stack.isEmpty();
}`,cpp:`bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c=='('||c=='['||c=='{') st.push(c);
        else {
            if (st.empty()) return false;
            char t = st.top(); st.pop();
            if ((c==')'&&t!='(')||(c==']'&&t!='[')||(c=='}'&&t!='{')) return false;
        }
    }
    return st.empty();
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Push")?4:(r=i.message)!=null&&r.includes("Pop")?5:3:-1}},"daily-temperatures":{javascript:`function dailyTemperatures(temps) {
  const res = new Array(temps.length).fill(0);
  const stack = [];
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[i] > temps[stack.at(-1)]) {
      const j = stack.pop();
      res[j] = i - j;
    }
    stack.push(i);
  }
  return res;
}`,python:`def daily_temperatures(temps):
    res = [0] * len(temps)
    stack = []
    for i, t in enumerate(temps):
        while stack and t > temps[stack[-1]]:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res`,java:`int[] dailyTemperatures(int[] temps) {
    int[] res = new int[temps.length];
    Deque<Integer> stack = new ArrayDeque<>();
    for (int i = 0; i < temps.length; i++) {
        while (!stack.isEmpty() && temps[i] > temps[stack.peek()])
            { int j = stack.pop(); res[j] = i - j; }
        stack.push(i);
    }
    return res;
}`,cpp:`vector<int> dailyTemperatures(vector<int>& temps) {
    vector<int> res(temps.size(), 0);
    stack<int> st;
    for (int i = 0; i < temps.size(); i++) {
        while (!st.empty() && temps[i] > temps[st.top()])
            { int j = st.top(); st.pop(); res[j] = i - j; }
        st.push(i);
    }
    return res;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Pop")?6:(r=i.message)!=null&&r.includes("Push")?8:5:-1}},"eval-rpn":{javascript:`function evalRPN(tokens) {
  const stack = [];
  for (const t of tokens) {
    if ('+-*/'.includes(t)) {
      const b = stack.pop(), a = stack.pop();
      if (t==='+') stack.push(a+b);
      else if (t==='-') stack.push(a-b);
      else if (t==='*') stack.push(a*b);
      else stack.push(Math.trunc(a/b));
    } else stack.push(Number(t));
  }
  return stack[0];
}`,python:`def eval_rpn(tokens):
    stack = []
    for t in tokens:
        if t in '+-*/':
            b, a = stack.pop(), stack.pop()
            if t=='+': stack.append(a+b)
            elif t=='-': stack.append(a-b)
            elif t=='*': stack.append(a*b)
            else: stack.append(int(a/b))
        else: stack.append(int(t))
    return stack[0]`,java:`int evalRPN(String[] tokens) {
    Deque<Integer> stack = new ArrayDeque<>();
    for (String t : tokens) {
        if ("+-*/".contains(t)) {
            int b = stack.pop(), a = stack.pop();
            switch(t) { case "+": stack.push(a+b); break;
                case "-": stack.push(a-b); break;
                case "*": stack.push(a*b); break;
                default: stack.push(a/b); }
        } else stack.push(Integer.parseInt(t));
    }
    return stack.peek();
}`,cpp:`int evalRPN(vector<string>& tokens) {
    stack<int> st;
    for (auto& t : tokens) {
        if (t=="+"||t=="-"||t=="*"||t=="/") {
            int b = st.top(); st.pop();
            int a = st.top(); st.pop();
            if (t=="+") st.push(a+b);
            else if (t=="-") st.push(a-b);
            else if (t=="*") st.push(a*b);
            else st.push(a/b);
        } else st.push(stoi(t));
    }
    return st.top();
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Apply")?6:(r=i.message)!=null&&r.includes("Push")?10:3:-1}},"largest-rectangle":{javascript:`function largestRectangle(heights) {
  const stack = [-1]; let best = 0;
  for (let i = 0; i <= heights.length; i++) {
    const h = i < heights.length ? heights[i] : 0;
    while (stack.length > 1 && h < heights[stack.at(-1)]) {
      const height = heights[stack.pop()];
      const width = i - stack.at(-1) - 1;
      best = Math.max(best, height * width);
    }
    stack.push(i);
  }
  return best;
}`,python:`def largest_rectangle(heights):
    stack, best = [-1], 0
    for i in range(len(heights) + 1):
        h = heights[i] if i < len(heights) else 0
        while len(stack) > 1 and h < heights[stack[-1]]:
            height = heights[stack.pop()]
            width = i - stack[-1] - 1
            best = max(best, height * width)
        stack.append(i)
    return best`,java:`int largestRectangle(int[] h) {
    Deque<Integer> stack = new ArrayDeque<>();
    stack.push(-1); int best = 0;
    for (int i = 0; i <= h.length; i++) {
        int cur = i < h.length ? h[i] : 0;
        while (stack.size() > 1 && cur < h[stack.peek()])
            { int height = h[stack.pop()]; best = Math.max(best, height*(i-stack.peek()-1)); }
        stack.push(i);
    }
    return best;
}`,cpp:`int largestRectangle(vector<int>& h) {
    stack<int> st; st.push(-1); int best = 0;
    for (int i = 0; i <= h.size(); i++) {
        int cur = i < h.size() ? h[i] : 0;
        while (st.size() > 1 && cur < h[st.top()])
            { int height = h[st.top()]; st.pop(); best = max(best, height*(i-st.top()-1)); }
        st.push(i);
    }
    return best;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Pop")?6:(r=i.message)!=null&&r.includes("area")?8:5:-1}},"sliding-window-max":{javascript:`function maxSlidingWindow(nums, k) {
  const deque = [], result = [];
  for (let i = 0; i < nums.length; i++) {
    while (deque.length && deque[0] <= i - k) deque.shift();
    while (deque.length && nums[deque.at(-1)] < nums[i]) deque.pop();
    deque.push(i);
    if (i >= k - 1) result.push(nums[deque[0]]);
  }
  return result;
}`,python:`from collections import deque
def max_sliding_window(nums, k):
    dq, result = deque(), []
    for i, n in enumerate(nums):
        while dq and dq[0] <= i - k: dq.popleft()
        while dq and nums[dq[-1]] < n: dq.pop()
        dq.append(i)
        if i >= k - 1: result.append(nums[dq[0]])
    return result`,java:`int[] maxSlidingWindow(int[] nums, int k) {
    Deque<Integer> dq = new ArrayDeque<>();
    int[] res = new int[nums.length - k + 1]; int ri = 0;
    for (int i = 0; i < nums.length; i++) {
        while (!dq.isEmpty() && dq.peekFirst() <= i-k) dq.pollFirst();
        while (!dq.isEmpty() && nums[dq.peekLast()] < nums[i]) dq.pollLast();
        dq.offerLast(i);
        if (i >= k-1) res[ri++] = nums[dq.peekFirst()];
    }
    return res;
}`,cpp:`vector<int> maxSlidingWindow(vector<int>& nums, int k) {
    deque<int> dq; vector<int> res;
    for (int i = 0; i < nums.size(); i++) {
        while (!dq.empty() && dq.front() <= i-k) dq.pop_front();
        while (!dq.empty() && nums[dq.back()] < nums[i]) dq.pop_back();
        dq.push_back(i);
        if (i >= k-1) res.push_back(nums[dq.front()]);
    }
    return res;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Remove")?4:(r=i.message)!=null&&r.includes("max")?7:3:-1}},"search-insert":{javascript:`function searchInsert(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    else if (nums[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return lo;
}`,python:`def search_insert(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        elif nums[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return lo`,java:`int searchInsert(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return lo;
}`,cpp:`int searchInsert(vector<int>& nums, int target) {
    int lo = 0, hi = nums.size() - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return lo;
}`,stepToLine:i=>{var e;return i?i.found!==void 0?5:(e=i.message)!=null&&e.includes("Mid")?4:3:-1}},"search-rotated":{javascript:`function search(nums, target) {
  let lo = 0, hi = nums.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] === target) return mid;
    if (nums[lo] <= nums[mid]) {
      if (target >= nums[lo] && target < nums[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (target > nums[mid] && target <= nums[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`,python:`def search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        if nums[lo] <= nums[mid]:
            if nums[lo] <= target < nums[mid]: hi = mid - 1
            else: lo = mid + 1
        else:
            if nums[mid] < target <= nums[hi]: lo = mid + 1
            else: hi = mid - 1
    return -1`,java:`int search(int[] nums, int target) {
    int lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {
            if (target >= nums[lo] && target < nums[mid]) hi = mid-1;
            else lo = mid+1;
        } else {
            if (target > nums[mid] && target <= nums[hi]) lo = mid+1;
            else hi = mid-1;
        }
    }
    return -1;
}`,cpp:`int search(vector<int>& nums, int target) {
    int lo = 0, hi = nums.size() - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] == target) return mid;
        if (nums[lo] <= nums[mid]) {
            if (target >= nums[lo] && target < nums[mid]) hi = mid-1;
            else lo = mid+1;
        } else {
            if (target > nums[mid] && target <= nums[hi]) lo = mid+1;
            else hi = mid-1;
        }
    }
    return -1;
}`,stepToLine:i=>{var e;return i?i.found!==void 0?5:(e=i.message)!=null&&e.includes("sorted half")?6:4:-1}},"find-peak":{javascript:`function findPeak(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] < nums[mid + 1]) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}`,python:`def find_peak(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < nums[mid + 1]: lo = mid + 1
        else: hi = mid
    return lo`,java:`int findPeak(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,cpp:`int findPeak(vector<int>& nums) {
    int lo = 0, hi = nums.size() - 1;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] < nums[mid + 1]) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("climb")?5:(r=i.message)!=null&&r.includes("descend")?6:4:-1}},"find-min-rotated":{javascript:`function findMin(nums) {
  let lo = 0, hi = nums.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (nums[mid] > nums[hi]) lo = mid + 1;
    else hi = mid;
  }
  return nums[lo];
}`,python:`def find_min(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]: lo = mid + 1
        else: hi = mid
    return nums[lo]`,java:`int findMin(int[] nums) {
    int lo = 0, hi = nums.length - 1;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
}`,cpp:`int findMin(vector<int>& nums) {
    int lo = 0, hi = nums.size() - 1;
    while (lo < hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else hi = mid;
    }
    return nums[lo];
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("right half")?5:(r=i.message)!=null&&r.includes("left half")?6:4:-1}},permutations:{javascript:`function permute(nums) {
  const res = [];
  function bt(cur, rem) {
    if (!rem.length) { res.push([...cur]); return; }
    for (let i = 0; i < rem.length; i++) {
      cur.push(rem[i]);
      bt(cur, [...rem.slice(0,i),...rem.slice(i+1)]);
      cur.pop();
    }
  }
  bt([], nums); return res;
}`,python:`def permute(nums):
    res = []
    def bt(cur, rem):
        if not rem: res.append(cur[:]); return
        for i in range(len(rem)):
            cur.append(rem[i])
            bt(cur, rem[:i]+rem[i+1:])
            cur.pop()
    bt([], nums); return res`,java:`List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> res = new ArrayList<>();
    bt(res, new ArrayList<>(), nums, new boolean[nums.length]);
    return res;
}
void bt(List<List<Integer>> res, List<Integer> cur, int[] nums, boolean[] used) {
    if (cur.size() == nums.length) { res.add(new ArrayList<>(cur)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true; cur.add(nums[i]);
        bt(res, cur, nums, used);
        cur.remove(cur.size()-1); used[i] = false;
    }
}`,cpp:`vector<vector<int>> permute(vector<int>& nums) {
    vector<vector<int>> res;
    sort(nums.begin(), nums.end());
    do { res.push_back(nums); }
    while (next_permutation(nums.begin(), nums.end()));
    return res;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Choose")?5:(r=i.message)!=null&&r.includes("Record")?4:3:-1}},"spiral-matrix":{javascript:`function spiralOrder(matrix) {
  const res = [];
  let t=0, b=matrix.length-1, l=0, r=matrix[0].length-1;
  while (t<=b && l<=r) {
    for (let i=l;i<=r;i++) res.push(matrix[t][i]); t++;
    for (let i=t;i<=b;i++) res.push(matrix[i][r]); r--;
    if (t<=b) { for (let i=r;i>=l;i--) res.push(matrix[b][i]); b--; }
    if (l<=r) { for (let i=b;i>=t;i--) res.push(matrix[i][l]); l++; }
  }
  return res;
}`,python:`def spiral_order(matrix):
    res = []; t,b,l,r = 0,len(matrix)-1,0,len(matrix[0])-1
    while t<=b and l<=r:
        for i in range(l,r+1): res.append(matrix[t][i]); t+=1
        for i in range(t,b+1): res.append(matrix[i][r]); r-=1
        if t<=b:
            for i in range(r,l-1,-1): res.append(matrix[b][i]); b-=1
        if l<=r:
            for i in range(b,t-1,-1): res.append(matrix[i][l]); l+=1
    return res`,java:`List<Integer> spiralOrder(int[][] m) {
    List<Integer> res = new ArrayList<>();
    int t=0,b=m.length-1,l=0,r=m[0].length-1;
    while (t<=b && l<=r) {
        for (int i=l;i<=r;i++) res.add(m[t][i]); t++;
        for (int i=t;i<=b;i++) res.add(m[i][r]); r--;
        if (t<=b) { for (int i=r;i>=l;i--) res.add(m[b][i]); b--; }
        if (l<=r) { for (int i=b;i>=t;i--) res.add(m[i][l]); l++; }
    }
    return res;
}`,cpp:`vector<int> spiralOrder(vector<vector<int>>& m) {
    vector<int> res;
    int t=0,b=m.size()-1,l=0,r=m[0].size()-1;
    while (t<=b && l<=r) {
        for (int i=l;i<=r;i++) res.push_back(m[t][i]); t++;
        for (int i=t;i<=b;i++) res.push_back(m[i][r]); r--;
        if (t<=b) { for (int i=r;i>=l;i--) res.push_back(m[b][i]); b--; }
        if (l<=r) { for (int i=b;i>=t;i--) res.push_back(m[i][l]); l++; }
    }
    return res;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("right")?5:(r=i.message)!=null&&r.includes("down")?6:4:-1}},"rotate-image":{javascript:`function rotate(matrix) {
  const n = matrix.length;
  // Transpose
  for (let i=0;i<n;i++)
    for (let j=i+1;j<n;j++)
      [matrix[i][j],matrix[j][i]]=[matrix[j][i],matrix[i][j]];
  // Reverse each row
  for (let i=0;i<n;i++) matrix[i].reverse();
}`,python:`def rotate(matrix):
    n = len(matrix)
    # Transpose
    for i in range(n):
        for j in range(i+1,n):
            matrix[i][j],matrix[j][i]=matrix[j][i],matrix[i][j]
    # Reverse each row
    for row in matrix: row.reverse()`,java:`void rotate(int[][] m) {
    int n = m.length;
    for (int i=0;i<n;i++)
        for (int j=i+1;j<n;j++)
            { int t=m[i][j]; m[i][j]=m[j][i]; m[j][i]=t; }
    for (int[] row : m) {
        int l=0,r=n-1;
        while(l<r){int t=row[l];row[l]=row[r];row[r]=t;l++;r--;}
    }
}`,cpp:`void rotate(vector<vector<int>>& m) {
    int n = m.size();
    for (int i=0;i<n;i++)
        for (int j=i+1;j<n;j++) swap(m[i][j],m[j][i]);
    for (auto& row : m) reverse(row.begin(),row.end());
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Transpose")?4:(r=i.message)!=null&&r.includes("Reverse")?7:3:-1}},"set-matrix-zeroes":{javascript:`function setZeroes(matrix) {
  const m=matrix.length, n=matrix[0].length;
  const rows=new Set(), cols=new Set();
  for (let i=0;i<m;i++)
    for (let j=0;j<n;j++)
      if (matrix[i][j]===0) { rows.add(i); cols.add(j); }
  for (let i=0;i<m;i++)
    for (let j=0;j<n;j++)
      if (rows.has(i)||cols.has(j)) matrix[i][j]=0;
}`,python:`def set_zeroes(matrix):
    m,n = len(matrix),len(matrix[0])
    rows,cols = set(),set()
    for i in range(m):
        for j in range(n):
            if matrix[i][j]==0: rows.add(i); cols.add(j)
    for i in range(m):
        for j in range(n):
            if i in rows or j in cols: matrix[i][j]=0`,java:`void setZeroes(int[][] matrix) {
    int m=matrix.length,n=matrix[0].length;
    Set<Integer> rows=new HashSet<>(),cols=new HashSet<>();
    for (int i=0;i<m;i++)
        for (int j=0;j<n;j++)
            if (matrix[i][j]==0){rows.add(i);cols.add(j);}
    for (int i=0;i<m;i++)
        for (int j=0;j<n;j++)
            if (rows.contains(i)||cols.contains(j)) matrix[i][j]=0;
}`,cpp:`void setZeroes(vector<vector<int>>& m) {
    set<int> rows,cols;
    for (int i=0;i<m.size();i++)
        for (int j=0;j<m[0].size();j++)
            if (m[i][j]==0){rows.insert(i);cols.insert(j);}
    for (int i=0;i<m.size();i++)
        for (int j=0;j<m[0].size();j++)
            if (rows.count(i)||cols.count(j)) m[i][j]=0;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("zero")?6:(r=i.message)!=null&&r.includes("Set")?8:4:-1}},"dp-lis":{javascript:`function lengthOfLIS(nums) {
  const dp = new Array(nums.length).fill(1);
  for (let i=1;i<nums.length;i++)
    for (let j=0;j<i;j++)
      if (nums[j]<nums[i]) dp[i]=Math.max(dp[i],dp[j]+1);
  return Math.max(...dp);
}`,python:`def length_of_lis(nums):
    dp = [1]*len(nums)
    for i in range(1,len(nums)):
        for j in range(i):
            if nums[j]<nums[i]: dp[i]=max(dp[i],dp[j]+1)
    return max(dp)`,java:`int lengthOfLIS(int[] nums) {
    int[] dp = new int[nums.length]; Arrays.fill(dp,1);
    for (int i=1;i<nums.length;i++)
        for (int j=0;j<i;j++)
            if (nums[j]<nums[i]) dp[i]=Math.max(dp[i],dp[j]+1);
    return Arrays.stream(dp).max().getAsInt();
}`,cpp:`int lengthOfLIS(vector<int>& nums) {
    vector<int> dp(nums.size(),1);
    for (int i=1;i<nums.size();i++)
        for (int j=0;j<i;j++)
            if (nums[j]<nums[i]) dp[i]=max(dp[i],dp[j]+1);
    return *max_element(dp.begin(),dp.end());
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("dp[")?5:3:-1}},"dp-house-robber":{javascript:`function rob(nums) {
  let prev2=0, prev1=0;
  for (const n of nums) {
    const cur = Math.max(prev1, prev2 + n);
    prev2 = prev1; prev1 = cur;
  }
  return prev1;
}`,python:`def rob(nums):
    prev2 = prev1 = 0
    for n in nums:
        cur = max(prev1, prev2 + n)
        prev2, prev1 = prev1, cur
    return prev1`,java:`int rob(int[] nums) {
    int prev2=0,prev1=0;
    for (int n:nums){int c=Math.max(prev1,prev2+n);prev2=prev1;prev1=c;}
    return prev1;
}`,cpp:`int rob(vector<int>& nums) {
    int prev2=0,prev1=0;
    for (int n:nums){int c=max(prev1,prev2+n);prev2=prev1;prev1=c;}
    return prev1;
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("dp[")?4:3:-1}},"dp-coin-change":{javascript:`function coinChange(coins, amount) {
  const dp = new Array(amount+1).fill(Infinity);
  dp[0] = 0;
  for (let i=1;i<=amount;i++)
    for (const c of coins)
      if (c<=i) dp[i] = Math.min(dp[i], dp[i-c]+1);
  return dp[amount]===Infinity ? -1 : dp[amount];
}`,python:`def coin_change(coins, amount):
    dp = [float('inf')]*(amount+1)
    dp[0] = 0
    for i in range(1,amount+1):
        for c in coins:
            if c<=i: dp[i]=min(dp[i],dp[i-c]+1)
    return dp[amount] if dp[amount]!=float('inf') else -1`,java:`int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount+1]; Arrays.fill(dp,amount+1);
    dp[0]=0;
    for (int i=1;i<=amount;i++)
        for (int c:coins)
            if (c<=i) dp[i]=Math.min(dp[i],dp[i-c]+1);
    return dp[amount]>amount?-1:dp[amount];
}`,cpp:`int coinChange(vector<int>& coins, int amount) {
    vector<int> dp(amount+1,amount+1); dp[0]=0;
    for (int i=1;i<=amount;i++)
        for (int c:coins)
            if (c<=i) dp[i]=min(dp[i],dp[i-c]+1);
    return dp[amount]>amount?-1:dp[amount];
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("dp[")?6:4:-1}},"dp-lcs":{javascript:`function longestCommonSubsequence(s1, s2) {
  const m=s1.length, n=s2.length;
  const dp = Array(m+1).fill(null).map(()=>Array(n+1).fill(0));
  for (let i=1;i<=m;i++)
    for (let j=1;j<=n;j++)
      dp[i][j] = s1[i-1]===s2[j-1] ? dp[i-1][j-1]+1 : Math.max(dp[i-1][j],dp[i][j-1]);
  return dp[m][n];
}`,python:`def lcs(s1, s2):
    m,n = len(s1),len(s2)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(1,m+1):
        for j in range(1,n+1):
            dp[i][j] = dp[i-1][j-1]+1 if s1[i-1]==s2[j-1] else max(dp[i-1][j],dp[i][j-1])
    return dp[m][n]`,java:`int lcs(String s1, String s2) {
    int m=s1.length(),n=s2.length();
    int[][] dp=new int[m+1][n+1];
    for (int i=1;i<=m;i++)
        for (int j=1;j<=n;j++)
            dp[i][j]=s1.charAt(i-1)==s2.charAt(j-1)?dp[i-1][j-1]+1:Math.max(dp[i-1][j],dp[i][j-1]);
    return dp[m][n];
}`,cpp:`int lcs(string s1, string s2) {
    int m=s1.size(),n=s2.size();
    vector<vector<int>> dp(m+1,vector<int>(n+1,0));
    for (int i=1;i<=m;i++)
        for (int j=1;j<=n;j++)
            dp[i][j]=s1[i-1]==s2[j-1]?dp[i-1][j-1]+1:max(dp[i-1][j],dp[i][j-1]);
    return dp[m][n];
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("dp[")?6:4:-1}},"dp-edit-distance":{javascript:`function minDistance(w1, w2) {
  const m=w1.length, n=w2.length;
  const dp=Array(m+1).fill(null).map((_,i)=>Array(n+1).fill(0).map((_,j)=>i===0?j:j===0?i:0));
  for (let i=1;i<=m;i++)
    for (let j=1;j<=n;j++)
      dp[i][j] = w1[i-1]===w2[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  return dp[m][n];
}`,python:`def min_distance(w1, w2):
    m,n = len(w1),len(w2)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(m+1): dp[i][0]=i
    for j in range(n+1): dp[0][j]=j
    for i in range(1,m+1):
        for j in range(1,n+1):
            dp[i][j]=dp[i-1][j-1] if w1[i-1]==w2[j-1] else 1+min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1])
    return dp[m][n]`,java:`int minDistance(String w1, String w2) {
    int m=w1.length(),n=w2.length();
    int[][] dp=new int[m+1][n+1];
    for (int i=0;i<=m;i++) dp[i][0]=i;
    for (int j=0;j<=n;j++) dp[0][j]=j;
    for (int i=1;i<=m;i++)
        for (int j=1;j<=n;j++)
            dp[i][j]=w1.charAt(i-1)==w2.charAt(j-1)?dp[i-1][j-1]:1+Math.min(dp[i-1][j],Math.min(dp[i][j-1],dp[i-1][j-1]));
    return dp[m][n];
}`,cpp:`int minDistance(string w1, string w2) {
    int m=w1.size(),n=w2.size();
    vector<vector<int>> dp(m+1,vector<int>(n+1));
    for (int i=0;i<=m;i++) dp[i][0]=i;
    for (int j=0;j<=n;j++) dp[0][j]=j;
    for (int i=1;i<=m;i++)
        for (int j=1;j<=n;j++)
            dp[i][j]=w1[i-1]==w2[j-1]?dp[i-1][j-1]:1+min({dp[i-1][j],dp[i][j-1],dp[i-1][j-1]});
    return dp[m][n];
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("dp[")?6:4:-1}},"dp-unique-paths":{javascript:`function uniquePaths(m, n) {
  const dp=Array(m).fill(null).map(()=>Array(n).fill(1));
  for (let i=1;i<m;i++)
    for (let j=1;j<n;j++)
      dp[i][j]=dp[i-1][j]+dp[i][j-1];
  return dp[m-1][n-1];
}`,python:`def unique_paths(m, n):
    dp = [[1]*n for _ in range(m)]
    for i in range(1,m):
        for j in range(1,n):
            dp[i][j]=dp[i-1][j]+dp[i][j-1]
    return dp[m-1][n-1]`,java:`int uniquePaths(int m, int n) {
    int[][] dp=new int[m][n];
    for (int[] r:dp) Arrays.fill(r,1);
    for (int i=1;i<m;i++)
        for (int j=1;j<n;j++) dp[i][j]=dp[i-1][j]+dp[i][j-1];
    return dp[m-1][n-1];
}`,cpp:`int uniquePaths(int m, int n) {
    vector<vector<int>> dp(m,vector<int>(n,1));
    for (int i=1;i<m;i++)
        for (int j=1;j<n;j++) dp[i][j]=dp[i-1][j]+dp[i][j-1];
    return dp[m-1][n-1];
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("dp[")?5:3:-1}},"dp-min-path-sum":{javascript:`function minPathSum(grid) {
  const m=grid.length, n=grid[0].length;
  for (let i=1;i<m;i++) grid[i][0]+=grid[i-1][0];
  for (let j=1;j<n;j++) grid[0][j]+=grid[0][j-1];
  for (let i=1;i<m;i++)
    for (let j=1;j<n;j++)
      grid[i][j]+=Math.min(grid[i-1][j],grid[i][j-1]);
  return grid[m-1][n-1];
}`,python:`def min_path_sum(grid):
    m,n = len(grid),len(grid[0])
    for i in range(1,m): grid[i][0]+=grid[i-1][0]
    for j in range(1,n): grid[0][j]+=grid[0][j-1]
    for i in range(1,m):
        for j in range(1,n):
            grid[i][j]+=min(grid[i-1][j],grid[i][j-1])
    return grid[m-1][n-1]`,java:`int minPathSum(int[][] g) {
    int m=g.length,n=g[0].length;
    for (int i=1;i<m;i++) g[i][0]+=g[i-1][0];
    for (int j=1;j<n;j++) g[0][j]+=g[0][j-1];
    for (int i=1;i<m;i++)
        for (int j=1;j<n;j++) g[i][j]+=Math.min(g[i-1][j],g[i][j-1]);
    return g[m-1][n-1];
}`,cpp:`int minPathSum(vector<vector<int>>& g) {
    int m=g.size(),n=g[0].size();
    for (int i=1;i<m;i++) g[i][0]+=g[i-1][0];
    for (int j=1;j<n;j++) g[0][j]+=g[0][j-1];
    for (int i=1;i<m;i++)
        for (int j=1;j<n;j++) g[i][j]+=min(g[i-1][j],g[i][j-1]);
    return g[m-1][n-1];
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("dp[")?7:5:-1}},"jump-game-ii":{javascript:`function jump(nums) {
  let jumps=0, end=0, farthest=0;
  for (let i=0;i<nums.length-1;i++) {
    farthest = Math.max(farthest, i+nums[i]);
    if (i===end) { jumps++; end=farthest; }
  }
  return jumps;
}`,python:`def jump(nums):
    jumps=end=farthest=0
    for i in range(len(nums)-1):
        farthest=max(farthest,i+nums[i])
        if i==end: jumps+=1; end=farthest
    return jumps`,java:`int jump(int[] nums) {
    int jumps=0,end=0,farthest=0;
    for (int i=0;i<nums.length-1;i++){
        farthest=Math.max(farthest,i+nums[i]);
        if (i==end){jumps++;end=farthest;}
    }
    return jumps;
}`,cpp:`int jump(vector<int>& nums) {
    int jumps=0,end=0,farthest=0;
    for (int i=0;i<nums.size()-1;i++){
        farthest=max(farthest,i+nums[i]);
        if (i==end){jumps++;end=farthest;}
    }
    return jumps;
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("Jump")?5:4:-1}},"gas-station":{javascript:`function canCompleteCircuit(gas, cost) {
  let total=0, tank=0, start=0;
  for (let i=0;i<gas.length;i++) {
    const net = gas[i]-cost[i];
    total += net; tank += net;
    if (tank < 0) { start=i+1; tank=0; }
  }
  return total>=0 ? start : -1;
}`,python:`def can_complete_circuit(gas, cost):
    total=tank=start=0
    for i in range(len(gas)):
        net = gas[i]-cost[i]
        total+=net; tank+=net
        if tank<0: start=i+1; tank=0
    return start if total>=0 else -1`,java:`int canCompleteCircuit(int[] gas, int[] cost) {
    int total=0,tank=0,start=0;
    for (int i=0;i<gas.length;i++){
        int net=gas[i]-cost[i]; total+=net; tank+=net;
        if (tank<0){start=i+1;tank=0;}
    }
    return total>=0?start:-1;
}`,cpp:`int canCompleteCircuit(vector<int>& gas, vector<int>& cost) {
    int total=0,tank=0,start=0;
    for (int i=0;i<gas.size();i++){
        int net=gas[i]-cost[i]; total+=net; tank+=net;
        if (tank<0){start=i+1;tank=0;}
    }
    return total>=0?start:-1;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Reset")?6:(r=i.message)!=null&&r.includes("net")?4:3:-1}},"number-of-islands":{javascript:`function numIslands(grid) {
  let count = 0;
  for (let i=0;i<grid.length;i++)
    for (let j=0;j<grid[0].length;j++)
      if (grid[i][j]==='1') { count++; dfs(grid,i,j); }
  return count;
}
function dfs(g,i,j) {
  if (i<0||j<0||i>=g.length||j>=g[0].length||g[i][j]!=='1') return;
  g[i][j]='0';
  dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);
}`,python:`def num_islands(grid):
    count = 0
    for i in range(len(grid)):
        for j in range(len(grid[0])):
            if grid[i][j]=='1': count+=1; dfs(grid,i,j)
    return count
def dfs(g,i,j):
    if i<0 or j<0 or i>=len(g) or j>=len(g[0]) or g[i][j]!='1': return
    g[i][j]='0'
    dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1)`,java:`int numIslands(char[][] grid) {
    int count = 0;
    for (int i=0;i<grid.length;i++)
        for (int j=0;j<grid[0].length;j++)
            if (grid[i][j]=='1'){count++;dfs(grid,i,j);}
    return count;
}
void dfs(char[][] g,int i,int j){
    if(i<0||j<0||i>=g.length||j>=g[0].length||g[i][j]!='1')return;
    g[i][j]='0';dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);
}`,cpp:`int numIslands(vector<vector<char>>& grid) {
    int count = 0;
    for (int i=0;i<grid.size();i++)
        for (int j=0;j<grid[0].size();j++)
            if (grid[i][j]=='1'){count++;dfs(grid,i,j);}
    return count;
}
void dfs(vector<vector<char>>& g,int i,int j){
    if(i<0||j<0||i>=g.size()||j>=g[0].size()||g[i][j]!='1')return;
    g[i][j]='0';dfs(g,i+1,j);dfs(g,i-1,j);dfs(g,i,j+1);dfs(g,i,j-1);
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Island")?5:(r=i.message)!=null&&r.includes("DFS")?9:3:-1}},"rotting-oranges":{javascript:`function orangesRotting(grid) {
  const q=[], m=grid.length, n=grid[0].length;
  let fresh=0;
  for (let i=0;i<m;i++)
    for (let j=0;j<n;j++) {
      if (grid[i][j]===2) q.push([i,j]);
      if (grid[i][j]===1) fresh++;
    }
  let mins=0;
  while (q.length && fresh) {
    mins++;
    for (let sz=q.length;sz>0;sz--) {
      const [r,c]=q.shift();
      for (const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nr=r+dr,nc=c+dc;
        if (nr>=0&&nc>=0&&nr<m&&nc<n&&grid[nr][nc]===1)
          { grid[nr][nc]=2; fresh--; q.push([nr,nc]); }
      }
    }
  }
  return fresh===0?mins:-1;
}`,python:`from collections import deque
def oranges_rotting(grid):
    q,m,n,fresh = deque(),len(grid),len(grid[0]),0
    for i in range(m):
        for j in range(n):
            if grid[i][j]==2: q.append((i,j))
            if grid[i][j]==1: fresh+=1
    mins=0
    while q and fresh:
        mins+=1
        for _ in range(len(q)):
            r,c=q.popleft()
            for dr,dc in [(1,0),(-1,0),(0,1),(0,-1)]:
                nr,nc=r+dr,c+dc
                if 0<=nr<m and 0<=nc<n and grid[nr][nc]==1:
                    grid[nr][nc]=2; fresh-=1; q.append((nr,nc))
    return mins if fresh==0 else -1`,java:`int orangesRotting(int[][] grid) {
    Queue<int[]> q=new LinkedList<>(); int fresh=0;
    int m=grid.length,n=grid[0].length;
    for (int i=0;i<m;i++) for (int j=0;j<n;j++){
        if (grid[i][j]==2) q.add(new int[]{i,j});
        if (grid[i][j]==1) fresh++; }
    int mins=0; int[][] dirs={{1,0},{-1,0},{0,1},{0,-1}};
    while (!q.isEmpty()&&fresh>0){ mins++;
        for (int sz=q.size();sz>0;sz--){ int[] p=q.poll();
            for (int[] d:dirs){ int nr=p[0]+d[0],nc=p[1]+d[1];
                if (nr>=0&&nc>=0&&nr<m&&nc<n&&grid[nr][nc]==1)
                    {grid[nr][nc]=2;fresh--;q.add(new int[]{nr,nc});}}}}
    return fresh==0?mins:-1;
}`,cpp:`int orangesRotting(vector<vector<int>>& grid) {
    queue<pair<int,int>> q; int fresh=0;
    int m=grid.size(),n=grid[0].size();
    for (int i=0;i<m;i++) for (int j=0;j<n;j++){
        if (grid[i][j]==2) q.push({i,j});
        if (grid[i][j]==1) fresh++; }
    int mins=0;
    while (!q.empty()&&fresh){ mins++;
        for (int sz=q.size();sz>0;sz--){ auto [r,c]=q.front();q.pop();
            for (auto [dr,dc]:vector<pair<int,int>>{{1,0},{-1,0},{0,1},{0,-1}}){
                int nr=r+dr,nc=c+dc;
                if (nr>=0&&nc>=0&&nr<m&&nc<n&&grid[nr][nc]==1)
                    {grid[nr][nc]=2;fresh--;q.push({nr,nc});}}}}
    return fresh==0?mins:-1;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("minute")?10:(r=i.message)!=null&&r.includes("rot")?13:4:-1}},"heap-sort":{javascript:`function heapSort(arr) {
  const n = arr.length;
  for (let i=Math.floor(n/2)-1;i>=0;i--) heapify(arr,n,i);
  for (let i=n-1;i>0;i--) {
    [arr[0],arr[i]]=[arr[i],arr[0]];
    heapify(arr,i,0);
  }
}
function heapify(a,n,i) {
  let largest=i,l=2*i+1,r=2*i+2;
  if (l<n&&a[l]>a[largest]) largest=l;
  if (r<n&&a[r]>a[largest]) largest=r;
  if (largest!==i) { [a[i],a[largest]]=[a[largest],a[i]]; heapify(a,n,largest); }
}`,python:`def heap_sort(arr):
    n = len(arr)
    for i in range(n//2-1,-1,-1): heapify(arr,n,i)
    for i in range(n-1,0,-1):
        arr[0],arr[i]=arr[i],arr[0]
        heapify(arr,i,0)
def heapify(a,n,i):
    largest,l,r = i,2*i+1,2*i+2
    if l<n and a[l]>a[largest]: largest=l
    if r<n and a[r]>a[largest]: largest=r
    if largest!=i: a[i],a[largest]=a[largest],a[i]; heapify(a,n,largest)`,java:`void heapSort(int[] arr) {
    int n=arr.length;
    for (int i=n/2-1;i>=0;i--) heapify(arr,n,i);
    for (int i=n-1;i>0;i--){
        int t=arr[0];arr[0]=arr[i];arr[i]=t;
        heapify(arr,i,0);
    }
}
void heapify(int[] a,int n,int i){
    int lg=i,l=2*i+1,r=2*i+2;
    if (l<n&&a[l]>a[lg]) lg=l; if (r<n&&a[r]>a[lg]) lg=r;
    if (lg!=i){int t=a[i];a[i]=a[lg];a[lg]=t;heapify(a,n,lg);}
}`,cpp:`void heapSort(vector<int>& arr) {
    int n=arr.size();
    for (int i=n/2-1;i>=0;i--) heapify(arr,n,i);
    for (int i=n-1;i>0;i--){
        swap(arr[0],arr[i]);
        heapify(arr,i,0);
    }
}
void heapify(vector<int>& a,int n,int i){
    int lg=i,l=2*i+1,r=2*i+2;
    if (l<n&&a[l]>a[lg]) lg=l; if (r<n&&a[r]>a[lg]) lg=r;
    if (lg!=i){swap(a[i],a[lg]);heapify(a,n,lg);}
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Heapify")?10:(r=i.message)!=null&&r.includes("Extract")?4:3:-1}},"counting-sort":{javascript:`function countingSort(arr) {
  const max = Math.max(...arr);
  const count = new Array(max+1).fill(0);
  for (const n of arr) count[n]++;
  let idx = 0;
  for (let i=0;i<=max;i++)
    while (count[i]-->0) arr[idx++]=i;
}`,python:`def counting_sort(arr):
    mx = max(arr)
    count = [0]*(mx+1)
    for n in arr: count[n]+=1
    idx = 0
    for i in range(mx+1):
        while count[i]>0: arr[idx]=i; idx+=1; count[i]-=1`,java:`void countingSort(int[] arr) {
    int max = Arrays.stream(arr).max().getAsInt();
    int[] count = new int[max+1];
    for (int n:arr) count[n]++;
    int idx=0;
    for (int i=0;i<=max;i++) while (count[i]-->0) arr[idx++]=i;
}`,cpp:`void countingSort(vector<int>& arr) {
    int mx = *max_element(arr.begin(),arr.end());
    vector<int> count(mx+1,0);
    for (int n:arr) count[n]++;
    int idx=0;
    for (int i=0;i<=mx;i++) while (count[i]-->0) arr[idx++]=i;
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("Count")?4:(r=i.message)!=null&&r.includes("Place")?6:3:-1}},"radix-sort":{javascript:`function radixSort(arr) {
  const max = Math.max(...arr);
  for (let exp=1; Math.floor(max/exp)>0; exp*=10) {
    const buckets = Array.from({length:10},()=>[]);
    for (const n of arr) buckets[Math.floor(n/exp)%10].push(n);
    let idx=0;
    for (const b of buckets) for (const n of b) arr[idx++]=n;
  }
}`,python:`def radix_sort(arr):
    mx = max(arr); exp = 1
    while mx // exp > 0:
        buckets = [[] for _ in range(10)]
        for n in arr: buckets[(n//exp)%10].append(n)
        idx = 0
        for b in buckets:
            for n in b: arr[idx]=n; idx+=1
        exp *= 10`,java:`void radixSort(int[] arr) {
    int max = Arrays.stream(arr).max().getAsInt();
    for (int exp=1;max/exp>0;exp*=10) {
        List<List<Integer>> buckets = new ArrayList<>();
        for (int i=0;i<10;i++) buckets.add(new ArrayList<>());
        for (int n:arr) buckets.get((n/exp)%10).add(n);
        int idx=0;
        for (var b:buckets) for (int n:b) arr[idx++]=n;
    }
}`,cpp:`void radixSort(vector<int>& arr) {
    int mx = *max_element(arr.begin(),arr.end());
    for (int exp=1;mx/exp>0;exp*=10) {
        vector<vector<int>> buckets(10);
        for (int n:arr) buckets[(n/exp)%10].push_back(n);
        int idx=0;
        for (auto& b:buckets) for (int n:b) arr[idx++]=n;
    }
}`,stepToLine:i=>{var e,r;return i?(e=i.message)!=null&&e.includes("digit")?4:(r=i.message)!=null&&r.includes("Collect")?6:3:-1}},"sort-colors":{javascript:`function sortColors(nums) {
  let lo=0, mid=0, hi=nums.length-1;
  while (mid <= hi) {
    if (nums[mid]===0) { [nums[lo],nums[mid]]=[nums[mid],nums[lo]]; lo++; mid++; }
    else if (nums[mid]===1) mid++;
    else { [nums[mid],nums[hi]]=[nums[hi],nums[mid]]; hi--; }
  }
}`,python:`def sort_colors(nums):
    lo,mid,hi = 0,0,len(nums)-1
    while mid <= hi:
        if nums[mid]==0: nums[lo],nums[mid]=nums[mid],nums[lo]; lo+=1; mid+=1
        elif nums[mid]==1: mid+=1
        else: nums[mid],nums[hi]=nums[hi],nums[mid]; hi-=1`,java:`void sortColors(int[] nums) {
    int lo=0,mid=0,hi=nums.length-1;
    while (mid<=hi) {
        if (nums[mid]==0) {int t=nums[lo];nums[lo]=nums[mid];nums[mid]=t;lo++;mid++;}
        else if (nums[mid]==1) mid++;
        else {int t=nums[mid];nums[mid]=nums[hi];nums[hi]=t;hi--;}
    }
}`,cpp:`void sortColors(vector<int>& nums) {
    int lo=0,mid=0,hi=nums.size()-1;
    while (mid<=hi) {
        if (nums[mid]==0) swap(nums[lo++],nums[mid++]);
        else if (nums[mid]==1) mid++;
        else swap(nums[mid],nums[hi--]);
    }
}`,stepToLine:i=>{var e;return i?(e=i.message)!=null&&e.includes("Swap")?4:3:-1}}},I=[{id:"javascript",label:"JavaScript",icon:"JS"},{id:"python",label:"Python",icon:"PY"},{id:"java",label:"Java",icon:"JV"},{id:"cpp",label:"C++",icon:"C+"}],q=[{label:"0.5×",value:1200},{label:"1×",value:600},{label:"1.5×",value:400},{label:"2×",value:300},{label:"4×",value:150}],Hr=[{id:"sorting",label:"Sorting",icon:"📊",gradient:"linear-gradient(135deg, #f472b6, #ec4899)"},{id:"array",label:"Array",icon:"📋",gradient:"linear-gradient(135deg, #60a5fa, #3b82f6)"},{id:"string",label:"String",icon:"🔤",gradient:"linear-gradient(135deg, #22d3ee, #06b6d4)"},{id:"hash-table",label:"Hash Table",icon:"🗃️",gradient:"linear-gradient(135deg, #fb923c, #f97316)"},{id:"searching",label:"Binary Search",icon:"🔍",gradient:"linear-gradient(135deg, #60a5fa, #3b82f6)"},{id:"two-pointers",label:"Two Pointers",icon:"↔️",gradient:"linear-gradient(135deg, #60a5fa, #818cf8)"},{id:"sliding-window",label:"Sliding Window",icon:"🪟",gradient:"linear-gradient(135deg, #34d399, #10b981)"},{id:"prefix-sum",label:"Prefix Sum",icon:"➕",gradient:"linear-gradient(135deg, #a78bfa, #8b5cf6)"},{id:"kadanes",label:"Kadane's Algorithm",icon:"📈",gradient:"linear-gradient(135deg, #fbbf24, #f59e0b)"},{id:"matrix",label:"Matrix",icon:"🔲",gradient:"linear-gradient(135deg, #818cf8, #6366f1)"},{id:"stack",label:"Stack",icon:"📚",gradient:"linear-gradient(135deg, #f97316, #ea580c)"},{id:"queue",label:"Queue",icon:"📬",gradient:"linear-gradient(135deg, #22d3ee, #0891b2)"},{id:"intervals",label:"Intervals",icon:"🔗",gradient:"linear-gradient(135deg, #f472b6, #e879f9)"},{id:"graph",label:"Graph",icon:"🕸️",gradient:"linear-gradient(135deg, #22d3ee, #06b6d4)"},{id:"backtracking",label:"Backtracking",icon:"🌳",gradient:"linear-gradient(135deg, #c084fc, #a855f7)"},{id:"greedy",label:"Greedy",icon:"🏆",gradient:"linear-gradient(135deg, #4ade80, #22c55e)"},{id:"dp",label:"Dynamic Programming",icon:"🧬",gradient:"linear-gradient(135deg, #22d3ee, #ef4444)"},{id:"bit-manipulation",label:"Bit Manipulation",icon:"💻",gradient:"linear-gradient(135deg, #e879f9, #d946ef)"}],G={Easy:{bg:"rgba(34, 197, 94, 0.12)",border:"rgba(34, 197, 94, 0.25)",text:"#4ade80"},Medium:{bg:"rgba(251, 191, 36, 0.12)",border:"rgba(251, 191, 36, 0.25)",text:"#fbbf24"},Hard:{bg:"rgba(239, 68, 68, 0.12)",border:"rgba(239, 68, 68, 0.25)",text:"#f87171"}};function Gr({onSelectAlgorithm:i}){const[e,r]=w.useState(""),[s,n]=w.useState("all"),[t,a]=w.useState(null),o=w.useMemo(()=>{const d={};return H.forEach(h=>{d[h.category]||(d[h.category]=[]),d[h.category].push(h)}),d},[]),l=w.useMemo(()=>Hr.map(d=>{const h=(o[d.id]||[]).filter(f=>{const x=e===""||f.name.toLowerCase().includes(e.toLowerCase())||f.description.toLowerCase().includes(e.toLowerCase()),k=s==="all"||f.difficulty===s;return x&&k});return{...d,algorithms:h}}).filter(d=>d.algorithms.length>0),[o,e,s]),u=H.length,c=l.reduce((d,h)=>d+h.algorithms.length,0);return m.jsxs("div",{className:"algo-catalog",children:[m.jsxs("div",{className:"algo-catalog-hero",children:[m.jsx("div",{className:"algo-catalog-hero-glow"}),m.jsxs("div",{className:"algo-catalog-hero-content",children:[m.jsxs("div",{className:"algo-catalog-badge",children:[m.jsx(ue,{size:14}),m.jsx("span",{children:"Interactive Visualizations"})]}),m.jsxs("h1",{className:"algo-catalog-title",children:["DSA ",m.jsx("span",{className:"text-gradient-anim",children:"Animations"})]}),m.jsxs("p",{className:"algo-catalog-subtitle",children:["Step through ",u," algorithms with interactive visualizations. Watch every comparison, swap, and traversal come alive."]})]})]}),m.jsxs("div",{className:"algo-catalog-controls",children:[m.jsxs("div",{className:"algo-search-wrapper",children:[m.jsx(W,{size:16,className:"algo-search-icon"}),m.jsx("input",{type:"text",value:e,onChange:d=>r(d.target.value),placeholder:"Search algorithms...",className:"algo-search-input"}),e&&m.jsxs("span",{className:"algo-search-count",children:[c," found"]})]}),m.jsx("div",{className:"algo-diff-filters",children:["all","Easy","Medium","Hard"].map(d=>m.jsx("button",{onClick:()=>n(d),className:`algo-diff-pill ${s===d?"active":""}`,"data-difficulty":d,children:d==="all"?"All":d},d))})]}),m.jsxs("div",{className:"algo-catalog-sections",children:[l.map((d,h)=>m.jsxs("div",{className:"algo-cat-section",style:{animationDelay:`${h*60}ms`},children:[m.jsxs("div",{className:"algo-cat-header",children:[m.jsx("div",{className:"algo-cat-icon",style:{background:d.gradient},children:m.jsx("span",{children:d.icon})}),m.jsxs("div",{children:[m.jsx("h2",{className:"algo-cat-title",children:d.label}),m.jsxs("span",{className:"algo-cat-count",children:[d.algorithms.length," animation",d.algorithms.length!==1?"s":""]})]})]}),m.jsx("div",{className:"algo-cards-grid",children:d.algorithms.map((f,x)=>{const k=G[f.difficulty]||G.Easy,b=t===f.id;return m.jsxs("button",{className:`algo-card ${b?"hovered":""}`,onClick:()=>i(f),onMouseEnter:()=>a(f.id),onMouseLeave:()=>a(null),style:{"--card-color":f.color,"--card-delay":`${(h*4+x)*40}ms`},children:[m.jsx("span",{className:"algo-card-diff",style:{background:k.bg,border:`1px solid ${k.border}`,color:k.text},children:f.difficulty}),m.jsxs("div",{className:"algo-card-body",children:[m.jsx("div",{className:"algo-card-icon-wrap",children:m.jsx("span",{className:"algo-card-icon",children:f.icon})}),m.jsx("h3",{className:"algo-card-name",children:f.name}),m.jsx("p",{className:"algo-card-desc",children:f.description})]}),m.jsxs("div",{className:"algo-card-footer",children:[m.jsxs("span",{className:"algo-card-complexity",children:[m.jsx(ce,{size:10})," ",f.complexity.time]}),m.jsxs("span",{className:"algo-card-action",children:["Visualize ",m.jsx(me,{size:12})]})]}),m.jsx("div",{className:"algo-card-glow",style:{background:f.color}})]},f.id)})})]},d.id)),l.length===0&&m.jsxs("div",{className:"algo-empty",children:[m.jsx(W,{size:48,strokeWidth:1}),m.jsx("h3",{children:"No algorithms found"}),m.jsx("p",{children:"Try a different search query or filter"})]})]})]})}function Ur({algorithm:i,onBack:e}){var C,E,R,F,D;const[r,s]=w.useState(i),[n,t]=w.useState([]),[a,o]=w.useState(0),[l,u]=w.useState(!1),[c,d]=w.useState(1),[h,f]=w.useState(""),[x,k]=w.useState(""),[b,S]=w.useState("preset1"),[U,z]=w.useState(!1),[A,V]=w.useState("javascript"),[X,L]=w.useState(!1),N=w.useRef(null),O=w.useCallback(()=>{u(!1),o(0);const g=r;let p,y={};g.category==="graph"||g.id==="topological-sort"?(p=g.defaultGraph,y.start=0):g.id==="union-find"?p=g.defaultGraph:g.id==="dp-fibonacci"?(p=null,y.dpN=g.dpN||8):g.id==="dp-knapsack"?p=g.knapsackData:g.id==="greedy"||g.id==="merge-intervals"?p=g.defaultInput:(b==="custom"&&h.trim()?p=h.split(",").map(_=>parseInt(_.trim())).filter(_=>!isNaN(_)):p=[...g.defaultInput],(g.id.includes("search")||g.id==="two-pointers")&&(y.target=x?parseInt(x):g.searchTarget),g.id==="sliding-window"&&(y.windowSize=g.windowSize||3));const v=Dr(g.id,p,y);t(v)},[r,h,x,b]);w.useEffect(()=>{O()},[r]),w.useEffect(()=>(l&&a<n.length-1?N.current=setTimeout(()=>{o(g=>g+1)},q[c].value):a>=n.length-1&&u(!1),()=>clearTimeout(N.current)),[l,a,c,n.length]);const K=()=>o(g=>Math.min(g+1,n.length-1)),Z=()=>o(g=>Math.max(g-1,0)),J=()=>{u(!1),o(0)},Q=()=>{a>=n.length-1&&o(0),u(g=>!g)},j=n[a]||{},P=n.length>1?a/(n.length-1)*100:0,Y=r.category==="graph"||r.id==="topological-sort",ee=r.id.includes("search")||r.id==="two-pointers",re=r.defaultInput&&!Array.isArray((C=r.defaultInput)==null?void 0:C[0]),$=Wr[r.id],M=Br[r.id],te=($==null?void 0:$[A])||($==null?void 0:$.javascript)||(M==null?void 0:M.code)||"",ie=((E=($==null?void 0:$.stepToLine)||(M==null?void 0:M.stepToLine))==null?void 0:E(j))??-1,T=I.find(g=>g.id===A)||I[0];return m.jsxs("div",{className:"viz-page",children:[m.jsxs("div",{className:"viz-topbar",children:[m.jsxs("button",{onClick:e,className:"viz-back-btn",children:[m.jsx(ae,{size:16}),m.jsx("span",{children:"Back to All Animations"})]}),m.jsx("h1",{className:"viz-title",children:r.name})]}),m.jsxs("div",{className:"viz-split",children:[m.jsx("div",{className:"viz-code-side",children:$||M?m.jsxs("div",{className:"viz-code-panel",children:[m.jsxs("div",{className:"viz-code-header",children:[m.jsxs("div",{className:"viz-code-dots",children:[m.jsx("span",{className:"dot red"}),m.jsx("span",{className:"dot yellow"}),m.jsx("span",{className:"dot green"})]}),m.jsxs("div",{className:"viz-lang-selector",children:[m.jsxs("button",{className:"viz-lang-btn",onClick:()=>L(g=>!g),children:[m.jsx("span",{className:"viz-lang-icon",children:T.icon}),m.jsx("span",{children:T.label}),m.jsx(B,{size:12})]}),X&&m.jsx("div",{className:"viz-lang-menu",children:I.map(g=>m.jsxs("button",{className:`viz-lang-option ${A===g.id?"active":""}`,onClick:()=>{V(g.id),L(!1)},children:[m.jsx("span",{className:"viz-lang-icon",children:g.icon}),g.label]},g.id))})]})]}),m.jsx("div",{className:"viz-code-body",children:te.split(`
`).map((g,p)=>{const y=p+1,v=y===ie;return m.jsxs("div",{className:`viz-code-line ${v?"active":""}`,children:[m.jsx("span",{className:"viz-line-num",children:y}),m.jsx("span",{className:"viz-line-text",children:m.jsx(Kr,{text:g})})]},p)})})]}):m.jsxs("div",{className:"viz-code-panel viz-no-code",children:[m.jsx("div",{className:"viz-code-header",children:m.jsxs("div",{className:"viz-code-dots",children:[m.jsx("span",{className:"dot red"}),m.jsx("span",{className:"dot yellow"}),m.jsx("span",{className:"dot green"})]})}),m.jsx("div",{style:{padding:40,textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:13},children:m.jsx("p",{children:"Code panel not available for this algorithm"})})]})}),m.jsxs("div",{className:"viz-anim-side",children:[re&&m.jsxs("div",{className:"viz-input-bar",children:[m.jsx("button",{className:`viz-input-tab ${b==="preset1"?"active":""}`,onClick:()=>{S("preset1"),f("")},children:"Input 1"}),m.jsx("button",{className:`viz-input-tab ${b==="custom"?"active":""}`,onClick:()=>S("custom"),children:"Custom"}),b==="custom"&&m.jsxs("div",{className:"viz-custom-input",children:[m.jsx("input",{value:h,onChange:g=>f(g.target.value),placeholder:(R=r.defaultInput)==null?void 0:R.join(", "),className:"viz-input-field"}),ee&&r.searchTarget!==void 0&&m.jsx("input",{value:x,onChange:g=>k(g.target.value),placeholder:`Target: ${r.searchTarget}`,className:"viz-input-field"}),m.jsx("button",{onClick:O,className:"viz-apply-btn",children:"Apply"})]})]}),m.jsx("div",{className:"viz-canvas",children:m.jsx("div",{className:"viz-canvas-inner",children:Y?m.jsx(ne,{step:j}):j.array?m.jsx(se,{step:j,algorithmId:r.id}):m.jsxs("div",{className:"viz-special-render",children:[m.jsx("div",{style:{fontSize:48,marginBottom:16},children:r.icon}),m.jsx("p",{className:"viz-message",children:j.message||"Press Play to start visualization"}),j.dpTable&&m.jsx("div",{className:"viz-dp-table",children:m.jsx("table",{children:m.jsx("tbody",{children:(D=(F=j.dpTable).map)==null?void 0:D.call(F,(g,p)=>m.jsx("tr",{children:(Array.isArray(g)?g:[g]).map((y,v)=>m.jsx("td",{className:j.currentItem===p&&j.currentWeight===v?"dp-active":"",children:y},v))},p))})})}),j.result&&m.jsx("div",{className:"viz-subsets",children:j.result.map((g,p)=>m.jsxs("span",{className:"viz-subset-chip",children:["[",g.join(","),"]"]},p))}),j.parent&&m.jsx("div",{className:"viz-uf-nodes",children:j.nodes.map((g,p)=>{var y;return m.jsxs("div",{className:"viz-uf-node",children:[m.jsx("div",{className:`viz-uf-circle ${(y=j.highlights)!=null&&y.includes(g)?"highlighted":""}`,children:g}),m.jsxs("div",{className:"viz-uf-parent",children:["p=",j.parent[p]]})]},p)})}),j.binary&&m.jsx("div",{className:"viz-bits",children:j.binary.split("").map((g,p)=>m.jsx("span",{className:`viz-bit ${g==="1"?"on":""}`,children:g},p))})]})})}),(()=>{const g=new Set(["array","highlights","sorted","message","comparing","swapping","nodes","edges","intervals","result","current","ranges","dpTable","weights","values","eliminated","checked","exploring","skipped","action","sets","binary","partitionBoundary","prefix"]);let p=j.variables;if(!p||Object.keys(p).length===0){p={};for(const[y,v]of Object.entries(j))g.has(y)||(typeof v=="number"||typeof v=="boolean"||typeof v=="string"&&v.length<30?p[y]=v:Array.isArray(v)&&v.length<=12&&v.every(_=>typeof _=="number"||typeof _=="string")&&(p[y]=`[${v.join(",")}]`))}return!p||Object.keys(p).length===0?null:m.jsxs("div",{className:"viz-dryrun",children:[m.jsx("span",{className:"viz-dryrun-label",children:"Variables"}),m.jsx("div",{className:"viz-dryrun-chips",children:Object.entries(p).map(([y,v])=>m.jsxs("span",{className:"viz-dryrun-chip",children:[m.jsx("span",{className:"viz-dryrun-key",children:y}),m.jsx("span",{className:"viz-dryrun-eq",children:"="}),m.jsx("span",{className:"viz-dryrun-val",children:typeof v=="object"?JSON.stringify(v):String(v)})]},y))})]})})(),m.jsxs("div",{className:"viz-step-msg",children:[m.jsx("span",{className:"viz-step-num",children:a}),m.jsx("span",{className:"viz-step-text",children:j.message||"Ready to begin..."})]})]})]}),m.jsx("div",{className:"viz-controls",children:m.jsxs("div",{className:"viz-controls-inner",children:[m.jsxs("div",{className:"viz-ctrl-group",children:[m.jsx("button",{onClick:Z,className:"viz-ctrl-btn",disabled:a===0,title:"Previous Step",children:m.jsx(fe,{size:16})}),m.jsx("button",{onClick:Q,className:"viz-ctrl-play",title:l?"Pause":"Play",children:l?m.jsx(de,{size:20}):m.jsx(le,{size:20,style:{marginLeft:2}})}),m.jsx("button",{onClick:K,className:"viz-ctrl-btn",disabled:a>=n.length-1,title:"Next Step",children:m.jsx(ge,{size:16})}),m.jsx("button",{onClick:J,className:"viz-ctrl-btn",title:"Reset",children:m.jsx(he,{size:14})})]}),m.jsx("div",{className:"viz-progress-wrap",onClick:g=>{const p=g.currentTarget.getBoundingClientRect(),y=(g.clientX-p.left)/p.width;o(Math.round(y*(n.length-1)))},children:m.jsxs("div",{className:"viz-progress-track",children:[m.jsx("div",{className:"viz-progress-fill",style:{width:`${P}%`}}),m.jsx("div",{className:"viz-progress-thumb",style:{left:`${P}%`}})]})}),m.jsxs("div",{className:"viz-ctrl-group viz-ctrl-right",children:[m.jsxs("span",{className:"viz-step-counter",children:[a," / ",Math.max(0,n.length-1)]}),m.jsxs("div",{className:"viz-speed-wrap",children:[m.jsxs("button",{className:"viz-speed-btn",onClick:()=>z(g=>!g),children:[q[c].label," ",m.jsx(B,{size:12})]}),U&&m.jsx("div",{className:"viz-speed-menu",children:q.map((g,p)=>m.jsx("button",{className:`viz-speed-option ${c===p?"active":""}`,onClick:()=>{d(p),z(!1)},children:g.label},p))})]})]})]})})]})}const Vr=new Set(["function","const","let","var","if","else","for","while","return","new","true","false","null","undefined","break","continue","switch","case","default","do","try","catch","finally","throw","async","await","yield"]),Xr=new Set(["Array","Math","console","log","push","pop","shift","unshift","slice","splice","sort","filter","map","reduce","forEach","indexOf","includes","length","swap","min","max","abs","floor","ceil"]);function Kr({text:i}){if(!i.trim())return m.jsx("span",{children:i||" "});const e=[];let r=i;const s=[{regex:/^(\/\/.*)/,cls:"tok-comment"},{regex:/^("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/,cls:"tok-string"},{regex:/^(\b\d+\.?\d*\b)/,cls:"tok-number"},{regex:/^([+\-*/%=<>!&|^~?:]+)/,cls:"tok-operator"},{regex:/^([()[\]{}])/,cls:"tok-bracket"},{regex:/^(\s+)/,cls:""},{regex:/^(\w+)/,cls:"tok-ident"},{regex:/^(.)/,cls:""}];for(;r.length>0;){let n=!1;for(const{regex:t,cls:a}of s){const o=r.match(t);if(o){let l=a;a==="tok-ident"&&(Vr.has(o[1])?l="tok-keyword":Xr.has(o[1])?l="tok-fn":l="tok-text"),e.push({text:o[1],cls:l}),r=r.slice(o[1].length),n=!0;break}}n||(e.push({text:r[0],cls:""}),r=r.slice(1))}return m.jsx(m.Fragment,{children:e.map((n,t)=>n.cls?m.jsx("span",{className:n.cls,children:n.text},t):n.text)})}function st(){const[i,e]=w.useState(null);return i?m.jsx(Ur,{algorithm:i,onBack:()=>e(null)}):m.jsx(Gr,{onSelectAlgorithm:e})}export{st as default};
