// ═══════════════════════════════════════════
//  Extra Step Generators — Array, String, Hash Table
// ═══════════════════════════════════════════

// ── Move Zeroes ──
export function generateMoveZeroesSteps(arr) {
  const a = [...arr]; const n = a.length;
  const steps = [{ array: [...a], highlights: [], sorted: [], message: 'Move Zeroes: move all 0s to end while maintaining order of non-zero elements.' }];
  let insertPos = 0;
  for (let i = 0; i < n; i++) {
    steps.push({ array: [...a], highlights: [i, insertPos], comparing: true, message: `Checking index ${i}: value = ${a[i]}` });
    if (a[i] !== 0) {
      if (i !== insertPos) {
        [a[i], a[insertPos]] = [a[insertPos], a[i]];
        steps.push({ array: [...a], highlights: [i, insertPos], swapping: true, message: `Non-zero ${a[insertPos]} → swap to position ${insertPos}` });
      }
      insertPos++;
    }
  }
  steps.push({ array: [...a], highlights: [], sorted: Array.from({ length: n }, (_, k) => k), message: `✅ All zeroes moved to end: [${a.join(', ')}]` });
  return steps;
}

// ── Rotate Array ──
export function generateRotateArraySteps(arr, k) {
  const a = [...arr]; const n = a.length; k = k % n;
  const steps = [{ array: [...a], highlights: [], message: `Rotate Array by k=${k} positions using reverse approach.` }];
  function reverse(a, start, end, label) {
    while (start < end) {
      steps.push({ array: [...a], highlights: [start, end], comparing: true, message: `${label}: swap indices ${start} and ${end}` });
      [a[start], a[end]] = [a[end], a[start]];
      steps.push({ array: [...a], highlights: [start, end], swapping: true, message: `Swapped ${a[end]} ↔ ${a[start]}` });
      start++; end--;
    }
  }
  steps.push({ array: [...a], highlights: Array.from({ length: n }, (_, i) => i), message: 'Step 1: Reverse entire array' });
  reverse(a, 0, n - 1, 'Reverse all');
  steps.push({ array: [...a], highlights: Array.from({ length: k }, (_, i) => i), message: `Step 2: Reverse first ${k} elements` });
  reverse(a, 0, k - 1, 'Reverse first k');
  steps.push({ array: [...a], highlights: Array.from({ length: n - k }, (_, i) => k + i), message: `Step 3: Reverse remaining ${n - k} elements` });
  reverse(a, k, n - 1, 'Reverse rest');
  steps.push({ array: [...a], highlights: [], sorted: Array.from({ length: n }, (_, k) => k), message: `✅ Array rotated by ${k}: [${a.join(', ')}]` });
  return steps;
}

// ── Remove Duplicates from Sorted Array ──
export function generateRemoveDuplicatesSteps(arr) {
  const a = [...arr].sort((x, y) => x - y);
  const steps = [{ array: [...a], highlights: [], message: 'Remove Duplicates from Sorted Array: keep unique elements in-place.' }];
  if (a.length === 0) return steps;
  let slow = 0;
  for (let fast = 1; fast < a.length; fast++) {
    steps.push({ array: [...a], highlights: [slow, fast], left: slow, right: fast, comparing: true, message: `Compare a[${slow}]=${a[slow]} with a[${fast}]=${a[fast]}` });
    if (a[fast] !== a[slow]) {
      slow++;
      a[slow] = a[fast];
      steps.push({ array: [...a], highlights: [slow], sorted: Array.from({ length: slow + 1 }, (_, k) => k), message: `Unique! Place ${a[slow]} at index ${slow}` });
    } else {
      steps.push({ array: [...a], highlights: [fast], message: `Duplicate ${a[fast]} — skip` });
    }
  }
  steps.push({ array: [...a], sorted: Array.from({ length: slow + 1 }, (_, k) => k), message: `✅ ${slow + 1} unique elements: [${a.slice(0, slow + 1).join(', ')}]` });
  return steps;
}

