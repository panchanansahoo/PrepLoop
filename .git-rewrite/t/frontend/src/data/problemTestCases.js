// ─── Comprehensive Test Cases for All DSA Problems ───
// Each problem maps to an array of { input, output, name } objects
// input: array of arguments to pass to the solution function
// output: expected return value

export const PROBLEM_TEST_CASES = {

  // ===== ARRAY PROBLEMS =====

  'two-sum': [
    { input: [[2,7,11,15], 9], output: [0,1], name: 'Basic case' },
    { input: [[3,2,4], 6], output: [1,2], name: 'Middle elements' },
    { input: [[3,3], 6], output: [0,1], name: 'Duplicate values' },
    { input: [[1,2,3,4,5,6,7,8,9,10], 19], output: [8,9], name: 'Last two elements' },
    { input: [[-1,-2,-3,-4,-5], -8], output: [2,4], name: 'Negative numbers' },
    { input: [[0,4,3,0], 0], output: [0,3], name: 'Zero target' },
    { input: [[1000000,500000,-1500000], -1000000], output: [1,2], name: 'Large values' },
  ],

  'best-time-to-buy-and-sell-stock': [
    { input: [[7,1,5,3,6,4]], output: 5, name: 'Basic case' },
    { input: [[7,6,4,3,1]], output: 0, name: 'Decreasing prices' },
    { input: [[1,2]], output: 1, name: 'Two elements ascending' },
    { input: [[2,1]], output: 0, name: 'Two elements descending' },
    { input: [[1]], output: 0, name: 'Single element' },
    { input: [[3,3,3,3]], output: 0, name: 'All same prices' },
    { input: [[1,4,2,7]], output: 6, name: 'Buy first sell last' },
  ],

  'contains-duplicate': [
    { input: [[1,2,3,1]], output: true, name: 'Has duplicate' },
    { input: [[1,2,3,4]], output: false, name: 'All unique' },
    { input: [[1,1,1,3,3,4,3,2,4,2]], output: true, name: 'Multiple duplicates' },
    { input: [[]], output: false, name: 'Empty array' },
    { input: [[1]], output: false, name: 'Single element' },
    { input: [[-1,-1]], output: true, name: 'Negative duplicates' },
    { input: [[0,0]], output: true, name: 'Zero duplicates' },
  ],

  'product-of-array-except-self': [
    { input: [[1,2,3,4]], output: [24,12,8,6], name: 'Basic case' },
    { input: [[-1,1,0,-3,3]], output: [0,0,9,0,0], name: 'Contains zero' },
    { input: [[1,1,1,1]], output: [1,1,1,1], name: 'All ones' },
    { input: [[2,3]], output: [3,2], name: 'Two elements' },
    { input: [[-1,-2,-3]], output: [6,-3,-2], name: 'All negative' },
  ],

  'maximum-subarray': [
    { input: [[-2,1,-3,4,-1,2,1,-5,4]], output: 6, name: 'Mixed values (Kadane)' },
    { input: [[1]], output: 1, name: 'Single element' },
    { input: [[5,4,-1,7,8]], output: 23, name: 'Mostly positive' },
    { input: [[-1]], output: -1, name: 'Single negative' },
    { input: [[-2,-1]], output: -1, name: 'All negative' },
    { input: [[0,0,0]], output: 0, name: 'All zeros' },
    { input: [[1,2,3,4,5]], output: 15, name: 'All positive' },
  ],

  'maximum-product-subarray': [
    { input: [[2,3,-2,4]], output: 6, name: 'Basic case' },
    { input: [[-2,0,-1]], output: 0, name: 'Contains zero' },
    { input: [[-2,3,-4]], output: 24, name: 'Two negatives' },
    { input: [[0,2]], output: 2, name: 'Starts with zero' },
    { input: [[-2]], output: -2, name: 'Single negative' },
    { input: [[2,-5,-2,-4,3]], output: 24, name: 'Complex case' },
  ],

  'find-minimum-in-rotated-sorted-array': [
    { input: [[3,4,5,1,2]], output: 1, name: 'Rotated by 3' },
    { input: [[4,5,6,7,0,1,2]], output: 0, name: 'Contains zero' },
    { input: [[11,13,15,17]], output: 11, name: 'Not rotated' },
    { input: [[2,1]], output: 1, name: 'Two elements' },
    { input: [[1]], output: 1, name: 'Single element' },
    { input: [[3,1,2]], output: 1, name: 'Rotated by 1' },
  ],

  'search-in-rotated-sorted-array': [
    { input: [[4,5,6,7,0,1,2], 0], output: 4, name: 'Found in right half' },
    { input: [[4,5,6,7,0,1,2], 3], output: -1, name: 'Not found' },
    { input: [[1], 0], output: -1, name: 'Single element not found' },
    { input: [[1], 1], output: 0, name: 'Single element found' },
    { input: [[3,1], 1], output: 1, name: 'Two elements' },
    { input: [[5,1,3], 5], output: 0, name: 'Found at start' },
  ],

  'container-with-most-water': [
    { input: [[1,8,6,2,5,4,8,3,7]], output: 49, name: 'Basic case' },
    { input: [[1,1]], output: 1, name: 'Two elements same' },
    { input: [[4,3,2,1,4]], output: 16, name: 'Symmetric sides' },
    { input: [[1,2,1]], output: 2, name: 'Three elements' },
    { input: [[2,3,4,5,18,17,6]], output: 17, name: 'Large values in middle' },
  ],

  '3sum': [
    { input: [[-1,0,1,2,-1,-4]], output: [[-1,-1,2],[-1,0,1]], name: 'Basic case' },
    { input: [[0,1,1]], output: [], name: 'No triplets' },
    { input: [[0,0,0]], output: [[0,0,0]], name: 'All zeros' },
    { input: [[0,0,0,0]], output: [[0,0,0]], name: 'Multiple zeros' },
    { input: [[-2,0,1,1,2]], output: [[-2,0,2],[-2,1,1]], name: 'Multiple triplets' },
  ],

  'remove-duplicates-from-sorted-array': [
    { input: [[1,1,2]], output: 2, name: 'Basic case' },
    { input: [[0,0,1,1,1,2,2,3,3,4]], output: 5, name: 'Multiple duplicates' },
    { input: [[1]], output: 1, name: 'Single element' },
    { input: [[1,2,3]], output: 3, name: 'No duplicates' },
    { input: [[-1,-1,0,0,1,1]], output: 3, name: 'Negative values' },
  ],

  'rotate-array': [
    { input: [[1,2,3,4,5,6,7], 3], output: [5,6,7,1,2,3,4], name: 'Basic case' },
    { input: [[-1,-100,3,99], 2], output: [3,99,-1,-100], name: 'Mixed values' },
    { input: [[1,2], 1], output: [2,1], name: 'Two elements' },
    { input: [[1], 0], output: [1], name: 'No rotation' },
    { input: [[1,2,3], 3], output: [1,2,3], name: 'Full rotation' },
  ],

  'jump-game': [
    { input: [[2,3,1,1,4]], output: true, name: 'Can reach end' },
    { input: [[3,2,1,0,4]], output: false, name: 'Cannot reach end' },
    { input: [[0]], output: true, name: 'Single element' },
    { input: [[2,0]], output: true, name: 'Two elements reachable' },
    { input: [[0,1]], output: false, name: 'Stuck at start' },
    { input: [[1,1,1,1]], output: true, name: 'All ones' },
  ],

  'merge-sorted-array': [
    { input: [[1,2,3,0,0,0], 3, [2,5,6], 3], output: [1,2,2,3,5,6], name: 'Basic merge' },
    { input: [[1], 1, [], 0], output: [1], name: 'Empty second array' },
    { input: [[0], 0, [1], 1], output: [1], name: 'Empty first array' },
    { input: [[4,5,6,0,0,0], 3, [1,2,3], 3], output: [1,2,3,4,5,6], name: 'All before' },
    { input: [[1,2,3,0,0,0], 3, [4,5,6], 3], output: [1,2,3,4,5,6], name: 'All after' },
  ],

  'majority-element': [
    { input: [[3,2,3]], output: 3, name: 'Basic case' },
    { input: [[2,2,1,1,1,2,2]], output: 2, name: 'Complex case' },
    { input: [[1]], output: 1, name: 'Single element' },
    { input: [[1,1,1]], output: 1, name: 'All same' },
    { input: [[6,5,5]], output: 5, name: 'Majority at end' },
  ],

  'rotate-image': [
    { input: [[[1,2,3],[4,5,6],[7,8,9]]], output: [[7,4,1],[8,5,2],[9,6,3]], name: '3x3 matrix' },
    { input: [[[1,2],[3,4]]], output: [[3,1],[4,2]], name: '2x2 matrix' },
    { input: [[[1]]], output: [[1]], name: '1x1 matrix' },
    { input: [[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]], output: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]], name: '4x4 matrix' },
  ],

  'set-matrix-zeroes': [
    { input: [[[1,1,1],[1,0,1],[1,1,1]]], output: [[1,0,1],[0,0,0],[1,0,1]], name: 'Center zero' },
    { input: [[[0,1,2,0],[3,4,5,2],[1,3,1,5]]], output: [[0,0,0,0],[0,4,5,0],[0,3,1,0]], name: 'Edge zeros' },
    { input: [[[1,2],[3,4]]], output: [[1,2],[3,4]], name: 'No zeros' },
  ],

  'merge-intervals': [
    { input: [[[1,3],[2,6],[8,10],[15,18]]], output: [[1,6],[8,10],[15,18]], name: 'Basic merge' },
    { input: [[[1,4],[4,5]]], output: [[1,5]], name: 'Touching intervals' },
    { input: [[[1,4],[0,4]]], output: [[0,4]], name: 'Overlapping start' },
    { input: [[[1,4],[2,3]]], output: [[1,4]], name: 'Contained interval' },
    { input: [[[1,2]]], output: [[1,2]], name: 'Single interval' },
  ],

  'missing-number': [
    { input: [[3,0,1]], output: 2, name: 'Middle missing' },
    { input: [[0,1]], output: 2, name: 'Last missing' },
    { input: [[9,6,4,2,3,5,7,0,1]], output: 8, name: 'Large array' },
    { input: [[0]], output: 1, name: 'Single element' },
    { input: [[1]], output: 0, name: 'Zero missing' },
  ],

  'move-zeroes': [
    { input: [[0,1,0,3,12]], output: [1,3,12,0,0], name: 'Basic case' },
    { input: [[0]], output: [0], name: 'Single zero' },
    { input: [[1,2,3]], output: [1,2,3], name: 'No zeros' },
    { input: [[0,0,0,1]], output: [1,0,0,0], name: 'Multiple zeros' },
    { input: [[1,0]], output: [1,0], name: 'Two elements' },
  ],

  'plus-one': [
    { input: [[1,2,3]], output: [1,2,4], name: 'No carry' },
    { input: [[4,3,2,1]], output: [4,3,2,2], name: 'Large number' },
    { input: [[9]], output: [1,0], name: 'Single 9 with carry' },
    { input: [[9,9,9]], output: [1,0,0,0], name: 'All nines' },
    { input: [[0]], output: [1], name: 'Zero' },
  ],

  'longest-consecutive-sequence': [
    { input: [[100,4,200,1,3,2]], output: 4, name: 'Basic case' },
    { input: [[0,3,7,2,5,8,4,6,0,1]], output: 9, name: 'Long sequence' },
    { input: [[]], output: 0, name: 'Empty array' },
    { input: [[1]], output: 1, name: 'Single element' },
    { input: [[1,2,0,1]], output: 3, name: 'With duplicates' },
  ],

  // ===== TWO POINTERS PROBLEMS =====

  'valid-palindrome': [
    { input: ['A man, a plan, a canal: Panama'], output: true, name: 'Classic palindrome' },
    { input: ['race a car'], output: false, name: 'Not palindrome' },
    { input: [' '], output: true, name: 'Single space' },
    { input: [''], output: true, name: 'Empty string' },
    { input: ['a'], output: true, name: 'Single char' },
    { input: ['ab'], output: false, name: 'Two different chars' },
    { input: ['.,'], output: true, name: 'Only special chars' },
    { input: ['0P'], output: false, name: 'Alphanumeric mix' },
  ],

  'reverse-string': [
    { input: [['h','e','l','l','o']], output: ['o','l','l','e','h'], name: 'Basic case' },
    { input: [['H','a','n','n','a','h']], output: ['h','a','n','n','a','H'], name: 'Palindrome name' },
    { input: [['a']], output: ['a'], name: 'Single char' },
    { input: [['a','b']], output: ['b','a'], name: 'Two chars' },
  ],

  'squares-of-a-sorted-array': [
    { input: [[-4,-1,0,3,10]], output: [0,1,9,16,100], name: 'Mixed signs' },
    { input: [[-7,-3,2,3,11]], output: [4,9,9,49,121], name: 'More negatives' },
    { input: [[1]], output: [1], name: 'Single element' },
    { input: [[-5,-3,-2,-1]], output: [1,4,9,25], name: 'All negative' },
    { input: [[0,1,2,3]], output: [0,1,4,9], name: 'All non-negative' },
  ],

  'trapping-rain-water': [
    { input: [[0,1,0,2,1,0,1,3,2,1,2,1]], output: 6, name: 'Basic case' },
    { input: [[4,2,0,3,2,5]], output: 9, name: 'Valley shape' },
    { input: [[1,2,3,4,5]], output: 0, name: 'Increasing' },
    { input: [[5,4,3,2,1]], output: 0, name: 'Decreasing' },
    { input: [[0]], output: 0, name: 'Single element' },
  ],

  'is-subsequence': [
    { input: ['abc', 'ahbgdc'], output: true, name: 'Is subsequence' },
    { input: ['axc', 'ahbgdc'], output: false, name: 'Not subsequence' },
    { input: ['', 'ahbgdc'], output: true, name: 'Empty s' },
    { input: ['abc', ''], output: false, name: 'Empty t' },
    { input: ['a', 'a'], output: true, name: 'Single char match' },
  ],

  'linked-list-cycle': [
    { input: [[3,2,0,-4], 1], output: true, name: 'Has cycle' },
    { input: [[1,2], 0], output: true, name: 'Two node cycle' },
    { input: [[1], -1], output: false, name: 'No cycle single node' },
    { input: [[1,2,3], -1], output: false, name: 'No cycle' },
  ],

  // ===== SLIDING WINDOW PROBLEMS =====

  'longest-substring-without-repeating-characters': [
    { input: ['abcabcbb'], output: 3, name: 'Basic case abc' },
    { input: ['bbbbb'], output: 1, name: 'All same chars' },
    { input: ['pwwkew'], output: 3, name: 'Middle substring wke' },
    { input: [''], output: 0, name: 'Empty string' },
    { input: ['a'], output: 1, name: 'Single char' },
    { input: ['abcdef'], output: 6, name: 'All unique' },
    { input: ['dvdf'], output: 3, name: 'Restart window' },
  ],

  'minimum-window-substring': [
    { input: ['ADOBECODEBANC', 'ABC'], output: 'BANC', name: 'Basic case' },
    { input: ['a', 'a'], output: 'a', name: 'Single char match' },
    { input: ['a', 'aa'], output: '', name: 'Impossible match' },
    { input: ['aa', 'aa'], output: 'aa', name: 'Exact match' },
  ],

  'find-all-anagrams-in-a-string': [
    { input: ['cbaebabacd', 'abc'], output: [0,6], name: 'Basic case' },
    { input: ['abab', 'ab'], output: [0,1,2], name: 'Overlapping anagrams' },
    { input: ['a', 'a'], output: [0], name: 'Single char' },
    { input: ['abc', 'de'], output: [], name: 'No anagrams' },
  ],

  'contains-duplicate-ii': [
    { input: [[1,2,3,1], 3], output: true, name: 'Within range' },
    { input: [[1,0,1,1], 1], output: true, name: 'Adjacent duplicates' },
    { input: [[1,2,3,1,2,3], 2], output: false, name: 'Out of range' },
    { input: [[1], 1], output: false, name: 'Single element' },
  ],

  // ===== LINKED LIST PROBLEMS =====

  'reverse-linked-list': [
    { input: [[1,2,3,4,5]], output: [5,4,3,2,1], name: 'Basic case' },
    { input: [[1,2]], output: [2,1], name: 'Two nodes' },
    { input: [[1]], output: [1], name: 'Single node' },
    { input: [[]], output: [], name: 'Empty list' },
    { input: [[1,2,3]], output: [3,2,1], name: 'Three nodes' },
  ],

  'merge-two-sorted-lists': [
    { input: [[1,2,4], [1,3,4]], output: [1,1,2,3,4,4], name: 'Basic merge' },
    { input: [[], []], output: [], name: 'Both empty' },
    { input: [[], [0]], output: [0], name: 'First empty' },
    { input: [[1], []], output: [1], name: 'Second empty' },
    { input: [[1,3,5], [2,4,6]], output: [1,2,3,4,5,6], name: 'Interleaved' },
    { input: [[1,1,1], [1,1,1]], output: [1,1,1,1,1,1], name: 'All same values' },
  ],

  'add-two-numbers': [
    { input: [[2,4,3], [5,6,4]], output: [7,0,8], name: '342 + 465 = 807' },
    { input: [[0], [0]], output: [0], name: 'Zero plus zero' },
    { input: [[9,9,9,9,9,9,9], [9,9,9,9]], output: [8,9,9,9,0,0,0,1], name: 'Carry overflow' },
    { input: [[9], [1]], output: [0,1], name: 'Simple carry' },
  ],

  'remove-nth-node-from-end-of-list': [
    { input: [[1,2,3,4,5], 2], output: [1,2,3,5], name: 'Remove 4th' },
    { input: [[1], 1], output: [], name: 'Remove only node' },
    { input: [[1,2], 1], output: [1], name: 'Remove last' },
    { input: [[1,2], 2], output: [2], name: 'Remove first' },
  ],

  'lru-cache': [
    { input: [['LRUCache','put','put','get','put','get','put','get','get','get'], [[2],[1,1],[2,2],[1],[3,3],[2],[4,4],[1],[3],[4]]], output: [null,null,null,1,null,-1,null,-1,3,4], name: 'Basic LRU operations' },
  ],

  // ===== STACK PROBLEMS =====

  'valid-parentheses': [
    { input: ['()'], output: true, name: 'Simple parens' },
    { input: ['()[]{}'], output: true, name: 'All bracket types' },
    { input: ['(]'], output: false, name: 'Mismatched' },
    { input: ['([)]'], output: false, name: 'Wrong nesting' },
    { input: ['{[]}'], output: true, name: 'Nested brackets' },
    { input: [''], output: true, name: 'Empty string' },
    { input: ['('], output: false, name: 'Single open' },
  ],

  'min-stack': [
    { input: [['MinStack','push','push','push','getMin','pop','top','getMin'], [[],[-2],[0],[-3],[],[],[],[]]], output: [null,null,null,null,-3,null,0,-2], name: 'Basic operations' },
  ],

  'evaluate-reverse-polish-notation': [
    { input: [['2','1','+','3','*']], output: 9, name: '(2+1)*3 = 9' },
    { input: [['4','13','5','/','+' ]], output: 6, name: '4+(13/5) = 6' },
    { input: [['10','6','9','3','+','-11','*','/','*','17','+','5','+']], output: 22, name: 'Complex expression' },
  ],

  'daily-temperatures': [
    { input: [[73,74,75,71,69,72,76,73]], output: [1,1,4,2,1,1,0,0], name: 'Basic case' },
    { input: [[30,40,50,60]], output: [1,1,1,0], name: 'Increasing temps' },
    { input: [[30,60,90]], output: [1,1,0], name: 'Three days' },
    { input: [[90,80,70,60]], output: [0,0,0,0], name: 'Decreasing temps' },
  ],

  'decode-string': [
    { input: ['3[a]2[bc]'], output: 'aaabcbc', name: 'Basic encoding' },
    { input: ['3[a2[c]]'], output: 'accaccacc', name: 'Nested encoding' },
    { input: ['2[abc]3[cd]ef'], output: 'abcabccdcdcdef', name: 'Mixed encoding' },
    { input: ['abc3[cd]xyz'], output: 'abccdcdcdxyz', name: 'With plain chars' },
  ],

  // ===== BINARY SEARCH PROBLEMS =====

  'binary-search': [
    { input: [[-1,0,3,5,9,12], 9], output: 4, name: 'Found in array' },
    { input: [[-1,0,3,5,9,12], 2], output: -1, name: 'Not found' },
    { input: [[5], 5], output: 0, name: 'Single element found' },
    { input: [[5], -5], output: -1, name: 'Single element not found' },
    { input: [[1,2,3,4,5], 1], output: 0, name: 'First element' },
    { input: [[1,2,3,4,5], 5], output: 4, name: 'Last element' },
  ],

  'search-insert-position': [
    { input: [[1,3,5,6], 5], output: 2, name: 'Found exact' },
    { input: [[1,3,5,6], 2], output: 1, name: 'Insert in middle' },
    { input: [[1,3,5,6], 7], output: 4, name: 'Insert at end' },
    { input: [[1,3,5,6], 0], output: 0, name: 'Insert at start' },
    { input: [[1], 1], output: 0, name: 'Single element match' },
  ],

  'koko-eating-bananas': [
    { input: [[3,6,7,11], 8], output: 4, name: 'Basic case' },
    { input: [[30,11,23,4,20], 5], output: 30, name: 'Tight hours' },
    { input: [[30,11,23,4,20], 6], output: 23, name: 'Medium hours' },
    { input: [[1], 1], output: 1, name: 'Single pile' },
  ],

  // ===== TREE PROBLEMS =====

  'maximum-depth-of-binary-tree': [
    { input: [[3,9,20,null,null,15,7]], output: 3, name: 'Basic tree' },
    { input: [[1,null,2]], output: 2, name: 'Right skewed' },
    { input: [[]], output: 0, name: 'Empty tree' },
    { input: [[1]], output: 1, name: 'Single node' },
    { input: [[1,2,3,4,5]], output: 3, name: 'Left heavy' },
  ],

  'invert-binary-tree': [
    { input: [[4,2,7,1,3,6,9]], output: [4,7,2,9,6,3,1], name: 'Complete tree' },
    { input: [[2,1,3]], output: [2,3,1], name: 'Three nodes' },
    { input: [[]], output: [], name: 'Empty tree' },
    { input: [[1]], output: [1], name: 'Single node' },
  ],

  'same-tree': [
    { input: [[1,2,3], [1,2,3]], output: true, name: 'Same trees' },
    { input: [[1,2], [1,null,2]], output: false, name: 'Different structure' },
    { input: [[1,2,1], [1,1,2]], output: false, name: 'Different values' },
    { input: [[], []], output: true, name: 'Both empty' },
    { input: [[1], [1]], output: true, name: 'Single nodes same' },
  ],

  'symmetric-tree': [
    { input: [[1,2,2,3,4,4,3]], output: true, name: 'Symmetric' },
    { input: [[1,2,2,null,3,null,3]], output: false, name: 'Not symmetric' },
    { input: [[1]], output: true, name: 'Single node' },
    { input: [[]], output: true, name: 'Empty tree' },
  ],

  'binary-tree-level-order-traversal': [
    { input: [[3,9,20,null,null,15,7]], output: [[3],[9,20],[15,7]], name: 'Basic tree' },
    { input: [[1]], output: [[1]], name: 'Single node' },
    { input: [[]], output: [], name: 'Empty tree' },
    { input: [[1,2,3,4,5]], output: [[1],[2,3],[4,5]], name: 'Left heavy' },
  ],

  'validate-binary-search-tree': [
    { input: [[2,1,3]], output: true, name: 'Valid BST' },
    { input: [[5,1,4,null,null,3,6]], output: false, name: 'Invalid BST' },
    { input: [[1]], output: true, name: 'Single node' },
    { input: [[2,2,2]], output: false, name: 'Equal values' },
  ],

  'lowest-common-ancestor-of-a-binary-search-tree': [
    { input: [[6,2,8,0,4,7,9,null,null,3,5], 2, 8], output: 6, name: 'Root is LCA' },
    { input: [[6,2,8,0,4,7,9,null,null,3,5], 2, 4], output: 2, name: 'Ancestor is one node' },
    { input: [[2,1], 2, 1], output: 2, name: 'Two nodes' },
  ],

  'path-sum': [
    { input: [[5,4,8,11,null,13,4,7,2,null,null,null,1], 22], output: true, name: 'Has path' },
    { input: [[1,2,3], 5], output: false, name: 'No path' },
    { input: [[], 0], output: false, name: 'Empty tree' },
    { input: [[1], 1], output: true, name: 'Single node match' },
    { input: [[1], 2], output: false, name: 'Single node no match' },
  ],

  'climbing-stairs': [
    { input: [2], output: 2, name: 'Two stairs' },
    { input: [3], output: 3, name: 'Three stairs' },
    { input: [1], output: 1, name: 'One stair' },
    { input: [4], output: 5, name: 'Four stairs' },
    { input: [5], output: 8, name: 'Five stairs' },
    { input: [10], output: 89, name: 'Ten stairs' },
    { input: [45], output: 1836311903, name: 'Large input' },
  ],

  // ===== DYNAMIC PROGRAMMING PROBLEMS =====

  'house-robber': [
    { input: [[1,2,3,1]], output: 4, name: 'Basic case' },
    { input: [[2,7,9,3,1]], output: 12, name: 'Five houses' },
    { input: [[2,1,1,2]], output: 4, name: 'First and last' },
    { input: [[1]], output: 1, name: 'Single house' },
    { input: [[1,2]], output: 2, name: 'Two houses' },
    { input: [[0,0,0]], output: 0, name: 'All zeros' },
  ],

  'coin-change': [
    { input: [[1,5,10,25], 36], output: 3, name: 'US coins' },
    { input: [[2], 3], output: -1, name: 'Impossible' },
    { input: [[1], 0], output: 0, name: 'Zero amount' },
    { input: [[1,2,5], 11], output: 3, name: 'Basic case' },
    { input: [[186,419,83,408], 6249], output: 20, name: 'Large values' },
  ],

  'longest-increasing-subsequence': [
    { input: [[10,9,2,5,3,7,101,18]], output: 4, name: 'Basic case' },
    { input: [[0,1,0,3,2,3]], output: 4, name: 'Multiple options' },
    { input: [[7,7,7,7,7,7,7]], output: 1, name: 'All same' },
    { input: [[1]], output: 1, name: 'Single element' },
    { input: [[1,2,3,4,5]], output: 5, name: 'Already sorted' },
  ],

  'unique-paths': [
    { input: [3, 7], output: 28, name: '3x7 grid' },
    { input: [3, 2], output: 3, name: '3x2 grid' },
    { input: [1, 1], output: 1, name: '1x1 grid' },
    { input: [7, 3], output: 28, name: 'Symmetric to 3x7' },
    { input: [3, 3], output: 6, name: '3x3 grid' },
  ],

  'word-break': [
    { input: ['leetcode', ['leet','code']], output: true, name: 'Basic case' },
    { input: ['applepenapple', ['apple','pen']], output: true, name: 'Reuse words' },
    { input: ['catsandog', ['cats','dog','sand','and','cat']], output: false, name: 'Cannot break' },
    { input: ['a', ['a']], output: true, name: 'Single char' },
  ],

  'longest-palindromic-substring': [
    { input: ['babad'], output: 'bab', name: 'Basic case' },
    { input: ['cbbd'], output: 'bb', name: 'Even length' },
    { input: ['a'], output: 'a', name: 'Single char' },
    { input: ['ac'], output: 'a', name: 'No palindrome > 1' },
    { input: ['racecar'], output: 'racecar', name: 'Full string palindrome' },
  ],

  'edit-distance': [
    { input: ['horse', 'ros'], output: 3, name: 'Basic case' },
    { input: ['intention', 'execution'], output: 5, name: 'Longer strings' },
    { input: ['', ''], output: 0, name: 'Both empty' },
    { input: ['abc', ''], output: 3, name: 'One empty' },
    { input: ['abc', 'abc'], output: 0, name: 'Same strings' },
  ],

  'partition-equal-subset-sum': [
    { input: [[1,5,11,5]], output: true, name: 'Can partition' },
    { input: [[1,2,3,5]], output: false, name: 'Cannot partition' },
    { input: [[1,1]], output: true, name: 'Two equal elements' },
    { input: [[1,2,5]], output: false, name: 'Odd sum' },
  ],

  // ===== GRAPH PROBLEMS =====

  'number-of-islands': [
    { input: [[['1','1','1','1','0'],['1','1','0','1','0'],['1','1','0','0','0'],['0','0','0','0','0']]], output: 1, name: 'One island' },
    { input: [[['1','1','0','0','0'],['1','1','0','0','0'],['0','0','1','0','0'],['0','0','0','1','1']]], output: 3, name: 'Three islands' },
    { input: [[['0']]], output: 0, name: 'No islands' },
    { input: [[['1']]], output: 1, name: 'Single cell island' },
  ],

  'course-schedule': [
    { input: [2, [[1,0]]], output: true, name: 'Simple prereq' },
    { input: [2, [[1,0],[0,1]]], output: false, name: 'Cycle exists' },
    { input: [1, []], output: true, name: 'No prereqs' },
    { input: [3, [[1,0],[2,1]]], output: true, name: 'Chain prereqs' },
    { input: [4, [[1,0],[2,1],[3,2],[1,3]]], output: false, name: 'Complex cycle' },
  ],

  'clone-graph': [
    { input: [[[2,4],[1,3],[2,4],[1,3]]], output: [[2,4],[1,3],[2,4],[1,3]], name: 'Basic graph' },
    { input: [[[]]], output: [[]], name: 'Single node no neighbors' },
    { input: [[]], output: [], name: 'Empty graph' },
  ],

  // ===== BACKTRACKING PROBLEMS =====

  'subsets': [
    { input: [[1,2,3]], output: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]], name: 'Three elements' },
    { input: [[0]], output: [[],[0]], name: 'Single element' },
    { input: [[1,2]], output: [[],[1],[2],[1,2]], name: 'Two elements' },
  ],

  'permutations': [
    { input: [[1,2,3]], output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]], name: 'Three elements' },
    { input: [[0,1]], output: [[0,1],[1,0]], name: 'Two elements' },
    { input: [[1]], output: [[1]], name: 'Single element' },
  ],

  'combination-sum': [
    { input: [[2,3,6,7], 7], output: [[2,2,3],[7]], name: 'Basic case' },
    { input: [[2,3,5], 8], output: [[2,2,2,2],[2,3,3],[3,5]], name: 'Multiple combos' },
    { input: [[2], 1], output: [], name: 'Impossible' },
    { input: [[1], 1], output: [[1]], name: 'Single element match' },
  ],

  'letter-combinations-of-a-phone-number': [
    { input: ['23'], output: ['ad','ae','af','bd','be','bf','cd','ce','cf'], name: 'Two digits' },
    { input: [''], output: [], name: 'No digits' },
    { input: ['2'], output: ['a','b','c'], name: 'Single digit' },
  ],

  'generate-parentheses': [
    { input: [3], output: ['((()))','(()())','(())()','()(())','()()()'], name: 'n=3' },
    { input: [1], output: ['()'], name: 'n=1' },
    { input: [2], output: ['(())','()()'], name: 'n=2' },
  ],

  'word-search': [
    { input: [[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], 'ABCCED'], output: true, name: 'Found word' },
    { input: [[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], 'SEE'], output: true, name: 'Short word' },
    { input: [[['A','B','C','E'],['S','F','C','S'],['A','D','E','E']], 'ABCB'], output: false, name: 'Cannot revisit' },
  ],

  'n-queens': [
    { input: [4], output: [['.Q..','...Q','Q...','..Q.'],['..Q.','Q...','...Q','.Q..']], name: '4 queens' },
    { input: [1], output: [['Q']], name: '1 queen' },
  ],

  // ===== HEAP PROBLEMS =====

  'kth-largest-element-in-an-array': [
    { input: [[3,2,1,5,6,4], 2], output: 5, name: 'Basic case' },
    { input: [[3,2,3,1,2,4,5,5,6], 4], output: 4, name: 'With duplicates' },
    { input: [[1], 1], output: 1, name: 'Single element' },
    { input: [[7,6,5,4,3,2,1], 5], output: 3, name: 'Sorted desc' },
  ],

  'top-k-frequent-elements': [
    { input: [[1,1,1,2,2,3], 2], output: [1,2], name: 'Basic case' },
    { input: [[1], 1], output: [1], name: 'Single element' },
    { input: [[1,2], 2], output: [1,2], name: 'Equal frequency' },
  ],

  'task-scheduler': [
    { input: [['A','A','A','B','B','B'], 2], output: 8, name: 'Basic case' },
    { input: [['A','A','A','B','B','B'], 0], output: 6, name: 'No cooldown' },
    { input: [['A','A','A','A','A','A','B','C','D','E','F','G'], 2], output: 16, name: 'Many unique tasks' },
  ],

  // ===== TRIE PROBLEMS =====

  'implement-trie-prefix-tree': [
    { input: [['Trie','insert','search','search','startsWith','insert','search'], [[],['apple'],['apple'],['app'],['app'],['app'],['app']]], output: [null,null,true,false,true,null,true], name: 'Basic operations' },
  ],

  // ===== GREEDY PROBLEMS =====

  'jump-game-ii': [
    { input: [[2,3,1,1,4]], output: 2, name: 'Basic case' },
    { input: [[2,3,0,1,4]], output: 2, name: 'With zero' },
    { input: [[1,2,3]], output: 2, name: 'Three elements' },
    { input: [[0]], output: 0, name: 'Already at end' },
    { input: [[1,1,1,1]], output: 3, name: 'All ones' },
  ],

  'gas-station': [
    { input: [[1,2,3,4,5], [3,4,5,1,2]], output: 3, name: 'Basic case' },
    { input: [[2,3,4], [3,4,3]], output: -1, name: 'Not enough gas' },
    { input: [[5,1,2,3,4], [4,4,1,5,1]], output: 4, name: 'Start from end' },
  ],

  'best-time-to-buy-and-sell-stock-ii': [
    { input: [[7,1,5,3,6,4]], output: 7, name: 'Multiple transactions' },
    { input: [[1,2,3,4,5]], output: 4, name: 'Increasing prices' },
    { input: [[7,6,4,3,1]], output: 0, name: 'Decreasing prices' },
  ],

  // ===== ADDITIONAL POPULAR PROBLEMS =====

  'palindrome-number': [
    { input: [121], output: true, name: 'Palindrome' },
    { input: [-121], output: false, name: 'Negative number' },
    { input: [10], output: false, name: 'Ends in zero' },
    { input: [0], output: true, name: 'Zero' },
    { input: [12321], output: true, name: '5-digit palindrome' },
  ],

  'roman-to-integer': [
    { input: ['III'], output: 3, name: 'Simple III' },
    { input: ['LVIII'], output: 58, name: 'LVIII' },
    { input: ['MCMXCIV'], output: 1994, name: 'Complex MCMXCIV' },
    { input: ['IV'], output: 4, name: 'Subtraction IV' },
    { input: ['IX'], output: 9, name: 'Subtraction IX' },
  ],

  'longest-common-prefix': [
    { input: [['flower','flow','flight']], output: 'fl', name: 'Common prefix fl' },
    { input: [['dog','racecar','car']], output: '', name: 'No common prefix' },
    { input: [['a']], output: 'a', name: 'Single string' },
    { input: [['','']], output: '', name: 'Empty strings' },
  ],

  'single-number': [
    { input: [[2,2,1]], output: 1, name: 'Basic case' },
    { input: [[4,1,2,1,2]], output: 4, name: 'Five elements' },
    { input: [[1]], output: 1, name: 'Single element' },
    { input: [[-1,-1,-2]], output: -2, name: 'Negative values' },
  ],

  'fizz-buzz': [
    { input: [3], output: ['1','2','Fizz'], name: 'n=3' },
    { input: [5], output: ['1','2','Fizz','4','Buzz'], name: 'n=5' },
    { input: [15], output: ['1','2','Fizz','4','Buzz','Fizz','7','8','Fizz','Buzz','11','Fizz','13','14','FizzBuzz'], name: 'n=15' },
  ],

  'string-to-integer-atoi': [
    { input: ['42'], output: 42, name: 'Simple number' },
    { input: ['   -42'], output: -42, name: 'Leading whitespace neg' },
    { input: ['4193 with words'], output: 4193, name: 'Trailing words' },
    { input: ['words and 987'], output: 0, name: 'Leading words' },
    { input: ['-91283472332'], output: -2147483648, name: 'Overflow negative' },
  ],

  'implement-strstr': [
    { input: ['hello', 'll'], output: 2, name: 'Found substring' },
    { input: ['aaaaa', 'bba'], output: -1, name: 'Not found' },
    { input: ['', ''], output: 0, name: 'Both empty' },
    { input: ['abc', ''], output: 0, name: 'Empty needle' },
  ],

  'group-anagrams': [
    { input: [['eat','tea','tan','ate','nat','bat']], output: [['eat','tea','ate'],['tan','nat'],['bat']], name: 'Basic case' },
    { input: [['','']], output: [['','']], name: 'Empty strings' },
    { input: [['a']], output: [['a']], name: 'Single string' },
  ],

  'valid-anagram': [
    { input: ['anagram', 'nagaram'], output: true, name: 'Is anagram' },
    { input: ['rat', 'car'], output: false, name: 'Not anagram' },
    { input: ['a', 'a'], output: true, name: 'Single char' },
    { input: ['ab', 'a'], output: false, name: 'Different lengths' },
  ],

  'power-of-two': [
    { input: [1], output: true, name: '2^0' },
    { input: [16], output: true, name: '2^4' },
    { input: [3], output: false, name: 'Not power of 2' },
    { input: [0], output: false, name: 'Zero' },
    { input: [-1], output: false, name: 'Negative' },
  ],

  'reverse-integer': [
    { input: [123], output: 321, name: 'Positive number' },
    { input: [-123], output: -321, name: 'Negative number' },
    { input: [120], output: 21, name: 'Trailing zero' },
    { input: [0], output: 0, name: 'Zero' },
  ],
};

// Helper: get test cases for a problem by slug
export function getTestCasesForProblem(slug) {
  const normalized = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return PROBLEM_TEST_CASES[normalized] || [];
}

// Get count of all problems with test cases
export function getTestCaseStats() {
  const entries = Object.entries(PROBLEM_TEST_CASES);
  return {
    totalProblems: entries.length,
    totalTestCases: entries.reduce((sum, [, cases]) => sum + cases.length, 0),
    problems: entries.map(([name, cases]) => ({ name, count: cases.length })),
  };
}
