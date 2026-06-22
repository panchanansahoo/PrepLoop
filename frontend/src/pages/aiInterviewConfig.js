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
    'Google':      { male: { name: 'Ryan Mitchell', role: 'Senior Software Engineer' },   female: { name: 'Hannah Chen', role: 'Senior Software Engineer' } },
    'Apple':       { male: { name: 'James Park', role: 'Staff Engineer' },                female: { name: 'Megan Liu', role: 'Staff Engineer' } },
    'Meta':        { male: { name: 'Kevin Patel', role: 'Engineering Manager' },           female: { name: 'Priya Sharma', role: 'Engineering Manager' } },
    'Amazon':      { male: { name: 'David Kim', role: 'Principal SDE' },                  female: { name: 'Emily Torres', role: 'Principal SDE' } },
    'Netflix':     { male: { name: 'Marcus Lee', role: 'Senior Engineer' },                female: { name: 'Sarah Johnson', role: 'Senior Engineer' } },
    'Microsoft':   { male: { name: 'Alex Rodriguez', role: 'Principal Engineer' },         female: { name: 'Jessica Wang', role: 'Principal Engineer' } },
    'Infosys':     { male: { name: 'Rajesh Nair', role: 'Technical Lead' },                female: { name: 'Megha Iyer', role: 'Technical Lead' } },
    'TCS':         { male: { name: 'Suresh Kumar', role: 'Solution Architect' },            female: { name: 'Ananya Gupta', role: 'Solution Architect' } },
    'Wipro':       { male: { name: 'Karthik Menon', role: 'Senior Developer' },             female: { name: 'Lavanya Reddy', role: 'Senior Developer' } },
    'Flipkart':    { male: { name: 'Arjun Das', role: 'SDE-3' },                           female: { name: 'Sneha Patel', role: 'SDE-3' } },
    'Razorpay':    { male: { name: 'Arjun Mehta', role: 'Backend Lead' },                  female: { name: 'Ritu Saxena', role: 'Backend Lead' } },
    'Swiggy':      { male: { name: 'Varun Srinivasan', role: 'Engineering Manager' },      female: { name: 'Divya Krishnan', role: 'Engineering Manager' } },
    'Zomato':      { male: { name: 'Rohit Verma', role: 'Staff Engineer' },                female: { name: 'Pooja Bansal', role: 'Staff Engineer' } },
    'Paytm':       { male: { name: 'Nikhil Jain', role: 'Tech Lead' },                     female: { name: 'Neha Agarwal', role: 'Tech Lead' } },
    'Meesho':      { male: { name: 'Vikram Singh', role: 'Senior SDE' },                   female: { name: 'Aditi Sharma', role: 'Senior SDE' } },
    'Dream11':     { male: { name: 'Aditya Joshi', role: 'Platform Engineer' },             female: { name: 'Tanvi Desai', role: 'Platform Engineer' } },
    'PhonePe':     { male: { name: 'Harish Rao', role: 'Engineering Lead' },                female: { name: 'Kavitha Raman', role: 'Engineering Lead' } },
    'CRED':        { male: { name: 'Siddharth Rao', role: 'Senior Backend Engineer' },     female: { name: 'Nisha Kapoor', role: 'Senior Backend Engineer' } },
    'Spotify':     { male: { name: 'Erik Lindström', role: 'Senior Engineer' },             female: { name: 'Sofia Andersson', role: 'Senior Engineer' } },
    'Airbnb':      { male: { name: 'Tyler Brooks', role: 'Staff Engineer' },                female: { name: 'Michelle Wu', role: 'Staff Engineer' } },
    'Uber':        { male: { name: 'Carlos Mendez', role: 'Senior SDE' },                  female: { name: 'Aisha Patel', role: 'Senior SDE' } },
    'Stripe':      { male: { name: 'Nathan Cole', role: 'Engineering Lead' },               female: { name: 'Emma Clarke', role: 'Engineering Lead' } },
    'Salesforce':  { male: { name: 'Michael Torres', role: 'Principal Engineer' },          female: { name: 'Laura Chen', role: 'Principal Engineer' } },
    'Adobe':       { male: { name: 'Brian Zhang', role: 'Staff Software Engineer' },        female: { name: 'Lisa Wang', role: 'Staff Software Engineer' } },
    'Oracle':      { male: { name: 'Robert Chen', role: 'Senior Architect' },               female: { name: 'Sandra Lee', role: 'Senior Architect' } },
    'IBM':         { male: { name: 'Thomas Reed', role: 'Distinguished Engineer' },          female: { name: 'Nadia Okonkwo', role: 'Distinguished Engineer' } },
    'Twitter / X': { male: { name: 'Jake Morrison', role: 'Senior Backend Engineer' },     female: { name: 'Maya Singh', role: 'Senior Backend Engineer' } },
    'LinkedIn':    { male: { name: 'Daniel Park', role: 'Senior Software Engineer' },       female: { name: 'Rachel Kim', role: 'Senior Software Engineer' } },
    'Nvidia':      { male: { name: 'Daniel Liu', role: 'Senior CUDA Engineer' },            female: { name: 'Wei Lin', role: 'Senior CUDA Engineer' } },
    'Tesla':       { male: { name: 'Mark Johnson', role: 'Firmware Lead' },                 female: { name: 'Anna Kowalski', role: 'Firmware Lead' } },
};

export const DEFAULT_INTERVIEWER = {
    male:   { name: 'Ryan Mitchell', role: 'Senior Software Engineer' },
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