// ── Best Time to Buy and Sell Stock ──
export function generateBuySellStockSteps(arr) {
  const a = [...arr];
  const steps = [{ array: [...a], highlights: [], message: 'Buy & Sell Stock: find max profit from single buy-sell transaction.' }];
  let minPrice = a[0], maxProfit = 0, buyDay = 0, sellDay = 0, bestBuy = 0;
  steps.push({ array: [...a], highlights: [0], message: `Day 0: price = ${a[0]}. Set as min buy price.` });
  for (let i = 1; i < a.length; i++) {
    const profit = a[i] - minPrice;
    steps.push({ array: [...a], highlights: [buyDay, i], comparing: true, message: `Day ${i}: price=${a[i]}, profit if sell = ${a[i]} - ${minPrice} = ${profit}` });
    if (profit > maxProfit) {
      maxProfit = profit; bestBuy = buyDay; sellDay = i;
      steps.push({ array: [...a], highlights: [bestBuy, sellDay], sorted: [bestBuy, sellDay], message: `New max profit = ${maxProfit}! Buy day ${bestBuy}, sell day ${sellDay}` });
    }
    if (a[i] < minPrice) {
      minPrice = a[i]; buyDay = i;
      steps.push({ array: [...a], highlights: [i], message: `New min price = ${a[i]} at day ${i}` });
    }
  }
  steps.push({ array: [...a], highlights: [bestBuy, sellDay], sorted: [bestBuy, sellDay], message: `✅ Max profit = ${maxProfit} (buy at ${a[bestBuy]} on day ${bestBuy}, sell at ${a[sellDay]} on day ${sellDay})` });
  return steps;
}

// ── Product of Array Except Self ──
export function generateProductExceptSelfSteps(arr) {
  const a = [...arr]; const n = a.length;
  const result = new Array(n).fill(1);
  const steps = [{ array: [...a], result: [...result], highlights: [], message: 'Product Except Self: compute product of all elements except self without division.' }];
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;
    steps.push({ array: [...a], result: [...result], highlights: [i], message: `Left pass: result[${i}] = ${prefix} (prefix product)` });
    prefix *= a[i];
  }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    steps.push({ array: [...a], result: [...result], highlights: [i], message: `Right pass: result[${i}] *= ${suffix} = ${result[i]} (suffix product)` });
    suffix *= a[i];
  }
  steps.push({ array: [...a], result: [...result], sorted: Array.from({ length: n }, (_, k) => k), message: `✅ Result: [${result.join(', ')}]` });
  return steps;
}

// ── Contains Duplicate ──
export function generateContainsDuplicateSteps(arr) {
  const a = [...arr]; const seen = new Set();
  const steps = [{ array: [...a], highlights: [], message: 'Contains Duplicate: check if any value appears at least twice.' }];
  for (let i = 0; i < a.length; i++) {
    if (seen.has(a[i])) {
      const firstIdx = a.indexOf(a[i]);
      steps.push({ array: [...a], highlights: [firstIdx, i], swapping: true, message: `✅ Duplicate found! ${a[i]} at index ${firstIdx} and ${i}` });
      return steps;
    }
    seen.add(a[i]);
    steps.push({ array: [...a], highlights: [i], checked: Array.from(seen).map(v => a.indexOf(v)), message: `Index ${i}: ${a[i]} — not seen before. Set: {${Array.from(seen).join(', ')}}` });
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: '✅ No duplicates found!' });
  return steps;
}

// ── Majority Element ──
export function generateMajorityElementSteps(arr) {
  const a = [...arr]; let candidate = a[0], count = 1;
  const steps = [{ array: [...a], highlights: [0], message: `Majority Element (Boyer-Moore): candidate = ${a[0]}, count = 1` }];
  for (let i = 1; i < a.length; i++) {
    if (count === 0) {
      candidate = a[i]; count = 1;
      steps.push({ array: [...a], highlights: [i], message: `Count hit 0 — new candidate: ${a[i]}` });
    } else if (a[i] === candidate) {
      count++;
      steps.push({ array: [...a], highlights: [i], comparing: true, message: `${a[i]} == candidate ${candidate} → count = ${count}` });
    } else {
      count--;
      steps.push({ array: [...a], highlights: [i], swapping: true, message: `${a[i]} != candidate ${candidate} → count = ${count}` });
    }
  }
  steps.push({ array: [...a], highlights: a.map((v, i) => v === candidate ? i : -1).filter(i => i >= 0), sorted: a.map((v, i) => v === candidate ? i : -1).filter(i => i >= 0), message: `✅ Majority element = ${candidate}` });
  return steps;
}

