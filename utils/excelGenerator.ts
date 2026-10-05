import * as XLSX from 'xlsx';
import { PaymentDTO } from '../types/payment';
import { ALL_REPORT_FIELDS } from './pdfGenerator';

export const generateExcelReport = (payments: PaymentDTO[], title: string = 'Payment Report', activeFields: string[] = ALL_REPORT_FIELDS.map(f => f.key)) => {
    type RowGetter = (p: PaymentDTO, i: number) => string | number;
    const allCols: { key: string; label: string; get: RowGetter }[] = [
        { key: 'sno',            label: 'S No.',            get: (_, i) => i + 1 },
        { key: 'file_no',        label: 'Per No',           get: p => p.file_no || '' },
        { key: 'name',           label: 'Name',             get: p => p.name || '' },
        { key: 'station',        label: 'Location',         get: p => p.station || '' },
        { key: 'conraiss',       label: 'Level',            get: p => p.conraiss || '' },
        { key: 'posting',        label: 'State Posted',     get: p => p.posting || '' },
        { key: 'numb_of_nights', label: 'No of Nites',      get: p => p.numb_of_nights || 0 },
        { key: 'dta',            label: 'Nights (DTA)',     get: p => p.dta || 0 },
        { key: 'transport',      label: 'Kilo (Transport)', get: p => p.transport || 0 },
        { key: 'fuel_local',     label: 'Fuel/Local',       get: p => p.fuel_local || 0 },
        { key: 'tax',            label: 'Tax',              get: p => p.tax || 0 },
        { key: 'total_netpay',   label: 'Netpay',           get: p => p.total_netpay || 0 },
    ];
    const cols = allCols.filter(c => activeFields.includes(c.key));

    const data = payments.map((p, i) => {
        const row: Record<string, string | number> = {};
        cols.forEach(c => { row[c.label] = c.get(p, i); });
        return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Data');

    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    XLSX.writeFile(workbook, `${safeTitle}_report.xlsx`);
};
