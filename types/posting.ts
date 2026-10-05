export interface Posting {
    id: number;
    state?: string | null;
    file_no?: string | null;
    name?: string | null;
    conraiss?: string | null;
    station?: string | null;
    posting?: string | null;
    no_of_nights?: number | null;
    batch_name?: string | null;
    category?: string | null;
    rank?: string | null;
    mandate?: string | null;
    active: boolean;
    created_at?: string | null;
}

export interface CreatePostingDTO {
    state?: string | null;
    file_no?: string | null;
    name?: string | null;
    conraiss?: string | null;
    station?: string | null;
    posting?: string | null;
    no_of_nights?: number | null;
    category?: string | null;
    rank?: string | null;
    mandate?: string | null;
    active?: boolean;
}

export interface UpdatePostingDTO extends CreatePostingDTO { }

export interface GeneratePaymentDTO {
    payment_title: string;
    numb_of_nights: number;
    local_runs: number;
}
