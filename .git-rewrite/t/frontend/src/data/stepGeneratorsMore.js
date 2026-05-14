// ═══════════════════════════════════════════
//  Extra Step Generators — Patterns, Search, Stack, Matrix, DP, Greedy, Graph
// ═══════════════════════════════════════════

// ── 3Sum ──
export function generate3SumSteps(arr) {
  const a = [...arr].sort((x, y) => x - y);
  const steps = [{ array: [...a], highlights: [], message: `3Sum: find all triplets that sum to 0 in sorted array.` }];
  const result = [];
  for (let i = 0; i < a.length - 2; i++) {
    if (i > 0 && a[i] === a[i - 1]) continue;
    let l = i + 1, r = a.length - 1;
    steps.push({ array: [...a], highlights: [i], message: `Fix a[${i}]=${a[i]}, search pairs in [${l}..${r}]` });
    while (l < r) {
      const sum = a[i] + a[l] + a[r];
      steps.push({ array: [...a], highlights: [i, l, r], comparing: true, left: l, right: r, message: `${a[i]}+${a[l]}+${a[r]}=${sum}` });
      if (sum === 0) {
        result.push([a[i], a[l], a[r]]);
        steps.push({ array: [...a], highlights: [i, l, r], sorted: [i, l, r], message: `✓ Found triplet [${a[i]},${a[l]},${a[r]}]!` });
        while (l < r && a[l] === a[l + 1]) l++;
        while (l < r && a[r] === a[r - 1]) r--;
        l++; r--;
      } else if (sum < 0) { l++; } else { r--; }
    }
  }
  steps.push({ array: [...a], message: `✅ Found ${result.length} triplet(s): ${result.map(t => '[' + t + ']').join(', ')}` });
  return steps;
}

// ── Container With Most Water ──
export function generateContainerWaterSteps(arr) {
  const a = [...arr];
  const steps = [{ array: [...a], highlights: [], message: 'Container With Most Water: maximize area between two lines.' }];
  let l = 0, r = a.length - 1, maxArea = 0;
  while (l < r) {
    const area = Math.min(a[l], a[r]) * (r - l);
    const isMax = area > maxArea;
    if (isMax) maxArea = area;
    steps.push({ array: [...a], highlights: [l, r], left: l, right: r, comparing: true, message: `Area = min(${a[l]},${a[r]}) × ${r - l} = ${area}${isMax ? ' ★ New max!' : ''}. Max = ${maxArea}` });
    if (a[l] < a[r]) {
      steps.push({ array: [...a], highlights: [l], message: `Left shorter → move left pointer right` });
      l++;
    } else {
      steps.push({ array: [...a], highlights: [r], message: `Right shorter → move right pointer left` });
      r--;
    }
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Max water area = ${maxArea}` });
  return steps;
}

// ── Trapping Rain Water ──
export function generateTrappingRainWaterSteps(arr) {
  const a = [...arr]; let l = 0, r = a.length - 1, lMax = 0, rMax = 0, water = 0;
  const steps = [{ array: [...a], highlights: [], message: 'Trapping Rain Water: compute water trapped using two pointers.' }];
  while (l < r) {
    if (a[l] <= a[r]) {
      if (a[l] >= lMax) { lMax = a[l]; } else { water += lMax - a[l]; }
      steps.push({ array: [...a], highlights: [l, r], left: l, right: r, message: `Left: h=${a[l]}, lMax=${lMax}, water at ${l} = ${Math.max(0, lMax - a[l])}. Total = ${water}` });
      l++;
    } else {
      if (a[r] >= rMax) { rMax = a[r]; } else { water += rMax - a[r]; }
      steps.push({ array: [...a], highlights: [l, r], left: l, right: r, message: `Right: h=${a[r]}, rMax=${rMax}, water at ${r} = ${Math.max(0, rMax - a[r])}. Total = ${water}` });
      r--;
    }
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Total trapped water = ${water}` });
  return steps;
}

