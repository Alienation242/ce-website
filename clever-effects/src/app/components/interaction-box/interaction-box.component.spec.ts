import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractionBoxComponent } from './interaction-box.component';

describe('InteractionBoxComponent', () => {
  let component: InteractionBoxComponent;
  let fixture: ComponentFixture<InteractionBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractionBoxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InteractionBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
