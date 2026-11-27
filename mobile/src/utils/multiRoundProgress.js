import AsyncStorage from "@react-native-async-storage/async-storage";

export const ROUND_PASS_SCORE = 60;
export const ROUND_COUNT = 4;
const roundKey = userId => `interview-round:${userId}`;

export async function readCurrentRound(userId) {
    if (!userId) return 1;
    const stored = Number(await AsyncStorage.getItem(roundKey(userId)));
    return Number.isInteger(stored) && stored > 0 && stored <= ROUND_COUNT + 1 ? stored : 1;
}

export async function recordPassedRound(userId, round, result) {
    if (!userId || !Number.isInteger(round) || round < 1 || round > ROUND_COUNT) return false;
    const score = result?.scores?.overall;
    if (!result?.interviewId || !Number.isFinite(score) || score < ROUND_PASS_SCORE) return false;

    const current = await readCurrentRound(userId);
    if (round !== current) return false;
    await AsyncStorage.setItem(roundKey(userId), String(round + 1));
    return true;
}

export async function clearRoundProgress(userId) {
    if (!userId) return;
    await AsyncStorage.removeItem(roundKey(userId));
}
