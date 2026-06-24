/**
 * AI Interview Page configuration constants.
 * Extracted from AIInterviewPage.jsx to reduce component complexity.
 */

export const BOILERPLATE = {
    python: `def solution(nums, k):
    """
    Solve the problem here.

    Args:
        nums: Input array
        k: Parameter k

    Returns:
        Result
    """
    # Your solution here
    pass

# Test your solution
if __name__ == "__main__":
    test_nums = [1, 2, 3]
    test_k = 1
    result = solution(test_nums, test_k)
    print(f"Result: {result}")
`,
    javascript: `// Write your solution here
function solution(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    return [];
}

// Test cases
console.log(solution([2, 7, 11, 15], 9));  // [0, 1]
console.log(solution([3, 2, 4], 6));       // [1, 2]
`,
    java: `// Write your solution here
import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}
`,
    cpp: `// Write your solution here
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    auto result = twoSum(nums, 9);
    cout << result[0] << ", " << result[1] << endl;
    return 0;
}
`,
    typescript: `// Write your solution here
function solution(nums: number[], target: number): number[] {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement)!, i];
        }
        seen.set(nums[i], i);
    }
    return [];
}

// Test cases
console.log(solution([2, 7, 11, 15], 9));
console.log(solution([3, 2, 4], 6));
`,
    go: `package main

import "fmt"

func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return []int{}
}

func main() {
    fmt.Println(twoSum([]int{2, 7, 11, 15}, 9))
}
`,
};

export const AI_INTERVIEW_GENDER_STORAGE_KEY = 'preploop-ai-interview-gender-v1';
export const AI_INTERVIEW_SESSION_KEY = 'preploop-ai-interview-session-v1';

export const readStoredInterviewerGender = () => {
    if (typeof window === 'undefined') return 'male';

    try {
        const stored = window.localStorage.getItem(AI_INTERVIEW_GENDER_STORAGE_KEY);
        return stored === 'female' ? 'female' : 'male';
    } catch {
        return 'male';
    }
};

export const HR_INTERVIEWER_VIDEOS = {
    male: {
        speaking: '/malespeaking.mp4',
        listening: '/malelisrning.mp4',
    },
    female: {
        speaking: '/HannahChenSpeaking.mp4',
        listening: '/HannahChenListening.mp4',
    },
};

