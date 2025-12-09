import { PaymentDTO } from '../types/payment';
import { getAuthHeaders, getAuthHeadersForFormData } from './apiHelpers';

const API_URL = ''; // Proxy handles the base URL

export const getPayments = async (skip: number = 0, limit: number = 100000): Promise<PaymentDTO[]> => {
    const response = await fetch(`${API_URL}/payments/?skip=${skip}&limit=${limit}`, {
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to fetch payments');
    }
    return response.json();
};

export const deletePayment = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/payments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    if (!response.ok) {
        throw new Error('Failed to delete payment');
    }
};

import * as XLSX from 'xlsx';

// ... (existing code)

const normalizeHeaders = (headers: string[]): string[] => {
    // Backend seems to expect specific case-sensitive headers (e.g. 'File_No')
    // based on user feedback that lower-casing everything broke it.
    // We only want to fix the known broken columns.

    return headers.map(h => {
        const trimmed = h.trim();
        const lower = trimmed.toLowerCase();

        if (lower === 'netpay' || lower === 'net_pay') return 'Total_Netpay';
        if (lower === 'account no' || lower === 'account_no') return 'Account_Numb';
        if (lower === 'bank') return 'Bank'; // Ensure Bank matches if it wasn't
        if (lower === 'payment_title') return 'Payment_Title';

        // Return original for everything else (File_No, Name, Conraiss, etc.)
        return trimmed;
    });
};

export const uploadPayment = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                // Convert to JSON to manipulate headers easily
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                if (jsonData.length === 0) {
                    throw new Error("File is empty");
                }

                // Get original headers (first row)
                const originalHeaders = jsonData[0] as string[];
                const newHeaders = normalizeHeaders(originalHeaders);

                // Replace headers in data
                jsonData[0] = newHeaders;

                // Re-create worksheet
                const newSheet = XLSX.utils.aoa_to_sheet(jsonData as any[][]);
                const csvOutput = XLSX.utils.sheet_to_csv(newSheet);

                // Create new File object
                const blob = new Blob([csvOutput], { type: 'text/csv' });
                const newFile = new File([blob], "normalized_payment.csv", { type: 'text/csv' });

                const formData = new FormData();
                formData.append('file', newFile);

                const response = await fetch(`${API_URL}/payments/upload`, {
                    method: 'POST',
                    headers: getAuthHeadersForFormData(),
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Failed to upload payment file');
                }
                resolve();

            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};