// ── Merge Sorted Array ──
export function generateMergeSortedArraySteps(input) {
  const nums1 = input?.nums1 || [1, 2, 3, 0, 0, 0]; const nums2 = input?.nums2 || [2, 5, 6]; const m = input?.m || 3;
  const a = [...nums1]; const n = nums2.length;
  const steps = [{ array: [...a], highlights: [], message: `Merge Sorted Array: merge [${a.slice(0, m)}] and [${nums2}] in-place from end.` }];
  let p1 = m - 1, p2 = n - 1, p = m + n - 1;
  while (p1 >= 0 && p2 >= 0) {
    if (a[p1] > nums2[p2]) {
      a[p] = a[p1];
      steps.push({ array: [...a], highlights: [p1, p], swapping: true, message: `a[${p1}]=${a[p1]} > b[${p2}]=${nums2[p2]} → place ${a[p1]} at ${p}` });
      p1--;
    } else {
      a[p] = nums2[p2];
      steps.push({ array: [...a], highlights: [p], comparing: true, message: `b[${p2}]=${nums2[p2]} ≥ a[${p1}]=${a[p1]} → place ${nums2[p2]} at ${p}` });
      p2--;
    }
    p--;
  }
  while (p2 >= 0) { a[p] = nums2[p2]; steps.push({ array: [...a], highlights: [p], message: `Copy remaining b[${p2}]=${nums2[p2]} at ${p}` }); p2--; p--; }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Merged: [${a.join(', ')}]` });
  return steps;
}

// ── Subarray Sum Equals K ──
export function generateSubarraySumKSteps(arr, k) {
  const a = [...arr]; k = k || 7; let count = 0, prefixSum = 0;
  const map = new Map([[0, 1]]);
  const steps = [{ array: [...a], highlights: [], message: `Subarray Sum = ${k}: use prefix sum + hash map.` }];
  for (let i = 0; i < a.length; i++) {
    prefixSum += a[i];
    const need = prefixSum - k;
    if (map.has(need)) { count += map.get(need); steps.push({ array: [...a], highlights: [i], sorted: [i], message: `prefixSum=${prefixSum}, need=${need} found! count += ${map.get(need)} → ${count}` }); }
    else { steps.push({ array: [...a], highlights: [i], message: `prefixSum=${prefixSum}, need=${need} not in map` }); }
    map.set(prefixSum, (map.get(prefixSum) || 0) + 1);
  }
  steps.push({ array: [...a], message: `✅ ${count} subarrays sum to ${k}` });
  return steps;
}

// ── Contiguous Array (equal 0s and 1s) ──
export function generateContiguousArraySteps(arr) {
  const a = [...arr]; let count = 0, maxLen = 0;
  const map = new Map([[0, -1]]);
  const steps = [{ array: [...a], highlights: [], message: 'Contiguous Array: find longest subarray with equal 0s and 1s.' }];
  for (let i = 0; i < a.length; i++) {
    count += a[i] === 1 ? 1 : -1;
    if (map.has(count)) {
      const len = i - map.get(count);
      if (len > maxLen) maxLen = len;
      steps.push({ array: [...a], highlights: [i], comparing: true, message: `Count=${count} seen at ${map.get(count)}. Length = ${len}. Max = ${maxLen}` });
    } else {
      map.set(count, i);
      steps.push({ array: [...a], highlights: [i], message: `Count=${count} first seen at index ${i}` });
    }
  }
  steps.push({ array: [...a], message: `✅ Longest balanced subarray length = ${maxLen}` });
  return steps;
}

// ── Longest Substring Without Repeating Characters ──
export function generateLongestSubstringSteps(input) {
  const s = typeof input === 'string' ? input : 'abcabcbb';
  const arr = s.split('');
  const steps = [{ array: arr, highlights: [], message: `Longest Substring Without Repeating: "${s}"` }];
  const map = new Map(); let maxLen = 0, start = 0, bestStart = 0;
  for (let end = 0; end < arr.length; end++) {
    if (map.has(arr[end]) && map.get(arr[end]) >= start) {
      start = map.get(arr[end]) + 1;
      steps.push({ array: arr, highlights: [end], swapping: true, windowStart: start, windowEnd: end, message: `'${arr[end]}' duplicate! Move start to ${start}` });
    }
    map.set(arr[end], end);
    const len = end - start + 1;
    if (len > maxLen) { maxLen = len; bestStart = start; }
    const windowHL = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    steps.push({ array: arr, highlights: windowHL, windowStart: start, windowEnd: end, message: `Window [${start}..${end}] = "${s.slice(start, end + 1)}", len=${len}, max=${maxLen}` });
  }
  steps.push({ array: arr, sorted: Array.from({ length: maxLen }, (_, k) => bestStart + k), message: `✅ Longest = ${maxLen}: "${s.slice(bestStart, bestStart + maxLen)}"` });
  return steps;
}

// ── Permutation in String ──
export function generatePermutationInStringSteps(input) {
  const s1 = input?.s1 || 'ab'; const s2 = input?.s2 || 'eidbaooo';
  const arr = s2.split('');
  const steps = [{ array: arr, highlights: [], message: `Permutation in String: does "${s2}" contain a permutation of "${s1}"?` }];
  const need = {}; for (const c of s1) need[c] = (need[c] || 0) + 1;
  const have = {}; let matched = 0; const required = Object.keys(need).length;
  for (let r = 0; r < arr.length; r++) {
    have[arr[r]] = (have[arr[r]] || 0) + 1;
    if (need[arr[r]] && have[arr[r]] === need[arr[r]]) matched++;
    const l = r - s1.length + 1;
    if (l >= 0) {
      const windowHL = Array.from({ length: s1.length }, (_, i) => l + i);
      if (matched === required) {
        steps.push({ array: arr, highlights: windowHL, sorted: windowHL, message: `✅ Permutation found at [${l}..${r}]: "${s2.slice(l, r + 1)}"` });
        return steps;
      }
      steps.push({ array: arr, highlights: windowHL, windowStart: l, windowEnd: r, message: `Window [${l}..${r}]: "${s2.slice(l, r + 1)}" — ${matched}/${required} chars matched` });
      if (need[arr[l]] && have[arr[l]] === need[arr[l]]) matched--;
      have[arr[l]]--;
    }
  }
  steps.push({ array: arr, message: `❌ No permutation of "${s1}" found in "${s2}"` });
  return steps;
}

// ── Max Consecutive Ones III ──
export function generateMaxConsecutiveOnesSteps(arr, k) {
  const a = [...arr]; k = k || 2; let l = 0, zeros = 0, maxLen = 0;
  const steps = [{ array: [...a], highlights: [], message: `Max Consecutive Ones III: max 1s with at most ${k} flips.` }];
  for (let r = 0; r < a.length; r++) {
    if (a[r] === 0) zeros++;
    while (zeros > k) { if (a[l] === 0) zeros--; l++; }
    const len = r - l + 1;
    if (len > maxLen) maxLen = len;
    const windowHL = Array.from({ length: r - l + 1 }, (_, i) => l + i);
    steps.push({ array: [...a], highlights: windowHL, windowStart: l, windowEnd: r, message: `Window [${l}..${r}], zeros=${zeros}, len=${len}, max=${maxLen}` });
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Max consecutive 1s (with ${k} flips) = ${maxLen}` });
  return steps;
}