export const COMPANY_INTERVIEWERS = {
    'Google':      { male: { name: 'James Chen', role: 'Senior Software Engineer' },      female: { name: 'Sarah Kim', role: 'Senior Software Engineer' } },
    'Apple':       { male: { name: 'Michael Park', role: 'Staff Engineer' },               female: { name: 'Emily Zhang', role: 'Staff Engineer' } },
    'Meta':        { male: { name: 'David Liu', role: 'Engineering Manager' },             female: { name: 'Rachel Wang', role: 'Engineering Manager' } },
    'Amazon':      { male: { name: 'Chris Sharma', role: 'Principal SDE' },                female: { name: 'Priya Nair', role: 'Principal SDE' } },
    'Netflix':     { male: { name: 'Alex Morgan', role: 'Senior Engineer' },               female: { name: 'Nicole Davis', role: 'Senior Engineer' } },
    'Microsoft':   { male: { name: 'Ryan Scott', role: 'Principal Engineer' },             female: { name: 'Jenny Wilson', role: 'Principal Engineer' } },
    'Infosys':     { male: { name: 'Arjun Mehta', role: 'Technical Lead' },                female: { name: 'Sneha Iyer', role: 'Technical Lead' } },
    'TCS':         { male: { name: 'Vikram Reddy', role: 'Solution Architect' },           female: { name: 'Anjali Sharma', role: 'Solution Architect' } },
    'Wipro':       { male: { name: 'Rahul Gupta', role: 'Senior Developer' },              female: { name: 'Kavya Nair', role: 'Senior Developer' } },
    'Flipkart':    { male: { name: 'Aditya Kumar', role: 'SDE-3' },                        female: { name: 'Divya Menon', role: 'SDE-3' } },
    'Razorpay':    { male: { name: 'Karthik Rao', role: 'Backend Lead' },                  female: { name: 'Meera Joshi', role: 'Backend Lead' } },
    'Swiggy':      { male: { name: 'Rohan Desai', role: 'Engineering Manager' },           female: { name: 'Nisha Patel', role: 'Engineering Manager' } },
    'Zomato':      { male: { name: 'Siddharth Verma', role: 'Staff Engineer' },            female: { name: 'Ritika Singh', role: 'Staff Engineer' } },
    'Paytm':       { male: { name: 'Amit Saxena', role: 'Tech Lead' },                     female: { name: 'Pooja Agarwal', role: 'Tech Lead' } },
    'Meesho':      { male: { name: 'Varun Pillai', role: 'Senior SDE' },                   female: { name: 'Tanvi Shah', role: 'Senior SDE' } },
    'Dream11':     { male: { name: 'Nikhil Bhat', role: 'Platform Engineer' },             female: { name: 'Shreya Kulkarni', role: 'Platform Engineer' } },
    'PhonePe':     { male: { name: 'Pranav Hegde', role: 'Engineering Lead' },             female: { name: 'Ananya Rao', role: 'Engineering Lead' } },
    'CRED':        { male: { name: 'Harsh Mittal', role: 'Senior Backend Engineer' },      female: { name: 'Riya Kapoor', role: 'Senior Backend Engineer' } },
    'Spotify':     { male: { name: 'Erik Lindqvist', role: 'Senior Engineer' },            female: { name: 'Sofia Andersson', role: 'Senior Engineer' } },
    'Airbnb':      { male: { name: 'Brian Hayes', role: 'Staff Engineer' },                female: { name: 'Lauren Chen', role: 'Staff Engineer' } },
    'Uber':        { male: { name: 'Daniel Nguyen', role: 'Senior SDE' },                  female: { name: 'Aisha Patel', role: 'Senior SDE' } },
    'Stripe':      { male: { name: 'Patrick O\'Brien', role: 'Engineering Lead' },         female: { name: 'Maya Thompson', role: 'Engineering Lead' } },
    'Salesforce':  { male: { name: 'Robert Kim', role: 'Principal Engineer' },             female: { name: 'Karen Wu', role: 'Principal Engineer' } },
    'Adobe':       { male: { name: 'Nathan Lee', role: 'Staff Software Engineer' },        female: { name: 'Jessica Rivera', role: 'Staff Software Engineer' } },
    'Oracle':      { male: { name: 'Andrew Wright', role: 'Senior Architect' },            female: { name: 'Michelle Tan', role: 'Senior Architect' } },
    'IBM':         { male: { name: 'Thomas Baker', role: 'Distinguished Engineer' },       female: { name: 'Lisa Johnson', role: 'Distinguished Engineer' } },
    'Twitter / X': { male: { name: 'Kevin Martinez', role: 'Senior Backend Engineer' },    female: { name: 'Natalie Brooks', role: 'Senior Backend Engineer' } },
    'LinkedIn':    { male: { name: 'Jason Taylor', role: 'Senior Software Engineer' },     female: { name: 'Amanda Li', role: 'Senior Software Engineer' } },
    'Nvidia':      { male: { name: 'Marcus Chen', role: 'Senior CUDA Engineer' },          female: { name: 'Grace Park', role: 'Senior CUDA Engineer' } },
    'Tesla':       { male: { name: 'Brandon Clark', role: 'Firmware Lead' },               female: { name: 'Diana Torres', role: 'Firmware Lead' } },
};

export const DEFAULT_INTERVIEWER = {
    male:   { name: 'James Mitchell', role: 'Senior Software Engineer' },
    female: { name: 'Hannah Chen', role: 'Senior Software Engineer' },
};

// ── Stage type → backend stage name (single source of truth) ──
export const STAGE_MAP = {
    'coding': 'DSA / Coding',
    'dsa': 'DSA / Coding',
    'system-design': 'System Design',
    'behavioral': 'Behavioral',
    'product': 'Technical',
    'data-science': 'Technical',
    'ai-llm': 'Technical',
    'hr': 'HR',
    'technical': 'Technical',
};

export function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}
