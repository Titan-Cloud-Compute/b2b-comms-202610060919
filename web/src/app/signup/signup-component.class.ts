import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthApi } from '../shared/api/auth-api.service';
import { BadRequestError, ConflictError } from '../shared/api/api-errors';

/**
 * Self-service sign-up: a single-step email + password form, open to anyone.
 * The backend creates the account with role VENDOR (no registration token).
 */
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  styleUrl: './signup.component.css',
  template: `
    <div class="signup-container">
      <div class="signup-card">
        <h1>Create Account</h1>

        @if (created()) {
          <div class="success-message" role="status">Account created</div>
          <p><a routerLink="/login">Go to Sign In</a></p>
        } @else {
          <form (ngSubmit)="onSignup()" class="signup-form">
            @if (error()) {
              <div class="error-message" role="alert">{{ error() }}</div>
            }

            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                placeholder="email@company.com"
                required
                autocomplete="email"
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                [(ngModel)]="password"
                name="password"
                placeholder="Min 8 characters"
                required
                autocomplete="new-password"
              />
            </div>

            <button type="submit" class="btn-primary" [disabled]="isLoading()">
              {{ isLoading() ? 'Creating account...' : 'Sign up' }}
            </button>
          </form>

          <p class="login-link">
            Already have an account? <a routerLink="/login">Sign In</a>
          </p>
        }
      </div>
    </div>
  `,
})
export class SignupComponent {
  email = '';
  password = '';
  error = signal<string | null>(null);
  isLoading = signal(false);
  created = signal(false);

  private authApi = inject(AuthApi);

  async onSignup(): Promise<void> {
    this.error.set(null);
    const email = this.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.error.set('Please enter a valid email address');
      return;
    }
    if (!this.password || this.password.length < 8) {
      this.error.set('Password must be at least 8 characters');
      return;
    }

    this.isLoading.set(true);
    try {
      await this.authApi.signup({ email, password: this.password });
      this.created.set(true);
    } catch (err) {
      if (err instanceof ConflictError) {
        this.error.set('An account with this email already exists');
      } else if (err instanceof BadRequestError) {
        this.error.set('Invalid sign-up data');
      } else {
        this.error.set('Something went wrong. Please try again.');
      }
    } finally {
      this.isLoading.set(false);
    }
  }
}
