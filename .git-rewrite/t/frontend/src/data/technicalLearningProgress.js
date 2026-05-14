// Technical Learning Progress — Using localStorage for the new Blueprint/Flashcard UI
const STORAGE_KEY = 'preploop_tech_progress';

const load = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
};
const save = (data) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

const defaultProgress = () => ({
    theoryRead: false,
    scenariosCompleted: [],  // array of scenario ids
    flashcardsMastered: [], // array of flashcard indices
    lastActivity: null
});

export const getTechnicalTopicProgress = (topicId) => {
    const all = load();
    const tp = all[topicId] || defaultProgress();

    // Calculate a mastery percentage based on components
    // In a real app, you'd pass the actual counts from the data
    let mastery = 0;
    if (tp.theoryRead) mastery += 20;

    // We don't have total counts here, so this is a simplified calculation
    // You might want to update this to take total scenarios and flashcards
    const scenarioPoints = Math.min(40, tp.scenariosCompleted.length * 20);
    const flashcardPoints = Math.min(40, tp.flashcardsMastered.length * 10);

    mastery += scenarioPoints + flashcardPoints;

    return {
        ...tp,
        masteryPercent: Math.min(100, Math.round(mastery))
    };
};

export const markTechTheoryRead = (topicId) => {
    const all = load();
    if (!all[topicId]) all[topicId] = defaultProgress();
    all[topicId].theoryRead = true;
    all[topicId].lastActivity = new Date().toISOString();
    save(all);
};

export const completeTechScenario = (topicId, scenarioId) => {
    const all = load();
    if (!all[topicId]) all[topicId] = defaultProgress();
    if (!all[topicId].scenariosCompleted.includes(scenarioId)) {
        all[topicId].scenariosCompleted.push(scenarioId);
    }
    all[topicId].lastActivity = new Date().toISOString();
    save(all);
};

export const masterTechFlashcard = (topicId, cardIndex) => {
    const all = load();
    if (!all[topicId]) all[topicId] = defaultProgress();
    if (!all[topicId].flashcardsMastered.includes(cardIndex)) {
        all[topicId].flashcardsMastered.push(cardIndex);
    }
    all[topicId].lastActivity = new Date().toISOString();
    save(all);
};

export const getTechOverallProgress = (topicIds) => {
    let totalMastery = 0;
    topicIds.forEach(id => {
        const p = getTechnicalTopicProgress(id);
        totalMastery += p.masteryPercent;
    });
    return {
        avgMastery: topicIds.length > 0 ? Math.round(totalMastery / topicIds.length) : 0,
        topicsMastered: topicIds.filter(id => getTechnicalTopicProgress(id).masteryPercent >= 90).length,
        topicsStarted: topicIds.filter(id => getTechnicalTopicProgress(id).masteryPercent > 0).length
    };
};
