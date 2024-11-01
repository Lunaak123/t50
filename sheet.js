let excelData = []; // Placeholder for Excel data
let currentSheetName = ''; // Placeholder for the current sheet name

// Load the Google Sheets file when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fileUrl = urlParams.get('fileUrl');

    if (fileUrl) {
        await loadExcelData(fileUrl);
    }
});

// Function to load Excel data
async function loadExcelData(url) {
    const response = await fetch(url);
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    excelData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
    displayData(excelData);
}

// Function to display data in the table
function displayData(data) {
    const sheetContent = document.getElementById('sheet-content');
    sheetContent.innerHTML = '';

    const table = document.createElement('table');
    data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach((cell, cellIndex) => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
    sheetContent.appendChild(table);
}

// Highlight data based on selections
function highlightData() {
    const primaryColumn = document.getElementById('primary-column').value.trim().toUpperCase();
    const operationColumns = document.getElementById('operation-columns').value.trim().toUpperCase().split(',');
    const operationType = document.getElementById('operation-type').value;
    const operation = document.getElementById('operation').value;

    const table = document.querySelector('table');
    if (!table) return;

    const rows = table.querySelectorAll('tr');

    rows.forEach((row, rowIndex) => {
        const primaryCell = row.cells[primaryColumn.charCodeAt(0) - 65]; // Convert column letter to index
        const shouldHighlight = checkOperation(rowIndex, primaryCell, operationColumns, operation, operationType);

        if (shouldHighlight) {
            row.style.backgroundColor = '#d1e7dd'; // Highlight color
        } else {
            row.style.backgroundColor = ''; // Reset color
        }
    });
}

// Check the operation condition
function checkOperation(rowIndex, primaryCell, operationColumns, operation, operationType) {
    const primaryValue = primaryCell.textContent.trim();

    if (operationType === 'and') {
        return operationColumns.every(col => {
            const colCell = primaryCell.parentNode.cells[col.charCodeAt(0) - 65]; // Get cell for operation
            const colValue = colCell.textContent.trim();
            return operation === 'null' ? !colValue : colValue !== '';
        });
    } else if (operationType === 'or') {
        return operationColumns.some(col => {
            const colCell = primaryCell.parentNode.cells[col.charCodeAt(0) - 65]; // Get cell for operation
            const colValue = colCell.textContent.trim();
            return operation === 'null' ? !colValue : colValue !== '';
        });
    }
    return false;
}

// Download functionality
document.getElementById('download-button').addEventListener('click', () => {
    document.getElementById('download-modal').style.display = 'flex';
});

// Confirm download button
document.getElementById('confirm-download').addEventListener('click', () => {
    const filename = document.getElementById('filename').value || 'downloaded_file';
    const format = document.getElementById('file-format').value;

    // Download logic based on format
    if (format === 'xlsx') {
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, currentSheetName);
        XLSX.writeFile(wb, `${filename}.xlsx`);
    } else if (format === 'csv') {
        const csvContent = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(excelData));
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    document.getElementById('download-modal').style.display = 'none';
});

// Close modal
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('download-modal').style.display = 'none';
});

let data = [];
let filteredData = [];

// Load Excel Sheet
async function loadExcelSheet(fileUrl) {
    try {
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        data = XLSX.utils.sheet_to_json(sheet, { defval: null });
        filteredData = [...data];
        displaySheet(filteredData);
    } catch (error) {
        console.error("Error loading Excel sheet:", error);
    }
}

// Display Sheet
function displaySheet(sheetData) {
    const sheetContentDiv = document.getElementById('sheet-content');
    sheetContentDiv.innerHTML = '';

    if (sheetData.length === 0) {
        sheetContentDiv.innerHTML = '<p>No data available.</p>';
        return;
    }

    const table = document.createElement('table');
    const headerRow = document.createElement('tr');

    // Create header
    Object.keys(sheetData[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    // Create data rows
    sheetData.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    sheetContentDiv.appendChild(table);
}

// Apply Operation
document.getElementById('apply-operation').addEventListener('click', () => {
    const rowRange = document.getElementById('row-range').value;
    const [from, to] = rowRange.split('-').map(Number);

    // Check for valid range
    if (isNaN(from) || isNaN(to) || from < 1 || to < from || to > data.length) {
        alert('Invalid row range. Please enter a valid range like "1-10".');
        return;
    }

    // Highlight rows in the specified range
    highlightRows(from - 1, to); // Adjust for zero-based index
});

// Highlight Rows
function highlightRows(from, to) {
    const rows = document.querySelectorAll('#sheet-content table tr');
    rows.forEach((row, index) => {
        if (index >= from && index <= to) {
            row.style.backgroundColor = 'lightyellow';
        } else {
            row.style.backgroundColor = '';
        }
    });
}
