// src/app/modules/admin/email-template/email-template.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { EmailTemplateRoutingModule } from './email-template-routing.module';
import { AntdModule } from 'src/app/shared/antd.module';

import { EmailTemplateListComponent } from './pages/email-template-list/email-template-list.component';
import { EmailTemplateFormModalComponent } from './components/email-template-form-modal/email-template-form-modal.component';

@NgModule({
  declarations: [
    EmailTemplateListComponent,
    EmailTemplateFormModalComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    EmailTemplateRoutingModule,
    AntdModule
  ]
})
export class EmailTemplateModule {}
