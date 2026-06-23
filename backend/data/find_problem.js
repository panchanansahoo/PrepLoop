import { all425Problems } from './allProblems.js';

const prob = all425Problems.find(p => p.title.toLowerCase().includes('stock'));
console.log(JSON.stringify(prob, null, 2));
