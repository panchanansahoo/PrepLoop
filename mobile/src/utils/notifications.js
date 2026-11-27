/**
 * notifications.js — Expo Push Notifications setup.
 *
 * Usage:
 *   import { notifications } from '../utils/notifications';
 *
 *   // Register on app start (inside useEffect)
 *   await notifications.register();
 *
 *   // Schedule a local notification
 *   await notifications.scheduleLocal("Time to practice!", "Keep your streak alive 🔥", 5);
 *
 *   // Listen for notifications
 *   const cleanup = notifications.addListener((notification) => { ... });
 */

import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";

const isExpoGo =
    Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient";

// Configure how notifications appear when app is in foreground
if (!isExpoGo) {
    Notifications.setNotificationHandler({
        handleNotification: async ({ request }) => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: request.content.data?.playSound !== false,
            shouldSetBadge: true,
        }),
    });
}

/**
 * Register for push notifications. Returns the Expo push token or null.
 * On physical devices, requests permission and registers with Expo's push service.
 * On emulators, returns null silently (push not supported).
 */
async function register() {
    // Expo Go (SDK 53+) does not support remote push registration on Android.
    // Use a development build for push token generation.
    if (isExpoGo) {
        console.log(
            "[Notifications] Skipping push registration in Expo Go. Use a development build for remote push notifications.",
        );
        return null;
    }

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
        console.log("[Notifications] Skipping — not a physical device");
        return null;
    }

    try {
        // Check existing permissions
        const { status: existingStatus } =
            await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Request permission if not already granted
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== "granted") {
            console.log("[Notifications] Permission not granted");
            return null;
        }

        // Get Expo push token
        const projectId =
            Constants.expoConfig?.extra?.eas?.projectId ??
            Constants.easConfig?.projectId;

        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        const token = tokenData.data;
        console.log("[Notifications] Push token:", token);

        // Android-specific channel setup
        if (Platform.OS === "android") {
            await Notifications.setNotificationChannelAsync("default", {
                name: "PrepLoop",
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: "#8b5cf6",
                sound: "default",
            });

            await Notifications.setNotificationChannelAsync("streaks", {
                name: "Streak Reminders",
                description: "Daily reminders to maintain your coding streak",
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 200],
                lightColor: "#fbbf24",
                sound: "default",
            });

            await Notifications.setNotificationChannelAsync("challenges", {
                name: "Daily Challenges",
                description: "New daily coding challenge notifications",
                importance: Notifications.AndroidImportance.DEFAULT,
                lightColor: "#10b981",
            });
        }

        return token;
    } catch (error) {
        console.warn("[Notifications] Registration failed:", error?.message);
        return null;
    }
}

/**
 * Schedule a local notification.
 * @param {string} title
 * @param {string} body
 * @param {number} triggerSeconds — seconds from now (0 = immediate)
 * @param {object} [data] — optional payload
 * @param {string} [channelId] — Android notification channel
 */
async function scheduleLocal(
    title,
    body,
    triggerSeconds = 0,
    data = {},
    channelId = "default",
    playSound = true,
) {
    try {
        const trigger =
            triggerSeconds > 0 ? { seconds: triggerSeconds } : null;

        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data: { ...data, playSound },
                sound: playSound ? "default" : false,
                ...(Platform.OS === "android" ? { channelId } : {}),
            },
            trigger,
        });
    } catch (error) {
        console.warn("[Notifications] Schedule failed:", error?.message);
    }
}

/**
 * Schedule a daily streak reminder at a fixed time.
 * @param {number} hour — hour in 24h format (default 20 = 8pm)
 * @param {number} minute — minute (default 0)
 */
async function scheduleDailyReminder(hour = 20, minute = 0, playSound = true) {
    try {
        // Cancel existing streak reminders first
        await cancelByTag("streak_reminder");

        await Notifications.scheduleNotificationAsync({
            content: {
                title: "🔥 Keep Your Streak Alive!",
                body: "Don't break your coding streak — solve at least one problem today.",
                data: { type: "streak_reminder", playSound },
                sound: playSound ? "default" : false,
                ...(Platform.OS === "android"
                    ? { channelId: "streaks" }
                    : {}),
            },
            trigger: {
                hour,
                minute,
                repeats: true,
            },
        });
    } catch (error) {
        console.warn("[Notifications] Daily reminder setup failed:", error?.message);
    }
}

