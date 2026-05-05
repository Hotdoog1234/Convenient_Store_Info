import * as XLSX from 'xlsx';

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet1 = workbook.SheetNames[0];
        const sheet2 = workbook.SheetNames[1];
        const tankData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet1]);
        const ownerData = XLSX.utils.sheet_to_json(workbook.Sheets[sheet2]);
        resolve({ tankData, ownerData });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