// ── Increasing Triplet Subsequence ──
export function generateIncreasingTripletSteps(arr) {
  const a = [...arr]; let first = Infinity, second = Infinity;
  const steps = [{ array: [...a], highlights: [], message: 'Increasing Triplet: find i < j < k where a[i] < a[j] < a[k].' }];
  for (let i = 0; i < a.length; i++) {
    if (a[i] <= first) {
      first = a[i];
      steps.push({ array: [...a], highlights: [i], message: `Update first = ${first}` });
    } else if (a[i] <= second) {
      second = a[i];
      steps.push({ array: [...a], highlights: [i], comparing: true, message: `Update second = ${second} (first = ${first})` });
    } else {
      steps.push({ array: [...a], highlights: [i], sorted: [i], swapping: true, message: `✅ Found triplet! first=${first}, second=${second}, third=${a[i]}` });
      return steps;
    }
  }
  steps.push({ array: [...a], message: '❌ No increasing triplet found.' });
  return steps;
}

// ── First Missing Positive ──
export function generateFirstMissingPositiveSteps(arr) {
  const a = [...arr]; const n = a.length;
  const steps = [{ array: [...a], highlights: [], message: 'First Missing Positive: place each number at its correct index (1→idx 0, 2→idx 1...).' }];
  for (let i = 0; i < n; i++) {
    while (a[i] > 0 && a[i] <= n && a[a[i] - 1] !== a[i]) {
      const target = a[i] - 1;
      steps.push({ array: [...a], highlights: [i, target], comparing: true, message: `${a[i]} should be at index ${target} — swap` });
      [a[i], a[target]] = [a[target], a[i]];
      steps.push({ array: [...a], highlights: [i, target], swapping: true, message: `Swapped. Array: [${a.join(', ')}]` });
    }
  }
  for (let i = 0; i < n; i++) {
    if (a[i] !== i + 1) {
      steps.push({ array: [...a], highlights: [i], sorted: Array.from({ length: n }, (_, k) => k).filter(k => a[k] === k + 1), message: `✅ First missing positive = ${i + 1} (index ${i} has ${a[i]})` });
      return steps;
    }
  }
  steps.push({ array: [...a], sorted: Array.from({ length: n }, (_, k) => k), message: `✅ First missing positive = ${n + 1}` });
  return steps;
}

// ── Valid Palindrome (String) ──
export function generateValidPalindromeSteps(input) {
  const s = (typeof input === 'string' ? input : 'racecar').toLowerCase().replace(/[^a-z0-9]/g, '');
  const arr = s.split('');
  const steps = [{ array: arr, highlights: [], message: `Valid Palindrome: check "${s}" from both ends.` }];
  let l = 0, r = arr.length - 1;
  while (l < r) {
    if (arr[l] === arr[r]) {
      steps.push({ array: arr, highlights: [l, r], sorted: [l, r], left: l, right: r, message: `'${arr[l]}' == '${arr[r]}' ✓ — move inward` });
    } else {
      steps.push({ array: arr, highlights: [l, r], swapping: true, left: l, right: r, message: `'${arr[l]}' != '${arr[r]}' ✗ — NOT a palindrome!` });
      return steps;
    }
    l++; r--;
  }
  steps.push({ array: arr, sorted: Array.from({ length: arr.length }, (_, k) => k), message: `✅ "${s}" IS a palindrome!` });
  return steps;
}

// ── Is Subsequence ──
export function generateIsSubsequenceSteps(input) {
  const s = input?.s || 'ace'; const t = input?.t || 'abcde';
  const sArr = s.split(''); const tArr = t.split('');
  const steps = [{ array: tArr, highlights: [], message: `Is Subsequence: is "${s}" a subsequence of "${t}"?` }];
  let si = 0;
  for (let ti = 0; ti < tArr.length && si < sArr.length; ti++) {
    if (tArr[ti] === sArr[si]) {
      steps.push({ array: tArr, highlights: [ti], sorted: [ti], message: `'${tArr[ti]}' matches s[${si}]='${sArr[si]}' ✓` });
      si++;
    } else {
      steps.push({ array: tArr, highlights: [ti], message: `'${tArr[ti]}' ≠ s[${si}]='${sArr[si]}' — skip` });
    }
  }
  if (si === sArr.length) {
    steps.push({ array: tArr, sorted: Array.from({ length: tArr.length }, (_, k) => k), message: `✅ "${s}" IS a subsequence of "${t}"` });
  } else {
    steps.push({ array: tArr, message: `❌ "${s}" is NOT a subsequence of "${t}"` });
  }
  return steps;
}

