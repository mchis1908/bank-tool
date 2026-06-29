// src/app/modules/admin/email-campaign/pages/email-campaign/email-campaign.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';

import { EmailTemplate, EmailSendResult, CampaignSummary, CampaignPhase } from 'src/app/core/models/email-template.model';
import { Customer, CustomerStatus, CUSTOMER_STATUS_LABELS, CustomerQueryParams } from 'src/app/core/models/customer.model';
import { EmailTemplateService } from 'src/app/core/services/email-template.service';
import { EmailCampaignService } from 'src/app/core/services/email-campaign.service';
import { CustomerService } from 'src/app/core/services/customer.service';

@Component({
  selector: 'app-email-campaign',
  templateUrl: './email-campaign.component.html',
  styleUrls: ['./email-campaign.component.scss']
})
export class EmailCampaignComponent implements OnInit, OnDestroy {

  // ======== Wizard State ========
  currentStep = 0;

  // ======== Step 1: Templates ========
  templates: EmailTemplate[] = [];
  selectedTemplate: EmailTemplate | null = null;
  isLoadingTemplates = false;

  // ======== Step 2: Customers ========
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  selectedCustomerIds = new Set<string>();
  isLoadingCustomers = false;
  searchText = '';
  filterStatus: CustomerStatus | '' = '';
  isPreviewEmailVisible = false;

