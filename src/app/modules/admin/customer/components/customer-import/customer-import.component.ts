// src/app/modules/admin/customer/components/customer-import/customer-import.component.ts
import { Component } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { CustomerService } from 'src/app/core/services/customer.service';
import { CustomerStatus } from 'src/app/core/models/customer.model';
import { ImportRow, ImportRowAction, BulkImportRequestRow, BulkImportResult } from 'src/app/core/models/customer.model';
import { parseExcelFile, mapExcelRowToCustomer } from 'src/app/shared/utils/excel-parser.util';

@Component({
  selector: 'app-customer-import',
  templateUrl: './customer-import.component.html',
  styleUrls: ['./customer-import.component.scss']
})
export class CustomerImportComponent {

  currentStep = 0; // 0: Tải file, 1: Xử lý trùng lặp, 2: Kết quả

  parsing = false;
  checkingDuplicates = false;
  importing = false;

  rows: ImportRow[] = [];
  importResult: BulkImportResult | null = null;

  get validRowsCount(): number {
    return this.rows.filter((r:any) => r.validationErrors.length === 0).length;
  }

  get invalidRowsCount(): number {
    return this.rows.filter((r:any) => r.validationErrors.length > 0).length;
  }

  get duplicateCount(): number {
    return this.rows.filter((r:any) => r.isDuplicate).length;
  }

  get newCount(): number {
    return this.rows.filter((r:any) => !r.isDuplicate && r.validationErrors.length === 0).length;
  }

  constructor(
    private customerService: CustomerService,
    private message: NzMessageService,
    private modalRef: NzModalRef
  ) {}

  // ===== Step 0: Tải file + Validate =====

  beforeUpload = (file: NzUploadFile): boolean => {
    this.handleFile(file as unknown as File);
    return false; // chặn ng-zorro tự upload lên server, mình tự xử lý
  };

  private async handleFile(file: File): Promise<void> {
    this.parsing = true;
    try {
      const rawRows = await parseExcelFile(file);

      if (rawRows.length === 0) {
        this.message.warning('File không có dữ liệu');
        this.parsing = false;
        return;
      }

      this.rows = rawRows.map((raw, index) => {
        const mapped = mapExcelRowToCustomer(raw);
        const errors = this.validateRow(mapped);

        return {
          rowIndex: index + 2, // +2 vì dòng 1 là header, Excel đếm từ 1
          data: { ...mapped, status: CustomerStatus.NEW },
          isDuplicate: false,
          action: 'create' as ImportRowAction,
          validationErrors: errors
        } as ImportRow;
      });

      this.parsing = false;
      this.message.success(`Đã đọc ${this.rows.length} dòng từ file`);
    } catch (err) {
      this.parsing = false;
      this.message.error('Không đọc được file. Vui lòng kiểm tra định dạng Excel.');
    }
  }

  private validateRow(data: { fullname: string; email: string }): string[] {
    const errors: string[] = [];
    if (!data.fullname) errors.push('Thiếu họ tên');
    if (!data.email) {
      errors.push('Thiếu email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Email không hợp lệ');
    }
    return errors;
  }

  removeRow(row: ImportRow): void {
    this.rows = this.rows.filter((r:any) => r !== row);
  }

  goToCheckDuplicates(): void {
    const validRows = this.rows.filter((r:any) => r.validationErrors.length === 0);
    if (validRows.length === 0) {
      this.message.warning('Không có dòng hợp lệ nào để import');
      return;
    }

    // Loại bỏ các dòng lỗi khỏi danh sách xử lý tiếp
    this.rows = validRows;

    this.checkingDuplicates = true;
    const emails = this.rows.map((r:any) => r.data.email);

    this.customerService.checkDuplicates(emails).subscribe({
      next: (res:any) => {
        const existingMap = new Map(res.duplicates.map((c:any) => [c.email.toLowerCase(), c]));

        this.rows = this.rows.map((row:any) => {
          const existing = existingMap.get(row.data.email.toLowerCase());
          if (existing) {
            return {
              ...row,
              isDuplicate: true,
              existingCustomer: existing,
              action: 'skip' as ImportRowAction // mặc định an toàn: bỏ qua, để nhân viên tự chọn lại nếu muốn
            };
          }
          return row;
        });

        this.checkingDuplicates = false;
        this.currentStep = 1;
      },
      error: () => {
        this.checkingDuplicates = false;
        this.message.error('Không kiểm tra được trùng lặp, vui lòng thử lại');
      }
    });
  }

  // ===== Step 1: Xử lý trùng lặp =====

  setRowAction(row: ImportRow, action: ImportRowAction): void {
    row.action = action;
  }

  goToImport(): void {
    this.doImport();
  }

  private doImport(): void {
    this.importing = true;

    const payload: BulkImportRequestRow[] = this.rows.map((row:any) => ({
      action: row.action,
      data: row.data,
      existingId: row.isDuplicate ? row.existingCustomer?._id : undefined
    }));

    this.customerService.bulkImport(payload).subscribe({
      next: (result:any) => {
        this.importResult = result;
        this.importing = false;
        this.currentStep = 2;
      },
      error: () => {
        this.importing = false;
        this.message.error('Import thất bại, vui lòng thử lại');
      }
    });
  }

  // ===== Step 2: Kết quả =====

  finish(): void {
    this.modalRef.close('imported');
  }

  backToUpload(): void {
    this.rows = [];
    this.importResult = null;
    this.currentStep = 0;
  }
}