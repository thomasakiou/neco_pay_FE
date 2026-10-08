import { State } from '../types/state';
import { Distance } from '../types/distance';

export type DistanceSide = 'source' | 'target';

const zoneLocations: Record<string, string> = {
    nezo: 'Bauchi',
    swzo: 'Ibadan',
    sezo: 'Enugu',
    nwzo: 'Kano',
    sszo: 'Port Harcourt',
    nczo: 'Ilorin',
    rlo: 'Abuja',
};

const normalizeLocation = (value: string) => value.trim().toLocaleLowerCase();
const compactLocation = (value: string) => {
    const compacted = value.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
    return compacted === 'pharcourt' ? 'portharcourt' : compacted;
};

function getCanonicalLocation(
    value: string,
    distances: Distance[],
    side?: DistanceSide
): string | undefined {
    const locations = side
        ? distances.map(distance => distance[side])
        : distances.flatMap(distance => [distance.source, distance.target]);
    return locations.find(location =>
        location?.trim() && compactLocation(location) === compactLocation(value)
    )?.trim();
}

export function isOfficeLocationCode(raw: string): boolean {
    const value = raw.trim();
    return /^hq[-\s]/i.test(value) || /^(?:ne|sw|se|nw|ss|nc)[-\s]?zo$/i.test(value) || /^rlo$/i.test(value);
}

/**
 * Resolves a raw posting station/posting value to the canonical city name
 * used in the Distance table, using the States table as a bridge.
 *
 * Resolution order:
 * 1. HQ-* pattern  → Minna (HQ) or Minna, matching the Distance source
 * 2. Zonal office  → its state/capital, matching the Distance side
 * 3. FCT / Abuja   → "Abuja"
 * 4. State name    → state capital
 * 5. State code    → state capital
 * 6. Capital name  → return as-is (already canonical)
 * 7. Direct match in the requested Distance field → return as-is
 * 8. Fallback      → return original value
 */
export function resolveLocation(
    raw: string,
    states: State[],
    distances: Distance[],
    side?: DistanceSide
): string {
    const v = raw.trim();
    const vl = v.toLowerCase();

    // NECO headquarters assignments all originate from Minna.
    if (/^hq[-\s]/i.test(v)) {
        const sources = distances
            .map(distance => distance.source?.trim())
            .filter((source): source is string => !!source);
        const hqSource = sources.find(source => compactLocation(source) === 'minnahq')
            || sources.find(source => compactLocation(source) === 'minna');
        if (hqSource) return hqSource;
        return 'Minna';
    }

    // Zonal assignments resolve to the zonal office city/state capital.
    const zoneCode = vl.replace(/[^a-z0-9]/g, '');
    const zoneLocation = zoneLocations[zoneCode];
    if (zoneLocation) {
        return getCanonicalLocation(zoneLocation, distances, side) || zoneLocation;
    }

    // 2. FCT / Abuja aliases
    if (vl === 'fct' || vl === 'abuja' || vl === 'fct abuja') {
        return getCanonicalLocation('Abuja', distances, side) || 'Abuja';
    }

    // 3 & 4. Match against States table (state name or code → capital)
    const stateMatch = states.find(s =>
        s.state?.toLowerCase() === vl ||
        s.code?.toLowerCase() === vl
    );
    if (stateMatch) return getCanonicalLocation(stateMatch.capital, distances, side) || stateMatch.capital;

    // 5. Value is already a capital name
    const capitalMatch = states.find(s => s.capital?.toLowerCase() === vl);
    if (capitalMatch) return getCanonicalLocation(capitalMatch.capital, distances, side) || capitalMatch.capital;

    // 6. Direct match in distance source or target
    const distMatch = getCanonicalLocation(v, distances, side);
    if (distMatch) return distMatch;

    // 7. Fallback
    return v;
}
