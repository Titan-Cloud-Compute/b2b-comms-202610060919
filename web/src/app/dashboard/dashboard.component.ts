import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="dashboard-page" data-placeholder>
      <header class="page-header">
        <h1>Dashboard</h1>
        <p class="subtitle">Welcome to the platform.</p>
      </header>
      <div class="card-grid">
        <div class="metric-card">
          <p class="metric-label">Field 1</p>
          <input type="text" id="ph-field-1" [(ngModel)]="field1" name="field1" placeholder="Enter value…" />
        </div>
        <div class="metric-card">
          <p class="metric-label">Field 2</p>
          <input type="text" id="ph-field-2" [(ngModel)]="field2" name="field2" placeholder="Enter value…" />
        </div>
        <div class="metric-card">
          <p class="metric-label">Status</p>
          <p class="metric-value">Active</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Orders</p>
          <p class="metric-value">—</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Invoices</p>
          <p class="metric-value">—</p>
        </div>
        <div class="metric-card">
          <p class="metric-label">Channels</p>
          <p class="metric-value">—</p>
        </div>
      </div>
      <div class="action-row">
        <button type="submit" class="btn-primary" disabled>Submit</button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      max-width: 1100px;
      margin: 0 auto;
      padding: var(--space-8) var(--space-4);
    }
    .page-header {
      margin-bottom: var(--space-8);
    }
    h1 {
      font-size: var(--font-size-xl);
      color: var(--color-text-primary);
      margin: 0 0 var(--space-1);
    }
    .subtitle {
      color: var(--color-text-secondary);
      font-size: var(--font-size-sm);
      margin: 0;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    .metric-card {
      background: var(--color-surface);
      border-radius: var(--radius-card);
      border: 1px solid var(--color-border);
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .metric-label {
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-text-secondary);
      margin: 0;
    }
    .metric-value {
      font-size: var(--font-size-xl);
      font-weight: 700;
      color: var(--color-text-primary);
      margin: 0;
    }
    .metric-card input {
      padding: var(--space-2-5) var(--space-3);
      font-size: var(--font-size-input);
      border: 1px solid var(--color-gray-300);
      border-radius: var(--radius-btn);
      background: var(--color-surface);
      min-height: 44px;
    }
    .action-row {
      display: flex;
    }
    .btn-primary {
      align-self: flex-start;
      padding: var(--space-2-5) var(--space-6);
      font-size: var(--font-size-sm);
      font-weight: 600;
      color: var(--color-on-primary);
      background: var(--color-primary);
      border: none;
      border-radius: var(--radius-btn);
      cursor: not-allowed;
      opacity: 0.6;
      min-height: 44px;
    }
    @media (max-width: 768px) {
      .card-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent {
  field1 = '';
  field2 = '';
}