// ── Max Product Subarray ──
export function generateMaxProductSubarraySteps(arr) {
  const a = [...arr]; let maxP = a[0], minP = a[0], result = a[0];
  const steps = [{ array: [...a], highlights: [0], message: `Max Product Subarray: track both max and min products (negatives can flip).` }];
  for (let i = 1; i < a.length; i++) {
    const candidates = [a[i], a[i] * maxP, a[i] * minP];
    const newMax = Math.max(...candidates), newMin = Math.min(...candidates);
    maxP = newMax; minP = newMin;
    if (maxP > result) result = maxP;
    steps.push({ array: [...a], highlights: [i], message: `a[${i}]=${a[i]}: maxP=${maxP}, minP=${minP}, result=${result}` });
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Maximum product subarray = ${result}` });
  return steps;
}

// ── Valid Parentheses ──
export function generateValidParenthesesSteps(input) {
  const s = typeof input === 'string' ? input : '({[]})';
  const arr = s.split(''); const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  const steps = [{ array: arr, highlights: [], stack: [], message: `Valid Parentheses: check if "${s}" is balanced.` }];
  for (let i = 0; i < arr.length; i++) {
    if ('({['.includes(arr[i])) {
      stack.push(arr[i]);
      steps.push({ array: arr, highlights: [i], stack: [...stack], message: `Push '${arr[i]}'. Stack: [${stack.join(', ')}]` });
    } else {
      if (stack.length === 0 || stack[stack.length - 1] !== map[arr[i]]) {
        steps.push({ array: arr, highlights: [i], stack: [...stack], swapping: true, message: `❌ '${arr[i]}' has no matching pair!` });
        return steps;
      }
      stack.pop();
      steps.push({ array: arr, highlights: [i], stack: [...stack], sorted: [i], message: `Pop matching '${map[arr[i]]}'. Stack: [${stack.join(', ')}]` });
    }
  }
  if (stack.length === 0) {
    steps.push({ array: arr, sorted: Array.from({ length: arr.length }, (_, k) => k), message: `✅ "${s}" is VALID!` });
  } else {
    steps.push({ array: arr, stack: [...stack], message: `❌ Stack not empty: [${stack.join(', ')}]` });
  }
  return steps;
}

// ── Daily Temperatures ──
export function generateDailyTemperaturesSteps(arr) {
  const a = [...arr]; const result = new Array(a.length).fill(0); const stack = [];
  const steps = [{ array: [...a], result: [...result], stack: [], highlights: [], message: 'Daily Temperatures: days until warmer using monotonic stack.' }];
  for (let i = 0; i < a.length; i++) {
    while (stack.length > 0 && a[i] > a[stack[stack.length - 1]]) {
      const idx = stack.pop(); result[idx] = i - idx;
      steps.push({ array: [...a], result: [...result], stack: [...stack], highlights: [idx, i], message: `Day ${i} (${a[i]}) > Day ${idx} (${a[idx]}): wait ${result[idx]} days` });
    }
    stack.push(i);
    steps.push({ array: [...a], result: [...result], stack: [...stack], highlights: [i], message: `Push day ${i} (${a[i]}). Stack: [${stack.map(s => a[s]).join(', ')}]` });
  }
  steps.push({ array: [...a], result: [...result], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Result: [${result.join(', ')}]` });
  return steps;
}

// ── Evaluate Reverse Polish Notation ──
export function generateEvalRPNSteps(input) {
  const tokens = input || ['2', '1', '+', '3', '*'];
  const arr = [...tokens]; const stack = [];
  const steps = [{ array: arr, stack: [], highlights: [], message: `Evaluate RPN: ${tokens.join(' ')}` }];
  for (let i = 0; i < arr.length; i++) {
    if (['+', '-', '*', '/'].includes(arr[i])) {
      const b = stack.pop(), a2 = stack.pop();
      let res;
      if (arr[i] === '+') res = a2 + b;
      else if (arr[i] === '-') res = a2 - b;
      else if (arr[i] === '*') res = a2 * b;
      else res = Math.trunc(a2 / b);
      stack.push(res);
      steps.push({ array: arr, stack: [...stack], highlights: [i], message: `${a2} ${arr[i]} ${b} = ${res}. Stack: [${stack.join(', ')}]` });
    } else {
      stack.push(parseInt(arr[i]));
      steps.push({ array: arr, stack: [...stack], highlights: [i], message: `Push ${arr[i]}. Stack: [${stack.join(', ')}]` });
    }
  }
  steps.push({ array: arr, stack: [...stack], sorted: Array.from({ length: arr.length }, (_, k) => k), message: `✅ Result = ${stack[0]}` });
  return steps;
}

