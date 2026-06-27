// src/app/shared/directives/vnd-input.directive.ts
import { Directive, ElementRef, HostListener, OnInit, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: 'input[appVndInput]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VndInputDirective),
      multi: true
    }
  ]
})
export class VndInputDirective implements ControlValueAccessor, OnInit {

  private onChange: (val: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngOnInit(): void {
    this.el.nativeElement.type = 'text';
    this.el.nativeElement.inputMode = 'numeric';
    this.el.nativeElement.autocomplete = 'off';
  }

  @HostListener('input')
  onInput(): void {
    const input = this.el.nativeElement;
    const cursorPos = input.selectionStart ?? 0;
    const oldLength = input.value.length;

    const digitsOnly = input.value.replace(/\D/g, '');

    if (digitsOnly === '') {
      input.value = '';
      this.onChange(null);
      return;
    }

    const formatted = this.formatVND(digitsOnly);
    input.value = formatted;

    const delta = formatted.length - oldLength;
    const newCursor = Math.max(0, cursorPos + delta);
    input.setSelectionRange(newCursor, newCursor);

    this.onChange(Number(digitsOnly));
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: number | null): void {
    this.el.nativeElement.value = value != null
      ? this.formatVND(String(value))
      : '';
  }

  registerOnChange(fn: (val: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  /**
   * Format chuỗi chỉ gồm chữ số thành dạng phân cách nghìn bằng dấu chấm.
   * Dùng regex thay toLocaleString để tránh làm tròn số lớn.
   * VD: "1500000000" → "1.500.000.000"
   */
  private formatVND(digits: string): string {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
}