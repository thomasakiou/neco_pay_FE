import * as XLSX from 'xlsx';
import { PaymentDTO } from '../types/payment';

export const generateExcelReport = (payments: PaymentDTO[], title: string = 'Payment Report') => {
    // Map payment data to Excel rows with specific column names
    const data = payments.map(p => ({
        'Name': p.name || '',
        'Per No': p.file_no || '',
        'Location': p.station || '',
        'Bank': p.bank || '',
        'Account': p.account_numb || '',
        'Fuel/Local': p.fuel_local || 0,
        'Transport': p.transport || 0,
        'DTA': p.dta || 0,
        'Netpay': p.total_netpay || 0
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Data');

    // Generate file name
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${safeTitle}_report.xlsx`;

    // Trigger download
    XLSX.writeFile(workbook, fileName);
};
