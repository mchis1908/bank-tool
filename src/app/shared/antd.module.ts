// src/app/shared/antd.module.ts
import { NgModule } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';

const MODULES = [
  NzModalModule,
  NzTableModule,
  NzButtonModule,
  NzIconModule,
  NzSelectModule,
  NzInputModule,
  NzStepsModule,
  NzUploadModule,
  NzTagModule,
  NzPopconfirmModule,
  NzFormModule,
  NzGridModule,
  NzSpinModule,
  NzEmptyModule,
  NzAlertModule,
  NzMessageModule,
  NzProgressModule,
  NzCheckboxModule,
  NzDividerModule,
  NzToolTipModule,
  NzBadgeModule,
  NzResultModule,
  NzTabsModule,
  NzCardModule,
  NzStatisticModule,
  NzRadioModule,
  NzInputNumberModule,
  NzDropDownModule,
  NzPageHeaderModule,
  NzDescriptionsModule,
];

@NgModule({
  exports: MODULES
})
export class AntdModule {}