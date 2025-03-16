import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpinnerComponent } from './spinner.component';

describe('SpinnerComponent', () => {
  let component: SpinnerComponent;
  let fixture: ComponentFixture<SpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SpinnerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render spinner with correct dimensions', () => {
    const svg = fixture.nativeElement.querySelector('svg.spinner');
    expect(svg).toBeTruthy();
    expect(svg.getAttribute('width')).toBe('65px');
    expect(svg.getAttribute('height')).toBe('65px');
  });

  it('should have correct wrapper class and margin', () => {
    const wrapper = fixture.nativeElement.querySelector('.spinner-wrapper');
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.marginTop).toBe('20px');
  });

  it('should render circle with correct attributes', () => {
    const circle = fixture.nativeElement.querySelector('circle.path');
    expect(circle).toBeTruthy();
    expect(circle.getAttribute('cx')).toBe('33');
    expect(circle.getAttribute('cy')).toBe('33');
    expect(circle.getAttribute('r')).toBe('30');
    expect(circle.getAttribute('stroke-width')).toBe('6');
  });
});