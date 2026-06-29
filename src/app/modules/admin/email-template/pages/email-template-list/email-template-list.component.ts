// src/app/modules/admin/email-template/pages/email-template-list/email-template-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { EmailTemplate } from 'src/app/core/models/email-template.model';
import { EmailTemplateService } from 'src/app/core/services/email-template.service';
import { EmailTemplateFormModalComponent } from '../../components/email-template-form-modal/email-template-form-modal.component';

@Component({
  selector: 'app-email-template-list',
  templateUrl: './email-template-list.component.html',
  styleUrls: ['./email-template-list.component.scss']
})
export class EmailTemplateListComponent implements OnInit, OnDestroy {
  templates: EmailTemplate[] = [];
  isLoading = false;
  previewTemplate: EmailTemplate | null = null;
  isPreviewVisible = false;

  private destroy$ = new Subject<void>();

  constructor(
    private templateService: EmailTemplateService,
    private message: NzMessageService,
    private modal: NzModalService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTemplates(): void {
    this.isLoading = true;
    this.templateService.getTemplates()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (templates) => {
          this.templates = templates;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.message.error('Không thể tải danh sách template');
        }
      });
  }

  openCreate(): void {
    const modalRef = this.modal.create({
      nzTitle: 'Tạo template mới',
      nzContent: EmailTemplateFormModalComponent,
      nzWidth: 900,
      nzFooter: null,
      nzComponentParams: { template: null }
    });

    modalRef.afterClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result === 'saved') {
        this.loadTemplates();
        this.message.success('Tạo template thành công!');
      }
    });
  }

  openEdit(template: EmailTemplate): void {
    const modalRef = this.modal.create({
      nzTitle: 'Chỉnh sửa template',
      nzContent: EmailTemplateFormModalComponent,
      nzWidth: 900,
      nzFooter: null,
      nzComponentParams: { template }
    });

    modalRef.afterClose.pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result === 'saved') {
        this.loadTemplates();
        this.message.success('Cập nhật template thành công!');
      }
    });
  }

  openPreview(template: EmailTemplate): void {
    this.previewTemplate = template;
    this.isPreviewVisible = true;
  }

  closePreview(): void {
    this.isPreviewVisible = false;
    this.previewTemplate = null;
  }

  confirmDelete(template: EmailTemplate): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xoá',
      nzContent: `Bạn có chắc muốn xoá template "<strong>${template.name}</strong>"?`,
      nzOkText: 'Xoá',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Huỷ',
      nzOnOk: () => this.deleteTemplate(template)
    });
  }

  private deleteTemplate(template: EmailTemplate): void {
    this.templateService.deleteTemplate(template._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadTemplates();
          this.message.success('Đã xoá template!');
        },
        error: () => this.message.error('Xoá thất bại!')
      });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  previewBodyAsHtml(body: string): string {
    return body.replace(/\n/g, '<br>');
  }
}
