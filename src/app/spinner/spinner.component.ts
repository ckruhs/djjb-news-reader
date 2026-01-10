import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'ck-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class SpinnerComponent {
  constructor() { }
}
