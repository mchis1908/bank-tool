// email-template-form-modal.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { EmailTemplate } from 'src/app/core/models/email-template.model';
import { EmailTemplateService } from 'src/app/core/services/email-template.service';

const AVAILABLE_VARS = ['fullname', 'email', 'phone', 'company', 'province'];

@Component({
  selector: 'app-email-template-form-modal',
  templateUrl: './email-template-form-modal.component.html',
  styleUrls: ['./email-template-form-modal.component.scss']
})
export class EmailTemplateFormModalComponent implements OnInit, OnDestroy {
  @Input() template: EmailTemplate | null = null;

  form!: FormGroup;
  isSaving = false;
  availableVars = AVAILABLE_VARS;

  private destroy$ = new Subject<void>();

  get isEditing(): boolean { return !!this.template; }

  get previewSubject(): string {
    return this.templateService.renderTemplate(
      this.form.get('subject')?.value || '',
      this.sampleData
    );
  }

  get previewBodyHtml(): string {
    const body = this.templateService.renderTemplate(
      this.form.get('body')?.value || '',
      this.sampleData
    );
    return body.replace(/\n/g, '<br>');
  }

  private sampleData: Record<string, string> = {
    fullname: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0987654321',
    company: 'Công ty ABC',
    province: 'Hà Nội'
  };

  constructor(
    private fb: FormBuilder,
    private modalRef: NzModalRef,
    private templateService: EmailTemplateService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.template?.name || '', [Validators.required, Validators.maxLength(100)]],
      subject: [this.template?.subject || '', [Validators.required, Validators.maxLength(200)]],
      body: [this.template?.body || '', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  insertVariable(varName: string): void {
    const bodyCtrl = this.form.get('body');
    if (!bodyCtrl) return;
    const current = bodyCtrl.value as string;
    bodyCtrl.setValue(current + `{{${varName}}}`);
    bodyCtrl.markAsDirty();
  }

  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity({ onlySelf: true });
      });
      return;
    }

    this.isSaving = true;
    const value = this.form.value;
    const variables = this.templateService.extractVariables(value.body + ' ' + value.subject);

    const obs$ = this.isEditing
      ? this.templateService.updateTemplate(this.template!._id, { ...value, variables })
      : this.templateService.createTemplate({ ...value, variables });

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.isSaving = false;
        this.modalRef.close('saved');
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  cancel(): void {
    this.modalRef.close();
  }
}
