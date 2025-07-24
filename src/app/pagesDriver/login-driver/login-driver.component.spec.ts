import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoginDriverComponent } from './login-driver.component';

describe('LoginDriverComponent', () => {
  let component: LoginDriverComponent;
  let fixture: ComponentFixture<LoginDriverComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LoginDriverComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginDriverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