/**
 * Cancel all scheduled notifications.
 */
async function cancelAll() {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {}
}

/**
 * Cancel notifications by data tag.
 * @param {string} tag — value in notification data.type
 */
async function cancelByTag(tag) {
    try {
        const scheduled =
            await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content?.data?.type === tag) {
                await Notifications.cancelScheduledNotificationAsync(
                    notif.identifier,
                );
            }
        }
    } catch {}
}

/**
 * Get the badge count (iOS mainly).
 */
async function getBadgeCount() {
    try {
        return await Notifications.getBadgeCountAsync();
    } catch {
        return 0;
    }
}

/**
 * Set the badge count.
 */
async function setBadgeCount(count) {
    try {
        await Notifications.setBadgeCountAsync(count);
    } catch {}
}

/**
 * Add a notification received listener.
 * Returns a cleanup function.
 */
function addListener(callback) {
    if (isExpoGo) return () => {};
    const subscription =
        Notifications.addNotificationReceivedListener(callback);
    return () => subscription.remove();
}

/**
 * Add a listener for when user taps a notification.
 * Returns a cleanup function.
 */
function addResponseListener(callback) {
    if (isExpoGo) return () => {};
    const subscription =
        Notifications.addNotificationResponseReceivedListener(callback);
    return () => subscription.remove();
}

async function preferenceChannel(playSound) {
    const channelId = playSound ? "reminders-audible-v2" : "reminders-quiet-v2";
    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(channelId, {
            name: playSound ? "PrepLoop reminders with sound" : "PrepLoop quiet reminders",
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: playSound ? "default" : null,
        });
    }
    return channelId;
}

async function ensurePermission({ request = false, playSound = false } = {}) {
    await preferenceChannel(playSound);
    let permission = await Notifications.getPermissionsAsync();
    const isGranted = p => Boolean(p?.granted || p?.status === "granted");
    if (!isGranted(permission) && request && permission?.canAskAgain !== false) {
        permission = await Notifications.requestPermissionsAsync();
    }
    return isGranted(permission);
}

async function replacePracticeReminders(preferences) {
    const playSound = preferences?.notificationSound === true;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
        if (item.content?.data?.practiceReminder || item.content?.data?.type === "streak_reminder") {
            await Notifications.cancelScheduledNotificationAsync(item.identifier);
        }
    }
    if (!preferences?.streakReminders && !preferences?.dailyChallenge) return;
    if (!await ensurePermission({ playSound })) return;

    const channelId = await preferenceChannel(playSound);
    const dailyTriggerType = Notifications.SchedulableTriggerInputTypes?.DAILY ?? "daily";
    const reminders = [
        { enabled: preferences.dailyChallenge, type: "daily_challenge", hour: 9, title: "Daily challenge", body: "Your daily practice challenge is ready." },
        { enabled: preferences.streakReminders, type: "streak_reminder", hour: 20, title: "Keep your streak going", body: "Solve a problem today to keep your streak active." },
    ];
    for (const { enabled, type, hour, title, body } of reminders) {
        if (!enabled) continue;
        await Notifications.scheduleNotificationAsync({
            content: { title, body, sound: playSound ? "default" : false, data: { type, playSound, practiceReminder: true } },
            trigger: { type: dailyTriggerType, hour, minute: 0, channelId },
        });
    }
}

async function showInterviewResult(playSound) {
    if (!await ensurePermission({ playSound })) return;
    const channelId = await preferenceChannel(playSound);
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Interview results ready",
            body: "Open PrepLoop to review your interview feedback.",
            sound: playSound ? "default" : false,
            data: { type: "interview_result", playSound },
        },
        trigger: Platform.OS === "android" ? { channelId } : null,
    });
}

export const notifications = {
    ensurePermission,
    replacePracticeReminders,
    showInterviewResult,
    register,
    scheduleLocal,
    scheduleDailyReminder,
    cancelAll,
    cancelByTag,
    getBadgeCount,
    setBadgeCount,
    addListener,
    addResponseListener,
};
