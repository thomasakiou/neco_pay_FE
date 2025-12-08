export interface Bank {
    id: number;
    code?: string | null;
    name?: string | null;
    sort_code?: string | null;
    branch?: string | null;
    location?: string | null;
    active: boolean;
    created_at?: string | null;
}

export interface CreateBankDTO {
    code?: string | null;
    name?: string | null;
    sort_code?: string | null;
    branch?: string | null;
    location?: string | null;
    active?: boolean;
}

export interface UpdateBankDTO extends CreateBankDTO { }
