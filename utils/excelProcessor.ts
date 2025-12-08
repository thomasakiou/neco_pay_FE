import * as XLSX from 'xlsx';
import { getStates } from '../services/states';

export interface ProcessedExcelResult {
    csvContent: string;
    preview: any[];
    fileName: string;
    originalRowCount: number;
    cleanedRowCount: number;
}

export const processExcelFile = (file: File): Promise<ProcessedExcelResult> => {
    return new Promise(async (resolve, reject) => {
        const reader = new FileReader();

        // Fetch states for mapping
        let stateMap: Record<string, string> = {};
        try {
            const states = await getStates(0, 1000);
            states.forEach(s => {
                if (s.state && s.capital) {
                    stateMap[s.state.toLowerCase()] = s.capital;
                }
            });
        } catch (err) {
            console.warn("Failed to load states for mapping:", err);
        }

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Assume first sheet
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to array of arrays
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });

                if (jsonData.length === 0) {
                    reject(new Error("Excel file is empty"));
                    return;
                }

                // 1. Find the real header row
                let headerRowIndex = 0;
                const knownHeaders = ['S/N', 'State', 'Name', 'File No', 'Conraiss', 'Posting', 'Station', 'Mandate', 'Sort Code', 'Category', 'Rank'];

                let maxMatchCount = 0;

                for (let i = 0; i < Math.min(jsonData.length, 30); i++) { // Check first 30 rows
                    const rowStr = JSON.stringify(jsonData[i]).toLowerCase();
                    let matchCount = 0;
                    knownHeaders.forEach(h => {
                        if (rowStr.includes(h.toLowerCase())) matchCount++;
                    });

                    if (matchCount > maxMatchCount) {
                        maxMatchCount = matchCount;
                        headerRowIndex = i;
                    }
                }

                const headers = jsonData[headerRowIndex].map((h: any) => String(h || '').trim().replace(/\./g, ""));

                // Add "Posted To" Header
                headers.push('Posted To');

                const originalRowCount = jsonData.length - (headerRowIndex + 1);

                const cleanedData: any[] = [];
                // Add Headers
                cleanedData.push(headers);

                // Identify indices for lookup
                const stateIdx = headers.findIndex(h => h.toLowerCase() === 'state');
                const postingIdx = headers.findIndex(h => h.toLowerCase() === 'posting');

                const junkPhrases = [
                    'prof. dantani',
                    'reg/ce',
                    'ssce external',
                    'batch a',
                    'counting & packaging'
                ];

                // Iterate data rows
                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    const rowValues = Array.from(row).map((c: any) => String(c || '').trim());
                    const rowStr = rowValues.join(' ').toLowerCase();

                    // Junk Filter
                    if (junkPhrases.some(phrase => rowStr.includes(phrase))) continue;

                    // Repeated Header Filter
                    let keyHeaderMatches = 0;
                    const keyColumnsToCheck = ['Name', 'File No', 'S/N', 'State', 'Mandate'];
                    keyColumnsToCheck.forEach(keyHeader => {
                        const idx = headers.findIndex(h => h.toLowerCase().includes(keyHeader.toLowerCase()));
                        // Note: headers has 'Posted To' at end, indices should match up to original length
                        if (idx !== -1 && idx < rowValues.length) {
                            if (rowValues[idx].toLowerCase() === headers[idx].toLowerCase()) {
                                keyHeaderMatches++;
                            }
                        }
                    });

                    if (keyHeaderMatches >= 2) continue;

                    // Fallback Repeat Check
                    let totalMatches = 0;
                    rowValues.forEach((val, idx) => {
                        if (idx < headers.length - 1 && headers[idx] && val.toLowerCase() === headers[idx].toLowerCase()) {
                            totalMatches++;
                        }
                    });
                    if (totalMatches > (headers.length - 1) / 2) continue;


                    // Empty Check
                    const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name'));
                    const fileNoIdx = headers.findIndex(h => h.toLowerCase().includes('file no'));

                    if (nameIdx !== -1 && fileNoIdx !== -1) {
                        const nameVal = rowValues[nameIdx];
                        const fileNoVal = rowValues[fileNoIdx];
                        if (!nameVal || !fileNoVal) continue;
                    } else {
                        const nonEmptyCells = rowValues.filter(v => v !== '').length;
                        if (nonEmptyCells === 0) continue;
                    }

                    // Calculate "Posted To"
                    let postedTo = '';
                    if (stateIdx !== -1 && stateIdx < rowValues.length) {
                        const val = rowValues[stateIdx].toLowerCase();
                        if (stateMap[val]) postedTo = stateMap[val];
                    }
                    if (!postedTo && postingIdx !== -1 && postingIdx < rowValues.length) {
                        const val = rowValues[postingIdx].toLowerCase();
                        if (stateMap[val]) postedTo = stateMap[val];
                    }

                    rowValues.push(postedTo);
                    cleanedData.push(rowValues);
                }

                const cleanedRowCount = cleanedData.length - 1;

                // Filter data for CSV Output (only specific columns)
                const targetColumns = ['File No', 'Name', 'Conraiss', 'Station', 'Posted To'];
                const headerIndices = targetColumns.map(col =>
                    headers.findIndex(h => h.toLowerCase() === col.toLowerCase())
                );

                const csvData = cleanedData.map(row =>
                    headerIndices.map(idx => (idx !== -1 && idx < row.length) ? row[idx] : '')
                );

                // Convert filtered data to CSV
                const worksheetOut = XLSX.utils.aoa_to_sheet(csvData);
                const csvOutput = XLSX.utils.sheet_to_csv(worksheetOut);

                // Prepare preview
                const previewKeys = cleanedData[0]; // headers
                const previewRows = cleanedData.slice(1, 201).map(row => {
                    const obj: any = {};
                    previewKeys.forEach((key: string, idx: number) => {
                        obj[key] = row[idx];
                    });
                    return obj;
                });

                resolve({
                    csvContent: csvOutput,
                    preview: previewRows,
                    fileName: file.name.replace(/\.[^/.]+$/, "") + "_cleaned.csv",
                    originalRowCount,
                    cleanedRowCount
                });

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
