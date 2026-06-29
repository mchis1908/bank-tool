// src/app/shared/utils/excel-parser.util.ts
import * as XLSX from 'xlsx';

/**
 * Đọc file Excel, trả về array các object - key lấy từ dòng header (dòng đầu tiên).
 * Mong đợi cột Excel có tên: Họ tên / Email / SĐT / Công ty / Lương / Tỉnh thành / Ghi chú
 * (không phân biệt hoa thường, sẽ tự chuẩn hoá ở bước map field).
 */
export function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Map 1 dòng raw từ Excel (key tiếng Việt có dấu, không cố định hoa/thường)
 * sang đúng field của Customer model.
 */
export function mapExcelRowToCustomer(raw: any): {
  fullname: string;
  email: string;
  phone: string;
  company: string;
  income: number | null;
  province: string;
  note: string;
} {
  const findKey = (obj: any, candidates: string[]): string => {
    const keys = Object.keys(obj);
    for (const candidate of candidates) {
      const found = keys.find(k => k.trim().toLowerCase() === candidate.toLowerCase());
      if (found) return String(obj[found] ?? '').trim();
    }
    return '';
  };

  const incomeRaw = findKey(raw, ['lương', 'thu nhập', 'income', 'mi']);
  const incomeDigits = incomeRaw.replace(/[^\d]/g, '');

  return {
    fullname: findKey(raw, ['họ tên', 'họ và tên', 'fullname', 'tên']),
    email: findKey(raw, ['email', 'e-mail']).toLowerCase(),
    phone: findKey(raw, ['sđt', 'số điện thoại', 'phone', 'điện thoại']),
    company: findKey(raw, ['công ty', 'company', 'nơi làm việc']),
    income: incomeDigits ? Number(incomeDigits) : null,
    province: findKey(raw, ['tỉnh thành', 'tỉnh/thành', 'province', 'khu vực']),
    note: findKey(raw, ['ghi chú', 'note'])
  };
}