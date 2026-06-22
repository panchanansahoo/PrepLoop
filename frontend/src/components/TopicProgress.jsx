import RoadmapView from '../features/dashboard/components/RoadmapView';
import {
    dsaCatalogPatterns,
    dsaRoadmapHierarchy,
    languageCatalogPatterns,
    languageRoadmapHierarchy,
    roadmapTrackConfigs,
    systemDesignCatalogPatterns,
    systemDesignRoadmapHierarchy,
    webDevCatalogPatterns,
    webDevRoadmapHierarchy,
} from '../data/roadmapCatalog';

export default function TopicProgress({ topics }) {
    const cards = [
        {
            key: roadmapTrackConfigs.dsa.trackKey,
            hierarchy: dsaRoadmapHierarchy,
            patterns: dsaCatalogPatterns,
            topics,
            config: roadmapTrackConfigs.dsa,
        },
        {
            key: roadmapTrackConfigs.language.trackKey,
            hierarchy: languageRoadmapHierarchy,
            patterns: languageCatalogPatterns,
            config: roadmapTrackConfigs.language,
        },
        {
            key: roadmapTrackConfigs['system-design'].trackKey,
            hierarchy: systemDesignRoadmapHierarchy,
            patterns: systemDesignCatalogPatterns,
            config: roadmapTrackConfigs['system-design'],
        },
        {
            key: roadmapTrackConfigs['web-dev'].trackKey,
            hierarchy: webDevRoadmapHierarchy,
            patterns: webDevCatalogPatterns,
            config: roadmapTrackConfigs['web-dev'],
        },
    ];

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {cards.map(({ key, hierarchy, patterns, config, topics: trackTopics }) => (
                <RoadmapView
                    key={key}
                    mode="compact"
                    hierarchy={hierarchy}
                    patterns={patterns}
                    topics={trackTopics}
                    trackKey={config.trackKey}
                    kicker={config.kicker}
                    title={config.title}
                    subtitle={config.subtitle}
                    ctaPath={config.path}
                    searchPlaceholder={config.searchPlaceholder}
                />
            ))}
        </div>
    );
}
