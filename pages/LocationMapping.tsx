import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Save, RefreshCw, MapPin } from 'lucide-react';
import { getPostings } from '../services/posting';
import { getDistances } from '../services/distance';
import { getStates } from '../services/states';
import { deleteLocationMapping, getLocationMappings, saveLocationMapping } from '../services/locationMapping';
import { Distance } from '../types/distance';
import { State } from '../types/state';
import { LocationFieldType, LocationMapping } from '../types/locationMapping';
import { Posting } from '../types/posting';
import Toast, { ToastType } from '../components/Toast';
import { isOfficeLocationCode, resolveLocation } from '../utils/resolveLocation';

interface MappingRow {
    fieldType: LocationFieldType;
    originalValue: string;
    savedMapping?: LocationMapping;
    suggestion?: string;
}

interface RoutePreview {
    station: string;
    postedTo: string;
    count: number;
    distance?: Distance;
}

const mappingKey = (fieldType: LocationFieldType, value: string) =>
    `${fieldType}:${value.trim().toLocaleLowerCase()}`;

const normalize = (value: string) => value.trim().toLocaleLowerCase();

export default function LocationMappingPage() {
    const [postings, setPostings] = useState<Posting[]>([]);
    const [distances, setDistances] = useState<Distance[]>([]);
    const [states, setStates] = useState<State[]>([]);
    const [mappings, setMappings] = useState<LocationMapping[]>([]);
    const [drafts, setDrafts] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const showToast = (message: string, type: ToastType) => setToast({ message, type });

    const loadData = async () => {
        try {
            setLoading(true);
            const [postingRows, distanceRows, stateRows, mappingRows] = await Promise.all([
                getPostings(0, 10000),
                getDistances(0, 100000),
                getStates(0, 10000),
                getLocationMappings(),
            ]);
            setPostings(postingRows);
            setDistances(distanceRows);
            setStates(stateRows);
            setMappings(mappingRows);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to load location mapping data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const sourceOptions = useMemo(
        () => Array.from(new Set(distances.map(row => row.source?.trim()).filter((value): value is string => !!value))).sort(),
        [distances]
    );
    const targetOptions = useMemo(
        () => Array.from(new Set(distances.map(row => row.target?.trim()).filter((value): value is string => !!value))).sort(),
        [distances]
    );

    const mappingRows = useMemo(() => {
        const values = new Map<string, { fieldType: LocationFieldType; originalValue: string }>();
        for (const posting of postings) {
            if (posting.station?.trim()) {
                values.set(mappingKey('station', posting.station), { fieldType: 'station', originalValue: posting.station.trim() });
            }
            if (posting.posting?.trim()) {
                values.set(mappingKey('posted_to', posting.posting), { fieldType: 'posted_to', originalValue: posting.posting.trim() });
            }
        }
        for (const mapping of mappings) {
            values.set(mappingKey(mapping.field_type, mapping.original_value), {
                fieldType: mapping.field_type,
                originalValue: mapping.original_value,
            });
        }

        const savedByKey = new Map(mappings.map(mapping => [mappingKey(mapping.field_type, mapping.original_value), mapping]));
        return Array.from(values.values()).map(({ fieldType, originalValue }): MappingRow => {
            const options = fieldType === 'station' ? sourceOptions : targetOptions;
            const savedMapping = savedByKey.get(mappingKey(fieldType, originalValue));
            const exact = options.find(option => normalize(option) === normalize(originalValue));
            const suffix = originalValue.includes('|') ? originalValue.split('|').at(-1)?.trim() : undefined;
            const suffixMatch = suffix && options.find(option => normalize(option) === normalize(suffix));
            const side = fieldType === 'station' ? 'source' : 'target';
            const automatic = isOfficeLocationCode(originalValue)
                ? options.find(option => normalize(option) === normalize(resolveLocation(originalValue, states, distances, side)))
                : undefined;
            const suggestion = automatic || savedMapping?.canonical_value || exact || suffixMatch;
            return { fieldType, originalValue, savedMapping, suggestion };
        }).sort((left, right) =>
            left.fieldType.localeCompare(right.fieldType) || left.originalValue.localeCompare(right.originalValue)
        );
    }, [postings, mappings, sourceOptions, targetOptions, states, distances]);

    const resolvedRoutes = useMemo(() => {
        const mappingByKey = new Map(mappings.map(mapping => [
            mappingKey(mapping.field_type, mapping.original_value),
            mapping.canonical_value,
        ]));
        const routeCounts = new Map<string, RoutePreview>();

        for (const posting of postings) {
            const station = posting.station?.trim() || '';
            const postedTo = posting.posting?.trim() || '';
            if (!station || !postedTo) continue;
            const sourceMapping = mappingByKey.get(mappingKey('station', station));
            const targetMapping = mappingByKey.get(mappingKey('posted_to', postedTo));
            const source = isOfficeLocationCode(station)
                ? resolveLocation(station, states, distances, 'source')
                : sourceMapping || station;
            const target = isOfficeLocationCode(postedTo)
                ? resolveLocation(postedTo, states, distances, 'target')
                : targetMapping || postedTo;
            const key = `${normalize(source)}|${normalize(target)}`;
            const existing = routeCounts.get(key);
            if (existing) {
                existing.count += 1;
            } else {
                const distance = distances.find(row =>
                    normalize(row.source || '') === normalize(source) &&
                    normalize(row.target || '') === normalize(target)
                );
                routeCounts.set(key, { station: source, postedTo: target, count: 1, distance });
            }
        }
        return Array.from(routeCounts.values()).sort((a, b) =>
            Number(!!b.distance) - Number(!!a.distance) ||
            a.station.localeCompare(b.station) ||
            a.postedTo.localeCompare(b.postedTo)
        );
    }, [postings, distances, mappings, states]);

    const handleSave = async (row: MappingRow) => {
        const key = mappingKey(row.fieldType, row.originalValue);
        const canonicalValue = drafts[key] ?? row.savedMapping?.canonical_value ?? row.suggestion ?? '';
        if (!canonicalValue) {
            showToast('Choose a matching Distance table location before saving.', 'error');
            return;
        }

        setSavingKey(key);
        try {
            const saved = await saveLocationMapping({
                field_type: row.fieldType,
                original_value: row.originalValue,
                canonical_value: canonicalValue,
            });
            setMappings(previous => [
                ...previous.filter(mapping => mappingKey(mapping.field_type, mapping.original_value) !== key),
                saved,
            ]);
            showToast('Location mapping saved.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to save location mapping.', 'error');
        } finally {
            setSavingKey(null);
        }
    };

    const handleClear = async (row: MappingRow) => {
        if (!row.savedMapping) return;
        const key = mappingKey(row.fieldType, row.originalValue);
        setSavingKey(key);
        try {
            await deleteLocationMapping(row.savedMapping.id);
            setMappings(previous => previous.filter(mapping => mapping.id !== row.savedMapping?.id));
            setDrafts(previous => ({ ...previous, [key]: '' }));
            showToast('Location mapping removed.', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to remove location mapping.', 'error');
        } finally {
            setSavingKey(null);
        }
    };

    const routeStatus = resolvedRoutes.length
        ? `${resolvedRoutes.filter(route => route.distance).length} of ${resolvedRoutes.length} distinct routes match the Distance table`
        : 'No posting routes are available to preview.';

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Location Mapping</h1>
                    <p className="mt-1 text-gray-500">Match uploaded Station and Posted To values to canonical Distance table locations.</p>
                </div>
                <button onClick={() => void loadData()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <strong>HQ-*</strong> stations are automatically resolved to <strong>Minna</strong> or <strong>Minna (HQ)</strong>, and zonal office codes are resolved to their office city/capital. For other values, map <strong>Station</strong> to a Distance <strong>Source</strong> and <strong>Posted To</strong> to a Distance <strong>Target</strong>; text after a <code>|</code> is suggested when it matches. Transport and Parameter Local are calculated only when that route exists in the Distance table.
            </div>

            {loading ? (
                <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
            ) : (
                <>
                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                            <h2 className="font-bold text-gray-900">Uploaded Location Values</h2>
                            <p className="mt-1 text-sm text-gray-500">Suggestions are not applied until you save them. Unmapped exact matches are used as-is.</p>
                        </div>
                        {mappingRows.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 p-8 text-center">
                                <p className="text-sm text-gray-500">No saved posting records found. Select a CSV on the Posting page and click <strong>Confirm Upload</strong> to save it before mapping locations.</p>
                                <Link to="/posting" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                                    Go to Posting
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-gray-200 bg-white text-gray-600">
                                        <tr>
                                            <th className="px-6 py-3">Field</th>
                                            <th className="px-6 py-3">Uploaded value</th>
                                            <th className="px-6 py-3">Distance table match</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {mappingRows.map(row => {
                                            const key = mappingKey(row.fieldType, row.originalValue);
                                            const value = drafts[key] ?? row.savedMapping?.canonical_value ?? row.suggestion ?? '';
                                            const options = row.fieldType === 'station' ? sourceOptions : targetOptions;
                                            const dirty = value !== (row.savedMapping?.canonical_value ?? '');
                                            return (
                                                <tr key={key}>
                                                    <td className="whitespace-nowrap px-6 py-3 font-medium text-gray-700">{row.fieldType === 'station' ? 'Station → Source' : 'Posted To → Target'}</td>
                                                    <td className="min-w-64 px-6 py-3 text-gray-900">{row.originalValue}</td>
                                                    <td className="min-w-72 px-6 py-3">
                                                        <select
                                                            value={value}
                                                            onChange={event => setDrafts(previous => ({ ...previous, [key]: event.target.value }))}
                                                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm"
                                                        >
                                                            <option value="">Select a canonical location…</option>
                                                            {options.map(option => <option key={option} value={option}>{option}</option>)}
                                                        </select>
                                                        {row.suggestion && !row.savedMapping && <span className="mt-1 block text-xs text-blue-700">Suggested: {row.suggestion}</span>}
                                                        {row.savedMapping && <span className="mt-1 block text-xs text-green-700">Saved mapping</span>}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-3 text-right">
                                                        <button onClick={() => void handleSave(row)} disabled={savingKey === key || !value || !dirty} className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50">
                                                            {savingKey === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                            Save
                                                        </button>
                                                        {row.savedMapping && <button onClick={() => void handleClear(row)} disabled={savingKey === key} className="ml-2 rounded-md px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">Clear</button>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-1 border-b border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-bold text-gray-900">Resolved Route Preview</h2>
                                <p className="mt-1 text-sm text-gray-500">{routeStatus}</p>
                            </div>
                            <MapPin className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="max-h-[32rem] overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="sticky top-0 bg-white text-gray-600">
                                    <tr>
                                        <th className="px-6 py-3">Resolved Source</th>
                                        <th className="px-6 py-3">Resolved Target</th>
                                        <th className="px-6 py-3">Distance (km)</th>
                                        <th className="px-6 py-3">Posting rows</th>
                                        <th className="px-6 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {resolvedRoutes.map(route => (
                                        <tr key={`${normalize(route.station)}|${normalize(route.postedTo)}`}>
                                            <td className="px-6 py-3">{route.station}</td>
                                            <td className="px-6 py-3">{route.postedTo}</td>
                                            <td className="px-6 py-3">{route.distance?.distance ?? '—'}</td>
                                            <td className="px-6 py-3">{route.count}</td>
                                            <td className="px-6 py-3">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${route.distance ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-800'}`}>
                                                    {route.distance ? 'Matched' : 'No distance match'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {resolvedRoutes.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No routes to preview.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