// ── Reverse Words in a String ──
export function generateReverseWordsSteps(input) {
  const s = typeof input === 'string' ? input : 'the sky is blue';
  const words = s.trim().split(/\s+/);
  const steps = [{ array: [...words], highlights: [], message: `Reverse Words: "${s}" → reverse word order.` }];
  let l = 0, r = words.length - 1;
  while (l < r) {
    steps.push({ array: [...words], highlights: [l, r], comparing: true, message: `Swap "${words[l]}" ↔ "${words[r]}"` });
    [words[l], words[r]] = [words[r], words[l]];
    steps.push({ array: [...words], highlights: [l, r], swapping: true, message: `Result: [${words.join(', ')}]` });
    l++; r--;
  }
  steps.push({ array: [...words], sorted: Array.from({ length: words.length }, (_, k) => k), message: `✅ Result: "${words.join(' ')}"` });
  return steps;
}

// ── Longest Common Prefix ──
export function generateLongestCommonPrefixSteps(input) {
  const strs = input || ['flower', 'flow', 'flight'];
  const arr = strs[0].split('');
  const steps = [{ array: arr, highlights: [], message: `Longest Common Prefix: compare ${strs.length} strings character by character.` }];
  let prefix = '';
  for (let i = 0; i < arr.length; i++) {
    const ch = arr[i]; let allMatch = true;
    for (let j = 1; j < strs.length; j++) {
      if (i >= strs[j].length || strs[j][i] !== ch) {
        allMatch = false;
        steps.push({ array: arr, highlights: [i], swapping: true, message: `'${ch}' at pos ${i}: mismatch with "${strs[j]}". Stop!` });
        break;
      }
    }
    if (!allMatch) break;
    prefix += ch;
    steps.push({ array: arr, highlights: [i], sorted: Array.from({ length: i + 1 }, (_, k) => k), message: `'${ch}' matches in all strings. Prefix so far: "${prefix}"` });
  }
  steps.push({ array: arr, sorted: Array.from({ length: prefix.length }, (_, k) => k), message: `✅ Longest common prefix: "${prefix}"` });
  return steps;
}

// ── Group Anagrams ──
export function generateGroupAnagramsSteps(input) {
  const strs = input || ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'];
  const arr = [...strs];
  const steps = [{ array: arr, highlights: [], message: `Group Anagrams: group ${strs.length} strings by sorted characters.` }];
  const map = {};
  for (let i = 0; i < arr.length; i++) {
    const key = arr[i].split('').sort().join('');
    if (!map[key]) map[key] = [];
    map[key].push(i);
    const groupIndices = map[key];
    steps.push({ array: arr, highlights: groupIndices, message: `"${arr[i]}" → sorted key "${key}". Group: [${groupIndices.map(j => arr[j]).join(', ')}]` });
  }
  const groups = Object.values(map);
  const allSorted = groups.flat();
  steps.push({ array: arr, sorted: allSorted, message: `✅ ${groups.length} groups: ${groups.map(g => '[' + g.map(i => arr[i]).join(', ') + ']').join(', ')}` });
  return steps;
}

// ── Longest Consecutive Sequence ──
export function generateLongestConsecutiveSteps(arr) {
  const a = [...arr]; const numSet = new Set(a);
  const steps = [{ array: [...a], highlights: [], message: `Longest Consecutive Sequence: find longest streak using HashSet.` }];
  let best = 0, bestStart = 0;
  for (let i = 0; i < a.length; i++) {
    if (!numSet.has(a[i] - 1)) {
      let count = 1, num = a[i];
      steps.push({ array: [...a], highlights: [i], message: `${a[i]} is a sequence start (no ${a[i] - 1} in set)` });
      while (numSet.has(num + 1)) {
        num++; count++;
        const idx = a.indexOf(num);
        if (idx >= 0) steps.push({ array: [...a], highlights: [idx], comparing: true, message: `${num} found! Streak length = ${count}` });
      }
      if (count > best) { best = count; bestStart = a[i]; }
    }
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k).filter(k => a[k] >= bestStart && a[k] < bestStart + best), message: `✅ Longest consecutive: ${best} (${bestStart} to ${bestStart + best - 1})` });
  return steps;
}

