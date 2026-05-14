// ── Codeforces API (live data, CORS-friendly) ──
export async function fetchCodeforcesContests() {
    try {
        const res = await fetch('https://codeforces.com/api/contest.list', { signal: AbortSignal.timeout(8000) });
        const data = await res.json();
        if (data.status !== 'OK') return [];
        return data.result
            .filter(c => c.phase === 'BEFORE')
            .slice(0, 3)
            .map(c => ({
                platform: 'Codeforces',
                name: c.name,
                date: new Date(c.startTimeSeconds * 1000),
                duration: `${Math.round(c.durationSeconds / 3600)} hrs`,
                link: `https://codeforces.com/contest/${c.id}`,
                live: true,
            }));
    } catch { return []; }
}

// ── Schedule-based contests for platforms with known recurring patterns ──
// These platforms run contests on fixed weekly schedules. We compute the
// next upcoming dates dynamically so they always stay current.

export function getNextDayOfWeek(dayOfWeek, hour = 0, minute = 0) {
    // dayOfWeek: 0=Sun, 1=Mon, ..., 6=Sat
    // hour/minute in IST (UTC+5:30)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const nowIST = new Date(now.getTime() + istOffset);

    const result = new Date(nowIST);
    result.setUTCHours(hour - 5, minute - 30, 0, 0); // Convert IST to UTC

    const diff = (dayOfWeek - nowIST.getUTCDay() + 7) % 7;
    result.setUTCDate(result.getUTCDate() + (diff === 0 && result <= now ? 7 : diff));

    return result;
}

export function getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

export function generateScheduledContests() {
    const weekNum = getWeekNumber();
    const contests = [];

    // ── LeetCode ──
    // Weekly Contest: Every Sunday 8:00 AM IST
    const lcWeeklyNum = 438 + (weekNum - 9); // approximate numbering
    contests.push({
        platform: 'LeetCode',
        name: `Weekly Contest ${lcWeeklyNum}`,
        date: getNextDayOfWeek(0, 8, 0), // Sunday 8 AM IST
        duration: '1.5 hrs',
        link: 'https://leetcode.com/contest/',
        live: false,
    });
    // Biweekly Contest: Every other Saturday 8:00 PM IST
    if (weekNum % 2 === 0) {
        const lcBiweeklyNum = 149 + Math.floor((weekNum - 8) / 2);
        contests.push({
            platform: 'LeetCode',
            name: `Biweekly Contest ${lcBiweeklyNum}`,
            date: getNextDayOfWeek(6, 20, 0), // Saturday 8 PM IST
            duration: '1.5 hrs',
            link: 'https://leetcode.com/contest/',
            live: false,
        });
    }

    // ── CodeChef ──
    // Starters: Every Wednesday 8:00 PM IST
    const ccStartersNum = 175 + (weekNum - 9);
    contests.push({
        platform: 'CodeChef',
        name: `Starters ${ccStartersNum}`,
        date: getNextDayOfWeek(3, 20, 0), // Wednesday 8 PM IST
        duration: '2 hrs',
        link: 'https://www.codechef.com/contests',
        live: false,
    });

    // ── AtCoder ──
    // ABC: Every Saturday 5:30 PM IST
    const atcoderNum = 392 + (weekNum - 9);
    contests.push({
        platform: 'AtCoder',
        name: `ABC ${atcoderNum}`,
        date: getNextDayOfWeek(6, 17, 30), // Saturday 5:30 PM IST
        duration: '1.5 hrs',
        link: 'https://atcoder.jp/contests/',
        live: false,
    });

    // ── GeeksforGeeks ──
    // Weekly Coding Contest: Every Sunday 7:00 PM IST
    contests.push({
        platform: 'GeeksforGeeks',
        name: `GFG Weekly Contest ${188 + (weekNum - 9)}`,
        date: getNextDayOfWeek(0, 19, 0), // Sunday 7 PM IST
        duration: '1.5 hrs',
        link: 'https://practice.geeksforgeeks.org/events',
        live: false,
    });

    return contests.filter(c => c.date > new Date());
}

export async function fetchAllContests() {
    try {
        const cfContests = await fetchCodeforcesContests();
        const scheduledContests = generateScheduledContests();
        const all = [...cfContests, ...scheduledContests];
        return all
            .filter(c => c.date > new Date())
            .sort((a, b) => a.date - b.date);
    } catch {
        // Fallback to scheduled only if CF fails
        return generateScheduledContests().filter(c => c.date > new Date()).sort((a, b) => a.date - b.date);
    }
}
