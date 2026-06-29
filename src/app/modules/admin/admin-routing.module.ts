// src/app/modules/admin/admin-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { LoginComponent } from './login/login.component';
import { AdminAuthGuard } from './guards/admin-auth.guard';

const routes: Routes = [

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [AdminAuthGuard],
    children: [

      {
        path: 'customer',
        loadChildren: () =>
          import('./customer/customer.module')
            .then(m => m.CustomerModule)
      },

      {
        path: 'email-template',
        loadChildren: () =>
          import('./email-template/email-template.module')
            .then(m => m.EmailTemplateModule)
      },

      {
        path: 'campaign',
        loadChildren: () =>
          import('./email-campaign/email-campaign.module')
            .then(m => m.EmailCampaignModule)
      },

      {
        path: '',
        redirectTo: 'customer',
        pathMatch: 'full'
      }

    ]
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule {}