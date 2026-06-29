// src/app/core/models/customer.model.ts

export enum CustomerStatus {
  NEW = 'new',                       // Mới
  CONSULTING = 'consulting',         // Đang tư vấn
  INTERESTED = 'interested',         // Quan tâm
  BORROWED = 'borrowed',             // Đã vay
  NOT_INTERESTED = 'not_interested', // Không quan tâm
  CLOSED = 'closed'                  // Đã đóng hồ sơ
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  [CustomerStatus.NEW]: 'Mới',
  [CustomerStatus.CONSULTING]: 'Đang tư vấn',
  [CustomerStatus.INTERESTED]: 'Quan tâm',
  [CustomerStatus.BORROWED]: 'Đã vay',
  [CustomerStatus.NOT_INTERESTED]: 'Không quan tâm',
  [CustomerStatus.CLOSED]: 'Đã đóng hồ sơ'
};

export interface Customer {
  _id?: string;
  fullname: string;
  email: string;
  phone?: string;
  company?: string;
  income?: number | null;
  province?: string;
  status: CustomerStatus;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerListResponse {
  data: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus | '';
}

// ===== Dùng cho luồng Import Excel =====

export type ImportRowAction = 'create' | 'update' | 'skip';

export interface ImportRow {
  rowIndex: number;          // số dòng trong file Excel (để hiển thị lỗi rõ ràng)
  data: Customer;
  isDuplicate: boolean;      // email đã tồn tại trong DB
  existingCustomer?: Customer; // dữ liệu KH hiện có trong DB (nếu trùng)
  action: ImportRowAction;   // người dùng chọn trên UI preview
  validationErrors: string[]; // lỗi validate (thiếu field bắt buộc, sai định dạng email...)
}

export interface BulkImportRequestRow {
  action: ImportRowAction;
  data: Customer;
  existingId?: string;
}

export interface BulkImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: { email?: string; message: string }[];
}