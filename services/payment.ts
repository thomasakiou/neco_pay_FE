import { PaymentDTO } from '../types/payment';
import { getAuthHeaders, getAuthHeadersForFormData } from './apiHelpers';
import * as XLSX from 'xlsx';

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

const normalizeHeaders = (headers: any[]): string[] => {
    return headers.map(h => {
        const trimmed = String(h || '').trim();
        const lower = trimmed.toLowerCase();

        if (lower === 'netpay' || lower === 'net_pay' || lower === 'total_netpay' || lower === 'net pay') return 'total_netpay';
        if (lower === 'account no' || lower === 'account_no' || lower === 'account_numb' || lower === 'account number' || lower === 'account') return 'account_numb';
        if (lower === 'bank' || lower === 'bank name') return 'bank';
        if (lower === 'payment_title' || lower === 'payment title' || lower === 'title') return 'payment_title';
        if (lower === 'fuel-local_runs' || lower === 'fuel_local' || lower === 'fuel local' || lower === 'fuel' || lower === 'fuel/local') return 'fuel_local';
        if (lower === 'file no' || lower === 'file_no' || lower === 'per no' || lower === 'per_no' || lower === 'staff_per_no' || lower === 'staff per no') return 'file_no';
        if (lower === 'name' || lower === 'staff name' || lower === 'fullname' || lower === 'full name') return 'name';
        if (lower === 'conraiss' || lower === 'level' || lower === 'grade') return 'conraiss';
        if (lower === 'station' || lower === 'location' || lower === 'current station') return 'station';
        if (lower === 'posting' || lower === 'state posted' || lower === 'posted to') return 'posting';
        if (lower === 'transport' || lower === 'total_transport' || lower === 'transport allowance') return 'transport';
        if (lower === 'numb_of_nights' || lower === 'no of nites' || lower === 'number of nights' || lower === 'nights') return 'numb_of_nights';
        if (lower === 'amt_per_night' || lower === 'amount_per_night' || lower === 'rate' || lower === 'amount per night') return 'amount_per_night';
        if (lower === 'dta' || lower === 'dta allowance') return 'dta';
        if (lower === 'tax' || lower === 'tax deduction') return 'tax';
        if (lower === 'total' || lower === 'gross total' || lower === 'gross pay' || lower === 'total amount') return 'total';

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
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to array of arrays to handle headers manually
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

                if (!rows || rows.length < 2) {
                    throw new Error("File must contain at least a header and one data row");
                }

                // Find header row index
                // Look for a row that contains our key keywords
                let headerRowIndex = 0;
                let foundHeaders = false;
                const maxScanRows = Math.min(rows.length, 20); // Scan first 20 rows

                // We'll normalize each row to check for matches
                for (let i = 0; i < maxScanRows; i++) {
                    const candidateRow = rows[i];
                    if (!candidateRow || candidateRow.length === 0) continue;

                    const normalizedCandidate = normalizeHeaders(candidateRow);
                    // Check if this row contains at least one of our critical headers
                    // file_no and total_netpay are good indicators
                    if (normalizedCandidate.includes('file_no') || normalizedCandidate.includes('total_netpay') || normalizedCandidate.includes('name')) {
                        headerRowIndex = i;
                        foundHeaders = true;
                        break;
                    }
                }

                // If not found in first 20 rows, we default to 0 but it will likely fail validaton later

                // Extract and normalize headers
                const originalHeaders = rows[headerRowIndex];
                const normalizedHeaders = normalizeHeaders(originalHeaders);

                // Validate essential headers
                const requiredFields = ['file_no', 'total_netpay'];
                const missingFields = requiredFields.filter(field => !normalizedHeaders.includes(field));

                if (missingFields.length > 0) {
                    // Check if it's potentially an issue with the header row index
                    const msg = `Could not find required columns: ${missingFields.join(', ')}. \nFound headers at row ${headerRowIndex + 1}: ${originalHeaders.join(', ')}.\nPlease ensure the file has a header row with 'File No' and 'Netpay'.`;
                    console.error(msg);
                    throw new Error(msg);
                }

                // Prepare data for reconstruction
                // Data starts AFTER the header row
                const dataRows = rows.slice(headerRowIndex + 1);

                // Construct a new array of objects with normalized keys
                const standardizedData = dataRows.map(row => {
                    const obj: any = {};
                    normalizedHeaders.forEach((header, index) => {
                        if (header) {
                            obj[header] = row[index];
                        }
                    });
                    return obj;
                });

                // Filter out completely empty objects if any
                const filteredData = standardizedData.filter(item =>
                    Object.values(item).some(val => val !== undefined && val !== null && val !== '')
                );

                if (filteredData.length === 0) {
                    throw new Error("No valid data rows found in the file");
                }

                // Re-generate a clean CSV for upload
                // Re-generate a clean CSV for upload
                const newSheet = XLSX.utils.json_to_sheet(filteredData);
                let csvOutput = XLSX.utils.sheet_to_csv(newSheet);

                // Strip BOM if present
                if (csvOutput.charCodeAt(0) === 0xFEFF) {
                    csvOutput = csvOutput.slice(1);
                }

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
                console.error('Upload processing error:', err);
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        };

        reader.onerror = (err) => reject(new Error("File reading failed"));
        reader.readAsArrayBuffer(file);
    });
};

