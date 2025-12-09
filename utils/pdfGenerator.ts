import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PaymentDTO } from '../types/payment';

export const generateBankReport = (payments: PaymentDTO[], title: string = 'Payment Schedule') => {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format roughly

    // Group by Bank
    const grouped: Record<string, PaymentDTO[]> = {};
    payments.forEach(p => {
        const bankName = p.bank?.trim() || 'Unknown Bank';
        if (!grouped[bankName]) grouped[bankName] = [];
        grouped[bankName].push(p);
    });

    const sortedBanks = Object.keys(grouped).sort();

    sortedBanks.forEach((bank, index) => {
        if (index > 0) doc.addPage();

        // 1. Header Information
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('The Manager,', 14, 20);

        doc.setFont('helvetica', 'normal');
        doc.text(today, 180, 20, { align: 'right' }); // Date top right

        // 2. Title
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), 14, 30);

        // 3. Table Data
        const bankPayments = grouped[bank];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tableBody: any[] = bankPayments.map((p, i) => [
            i + 1,
            p.name?.toUpperCase() || '',
            p.bank?.toUpperCase() || '',
            p.account_numb || '',
            p.total_netpay?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
        ]);

        // Calculate Total
        const totalAmount = bankPayments.reduce((sum, p) => sum + (p.total_netpay || 0), 0);

        // Add Total Row
        tableBody.push([
            {
                content: `Total for : ${bank.toUpperCase()}`,
                colSpan: 4,
                styles: { halign: 'right', fontStyle: 'bold' }
            },
            {
                content: totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                styles: { fontStyle: 'bold' }
            }
        ]);

        // 4. Generate Table
        autoTable(doc, {
            startY: 35,
            head: [['S/No', 'Name', 'Bank', 'Account No.', 'Amount']],
            body: tableBody,
            theme: 'plain', // Looks like plain/grid in screenshot
            styles: {
                fontSize: 9,
                cellPadding: 1,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                textColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                lineWidth: 0.1,
                lineColor: [0, 0, 0],
                fontStyle: 'normal' // specific styling from screenshot looks standard
            },
            columnStyles: {
                0: { cellWidth: 10 }, // S/No
                1: { cellWidth: 60 }, // Name
                2: { cellWidth: 50 }, // Bank
                3: { cellWidth: 35 }, // Account No
                4: { cellWidth: 30, halign: 'right' } // Amount
            }
        });

        // 5. Footer (Director, Finance & Accounts)
        const pageHeight = doc.internal.pageSize.height;
        const footerY = pageHeight - 30;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`salpost, ${today}`, 14, footerY);

        doc.setFont('helvetica', 'normal');
        // line for signature
        doc.line(130, footerY - 5, 190, footerY - 5);
        doc.setFont('courrier', 'normal'); // Courier-ish font often used in these reports
        doc.text('Director, Finance & Accounts', 130, footerY);
    });

    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeTitle}_bank_report.pdf`);
};

export const generateDetailsReport = (payments: PaymentDTO[], title: string = 'Payment Details') => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const today = new Date().toLocaleDateString('en-GB');

    // 1. Header Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('NECO POSTING - SSCE 2024 (EXTERNAL) MONITORING EXERCISE', 14, 15);

    doc.setFontSize(11);
    doc.text(title, 14, 25);

    // 2. Table Data
    // Column Mapping based on screenshot
    // S No | Per No | Name | Location | Level | State Posted | No of Nites | Nights (DTA) | Kilo (Transport) | Fuel/Local | Tax | Total

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tableBody: any[] = payments.map((p, i) => [
        i + 1,
        p.file_no || '',
        p.name?.toUpperCase() || '',
        p.station || '',
        p.conraiss || '',
        p.posting || '',
        p.numb_of_nights || '',
        p.dta?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00',
        p.transport?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00',
        p.fuel_local?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00',
        p.tax?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00',
        p.total_netpay?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'
    ]);

    autoTable(doc, {
        startY: 30,
        head: [['S No.', 'Per No', 'Name', 'Location', 'Level', 'State\nPosted', 'No of\nNites', 'Nights', 'Kilo', 'Fuel/\nLocal', 'Tax', 'Total']],
        body: tableBody,
        theme: 'plain',
        styles: {
            fontSize: 8,
            cellPadding: 1,
            lineColor: [0, 0, 0],
            lineWidth: 0.1,
            textColor: [0, 0, 0]
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            fontStyle: 'bold',
            valign: 'middle'
        },
        columnStyles: {
            0: { cellWidth: 10 }, // S/No
            1: { cellWidth: 15 }, // Per No
            2: { cellWidth: 55 }, // Name
            3: { cellWidth: 25 }, // Location
            4: { cellWidth: 12 }, // Level
            5: { cellWidth: 25 }, // State Posted
            6: { cellWidth: 15, halign: 'center' }, // No of Nites
            7: { cellWidth: 25, halign: 'right' }, // Nights (DTA)
            8: { cellWidth: 25, halign: 'right' }, // Kilo
            9: { cellWidth: 25, halign: 'right' }, // Fuel/Local
            10: { cellWidth: 20, halign: 'right' }, // Tax
            11: { cellWidth: 25, halign: 'right' } // Total
        }
    });

    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeTitle}_details_report.pdf`);
};
