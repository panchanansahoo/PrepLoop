import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { notifications } from "./notifications";

const defaults = {
    streakReminders: false,
    dailyChallenge: false,
    interviewResults: false,
    notificationSound: false,
    hapticFeedback: true,
};

const preferenceKey = userId => `account-preferences:${userId}`;
let activeUserId = null;
let pending = Promise.resolve();

export async function readPreferences(userId) {
    const stored = userId ? await AsyncStorage.getItem(preferenceKey(userId)) : null;
    if (!stored) return { ...defaults };
    try {
        const parsed = JSON.parse(stored);
        return { ...defaults, ...(parsed && typeof parsed === "object" ? parsed : {}) };
    } catch {
        return { ...defaults };
    }
}

function queue(action) {
    const result = pending.then(action);
    pending = result.catch(() => {});
    return result;
}

export function syncAccountReminders(userId) {
    activeUserId = userId;
    return queue(async () => {
        if (activeUserId !== userId) return;
        const preferences = userId ? await readPreferences(userId) : null;
        if (activeUserId === userId) await notifications.replacePracticeReminders(preferences);
    });
}

export function changePreference(userId, name, enabled) {
    return queue(async () => {
        if (!userId || userId !== activeUserId) throw new Error("Sign in to update preferences.");
        const previous = await readPreferences(userId);
        const next = { ...previous, [name]: enabled };
        if (enabled && ["streakReminders", "dailyChallenge", "interviewResults"].includes(name)) {
            const granted = await notifications.ensurePermission({ request: true, playSound: next.notificationSound });
            if (!granted) throw new Error("Allow notifications in your device settings to use this preference.");
        }
        if (userId !== activeUserId) throw new Error("Your account changed.");
        const affectsReminders = ["streakReminders", "dailyChallenge", "notificationSound"].includes(name);
        try {
            if (affectsReminders) await notifications.replacePracticeReminders(next);
            await AsyncStorage.setItem(preferenceKey(userId), JSON.stringify(next));
        } catch (error) {
            if (affectsReminders && userId === activeUserId) {
                await notifications.replacePracticeReminders(previous).catch(() => {});
            }
            throw error;
        }
        return next;
    });
}

export async function notifyInterviewResult(userId, result) {
    if (!userId || userId !== activeUserId || !result?.interviewId) return;
    const preferences = await readPreferences(userId);
    if (activeUserId === userId && preferences.interviewResults) {
        await notifications.showInterviewResult(preferences.notificationSound);
    }
}

export async function playHapticFeedback(userId = activeUserId, style = Haptics.ImpactFeedbackStyle.Light) {
    try {
        const preferences = await readPreferences(userId);
        if (userId === activeUserId && preferences.hapticFeedback) {
            await Haptics.impactAsync(style);
        }
    } catch {}
}

export async function playHapticNotification(type = Haptics.NotificationFeedbackType.Success, userId = activeUserId) {
    try {
        const preferences = await readPreferences(userId);
        if (userId === activeUserId && preferences.hapticFeedback) {
            await Haptics.notificationAsync(type);
        }
    } catch {}
}

export async function clearPreferences(userId) {
    if (!userId) return;
    if (activeUserId === userId) {
        activeUserId = null;
        await notifications.replacePracticeReminders(null).catch(() => {});
    }
    await AsyncStorage.removeItem(preferenceKey(userId));
}
