import * as XLSX from 'xlsx';
import { PaymentDTO } from '../types/payment';

export const generateExcelReport = (payments: PaymentDTO[], title: string = 'Payment Report') => {
    // Map payment data to Excel rows with specific column names
    const data = payments.map(p => ({
        'Iname': p.name || '',
        'Ilocation': p.station || '',
        'Ibank': p.bank || '',
        'Iaccount': p.account_numb || '',
        'Inetpay': p.total_netpay || 0
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
