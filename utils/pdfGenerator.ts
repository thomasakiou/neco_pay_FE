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
        const tableBody = bankPayments.map((p, i) => [
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
            '',
            '',
            `Total for : ${bank.toUpperCase()}`,
            '',
            totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
            },
            // Custom styling for the Total row (last row)
            didParseCell: (data) => {
                if (data.row.index === tableBody.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    if (data.column.index === 2) { // "Total for : BANK" label
                        data.cell.styles.halign = 'right';
                    }
                }
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
