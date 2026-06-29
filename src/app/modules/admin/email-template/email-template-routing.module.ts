// src/app/modules/admin/email-template/email-template-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailTemplateListComponent } from './pages/email-template-list/email-template-list.component';

const routes: Routes = [
  { path: '', component: EmailTemplateListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmailTemplateRoutingModule {}
