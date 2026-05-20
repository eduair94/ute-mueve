// Re-export for backwards compatibility. Canonical implementation lives in
// @ute-mueve/types/filters and is shared between bridge and SDK.
import type { schemas } from '@ute-mueve/types';
export { distance, expandStationsFilters as expandFilters } from '@ute-mueve/types';
export type { ExpandedFilters as ExpandedStationFilters } from '@ute-mueve/types';
export type StationFilterInput = schemas.StationsSearchRequest;
