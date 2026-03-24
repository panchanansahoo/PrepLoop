import React from 'react';
import RoadmapView from '../features/dashboard/components/RoadmapView';
import { languageCatalogPatterns, languageRoadmapHierarchy, roadmapTrackConfigs } from '../data/roadmapCatalog';

export default function LanguageRoadmap() {
    return (
        <RoadmapView
            hierarchy={languageRoadmapHierarchy}
            patterns={languageCatalogPatterns}
            trackKey={roadmapTrackConfigs.language.trackKey}
            kicker={roadmapTrackConfigs.language.kicker}
            title={roadmapTrackConfigs.language.title}
            subtitle={roadmapTrackConfigs.language.subtitle}
            ctaPath={roadmapTrackConfigs.language.path}
            searchPlaceholder={roadmapTrackConfigs.language.searchPlaceholder}
            sourceUrl=""
        />
    );
}
