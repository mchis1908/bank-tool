import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { AntdModule } from 'src/app/shared/antd.module';

@NgModule({
  declarations: [
    AdminLayoutComponent,
    LoginComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule,
    AntdModule
  ]
})
export class AdminModule {}