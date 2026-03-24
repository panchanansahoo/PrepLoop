import React from 'react';

import RoadmapView from '../features/dashboard/components/RoadmapView';
import { dsaCatalogPatterns, dsaRoadmapHierarchy, roadmapTrackConfigs } from '../data/roadmapCatalog';

export default function DSAPatterns() {
    return (
        <RoadmapView
            hierarchy={dsaRoadmapHierarchy}
            patterns={dsaCatalogPatterns}
            trackKey={roadmapTrackConfigs.dsa.trackKey}
            kicker={roadmapTrackConfigs.dsa.kicker}
            title={roadmapTrackConfigs.dsa.title}
            subtitle={roadmapTrackConfigs.dsa.subtitle}
            ctaPath={roadmapTrackConfigs.dsa.path}
            searchPlaceholder={roadmapTrackConfigs.dsa.searchPlaceholder}
        />
    );
}
