import RoadmapView from '../features/dashboard/components/RoadmapView';
import { roadmapTrackConfigs, systemDesignCatalogPatterns, systemDesignRoadmapHierarchy } from '../data/roadmapCatalog';

export default function SystemDesignRoadmap() {
    return (
        <RoadmapView
            hierarchy={systemDesignRoadmapHierarchy}
            patterns={systemDesignCatalogPatterns}
            trackKey={roadmapTrackConfigs['system-design'].trackKey}
            kicker={roadmapTrackConfigs['system-design'].kicker}
            title={roadmapTrackConfigs['system-design'].title}
            subtitle={roadmapTrackConfigs['system-design'].subtitle}
            ctaPath={roadmapTrackConfigs['system-design'].path}
            searchPlaceholder={roadmapTrackConfigs['system-design'].searchPlaceholder}
            sourceUrl=""
        />
    );
}
