import RoadmapView from '../features/dashboard/components/RoadmapView';
import { dsaRoadmapHierarchy, roadmapTrackConfigs } from '../data/roadmapCatalog';
import { dsaCatalogPatterns } from '../data/dsaRoadmapCatalog';

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
