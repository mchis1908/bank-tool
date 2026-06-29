// src/app/modules/admin/email-campaign/email-campaign-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmailCampaignComponent } from './pages/email-campaign/email-campaign.component';

const routes: Routes = [
  { path: '', component: EmailCampaignComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmailCampaignRoutingModule {}
