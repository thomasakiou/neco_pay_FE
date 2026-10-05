import { State } from '../types/state';
import { Distance } from '../types/distance';

/**
 * Resolves a raw posting station/posting value to the canonical city name
 * used in the Distance table, using the States table as a bridge.
 *
 * Resolution order:
 * 1. HQ-* pattern  → find the HQ source in the Distance table
 * 2. FCT / Abuja   → "Abuja"
 * 3. State name    → state capital
 * 4. State code    → state capital
 * 5. Capital name  → return as-is (already canonical)
 * 6. Direct match in distance source/target → return as-is
 * 7. Fallback      → return original value
 */
export function resolveLocation(
    raw: string,
    states: State[],
    distances: Distance[]
): string {
    const v = raw.trim();
    const vl = v.toLowerCase();

    // 1. HQ-* pattern (e.g. "HQ-AB", "HQ-KG") → find HQ source in distances
    if (/^hq[-\s]/i.test(v)) {
        const hqSource = distances.find(d => /\bHQ\b/i.test(d.source || ''))?.source;
        if (hqSource) return hqSource;
        // fallback: Minna is the known HQ location
        return 'Minna';
    }

    // 2. FCT / Abuja aliases
    if (vl === 'fct' || vl === 'abuja' || vl === 'fct abuja') return 'Abuja';

    // 3 & 4. Match against States table (state name or code → capital)
    const stateMatch = states.find(s =>
        s.state?.toLowerCase() === vl ||
        s.code?.toLowerCase() === vl
    );
    if (stateMatch) return stateMatch.capital;

    // 5. Value is already a capital name
    const capitalMatch = states.find(s => s.capital?.toLowerCase() === vl);
    if (capitalMatch) return capitalMatch.capital;

    // 6. Direct match in distance source or target
    const distMatch = distances.find(
        d => d.source?.toLowerCase() === vl || d.target?.toLowerCase() === vl
    );
    if (distMatch) return distMatch.source?.toLowerCase() === vl ? distMatch.source! : distMatch.target!;

    // 7. Fallback
    return v;
}
