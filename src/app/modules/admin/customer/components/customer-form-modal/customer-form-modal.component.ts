// src/app/modules/admin/customer/components/customer-form-modal/customer-form-modal.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CustomerService } from 'src/app/core/services/customer.service';
import {
  Customer,
  CustomerStatus,
  CUSTOMER_STATUS_LABELS
} from 'src/app/core/models/customer.model';

@Component({
  selector: 'app-customer-form-modal',
  templateUrl: './customer-form-modal.component.html',
  styleUrls: ['./customer-form-modal.component.scss']
})
export class CustomerFormModalComponent implements OnInit {

  @Input() customer: Customer | null = null;

  form!: FormGroup;
  saving = false;

  readonly statusOptions = Object.values(CustomerStatus).map(value => ({
    value,
    label: CUSTOMER_STATUS_LABELS[value]
  }));

  get isEditMode(): boolean {
    return !!this.customer?._id;
  }

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private message: NzMessageService,
    private modalRef: NzModalRef
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      fullname: [this.customer?.fullname || '', Validators.required],
      email: [this.customer?.email || '', [Validators.required, Validators.email]],
      phone: [this.customer?.phone || ''],
      company: [this.customer?.company || ''],
      income: [this.customer?.income ?? null],
      province: [this.customer?.province || ''],
      status: [this.customer?.status || CustomerStatus.NEW, Validators.required],
      note: [this.customer?.note || '']
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const payload: Customer = this.form.value;

    const request$ = this.isEditMode
      ? this.customerService.updateCustomer(this.customer!._id!, payload)
      : this.customerService.createCustomer(payload);

    request$.subscribe({
      next: () => {
        this.message.success(this.isEditMode ? 'Đã cập nhật khách hàng' : 'Đã thêm khách hàng mới');
        this.modalRef.close('saved');
      },
      error: (err) => {
        this.message.error(err?.error?.message || 'Có lỗi xảy ra, vui lòng thử lại');
        this.saving = false;
      }
    });
  }

  onCancel(): void {
    this.modalRef.close();
  }
}