  readonly statusOptions: { label: string; value: CustomerStatus | '' }[] = [
    { label: 'Tất cả trạng thái', value: '' },
    ...Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => ({
      label, value: value as CustomerStatus
    }))
  ];

  // ======== Step 3: Sending ========
  campaignPhase: CampaignPhase = 'idle';
  sendResults: EmailSendResult[] = [];
  summary: CampaignSummary = { total: 0, success: 0, fail: 0, pending: 0 };

  // Retry
  selectedForRetry = new Set<string>();
  isRetrying = false;
  retryResults: EmailSendResult[] = [];
  isAllRetrySelected = false;
  isRetryDone = false;

  // Filter result table
  resultFilter: 'all' | 'success' | 'fail' = 'all';

  private destroy$ = new Subject<void>();

  constructor(
    private templateService: EmailTemplateService,
    private campaignService: EmailCampaignService,
    private customerService: CustomerService,
    private message: NzMessageService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    this.loadCustomers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ===================================================
  // STEP 1: Template selection
  // ===================================================
  loadTemplates(): void {
    this.isLoadingTemplates = true;
    this.templateService.getTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tpls) => { this.templates = tpls; this.isLoadingTemplates = false; },
        error: () => { this.isLoadingTemplates = false; }
      });
  }

  selectTemplate(tpl: EmailTemplate): void {
    this.selectedTemplate = tpl;
  }

  // ===================================================
  // STEP 2: Customer selection
  // ===================================================
  loadCustomers(): void {
    this.isLoadingCustomers = true;
    this.customerService.getCustomers({ limit: 999 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.customers = res.data;
          this.applyFilter();
          this.isLoadingCustomers = false;
        },
        error: () => { this.isLoadingCustomers = false; }
      });
  }

  applyFilter(): void {
    this.filteredCustomers = this.customers.filter(c => {
      const matchSearch = !this.searchText ||
        c.fullname.toLowerCase().includes(this.searchText.toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchText.toLowerCase());
      const matchStatus = !this.filterStatus || c.status === this.filterStatus;
      return matchSearch && matchStatus;
    });
  }

  toggleCustomer(customerId: string, checked: boolean): void {
    if (checked) {
      this.selectedCustomerIds.add(customerId);
    } else {
      this.selectedCustomerIds.delete(customerId);
    }
  }

  selectAllVisible(checked: boolean): void {
    this.filteredCustomers.forEach(c => {
      if (c._id) {
        if (checked) this.selectedCustomerIds.add(c._id);
        else this.selectedCustomerIds.delete(c._id);
      }
    });
  }

  get isAllVisibleSelected(): boolean {
    return this.filteredCustomers.length > 0 &&
      this.filteredCustomers.every(c => c._id && this.selectedCustomerIds.has(c._id));
  }

  get isIndeterminate(): boolean {
    const sel = this.filteredCustomers.filter(c => c._id && this.selectedCustomerIds.has(c._id));
    return sel.length > 0 && sel.length < this.filteredCustomers.length;
  }

  get selectedCount(): number { return this.selectedCustomerIds.size; }

  get selectedCustomers(): Customer[] {
    return this.customers.filter(c => c._id && this.selectedCustomerIds.has(c._id));
  }

  get previewCustomer(): Customer | null {
    return this.selectedCustomers[0] || null;
  }

  get previewSubject(): string {
    if (!this.selectedTemplate || !this.previewCustomer) return '';
    return this.campaignService.renderEmailSubject(this.selectedTemplate, this.previewCustomer);
  }

  get previewBodyHtml(): string {
    if (!this.selectedTemplate || !this.previewCustomer) return '';
    return this.campaignService.renderEmailBody(this.selectedTemplate, this.previewCustomer)
      .replace(/\n/g, '<br>');
  }

  getStatusLabel(status: CustomerStatus): string {
    return CUSTOMER_STATUS_LABELS[status] || status;
  }

  getStatusColor(status: CustomerStatus): string {
    const map: Record<CustomerStatus, string> = {
      [CustomerStatus.NEW]: 'blue',
      [CustomerStatus.CONSULTING]: 'orange',
      [CustomerStatus.INTERESTED]: 'cyan',
      [CustomerStatus.BORROWED]: 'green',
      [CustomerStatus.NOT_INTERESTED]: 'red',
      [CustomerStatus.CLOSED]: 'default',
    };
    return map[status] || 'default';
  }

  // ===================================================
  // STEP 3: Send campaign
  // ===================================================
  get progressPercent(): number {
    if (this.summary.total === 0) return 0;
    const done = this.summary.success + this.summary.fail;
    return Math.round((done / this.summary.total) * 100);
  }

  get filteredResults(): EmailSendResult[] {
    if (this.resultFilter === 'success') return this.sendResults.filter(r => r.status === 'success');
    if (this.resultFilter === 'fail') return this.sendResults.filter(r => r.status === 'fail');
    return this.sendResults;
  }

  get failedResults(): EmailSendResult[] {
    return this.sendResults.filter(r => r.status === 'fail');
  }

  startSendCampaign(): void {
    if (!this.selectedTemplate || this.selectedCount === 0) {
      this.message.warning('Vui lòng chọn template và khách hàng!');
      return;
    }

    const customers = this.selectedCustomers;
    this.campaignPhase = 'sending';
    this.sendResults = customers.map(c => ({
      customerId: c._id || '',
      email: c.email,
      fullname: c.fullname,
      status: 'pending'
    }));
    this.summary = { total: customers.length, success: 0, fail: 0, pending: customers.length };
    this.selectedForRetry.clear();
    this.retryResults = [];
    this.isRetryDone = false;

    this.campaignService.sendCampaign(this.selectedTemplate, customers)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => this.handleResult(result),
        complete: () => {
          this.campaignPhase = 'done';
          this.message.success(`Gửi xong! ✅ ${this.summary.success} thành công, ❌ ${this.summary.fail} thất bại.`);
        },
        error: () => {
          this.campaignPhase = 'done';
          this.message.error('Có lỗi xảy ra trong quá trình gửi!');
        }
      });
  }

  private handleResult(result: EmailSendResult): void {
    const idx = this.sendResults.findIndex(r => r.email === result.email);
    if (idx !== -1) {
      this.sendResults[idx] = { ...result };
    }
    if (result.status === 'success') {
      this.summary.success++;
      this.summary.pending--;
    } else if (result.status === 'fail') {
      this.summary.fail++;
      this.summary.pending--;
    }
  }

  // Retry
  toggleRetrySelect(email: string, checked: boolean): void {
    if (checked) this.selectedForRetry.add(email);
    else this.selectedForRetry.delete(email);
    this.updateAllRetrySelected();
  }

  toggleAllRetry(checked: boolean): void {
    this.isAllRetrySelected = checked;
    if (checked) {
      this.failedResults.forEach(r => this.selectedForRetry.add(r.email));
    } else {
      this.selectedForRetry.clear();
    }
  }

  private updateAllRetrySelected(): void {
    this.isAllRetrySelected = this.failedResults.length > 0 &&
      this.failedResults.every(r => this.selectedForRetry.has(r.email));
  }

  get isRetryIndeterminate(): boolean {
    const sel = this.failedResults.filter(r => this.selectedForRetry.has(r.email));
    return sel.length > 0 && sel.length < this.failedResults.length;
  }

  get retryCount(): number { return this.selectedForRetry.size; }

  retrySend(): void {
    if (!this.selectedTemplate || this.retryCount === 0) return;

    const retryCustomers = this.customers.filter(c =>
      c.email && this.selectedForRetry.has(c.email)
    );

    this.isRetrying = true;
    this.isRetryDone = false;
    this.retryResults = [];

    // reset retry targets to pending
    retryCustomers.forEach(c => {
      const idx = this.sendResults.findIndex(r => r.email === c.email);
      if (idx !== -1 && this.sendResults[idx].status === 'fail') {
        this.sendResults[idx] = { ...this.sendResults[idx], status: 'pending', error: undefined };
        this.summary.fail--;
        this.summary.pending++;
      }
    });

    this.campaignService.sendCampaign(this.selectedTemplate, retryCustomers, 2)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.handleResult(result);
          this.retryResults.push(result);
        },
        complete: () => {
          this.isRetrying = false;
          this.isRetryDone = true;
          this.selectedForRetry.clear();
          this.isAllRetrySelected = false;
          const retrySuccess = this.retryResults.filter(r => r.status === 'success').length;
          const retryFail = this.retryResults.filter(r => r.status === 'fail').length;
          this.message.success(`Gửi lại xong! ✅ ${retrySuccess} thành công, ❌ ${retryFail} thất bại.`);
        },
        error: () => {
          this.isRetrying = false;
          this.message.error('Có lỗi xảy ra khi gửi lại!');
        }
      });
  }

  // ===================================================
  // Navigation
  // ===================================================
  goToStep(step: number): void {
    if (step === 1 && !this.selectedTemplate) {
      this.message.warning('Vui lòng chọn template trước!');
      return;
    }
    if (step === 2 && this.selectedCount === 0) {
      this.message.warning('Vui lòng chọn ít nhất 1 khách hàng!');
      return;
    }
    this.currentStep = step;
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  nextStep(): void {
    if (this.currentStep === 0 && !this.selectedTemplate) {
      this.message.warning('Vui lòng chọn template!');
      return;
    }
    if (this.currentStep === 1 && this.selectedCount === 0) {
      this.message.warning('Vui lòng chọn ít nhất 1 khách hàng!');
      return;
    }
    if (this.currentStep < 2) this.currentStep++;
  }

  resetCampaign(): void {
    this.currentStep = 0;
    this.selectedTemplate = null;
    this.selectedCustomerIds.clear();
    this.sendResults = [];
    this.campaignPhase = 'idle';
    this.summary = { total: 0, success: 0, fail: 0, pending: 0 };
    this.selectedForRetry.clear();
    this.retryResults = [];
    this.isRetryDone = false;
    this.resultFilter = 'all';
  }
}
