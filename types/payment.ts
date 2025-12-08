export interface Payment {
    id: number;
    per_no?: string | null;
    name?: string | null;
    station?: string | null;
    posting?: string | null;
    bank_account?: string | null;
    transport?: number | null;
    local_runs?: number | null;
    numb_of_nights?: number | null;
    amount_per_night?: number | null;
    netpay?: number | null;
    payment_title?: string | null;
    created_at?: string | null;
}

export interface CreatePaymentDTO {
    per_no?: string | null;
    name?: string | null;
    station?: string | null;
    posting?: string | null;
    bank_account?: string | null;
    transport?: number | null;
    local_runs?: number | null;
    numb_of_nights?: number | null;
    amount_per_night?: number | null;
    netpay?: number | null;
    payment_title?: string | null;
}

export interface UpdatePaymentDTO extends CreatePaymentDTO { }