// ── Largest Rectangle in Histogram ──
export function generateLargestRectangleSteps(arr) {
  const a = [...arr, 0]; const stack = []; let maxArea = 0;
  const steps = [{ array: [...arr], highlights: [], message: 'Largest Rectangle in Histogram: monotonic stack approach.' }];
  for (let i = 0; i < a.length; i++) {
    while (stack.length > 0 && a[i] < a[stack[stack.length - 1]]) {
      const h = a[stack.pop()]; const w = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;
      const area = h * w; if (area > maxArea) maxArea = area;
      steps.push({ array: [...arr], highlights: [i], message: `Pop h=${h}, w=${w}, area=${area}. Max=${maxArea}` });
    }
    stack.push(i);
    if (i < arr.length) steps.push({ array: [...arr], highlights: [i], stack: [...stack], message: `Push idx ${i} (h=${arr[i]}). Stack heights: [${stack.map(s => a[s]).join(',')}]` });
  }
  steps.push({ array: [...arr], sorted: Array.from({ length: arr.length }, (_, k) => k), message: `✅ Largest rectangle = ${maxArea}` });
  return steps;
}

// ── Sliding Window Maximum ──
export function generateSlidingWindowMaxSteps(arr, k) {
  const a = [...arr]; k = k || 3; const result = []; const deque = [];
  const steps = [{ array: [...a], highlights: [], message: `Sliding Window Maximum: max in each window of size ${k}.` }];
  for (let i = 0; i < a.length; i++) {
    while (deque.length > 0 && deque[0] < i - k + 1) deque.shift();
    while (deque.length > 0 && a[deque[deque.length - 1]] < a[i]) deque.pop();
    deque.push(i);
    if (i >= k - 1) {
      result.push(a[deque[0]]);
      const windowHL = Array.from({ length: k }, (_, j) => i - k + 1 + j);
      steps.push({ array: [...a], highlights: windowHL, windowStart: i - k + 1, windowEnd: i, message: `Window [${i - k + 1}..${i}]: max = ${a[deque[0]]}. Result: [${result.join(', ')}]` });
    } else {
      steps.push({ array: [...a], highlights: [i], message: `Building window: added ${a[i]}` });
    }
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Window maxes: [${result.join(', ')}]` });
  return steps;
}

// ── Search Insert Position ──
export function generateSearchInsertSteps(arr, target) {
  const a = [...arr]; target = target || 5;
  const steps = [{ array: [...a], highlights: [], message: `Search Insert Position: find index for ${target} in sorted array.` }];
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ array: [...a], highlights: [mid], left: lo, right: hi, mid, message: `mid=${mid}, a[mid]=${a[mid]} vs target=${target}` });
    if (a[mid] === target) { steps.push({ array: [...a], highlights: [mid], found: mid, message: `✅ Found at index ${mid}!` }); return steps; }
    else if (a[mid] < target) { lo = mid + 1; } else { hi = mid - 1; }
  }
  steps.push({ array: [...a], highlights: [lo], sorted: [lo], message: `✅ Insert at index ${lo}` });
  return steps;
}

// ── Search in Rotated Sorted Array ──
export function generateSearchRotatedSteps(arr, target) {
  const a = [...arr]; target = target || 0;
  const steps = [{ array: [...a], highlights: [], message: `Search in Rotated Sorted Array: find ${target} using modified binary search.` }];
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ array: [...a], highlights: [mid], left: lo, right: hi, mid, message: `mid=${mid}, a[mid]=${a[mid]}` });
    if (a[mid] === target) { steps.push({ array: [...a], found: mid, highlights: [mid], message: `✅ Found ${target} at index ${mid}!` }); return steps; }
    if (a[lo] <= a[mid]) {
      if (target >= a[lo] && target < a[mid]) { hi = mid - 1; steps.push({ array: [...a], highlights: [lo, mid], message: `Left sorted, target in left half` }); }
      else { lo = mid + 1; steps.push({ array: [...a], highlights: [mid, hi], message: `Left sorted, target in right half` }); }
    } else {
      if (target > a[mid] && target <= a[hi]) { lo = mid + 1; steps.push({ array: [...a], highlights: [mid, hi], message: `Right sorted, target in right half` }); }
      else { hi = mid - 1; steps.push({ array: [...a], highlights: [lo, mid], message: `Right sorted, target in left half` }); }
    }
  }
  steps.push({ array: [...a], message: `❌ ${target} not found.` });
  return steps;
}

// ── Find Peak Element ──
export function generateFindPeakSteps(arr) {
  const a = [...arr];
  const steps = [{ array: [...a], highlights: [], message: 'Find Peak Element: binary search for local maximum.' }];
  let lo = 0, hi = a.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ array: [...a], highlights: [mid, mid + 1], left: lo, right: hi, mid, comparing: true, message: `mid=${mid}: ${a[mid]} vs ${a[mid + 1]}` });
    if (a[mid] > a[mid + 1]) { hi = mid; steps.push({ array: [...a], highlights: [mid], message: `Descending → peak is left (or at mid)` }); }
    else { lo = mid + 1; steps.push({ array: [...a], highlights: [mid + 1], message: `Ascending → peak is right` }); }
  }
  steps.push({ array: [...a], highlights: [lo], sorted: [lo], found: lo, message: `✅ Peak at index ${lo}, value = ${a[lo]}` });
  return steps;
}

// ── Find Min in Rotated Sorted Array ──
export function generateFindMinRotatedSteps(arr) {
  const a = [...arr];
  const steps = [{ array: [...a], highlights: [], message: 'Find Minimum in Rotated Sorted Array.' }];
  let lo = 0, hi = a.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ array: [...a], highlights: [mid], left: lo, right: hi, mid, message: `mid=${mid}, a[mid]=${a[mid]}, a[hi]=${a[hi]}` });
    if (a[mid] > a[hi]) { lo = mid + 1; steps.push({ array: [...a], message: `a[mid] > a[hi] → min in right half` }); }
    else { hi = mid; steps.push({ array: [...a], message: `a[mid] ≤ a[hi] → min in left half (incl mid)` }); }
  }
  steps.push({ array: [...a], highlights: [lo], sorted: [lo], found: lo, message: `✅ Minimum = ${a[lo]} at index ${lo}` });
  return steps;
}

// ── Spiral Matrix ──
export function generateSpiralMatrixSteps(input) {
  const matrix = input || [[1,2,3],[4,5,6],[7,8,9]];
  const flat = matrix.flat(); const result = [];
  const steps = [{ array: flat, highlights: [], message: `Spiral Matrix: traverse ${matrix.length}×${matrix[0].length} matrix in spiral order.` }];
  let top = 0, bottom = matrix.length - 1, left = 0, right = matrix[0].length - 1;
  const cols = matrix[0].length;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) { result.push(matrix[top][c]); steps.push({ array: flat, highlights: [top * cols + c], sorted: result.map((_, i) => { const r2 = matrix.findIndex(row => row.includes(result[i])); return r2 >= 0 ? r2 * cols + matrix[r2].indexOf(result[i]) : 0; }), message: `→ [${top}][${c}] = ${matrix[top][c]}` }); }
    top++;
    for (let r = top; r <= bottom; r++) { result.push(matrix[r][right]); steps.push({ array: flat, highlights: [r * cols + right], message: `↓ [${r}][${right}] = ${matrix[r][right]}` }); }
    right--;
    if (top <= bottom) { for (let c = right; c >= left; c--) { result.push(matrix[bottom][c]); steps.push({ array: flat, highlights: [bottom * cols + c], message: `← [${bottom}][${c}] = ${matrix[bottom][c]}` }); } bottom--; }
    if (left <= right) { for (let r = bottom; r >= top; r--) { result.push(matrix[r][left]); steps.push({ array: flat, highlights: [r * cols + left], message: `↑ [${r}][${left}] = ${matrix[r][left]}` }); } left++; }
  }
  steps.push({ array: flat, sorted: Array.from({ length: flat.length }, (_, k) => k), message: `✅ Spiral order: [${result.join(', ')}]` });
  return steps;
}

// ── Set Matrix Zeroes ──
export function generateSetMatrixZeroesSteps(input) {
  const matrix = input || [[1,1,1],[1,0,1],[1,1,1]];
  const flat = matrix.flat(); const rows = matrix.length, cols = matrix[0].length;
  const steps = [{ array: [...flat], highlights: [], message: `Set Matrix Zeroes: zero out rows and columns containing 0.` }];
  const zeroRows = new Set(), zeroCols = new Set();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (matrix[r][c] === 0) { zeroRows.add(r); zeroCols.add(c); steps.push({ array: [...flat], highlights: [r * cols + c], swapping: true, message: `Found 0 at [${r}][${c}] → mark row ${r}, col ${c}` }); }
  }
  const result = flat.map((v, i) => { const r = Math.floor(i / cols), c = i % cols; return zeroRows.has(r) || zeroCols.has(c) ? 0 : v; });
  steps.push({ array: result, sorted: Array.from({ length: flat.length }, (_, k) => k), message: `✅ Zeroed rows: {${[...zeroRows]}}, cols: {${[...zeroCols]}}` });
  return steps;
}

// ── Rotate Image (90° clockwise) ──
export function generateRotateImageSteps(input) {
  const matrix = input || [[1,2,3],[4,5,6],[7,8,9]];
  const n = matrix.length; const flat = matrix.flat();
  const steps = [{ array: [...flat], highlights: [], message: `Rotate Image 90°: transpose then reverse each row.` }];
  // transpose
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]];
    steps.push({ array: matrix.flat(), highlights: [i * n + j, j * n + i], swapping: true, message: `Transpose: swap [${i}][${j}] ↔ [${j}][${i}]` });
  }
  // reverse rows
  for (let i = 0; i < n; i++) { matrix[i].reverse(); steps.push({ array: matrix.flat(), highlights: Array.from({ length: n }, (_, j) => i * n + j), message: `Reverse row ${i}: [${matrix[i].join(',')}]` }); }
  steps.push({ array: matrix.flat(), sorted: Array.from({ length: flat.length }, (_, k) => k), message: `✅ Image rotated 90° clockwise!` });
  return steps;
}

// ── Permutations (Backtracking) ──
export function generatePermutationsSteps(arr) {
  const a = [...arr]; const result = [];
  const steps = [{ array: [...a], result: [], current: [], message: `Permutations of [${a.join(', ')}]` }];
  function backtrack(current, remaining) {
    if (remaining.length === 0) { result.push([...current]); steps.push({ array: [...a], result: result.map(r => [...r]), current: [...current], highlights: current.map(c => a.indexOf(c)), message: `✓ Permutation: [${current.join(', ')}]` }); return; }
    for (let i = 0; i < remaining.length; i++) {
      current.push(remaining[i]);
      steps.push({ array: [...a], result: result.map(r => [...r]), current: [...current], highlights: [a.indexOf(remaining[i])], message: `Choose ${remaining[i]}` });
      backtrack(current, [...remaining.slice(0, i), ...remaining.slice(i + 1)]);
      current.pop();
    }
  }
  backtrack([], a);
  steps.push({ array: [...a], result: result.map(r => [...r]), message: `✅ ${result.length} permutations generated!` });
  return steps;
}

// ── Jump Game II ──
export function generateJumpGameIISteps(arr) {
  const a = [...arr]; let jumps = 0, curEnd = 0, farthest = 0;
  const steps = [{ array: [...a], highlights: [0], message: `Jump Game II: min jumps to reach end. Start at index 0.` }];
  for (let i = 0; i < a.length - 1; i++) {
    farthest = Math.max(farthest, i + a[i]);
    steps.push({ array: [...a], highlights: [i], comparing: true, message: `Index ${i}: can jump to ${i + a[i]}, farthest = ${farthest}` });
    if (i === curEnd) {
      jumps++; curEnd = farthest;
      steps.push({ array: [...a], highlights: [i], sorted: [i], swapping: true, message: `Jump #${jumps}! New boundary = ${curEnd}` });
      if (curEnd >= a.length - 1) break;
    }
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Minimum jumps = ${jumps}` });
  return steps;
}

// ── Gas Station ──
export function generateGasStationSteps(input) {
  const gas = input?.gas || [1, 2, 3, 4, 5]; const cost = input?.cost || [3, 4, 5, 1, 2];
  const arr = gas.map((g, i) => g - cost[i]);
  const steps = [{ array: [...arr], highlights: [], message: `Gas Station: net gain at each station: [${arr.join(', ')}]` }];
  let total = 0, tank = 0, start = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i]; tank += arr[i];
    steps.push({ array: [...arr], highlights: [i], message: `Station ${i}: net=${arr[i]}, tank=${tank}, total=${total}` });
    if (tank < 0) {
      start = i + 1; tank = 0;
      steps.push({ array: [...arr], highlights: [i], swapping: true, message: `Tank < 0! Reset. Try starting from ${start}` });
    }
  }
  if (total >= 0) { steps.push({ array: [...arr], sorted: [start], highlights: [start], message: `✅ Start at station ${start}` }); }
  else { steps.push({ array: [...arr], message: `❌ Impossible — total net < 0` }); }
  return steps;
}

// ── Longest Increasing Subsequence ──
export function generateLISSteps(arr) {
  const a = [...arr]; const n = a.length; const dp = new Array(n).fill(1);
  const steps = [{ array: [...a], result: [...dp], highlights: [], message: `LIS: dp[i] = length of LIS ending at i.` }];
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (a[j] < a[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        steps.push({ array: [...a], result: [...dp], highlights: [j, i], message: `a[${j}]=${a[j]} < a[${i}]=${a[i]}: dp[${i}] = ${dp[i]}` });
      }
    }
  }
  const maxLIS = Math.max(...dp);
  steps.push({ array: [...a], result: [...dp], sorted: dp.map((v, i) => v === maxLIS ? i : -1).filter(i => i >= 0), message: `✅ LIS length = ${maxLIS}` });
  return steps;
}

// ── House Robber ──
export function generateHouseRobberSteps(arr) {
  const a = [...arr]; const n = a.length;
  if (n === 0) return [{ array: [], message: 'Empty array' }];
  const dp = new Array(n).fill(0);
  dp[0] = a[0]; if (n > 1) dp[1] = Math.max(a[0], a[1]);
  const steps = [{ array: [...a], result: [...dp], highlights: [0], message: `House Robber: dp[0]=${dp[0]}${n > 1 ? ', dp[1]=' + dp[1] : ''}` }];
  for (let i = 2; i < n; i++) {
    dp[i] = Math.max(dp[i - 1], dp[i - 2] + a[i]);
    steps.push({ array: [...a], result: [...dp], highlights: [i], message: `dp[${i}] = max(dp[${i - 1}]=${dp[i - 1]}, dp[${i - 2}]+${a[i]}=${dp[i - 2] + a[i]}) = ${dp[i]}` });
  }
  steps.push({ array: [...a], result: [...dp], sorted: Array.from({ length: n }, (_, k) => k), message: `✅ Max loot = ${dp[n - 1]}` });
  return steps;
}

// ── Coin Change ──
export function generateCoinChangeSteps(input) {
  const coins = input?.coins || [1, 5, 10, 25]; const amount = input?.amount || 30;
  const dp = new Array(amount + 1).fill(Infinity); dp[0] = 0;
  const steps = [{ array: dp.slice(0, Math.min(amount + 1, 31)), highlights: [0], message: `Coin Change: min coins for amount ${amount}. Coins: [${coins.join(',')}]` }];
  for (const coin of coins) {
    for (let i = coin; i <= amount; i++) {
      if (dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
        if (i <= 30) steps.push({ array: dp.slice(0, Math.min(amount + 1, 31)), highlights: [i], message: `dp[${i}] = dp[${i - coin}]+1 = ${dp[i]} using coin ${coin}` });
      }
    }
  }
  steps.push({ array: dp.slice(0, Math.min(amount + 1, 31)), sorted: [amount <= 30 ? amount : 0], message: `✅ Min coins for ${amount} = ${dp[amount] === Infinity ? 'impossible' : dp[amount]}` });
  return steps;
}

// ── Longest Common Subsequence ──
export function generateLCSSteps(input) {
  const s1 = input?.s1 || 'abcde'; const s2 = input?.s2 || 'ace';
  const m = s1.length, n = s2.length;
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  const steps = [{ array: s1.split(''), message: `LCS of "${s1}" and "${s2}"` }];
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        steps.push({ array: s1.split(''), highlights: [i - 1], sorted: [i - 1], message: `'${s1[i - 1]}'='${s2[j - 1]}': dp[${i}][${j}]=${dp[i][j]}` });
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  steps.push({ array: s1.split(''), message: `✅ LCS length = ${dp[m][n]}` });
  return steps;
}

// ── Edit Distance ──
export function generateEditDistanceSteps(input) {
  const s1 = input?.s1 || 'horse'; const s2 = input?.s2 || 'ros';
  const m = s1.length, n = s2.length;
  const dp = Array(m + 1).fill(null).map((_, i) => { const row = Array(n + 1).fill(0); row[0] = i; return row; });
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  const steps = [{ array: s1.split(''), message: `Edit Distance: "${s1}" → "${s2}"` }];
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
        steps.push({ array: s1.split(''), highlights: [i - 1], sorted: [i - 1], message: `'${s1[i - 1]}'='${s2[j - 1]}': no op, dp[${i}][${j}]=${dp[i][j]}` });
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        steps.push({ array: s1.split(''), highlights: [i - 1], message: `'${s1[i - 1]}'≠'${s2[j - 1]}': dp[${i}][${j}]=${dp[i][j]}` });
      }
    }
  }
  steps.push({ array: s1.split(''), message: `✅ Edit distance = ${dp[m][n]}` });
  return steps;
}

// ── Unique Paths ──
export function generateUniquePathsSteps(input) {
  const m = input?.m || 3, n = input?.n || 7;
  const dp = Array(m).fill(null).map(() => Array(n).fill(1));
  const flat = dp.flat();
  const steps = [{ array: [...flat], highlights: [], message: `Unique Paths: ${m}×${n} grid. First row and column = 1.` }];
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
      steps.push({ array: dp.flat(), highlights: [i * n + j], message: `dp[${i}][${j}] = ${dp[i - 1][j]} + ${dp[i][j - 1]} = ${dp[i][j]}` });
    }
  }
  steps.push({ array: dp.flat(), sorted: [(m - 1) * n + (n - 1)], message: `✅ Unique paths = ${dp[m - 1][n - 1]}` });
  return steps;
}

// ── Min Path Sum ──
export function generateMinPathSumSteps(input) {
  const grid = input || [[1,3,1],[1,5,1],[4,2,1]];
  const m = grid.length, n = grid[0].length;
  const dp = grid.map(r => [...r]);
  const steps = [{ array: dp.flat(), highlights: [0], message: `Min Path Sum: ${m}×${n} grid. Top-left to bottom-right.` }];
  for (let i = 1; i < m; i++) { dp[i][0] += dp[i - 1][0]; steps.push({ array: dp.flat(), highlights: [i * n], message: `dp[${i}][0] = ${dp[i][0]}` }); }
  for (let j = 1; j < n; j++) { dp[0][j] += dp[0][j - 1]; steps.push({ array: dp.flat(), highlights: [j], message: `dp[0][${j}] = ${dp[0][j]}` }); }
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      dp[i][j] += Math.min(dp[i - 1][j], dp[i][j - 1]);
      steps.push({ array: dp.flat(), highlights: [i * n + j], message: `dp[${i}][${j}] = ${grid[i][j]} + min(${dp[i - 1][j]},${dp[i][j - 1]}) = ${dp[i][j]}` });
    }
  }
  steps.push({ array: dp.flat(), sorted: [(m - 1) * n + (n - 1)], message: `✅ Min path sum = ${dp[m - 1][n - 1]}` });
  return steps;
}

// ── Number of Islands (simplified as grid) ──
export function generateNumberOfIslandsSteps(input) {
  const grid = input || [[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]];
  const m = grid.length, n = grid[0].length;
  const visited = Array(m).fill(null).map(() => Array(n).fill(false));
  const flat = grid.flat();
  const steps = [{ array: [...flat], highlights: [], message: `Number of Islands: ${m}×${n} grid. BFS/DFS to count connected 1s.` }];
  let islands = 0;
  function dfs(i, j) {
    if (i < 0 || i >= m || j < 0 || j >= n || grid[i][j] === 0 || visited[i][j]) return;
    visited[i][j] = true;
    steps.push({ array: [...flat], highlights: [i * n + j], sorted: visited.flat().map((v, idx) => v ? idx : -1).filter(x => x >= 0), message: `Visit [${i}][${j}] — part of island ${islands}` });
    dfs(i + 1, j); dfs(i - 1, j); dfs(i, j + 1); dfs(i, j - 1);
  }
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (grid[i][j] === 1 && !visited[i][j]) {
        islands++;
        steps.push({ array: [...flat], highlights: [i * n + j], swapping: true, message: `Found new island #${islands} starting at [${i}][${j}]` });
        dfs(i, j);
      }
    }
  }
  steps.push({ array: [...flat], sorted: visited.flat().map((v, idx) => v ? idx : -1).filter(x => x >= 0), message: `✅ Number of islands = ${islands}` });
  return steps;
}

