// src/app/core/services/currency-formatter.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrencyFormatterService {

  /**
   * Format số thành chuỗi có dấu chấm phân cách hàng nghìn.
   * VD: 1500000 → "1.500.000"
   */
  format(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? value.replace(/\./g, '') : String(value);
    if (num === '' || isNaN(Number(num))) return '';
    return Number(num).toLocaleString('de-DE'); // de-DE dùng dấu . phân nghìn
  }

  /**
   * Parse chuỗi có dấu chấm thành số nguyên.
   * VD: "1.500.000" → 1500000
   */
  parse(value: string | null | undefined): number | null {
    if (!value) return null;
    const cleaned = value.replace(/\./g, '').trim();
    const num = Number(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * Xử lý sự kiện input: giữ cursor đúng vị trí sau khi format.
   * Dùng trực tiếp trong (input) handler của <input>.
   */
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cursorPos = input.selectionStart ?? 0;
    const oldValue = input.value;
    const oldLength = oldValue.length;

    // Chỉ lấy chữ số
    const raw = oldValue.replace(/\./g, '');
    if (raw === '' || isNaN(Number(raw))) {
      input.value = '';
      return;
    }

    const formatted = Number(raw).toLocaleString('de-DE');
    input.value = formatted;

    // Điều chỉnh cursor: đếm số dấu chấm thêm/bớt
    const newLength = formatted.length;
    const delta = newLength - oldLength;
    const newCursor = Math.max(0, cursorPos + delta);
    input.setSelectionRange(newCursor, newCursor);
  }
}
