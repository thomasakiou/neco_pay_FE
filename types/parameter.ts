export interface Parameter {
    id: number;
    contiss?: string | null;
    pernight?: number | null;
    local?: number | null;
    kilometer?: number | null;
    active: boolean;
    created_at?: string | null;
}

export interface CreateParameterDTO {
    contiss?: string | null;
    pernight?: number | null;
    local?: number | null;
    kilometer?: number | null;
    active?: boolean;
}

export interface UpdateParameterDTO extends CreateParameterDTO { }
