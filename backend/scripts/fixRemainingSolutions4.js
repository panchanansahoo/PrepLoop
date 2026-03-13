import { supabaseAdmin } from '../db/supabaseClient.js';

const solutions = {
    249: { python: `class BSTIterator:\n    def __init__(self, root):\n        self.stack = []\n        self._push_left(root)\n    def next(self):\n        node = self.stack.pop()\n        self._push_left(node.right)\n        return node.val\n    def hasNext(self):\n        return len(self.stack) > 0\n    def _push_left(self, node):\n        while node:\n            self.stack.append(node)\n            node = node.left`, javascript: `class BSTIterator {\n    constructor(root) { this.stack = []; this._pushLeft(root); }\n    next() { const n = this.stack.pop(); this._pushLeft(n.right); return n.val; }\n    hasNext() { return this.stack.length > 0; }\n    _pushLeft(n) { while(n) { this.stack.push(n); n = n.left; } }\n}` },
    151: { javascript: `class LFUCache {\n    constructor(capacity) {\n        this.cap = capacity;\n        this.cache = new Map();\n        this.freqMap = new Map();\n        this.minFreq = 0;\n    }\n    get(key) {\n        if (!this.cache.has(key)) return -1;\n        const { val, freq } = this.cache.get(key);\n        this._update(key, val, freq);\n        return val;\n    }\n    put(key, value) {\n        if (this.cap <= 0) return;\n        if (this.cache.has(key)) {\n            const { freq } = this.cache.get(key);\n            this._update(key, value, freq);\n            return;\n        }\n        if (this.cache.size >= this.cap) {\n            const keys = this.freqMap.get(this.minFreq);\n            const evict = keys.values().next().value;\n            keys.delete(evict);\n            this.cache.delete(evict);\n        }\n        this.cache.set(key, { val: value, freq: 1 });\n        if (!this.freqMap.has(1)) this.freqMap.set(1, new Set());\n        this.freqMap.get(1).add(key);\n        this.minFreq = 1;\n    }\n    _update(key, val, freq) {\n        this.freqMap.get(freq).delete(key);\n        if (this.freqMap.get(freq).size === 0 && freq === this.minFreq) this.minFreq++;\n        this.cache.set(key, { val, freq: freq + 1 });\n        if (!this.freqMap.has(freq + 1)) this.freqMap.set(freq + 1, new Set());\n        this.freqMap.get(freq + 1).add(key);\n    }\n}` },
    152: { javascript: `class AllOne {\n    constructor() { this.counts = new Map(); }\n    inc(key) { this.counts.set(key, (this.counts.get(key) || 0) + 1); }\n    dec(key) { const v = this.counts.get(key) - 1; v === 0 ? this.counts.delete(key) : this.counts.set(key, v); }\n    getMaxKey() { let mx = 0, mk = ""; this.counts.forEach((v,k) => { if(v>mx){mx=v;mk=k;} }); return mk; }\n    getMinKey() { let mn = Infinity, mk = ""; this.counts.forEach((v,k) => { if(v<mn){mn=v;mk=k;} }); return mk; }\n}` },
    153: { javascript: `class Skiplist {\n    constructor() { this.data = []; }\n    search(target) { return this.data.includes(target); }\n    add(num) { this.data.push(num); this.data.sort((a,b)=>a-b); }\n    erase(num) { const i = this.data.indexOf(num); if(i>=0){this.data.splice(i,1);return true;} return false; }\n}` },
    162: { javascript: `class MyStack {\n    constructor() { this.q = []; }\n    push(x) { this.q.push(x); for(let i=0;i<this.q.length-1;i++) this.q.push(this.q.shift()); }\n    pop() { return this.q.shift(); }\n    top() { return this.q[0]; }\n    empty() { return this.q.length === 0; }\n}` },
};

async function run() {
    console.log('Fixing last class-based solution mismatches...\n');
    let updated = 0, failed = 0;
    for (const [id, langSolutions] of Object.entries(solutions)) {
        const { data: problem } = await supabaseAdmin.from('problems').select('solution_code').eq('id', parseInt(id)).single();
        if (!problem) { console.log(`  Problem #${id} not found`); continue; }
        const merged = { ...(problem.solution_code || {}), ...langSolutions };
        const { error } = await supabaseAdmin.from('problems').update({ solution_code: merged }).eq('id', parseInt(id));
        if (error) { console.error(`  #${id}: ${error.message}`); failed++; }
        else { console.log(`  #${id} done`); updated++; }
    }
    console.log(`\nDone: ${updated} updated, ${failed} failed`);
}
run();