// ── Rotting Oranges ──
export function generateRottingOrangesSteps(input) {
  const grid = input || [[2,1,1],[1,1,0],[0,1,1]];
  const m = grid.length, n = grid[0].length;
  const g = grid.map(r => [...r]); let fresh = 0; const queue = [];
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) { if (g[i][j] === 2) queue.push([i, j]); if (g[i][j] === 1) fresh++; }
  const steps = [{ array: g.flat(), highlights: queue.map(([i, j]) => i * n + j), message: `Rotting Oranges: ${fresh} fresh, ${queue.length} rotten initially.` }];
  let minutes = 0; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length > 0 && fresh > 0) {
    const size = queue.length; minutes++;
    for (let q = 0; q < size; q++) {
      const [i, j] = queue.shift();
      for (const [di, dj] of dirs) {
        const ni = i + di, nj = j + dj;
        if (ni >= 0 && ni < m && nj >= 0 && nj < n && g[ni][nj] === 1) {
          g[ni][nj] = 2; fresh--; queue.push([ni, nj]);
          steps.push({ array: g.flat(), highlights: [ni * n + nj], swapping: true, message: `Min ${minutes}: [${ni}][${nj}] rots! Fresh left: ${fresh}` });
        }
      }
    }
  }
  steps.push({ array: g.flat(), sorted: Array.from({ length: m * n }, (_, k) => k), message: fresh === 0 ? `✅ All rotten in ${minutes} minutes!` : `❌ ${fresh} oranges can't be reached.` });
  return steps;
}

