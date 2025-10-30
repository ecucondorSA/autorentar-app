/* eslint-disable @typescript-eslint/unbound-method -- Test file with Jasmine spies */
import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let compiled: HTMLElement;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: Router, useValue: routerSpyObj },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Structure', () => {
    it('should have a form with data-testid="login-form"', () => {
      const form = compiled.querySelector('form[data-testid="login-form"]');
      expect(form).toBeTruthy();
    });

    it('should have email input with data-testid="email-input"', () => {
      const emailInput = compiled.querySelector(
        'ion-input[data-testid="email-input"]'
      );
      expect(emailInput).toBeTruthy();
    });

    it('should have password input with data-testid="password-input"', () => {
      const passwordInput = compiled.querySelector(
        'ion-input[data-testid="password-input"]'
      );
      expect(passwordInput).toBeTruthy();
    });

    it('should have submit button with data-testid="submit-login"', () => {
      const submitButton = compiled.querySelector(
        'ion-button[data-testid="submit-login"]'
      );
      expect(submitButton).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should have email field required', () => {
      const emailControl = component.form.get('email');
      expect(emailControl?.hasError('required')).toBe(true);

      emailControl?.setValue('test@example.com');
      expect(emailControl?.hasError('required')).toBe(false);
    });

    it('should validate email format', () => {
      const emailControl = component.form.get('email');

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);

      emailControl?.setValue('valid@example.com');
      expect(emailControl?.hasError('email')).toBe(false);
    });

    it('should have password field required', () => {
      const passwordControl = component.form.get('password');
      expect(passwordControl?.hasError('required')).toBe(true);

      passwordControl?.setValue('password123');
      expect(passwordControl?.hasError('required')).toBe(false);
    });

    it('should require password minimum length of 6', () => {
      const passwordControl = component.form.get('password');

      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBe(true);

      passwordControl?.setValue('123456');
      expect(passwordControl?.hasError('minlength')).toBe(false);
    });

    it('should disable submit button when form is invalid', () => {
      fixture.detectChanges();
      const submitButton = compiled.querySelector<HTMLIonButtonElement>(
        'ion-button[data-testid="submit-login"]'
      );

      expect(submitButton?.disabled).toBe(true);

      // Fill valid data
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });
      fixture.detectChanges();

      expect(submitButton?.disabled).toBe(false);
    });
  });

  describe('Error Messages', () => {
    it('should show email-error when email is invalid and touched', () => {
      const emailControl = component.form.get('email');

      // Initially no error shown
      expect(compiled.querySelector('[data-testid="email-error"]')).toBeFalsy();

      // Touch and make invalid
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = compiled.querySelector(
        '[data-testid="email-error"]'
      );
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('requerido');
    });

    it('should show email format error', () => {
      const emailControl = component.form.get('email');

      emailControl?.setValue('invalid');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = compiled.querySelector(
        '[data-testid="email-error"]'
      );
      expect(errorElement?.textContent).toContain('inválido');
    });

    it('should show password-error when password is invalid and touched', () => {
      const passwordControl = component.form.get('password');

      // Initially no error shown
      expect(
        compiled.querySelector('[data-testid="password-error"]')
      ).toBeFalsy();

      // Touch and make invalid
      passwordControl?.setValue('123');
      passwordControl?.markAsTouched();
      fixture.detectChanges();

      const errorElement = compiled.querySelector(
        '[data-testid="password-error"]'
      );
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('requerido');
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit when form is submitted', () => {
      const onSubmitSpy = jasmine.createSpy('onSubmit');
      component.onSubmit = onSubmitSpy;

      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      const form = compiled.querySelector<HTMLFormElement>(
        'form[data-testid="login-form"]'
      );
      form?.dispatchEvent(new Event('submit'));

      expect(onSubmitSpy).toHaveBeenCalled();
    });

    it('should not submit when form is invalid', async () => {
      component.form.patchValue({
        email: '',
        password: '',
      });

      await component.onSubmit();

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(component.submitting()).toBe(false);

      const submitPromise = component.onSubmit();
      expect(component.submitting()).toBe(true);

      await submitPromise;
      expect(component.submitting()).toBe(false);
    });

    it('should navigate to /dashboard after successful login', async () => {
      component.form.patchValue({
        email: 'test@example.com',
        password: 'password123',
      });

      await component.onSubmit();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('Button Text', () => {
    it('should show "Ingresar" when not submitting', () => {
      const button = compiled.querySelector(
        'ion-button[data-testid="submit-login"]'
      );
      expect(button?.textContent).toContain('Ingresar');
    });

    it('should show "Ingresando..." when submitting', () => {
      component.submitting.set(true);
      fixture.detectChanges();

      const button = compiled.querySelector(
        'ion-button[data-testid="submit-login"]'
      );
      expect(button?.textContent).toContain('Ingresando');
    });
  });
});
/* eslint-enable @typescript-eslint/unbound-method -- Re-enable after test file */
