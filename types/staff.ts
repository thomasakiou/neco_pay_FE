export interface Staff {
    id: number;
    staff_id: string; // per_no
    surname: string;
    firstname: string;
    middlename?: string | null;
    res?: string | null;
    tcheck?: string | null;
    dup?: string | null;
    dcode?: string | null;
    name1?: string | null;
    name?: string | null;
    department?: string | null;
    location?: string | null;
    state?: string | null; // active state of origin? or state field? context says 'state' in openapi
    div?: string | null;
    union?: string | null;
    post?: string | null;
    status?: string | null;
    posted?: string | null;
    bank?: string | null;
    tt?: string | null;
    mcs_no?: string | null;
    ippis?: string | null;
    title?: string | null;
    s_origin?: string | null;
    t_origin?: string | null;
    local_gov?: string | null;
    rank?: string | null;
    rank2?: string | null;
    rank3?: string | null;
    contiss?: string | null;
    level?: string | null; // level
    step?: string | null; // step
    oldcontiss?: string | null;
    oldstep?: string | null;
    sal_annum?: number | null;
    bank_code?: string | null; // bank_code
    sortcode?: string | null; // sortcode
    bank_name?: string | null; // bank_name
    bank_locat?: string | null;
    account_no?: string | null; // account_no
    old_acct?: string | null;
    branch?: string | null;
    eff_date?: string | null; // date
    daterecall?: string | null; // date
    datestoppe?: string | null; // date
    remark?: string | null; // for active logic
    reason?: string | null;
    mvariation?: string | null;
    group_code?: string | null;
    active: boolean; // active field
    created_at: string;
}

export interface CreateStaffDTO extends Omit<Staff, 'id' | 'created_at'> { }
