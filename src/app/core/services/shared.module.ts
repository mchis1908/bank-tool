// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VndInputDirective } from './vnd-input.directive';

@NgModule({
  declarations: [VndInputDirective],
  imports: [CommonModule],
  exports: [VndInputDirective]
})
export class SharedModule {}
