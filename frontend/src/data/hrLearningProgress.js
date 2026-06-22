const STORAGE_KEY = 'preploop_hr_progress';

const load = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
};
const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const defaultProgress = () => ({
    theoryRead: false,
    starSaved: false,  // Has user written their STAR story?
    simulatorScore: 0, // Best score in scenario simulator
    lastActivity: null
});

export const getHRTopicProgress = (topicId) => {
    const all = load();
    const tp = all[topicId] || defaultProgress();

    let mastery = 0;
    if (tp.theoryRead) mastery += 20;
    if (tp.starSaved) mastery += 40;
    mastery += (tp.simulatorScore / 100) * 40; // Max 40 points from simulator

    return {
        ...tp,
        masteryPercent: Math.min(100, Math.round(mastery))
    };
};

export const markHRTheoryRead = (topicId) => {
    const all = load();
    if (!all[topicId]) all[topicId] = defaultProgress();
    all[topicId].theoryRead = true;
    all[topicId].lastActivity = new Date().toISOString();
    save(all);
};

export const markHRStarSaved = (topicId) => {
    const all = load();
    if (!all[topicId]) all[topicId] = defaultProgress();
    all[topicId].starSaved = true;
    all[topicId].lastActivity = new Date().toISOString();
    save(all);
};

export const saveHRSimulatorScore = (topicId, score) => {
    const all = load();
    if (!all[topicId]) all[topicId] = defaultProgress();
    if (score > all[topicId].simulatorScore) {
        all[topicId].simulatorScore = score;
    }
    all[topicId].lastActivity = new Date().toISOString();
    save(all);
};

export const getHROverallProgress = (topicIds) => {
    let totalMastery = 0;
    topicIds.forEach(id => {
        const p = getHRTopicProgress(id);
        totalMastery += p.masteryPercent;
    });
    return {
        avgMastery: topicIds.length > 0 ? Math.round(totalMastery / topicIds.length) : 0,
        topicsMastered: topicIds.filter(id => getHRTopicProgress(id).masteryPercent >= 90).length,
        topicsStarted: topicIds.filter(id => getHRTopicProgress(id).masteryPercent > 0).length
    };
};
