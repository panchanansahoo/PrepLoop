import assert from 'node:assert/strict';
import {
  buildCareerSearchQuery,
  normalizeProfileSignals,
  scoreJobsAgainstProfile,
} from '../services/preploopCareerService.js';

const signals = normalizeProfileSignals({
  skills: 'React, Node.js, TypeScript',
  location: 'Bengaluru',
  qualification: 'B.Tech CSE',
  preferred_role: 'Frontend Developer',
});

assert.deepEqual(signals.skills, ['React', 'Node.js', 'TypeScript']);
assert.equal(signals.location, 'Bengaluru');
assert.equal(signals.qualification, 'B.Tech CSE');
assert.equal(signals.preferredRole, 'Frontend Developer');

const query = buildCareerSearchQuery(signals);
assert.match(query, /Frontend Developer/);
assert.match(query, /Bengaluru/);
assert.match(query, /B\.Tech CSE/);

const jobs = scoreJobsAgainstProfile([
  {
    title: 'Frontend Developer',
    company: 'Example Co',
    location: 'Bengaluru, India',
    description: 'Hiring React and TypeScript engineers with B.Tech background.',
    requirements: ['React', 'TypeScript'],
  },
  {
    title: 'Backend Engineer',
    company: 'Example Co',
    location: 'Pune, India',
    description: 'Node.js role for backend services.',
    requirements: ['Node.js'],
  },
], signals);

assert.ok(jobs[0].matchScore >= jobs[1].matchScore);
assert.ok(jobs[0].matchedSkills.includes('React'));
assert.ok(jobs[0].matchedSignals.some(signal => signal.includes('Location')));
assert.ok(jobs[0].matchedSignals.some(signal => signal.includes('Qualification')));

const locationOnly = scoreJobsAgainstProfile([
  {
    title: 'Data Analyst',
    company: 'Example Co',
    location: 'Bengaluru, India',
    description: 'Entry level analytics role.',
    requirements: [],
  },
], {
  location: 'Bengaluru',
  qualification: 'MBA',
});

assert.ok(locationOnly[0].matchScore >= 30);

console.log('PrepLoop career service tests passed');
