import { NgModule } from '@angular/core';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@NgModule({
  exports: [
    NzModalModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
  ]
})
export class AntdModule {}