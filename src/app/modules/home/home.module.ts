import { NzModalModule } from 'ng-zorro-antd/modal';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

// import { HomeRoutingModule
import { LoanInputFormComponent } from './components/loan-input-form/loan-input-form.component';
import { SolutionListComponent } from './components/solution-list/solution-list.component';
import { SolutionCardComponent } from './components/solution-card/solution-card.component';
import { HomeComponent } from './pages/home.component';
import { HomeRoutingModule } from './home-routing.module';
import { SharedModule } from 'src/app/core/services/shared.module';
import { AmortizationTableComponent } from './components/amortization-table/amortization-table.component';
import { AntdModule } from 'src/app/shared/antd.module';
@NgModule({
  declarations: [
    HomeComponent,
    LoanInputFormComponent,
    SolutionListComponent,
    SolutionCardComponent,
    AmortizationTableComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HomeRoutingModule,
    SharedModule,
    AntdModule,
    NzModalModule
  ]
})
export class HomeModule {}