// ── Contains Duplicate II ──
export function generateContainsDuplicateIISteps(arr, k) {
  const a = [...arr]; k = k || 3;
  const steps = [{ array: [...a], highlights: [], message: `Contains Duplicate II: find duplicate within distance k=${k}.` }];
  const map = new Map();
  for (let i = 0; i < a.length; i++) {
    if (map.has(a[i]) && i - map.get(a[i]) <= k) {
      steps.push({ array: [...a], highlights: [map.get(a[i]), i], swapping: true, message: `✅ ${a[i]} found at ${map.get(a[i])} and ${i}, distance = ${i - map.get(a[i])} ≤ ${k}` });
      return steps;
    }
    map.set(a[i], i);
    steps.push({ array: [...a], highlights: [i], checked: [i], message: `Index ${i}: ${a[i]} → stored in map` });
  }
  steps.push({ array: [...a], message: `❌ No duplicates within distance ${k}` });
  return steps;
}

// ── Ransom Note ──
export function generateRansomNoteSteps(input) {
  const ransomNote = input?.ransomNote || 'aab'; const magazine = input?.magazine || 'aabbc';
  const arr = magazine.split('');
  const steps = [{ array: arr, highlights: [], message: `Ransom Note: can "${ransomNote}" be made from "${magazine}"?` }];
  const freq = {};
  for (const ch of magazine) freq[ch] = (freq[ch] || 0) + 1;
  steps.push({ array: arr, message: `Magazine freq: ${JSON.stringify(freq)}` });
  for (let i = 0; i < ransomNote.length; i++) {
    const ch = ransomNote[i];
    if (!freq[ch] || freq[ch] <= 0) {
      steps.push({ array: arr, highlights: [], swapping: true, message: `❌ No '${ch}' left — cannot construct ransom note` });
      return steps;
    }
    freq[ch]--;
    const idx = arr.indexOf(ch);
    steps.push({ array: arr, highlights: idx >= 0 ? [idx] : [], sorted: [idx], message: `Need '${ch}' — found! Remaining: ${freq[ch]}` });
  }
  steps.push({ array: arr, sorted: Array.from({ length: arr.length }, (_, k) => k), message: `✅ Can construct "${ransomNote}" from "${magazine}"` });
  return steps;
}

// ── Isomorphic Strings ──
export function generateIsomorphicStringsSteps(input) {
  const s = input?.s || 'egg'; const t = input?.t || 'add';
  const arr = s.split('');
  const steps = [{ array: arr, highlights: [], message: `Isomorphic Strings: is "${s}" → "${t}" a valid mapping?` }];
  const mapST = {}, mapTS = {};
  for (let i = 0; i < s.length; i++) {
    if (mapST[s[i]] && mapST[s[i]] !== t[i]) {
      steps.push({ array: arr, highlights: [i], swapping: true, message: `❌ '${s[i]}' already maps to '${mapST[s[i]]}', not '${t[i]}'` });
      return steps;
    }
    if (mapTS[t[i]] && mapTS[t[i]] !== s[i]) {
      steps.push({ array: arr, highlights: [i], swapping: true, message: `❌ '${t[i]}' already mapped from '${mapTS[t[i]]}', not '${s[i]}'` });
      return steps;
    }
    mapST[s[i]] = t[i]; mapTS[t[i]] = s[i];
    steps.push({ array: arr, highlights: [i], sorted: [i], message: `'${s[i]}' ↔ '${t[i]}' ✓ Mapping: ${JSON.stringify(mapST)}` });
  }
  steps.push({ array: arr, sorted: Array.from({ length: arr.length }, (_, k) => k), message: `✅ "${s}" and "${t}" ARE isomorphic!` });
  return steps;
}

// ── Good Pairs ──
export function generateGoodPairsSteps(arr) {
  const a = [...arr]; const freq = {}; let count = 0;
  const steps = [{ array: [...a], highlights: [], message: 'Number of Good Pairs: count pairs (i,j) where a[i] == a[j] and i < j.' }];
  for (let i = 0; i < a.length; i++) {
    const prev = freq[a[i]] || 0;
    count += prev;
    freq[a[i]] = prev + 1;
    steps.push({ array: [...a], highlights: [i], message: `Index ${i}: ${a[i]} seen ${prev} times before → +${prev} pairs. Total = ${count}` });
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Total good pairs = ${count}` });
  return steps;
}
