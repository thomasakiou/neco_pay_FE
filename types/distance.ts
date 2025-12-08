export interface Distance {
    id: number;
    pcode?: string | null;
    source?: string | null;
    tcode?: string | null;
    target?: string | null;
    distance?: number | null;
    tstate?: string | null;
    active: boolean;
    created_at?: string | null;
}

export interface CreateDistanceDTO {
    pcode?: string | null;
    source?: string | null;
    tcode?: string | null;
    target?: string | null;
    distance?: number | null;
    tstate?: string | null;
    active?: boolean;
}

export interface UpdateDistanceDTO extends CreateDistanceDTO { }
