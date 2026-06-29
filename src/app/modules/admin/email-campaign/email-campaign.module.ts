// src/app/modules/admin/email-campaign/email-campaign.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { EmailCampaignRoutingModule } from './email-campaign-routing.module';
import { AntdModule } from 'src/app/shared/antd.module';

import { EmailCampaignComponent } from './pages/email-campaign/email-campaign.component';

@NgModule({
  declarations: [
    EmailCampaignComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    EmailCampaignRoutingModule,
    AntdModule
  ]
})
export class EmailCampaignModule {}
