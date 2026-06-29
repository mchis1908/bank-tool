// src/app/core/services/customer.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  Customer,
  CustomerListResponse,
  CustomerQueryParams,
  BulkImportRequestRow,
  BulkImportResult
} from '../models/customer.model';

@Injectable({ providedIn: 'root' })
export class CustomerService {

  private readonly baseUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  getCustomers(params: CustomerQueryParams = {}): Observable<CustomerListResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<CustomerListResponse>(this.baseUrl, { params: httpParams });
  }

  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  createCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, customer);
  }

  updateCustomer(id: string, customer: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.baseUrl}/${id}`, customer);
  }

  deleteCustomer(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  /**
   * Gửi danh sách email lên backend để kiểm tra trùng với KH đã có trong DB.
   * Dùng trong bước Preview của luồng Import Excel.
   */
  checkDuplicates(emails: string[]): Observable<{ duplicates: Customer[] }> {
    return this.http.post<{ duplicates: Customer[] }>(`${this.baseUrl}/check-duplicates`, { emails });
  }

  /**
   * Gửi danh sách dòng đã được người dùng xác nhận hành động (create/update/skip)
   * để backend xử lý import thật vào DB.
   */
  bulkImport(rows: BulkImportRequestRow[]): Observable<BulkImportResult> {
    return this.http.post<BulkImportResult>(`${this.baseUrl}/bulk-import`, { rows });
  }
}