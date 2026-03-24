import React from 'react';
import RoadmapView from '../features/dashboard/components/RoadmapView';
import { roadmapTrackConfigs, webDevCatalogPatterns, webDevRoadmapHierarchy } from '../data/roadmapCatalog';

export default function WebDevRoadmap() {
    return (
        <RoadmapView
            hierarchy={webDevRoadmapHierarchy}
            patterns={webDevCatalogPatterns}
            trackKey={roadmapTrackConfigs['web-dev'].trackKey}
            kicker={roadmapTrackConfigs['web-dev'].kicker}
            title={roadmapTrackConfigs['web-dev'].title}
            subtitle={roadmapTrackConfigs['web-dev'].subtitle}
            ctaPath={roadmapTrackConfigs['web-dev'].path}
            searchPlaceholder={roadmapTrackConfigs['web-dev'].searchPlaceholder}
            sourceUrl=""
        />
    );
}
