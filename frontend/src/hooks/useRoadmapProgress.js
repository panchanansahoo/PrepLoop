import { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'preploop_roadmap_progress_v1';
const STORAGE_EVENT = 'preploop-roadmap-progress-updated';

function readProgressStore() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function writeProgressStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT));
}

function countCompletedProblems(problemMap = {}) {
    return Object.values(problemMap).filter(Boolean).length;
}

export default function useRoadmapProgress(trackKey, guides = []) {
    const [store, setStore] = useState(() => readProgressStore());

    useEffect(() => {
        const sync = () => setStore(readProgressStore());
        window.addEventListener('storage', sync);
        window.addEventListener(STORAGE_EVENT, sync);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener(STORAGE_EVENT, sync);
        };
    }, []);

    const updateStore = useCallback((updater) => {
        const current = readProgressStore();
        const next = updater(current);
        writeProgressStore(next);
        setStore(next);
    }, []);

    const trackProgress = store[trackKey] || { guides: {} };

    const guideProgressById = useMemo(() => {
        const progressMap = new Map();

        guides.forEach((guide) => {
            const totalCount = guide.problems?.length || 0;
            const guideEntry = trackProgress.guides?.[guide.id] || {};
            const solvedCount = guideEntry.completed
                ? totalCount
                : Math.min(totalCount, countCompletedProblems(guideEntry.completedProblems));
            const isComplete = Boolean(guideEntry.completed) || (totalCount > 0 && solvedCount >= totalCount);

            progressMap.set(guide.id, {
                totalCount,
                solvedCount,
                isComplete,
                progressPercent: totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : isComplete ? 100 : 0,
            });
        });

        return progressMap;
    }, [guides, trackProgress.guides]);

    const setGuideCompleted = useCallback((guideId, completed, totalProblems = 0) => {
        updateStore((current) => {
            const currentTrack = current[trackKey] || { guides: {} };
            const currentGuide = currentTrack.guides?.[guideId] || {};
            const completedProblems = completed
                ? Object.fromEntries(Array.from({ length: totalProblems }, (_, index) => [`auto-${index}`, true]))
                : {};

            return {
                ...current,
                [trackKey]: {
                    ...currentTrack,
                    guides: {
                        ...currentTrack.guides,
                        [guideId]: {
                            ...currentGuide,
                            completed,
                            completedProblems,
                        },
                    },
                },
            };
        });
    }, [trackKey, updateStore]);

    const completedGuideCount = useMemo(
        () => Array.from(guideProgressById.values()).filter((guide) => guide.isComplete).length,
        [guideProgressById]
    );

    return {
        guideProgressById,
        completedGuideCount,
        setGuideCompleted,
    };
}