// ── Heap Sort ──
export function generateHeapSortSteps(arr) {
  const a = [...arr]; const n = a.length;
  const steps = [{ array: [...a], highlights: [], sorted: [], message: 'Heap Sort: build max-heap then extract max repeatedly.' }];
  function heapify(a, n, i) {
    let largest = i, l = 2 * i + 1, r2 = 2 * i + 2;
    if (l < n && a[l] > a[largest]) largest = l;
    if (r2 < n && a[r2] > a[largest]) largest = r2;
    if (largest !== i) {
      [a[i], a[largest]] = [a[largest], a[i]];
      steps.push({ array: [...a], highlights: [i, largest], swapping: true, message: `Heapify: swap ${a[largest]} ↔ ${a[i]}` });
      heapify(a, n, largest);
    }
  }
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) heapify(a, n, i);
  steps.push({ array: [...a], highlights: [], message: `Max-heap built: [${a.join(', ')}]` });
  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    steps.push({ array: [...a], highlights: [0, i], swapping: true, sorted: Array.from({ length: n - i }, (_, k) => n - 1 - k), message: `Extract max ${a[i]} to position ${i}` });
    heapify(a, i, 0);
  }
  steps.push({ array: [...a], sorted: Array.from({ length: n }, (_, k) => k), message: '✅ Heap Sort complete!' });
  return steps;
}

