export type LocationFieldType = 'station' | 'posted_to';

export interface LocationMapping {
    id: number;
    field_type: LocationFieldType;
    original_value: string;
    canonical_value: string;
    created_at?: string | null;
}

export interface SaveLocationMappingDTO {
    field_type: LocationFieldType;
    original_value: string;
    canonical_value: string;
}
