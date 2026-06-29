// src/app/modules/admin/customer/customer.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { CustomerRoutingModule } from './customer-routing.module';
import { AntdModule } from 'src/app/shared/antd.module';
import { SharedModule } from 'src/app/core/services/shared.module'; // chứa VndInputDirective

import { CustomerListComponent } from './pages/customer-list/customer-list.component';
import { CustomerFormModalComponent } from './components/customer-form-modal/customer-form-modal.component';
import { CustomerImportComponent } from './components/customer-import/customer-import.component';

@NgModule({
  declarations: [
    CustomerListComponent,
    CustomerFormModalComponent,
    CustomerImportComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    CustomerRoutingModule,
    AntdModule,
    SharedModule
  ]
})
export class CustomerModule {}