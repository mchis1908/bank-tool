// src/app/modules/admin/customer/pages/customer-list/customer-list.component.ts
import { Component, OnInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CustomerService } from 'src/app/core/services/customer.service';
import {
  Customer,
  CustomerStatus,
  CUSTOMER_STATUS_LABELS
} from 'src/app/core/models/customer.model';
import { CustomerFormModalComponent } from '../../components/customer-form-modal/customer-form-modal.component';
import { CustomerImportComponent } from '../../components/customer-import/customer-import.component';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss']
})
export class CustomerListComponent implements OnInit {

  customers: Customer[] = [];
  loading = false;

  page = 1;
  limit = 20;
  total = 0;

  search = '';
  statusFilter: CustomerStatus | '' = '';

  readonly statusOptions = Object.values(CustomerStatus).map(value => ({
    value,
    label: CUSTOMER_STATUS_LABELS[value]
  }));

  readonly statusLabels = CUSTOMER_STATUS_LABELS;

  private searchDebounceTimer: any;

  constructor(
    private customerService: CustomerService,
    private modal: NzModalService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.customerService.getCustomers({
      page: this.page,
      limit: this.limit,
      search: this.search,
      status: this.statusFilter
    }).subscribe({
      next: (res) => {
        this.customers = res.data;
        this.total = res.pagination.total;
        this.loading = false;
      },
      error: () => {
        this.message.error('Không tải được danh sách khách hàng');
        this.loading = false;
      }
    });
  }

  onSearchChange(value: string): void {
    this.search = value;
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.page = 1;
      this.loadCustomers();
    }, 400);
  }

  onStatusFilterChange(): void {
    this.page = 1;
    this.loadCustomers();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadCustomers();
  }

  openCreateModal(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Thêm khách hàng mới',
      nzContent: CustomerFormModalComponent,
      nzComponentParams: { customer: null },
      nzFooter: null,
      nzWidth: 600
    });

    modalRef.afterClose.subscribe((result) => {
      if (result === 'saved') {
        this.loadCustomers();
      }
    });
  }

  openEditModal(customer: Customer): void {
    const modalRef = this.modal.create({
      nzTitle: 'Cập nhật khách hàng',
      nzContent: CustomerFormModalComponent,
      nzComponentParams: { customer },
      nzFooter: null,
      nzWidth: 600
    });

    modalRef.afterClose.subscribe((result) => {
      if (result === 'saved') {
        this.loadCustomers();
      }
    });
  }

  deleteCustomer(customer: Customer): void {
    if (!customer._id) return;
    this.customerService.deleteCustomer(customer._id).subscribe({
      next: () => {
        this.message.success('Đã xoá khách hàng');
        this.loadCustomers();
      },
      error: () => this.message.error('Xoá thất bại')
    });
  }

  openImportModal(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Import khách hàng từ Excel',
      nzContent: CustomerImportComponent,
      nzFooter: null,
      nzWidth: 900,
      nzMaskClosable: false
    });

    modalRef.afterClose.subscribe((result) => {
      if (result === 'imported') {
        this.loadCustomers();
      }
    });
  }

  formatIncome(income: number | null | undefined): string {
    if (!income) return '—';
    return income.toLocaleString('vi-VN') + ' đ';
  }

  statusColor(status: CustomerStatus): string {
    const colorMap: Record<CustomerStatus, string> = {
      [CustomerStatus.NEW]: 'blue',
      [CustomerStatus.CONSULTING]: 'gold',
      [CustomerStatus.INTERESTED]: 'green',
      [CustomerStatus.BORROWED]: 'purple',
      [CustomerStatus.NOT_INTERESTED]: 'default',
      [CustomerStatus.CLOSED]: 'red'
    };
    return colorMap[status] || 'default';
  }
}