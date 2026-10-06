import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="landing-page">
      <header class="landing-hero" data-testid="landing-hero">
        <div class="landing-logo" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" style="fill: var(--color-primary)"/>
            <path d="M14 24L22 32L34 16" style="stroke: var(--color-surface)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1 class="landing-title">B2B Vendor &amp; Customer Workspace Portal</h1>
        <p class="landing-subtitle" data-testid="landing-subheadline">Streamline onboarding, communications, and invoicing between vendors and customers in one place.</p>
        <div class="landing-actions">
          <a routerLink="/dashboard" class="btn btn-primary" data-testid="landing-hero-cta">Get Started</a>
        </div>
        <div class="landing-secondary">
          <a routerLink="/login" class="link">Log in</a>
          <span aria-hidden="true">·</span>
          <a routerLink="/signup" class="link">Sign up</a>
        </div>
      </header>

      <section class="landing-section" aria-label="Highlights">
        <div class="landing-grid">
          <article class="landing-card" id="landing-highlight-0" data-testid="landing-highlight-0">
            <h2 class="card-title">Shared channels</h2>
            <p>Shared channels for real-time vendor-customer communication</p>
          </article>
          <article class="landing-card" id="landing-highlight-1" data-testid="landing-highlight-1">
            <h2 class="card-title">Invoicing</h2>
            <p>Integrated invoice management and approval workflows</p>
          </article>
          <article class="landing-card" id="landing-highlight-2" data-testid="landing-highlight-2">
            <h2 class="card-title">Access control</h2>
            <p>Role-based access for admins, vendors, and customers</p>
          </article>
        </div>
      </section>

      <section class="landing-section" aria-label="Get started by role">
        <div class="landing-grid">
          <div class="landing-role">
            <span class="role-label">Admins</span>
            <a routerLink="/dashboard" class="btn btn-primary" data-testid="landing-cta-admin">Get Started</a>
          </div>
          <div class="landing-role">
            <span class="role-label">Vendors</span>
            <a routerLink="/orders" class="btn btn-primary" data-testid="landing-cta-vendor">View Orders</a>
          </div>
          <div class="landing-role">
            <span class="role-label">Customers</span>
            <a routerLink="/invoices" class="btn btn-primary" data-testid="landing-cta-customer">Track Invoices</a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .landing-page {
      min-height: 100vh;
      background: var(--color-bg-secondary);
      padding: 2rem 1rem 3rem;
      box-sizing: border-box;
    }
    .landing-hero {
      text-align: center;
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem 0;
    }
    .landing-logo {
      margin-bottom: 1.5rem;
      display: flex;
      justify-content: center;
    }
    .landing-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0 0 0.75rem;
    }
    .landing-subtitle {
      color: var(--color-text-secondary);
      font-size: 1.125rem;
      margin: 0 auto 2rem;
      max-width: 640px;
    }
    .landing-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .landing-secondary {
      margin-top: 1rem;
      display: flex;
      gap: 0.5rem;
      justify-content: center;
      color: var(--color-text-tertiary);
    }
    .link {
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
    }
    .landing-section {
      max-width: 1100px;
      margin: 2rem auto 0;
    }
    .landing-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    @media (min-width: 768px) {
      .landing-grid { grid-template-columns: repeat(3, 1fr); }
      .landing-title { font-size: 2.5rem; }
    }
    .landing-card, .landing-role {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      padding: 1.25rem;
    }
    .landing-card p {
      margin: 0;
      color: var(--color-text-secondary);
    }
    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-text-primary);
      margin: 0 0 0.5rem;
    }
    .landing-role {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    .role-label {
      color: var(--color-text-secondary);
      font-weight: 600;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 2rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      text-decoration: none;
      font-size: 1rem;
    }
    .btn-primary {
      background: var(--color-primary);
      color: var(--color-surface);
    }
    .btn-primary:hover {
      background: var(--color-primary-hover);
    }
  `]
})
export class LandingComponent {}
