import * as XLSX from 'xlsx';

// Read only sheet names — fast, no cell parsing, safe for large files
export const getSheetNames = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', bookSheets: true });
        resolve(workbook.SheetNames);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// Parse two specific named sheets from the file
export const parseExcelFile = (file, tankSheet, ownerSheet) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const tankData  = XLSX.utils.sheet_to_json(workbook.Sheets[tankSheet]);
        const ownerData = XLSX.utils.sheet_to_json(workbook.Sheets[ownerSheet]);
        resolve({ tankData, ownerData });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
