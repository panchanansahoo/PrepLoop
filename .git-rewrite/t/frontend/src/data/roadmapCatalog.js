import { dsaPatternsAll as baseDsaPatterns } from './dsaPatternsData';
import { languagePatterns as baseLanguagePatterns, languageRoadmapHierarchy } from './languageRoadmapData';
import { roadmapHierarchy as dsaRoadmapHierarchy } from './roadmapData';
import { systemDesignPatterns as baseSystemDesignPatterns, systemDesignRoadmapHierarchy } from './systemDesignRoadmapData';
import { webDevPatterns as baseWebDevPatterns, webDevRoadmapHierarchy } from './webDevRoadmapData';

function collectLeafNodes(nodes = [], lineage = []) {
    return nodes.flatMap((node) => {
        const nextLineage = [...lineage, node];
        if (!node.children?.length) {
            return [{ node, lineage }];
        }
        return collectLeafNodes(node.children, nextLineage);
    });
}

function determineDifficulty(trackKey, lineage = [], label = '') {
    const depth = lineage.length;
    const normalized = label.toLowerCase();

    if (trackKey === 'system-design') {
        if (normalized.includes('consensus') || normalized.includes('recovery') || normalized.includes('coordination')) {
            return 'Hard';
        }
        return depth >= 2 ? 'Hard' : 'Medium';
    }

    if (trackKey === 'web-dev') {
        if (normalized.includes('security') || normalized.includes('scaling') || normalized.includes('performance')) {
            return 'Hard';
        }
        return depth <= 1 ? 'Easy' : 'Medium';
    }

    if (trackKey === 'language') {
        if (normalized.includes('concurrency') || normalized.includes('ownership') || normalized.includes('resource')) {
            return 'Hard';
        }
        return depth <= 1 ? 'Easy' : 'Medium';
    }

    if (normalized.includes('advanced') || normalized.includes('optimization') || normalized.includes('bitmask')) {
        return 'Hard';
    }

    return depth <= 1 ? 'Easy' : 'Medium';
}

function createGeneratedProblems(node, config, lineageLabels) {
    const section = lineageLabels[lineageLabels.length - 1] || config.title;
    return [
        {
            id: `${node.id}-explain`,
            title: `Explain the core idea behind ${node.label}`,
            difficulty: 'Easy',
            status: 'pending',
            mode: 'drill',
        },
        {
            id: `${node.id}-compare`,
            title: `Compare ${node.label} with adjacent concepts in ${section}`,
            difficulty: 'Medium',
            status: 'pending',
            mode: 'drill',
        },
        {
            id: `${node.id}-apply`,
            title: `Apply ${node.label} in a realistic ${config.title.toLowerCase()} scenario`,
            difficulty: determineDifficulty(config.trackKey, lineageLabels, node.label),
            status: 'pending',
            mode: 'drill',
        },
    ];
}

function createGeneratedLeafPattern(node, lineage, config) {
    const lineageLabels = lineage.map((entry) => entry.label);
    const section = lineageLabels[lineageLabels.length - 1] || config.title;
    const fullPath = [...lineageLabels, node.label].join(' -> ');

    return {
        id: node.id,
        name: node.label,
        category: `${config.title} Leaf Guide`,
        difficulty: determineDifficulty(config.trackKey, lineage, node.label),
        roadmapPath: config.path,
        trackKey: config.trackKey,
        problemInteraction: 'drill',
        generated: true,
        description: `Build confidence with ${node.label} as part of ${section} so you can explain it clearly, recognize it quickly, and use it deliberately.`,
        theory: `${node.label} sits inside ${config.title} under the path ${fullPath}.

This guide is meant to turn a roadmap bullet into a real learning step. Start by understanding what problem ${node.label} solves, then connect it to the surrounding concepts in ${section}, and finally practice how you would apply or discuss it in an interview, implementation, or design review.

The goal is not just recall. The goal is fluency: knowing when this concept matters, what trade-offs it introduces, and how it relates to the nodes around it on the roadmap.`,
        examples: [
            `Summarize ${node.label} in your own words without reading notes.`,
            `Relate ${node.label} to ${section} and explain when it becomes the right choice.`,
            `Practice one small implementation, design explanation, or debugging scenario involving ${node.label}.`,
        ],
        problems: createGeneratedProblems(node, config, lineageLabels),
    };
}

function decoratePatterns(patterns, config) {
    return patterns.map((pattern) => ({
        ...pattern,
        roadmapPath: pattern.roadmapPath || config.path,
        trackKey: pattern.trackKey || config.trackKey,
        problemInteraction: pattern.problemInteraction || config.problemInteraction,
    }));
}

function buildTrackPatterns(hierarchy, basePatterns, config) {
    const explicitPatterns = decoratePatterns(basePatterns, config);
    const explicitIds = new Set(explicitPatterns.map((pattern) => pattern.id));
    const generatedLeafPatterns = collectLeafNodes(hierarchy)
        .filter(({ node }) => !explicitIds.has(node.id))
        .map(({ node, lineage }) => createGeneratedLeafPattern(node, lineage, config));

    return [...explicitPatterns, ...generatedLeafPatterns];
}

export const roadmapTrackConfigs = {
    dsa: {
        trackKey: 'dsa',
        title: 'DSA Roadmap',
        kicker: 'Problem Solving Map',
        subtitle: 'Track the map, not just the totals',
        path: '/roadmap/dsa',
        problemInteraction: 'solver',
        searchPlaceholder: 'Search DSA roadmap',
    },
    language: {
        trackKey: 'language',
        title: 'Language Core',
        kicker: 'Programming Languages',
        subtitle: 'Go from syntax fluency to runtime intuition',
        path: '/roadmap/language',
        problemInteraction: 'drill',
        searchPlaceholder: 'Search language roadmap',
    },
    'system-design': {
        trackKey: 'system-design',
        title: 'System Design',
        kicker: 'Architecture Track',
        subtitle: 'From estimation to distributed systems trade-offs',
        path: '/roadmap/system-design',
        problemInteraction: 'drill',
        searchPlaceholder: 'Search system design roadmap',
    },
    'web-dev': {
        trackKey: 'web-dev',
        title: 'Web Development',
        kicker: 'Full-Stack Builder',
        subtitle: 'Connect browser, backend, data, and delivery',
        path: '/roadmap/web-dev',
        problemInteraction: 'drill',
        searchPlaceholder: 'Search web development roadmap',
    },
};

export const dsaCatalogPatterns = buildTrackPatterns(
    dsaRoadmapHierarchy,
    baseDsaPatterns,
    roadmapTrackConfigs.dsa
);

export const languageCatalogPatterns = buildTrackPatterns(
    languageRoadmapHierarchy,
    baseLanguagePatterns,
    roadmapTrackConfigs.language
);

export const systemDesignCatalogPatterns = buildTrackPatterns(
    systemDesignRoadmapHierarchy,
    baseSystemDesignPatterns,
    roadmapTrackConfigs['system-design']
);

export const webDevCatalogPatterns = buildTrackPatterns(
    webDevRoadmapHierarchy,
    baseWebDevPatterns,
    roadmapTrackConfigs['web-dev']
);

export {
    dsaRoadmapHierarchy,
    languageRoadmapHierarchy,
    systemDesignRoadmapHierarchy,
    webDevRoadmapHierarchy,
};