// ── Counting Sort ──
export function generateCountingSortSteps(arr) {
  const a = [...arr]; const max = Math.max(...a);
  const count = new Array(max + 1).fill(0);
  const steps = [{ array: [...a], highlights: [], message: `Counting Sort: count occurrences, max value = ${max}` }];
  for (let i = 0; i < a.length; i++) {
    count[a[i]]++;
    steps.push({ array: [...a], highlights: [i], message: `Count ${a[i]}: count[${a[i]}] = ${count[a[i]]}` });
  }
  let idx = 0;
  for (let i = 0; i <= max; i++) {
    while (count[i] > 0) { a[idx] = i; count[i]--; idx++; }
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Sorted: [${a.join(', ')}]` });
  return steps;
}

// ── Radix Sort ──
export function generateRadixSortSteps(arr) {
  const a = [...arr]; const max = Math.max(...a);
  const steps = [{ array: [...a], highlights: [], message: `Radix Sort: sort by each digit, max = ${max}` }];
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const output = new Array(a.length).fill(0);
    const count = new Array(10).fill(0);
    for (let i = 0; i < a.length; i++) count[Math.floor(a[i] / exp) % 10]++;
    for (let i = 1; i < 10; i++) count[i] += count[i - 1];
    for (let i = a.length - 1; i >= 0; i--) {
      const digit = Math.floor(a[i] / exp) % 10;
      output[count[digit] - 1] = a[i]; count[digit]--;
    }
    for (let i = 0; i < a.length; i++) a[i] = output[i];
    steps.push({ array: [...a], highlights: Array.from({ length: a.length }, (_, k) => k), message: `After sorting by ${exp}s digit: [${a.join(', ')}]` });
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Radix Sort complete: [${a.join(', ')}]` });
  return steps;
}

// ── Sort Colors (Dutch National Flag) ──
export function generateSortColorsSteps(arr) {
  const a = [...arr]; let lo = 0, mid = 0, hi = a.length - 1;
  const steps = [{ array: [...a], highlights: [], message: 'Sort Colors (Dutch National Flag): partition into 0s, 1s, 2s.' }];
  while (mid <= hi) {
    if (a[mid] === 0) {
      [a[lo], a[mid]] = [a[mid], a[lo]];
      steps.push({ array: [...a], highlights: [lo, mid], swapping: true, message: `${a[lo]}=0: swap to front (lo=${lo})` });
      lo++; mid++;
    } else if (a[mid] === 1) {
      steps.push({ array: [...a], highlights: [mid], message: `${a[mid]}=1: already in middle, skip` });
      mid++;
    } else {
      [a[mid], a[hi]] = [a[hi], a[mid]];
      steps.push({ array: [...a], highlights: [mid, hi], swapping: true, message: `${a[hi]}=2: swap to back (hi=${hi})` });
      hi--;
    }
  }
  steps.push({ array: [...a], sorted: Array.from({ length: a.length }, (_, k) => k), message: `✅ Sorted: [${a.join(', ')}]` });
  return steps;
}
