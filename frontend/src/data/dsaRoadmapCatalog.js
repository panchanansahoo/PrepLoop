import { dsaPatternsAll as baseDsaPatterns } from './dsaPatternsData';
import { buildTrackPatterns, dsaRoadmapHierarchy, roadmapTrackConfigs } from './roadmapCatalog';

export const dsaCatalogPatterns = buildTrackPatterns(
    dsaRoadmapHierarchy,
    baseDsaPatterns,
    roadmapTrackConfigs.dsa
);
