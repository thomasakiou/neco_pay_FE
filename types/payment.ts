export interface PaymentDTO {
    id: number;
    file_no?: string | null;
    name?: string | null;
    conraiss?: string | null;
    amount_per_night?: number | null;
    dta?: number | null;
    transport?: number | null;
    numb_of_nights?: number | null;
    total?: number | null;
    total_netpay?: number | null;
    payment_title?: string | null;
    bank?: string | null;
    account_numb?: string | null;
    tax?: number | null;
    fuel_local?: number | null;
    station?: string | null;
    posting?: string | null;
    created_at?: string | null;
}

export interface CreatePaymentDTO {
    file_no?: string | null;
    name?: string | null;
    conraiss?: string | null;
    amount_per_night?: number | null;
    dta?: number | null;
    transport?: number | null;
    numb_of_nights?: number | null;
    total?: number | null;
    total_netpay?: number | null;
    payment_title?: string | null;
    bank?: string | null;
    account_numb?: string | null;
    tax?: number | null;
    fuel_local?: number | null;
    station?: string | null;
    posting?: string | null;
}

export interface UpdatePaymentDTO extends CreatePaymentDTO { }
