import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient, ConflictError, MockApiClient } from '../../shared/api/api-client';

/** GET /api/admin/customers item. */
export interface CustomerSummary {
  id: string;
  email: string;
}

/** POST /api/admin/customers/invite response. */
export interface InviteCustomerResponse {
  customerId: string;
  email: string;
  invitationSent: boolean;
}

export const INVITE_SUCCESS_TEXT = 'a Customer record is created and returns 201 with invitationSent true';
export const INVITE_DUPLICATE_TEXT = 'the response returns 409 error indicating the customer already exists';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div data-testid="admin-customers-screen">
      <h1>Customer Management</h1>

      <section data-testid="customer-invite-rules">
        <h2>Invitation rules</h2>
        <ul>
          <li>When you invite a new email, {{ successText }}.</li>
          <li>When a customer with that email already exists, {{ duplicateText }}.</li>
        </ul>
      </section>

      <form data-testid="customer-invite-form" (ngSubmit)="invite()">
        <label for="customer-invite-email">Customer email</label>
        <input
          id="customer-invite-email"
          data-testid="customer-invite-email"
          type="email"
          name="email"
          required
          [(ngModel)]="email"
        />
        <button type="submit" data-testid="customer-invite-submit" [disabled]="submitting()">
          Send invitation
        </button>
      </form>

      @if (status()) {
        <p data-testid="customer-invite-status" role="status">{{ status() }}</p>
      }
      @if (error()) {
        <p data-testid="customer-invite-error" role="alert">{{ error() }}</p>
      }

      <h2>Customers</h2>
      <ul data-testid="customer-list">
        @for (c of customers(); track c.id) {
          <li data-testid="customer-list-item">{{ c.email }}</li>
        } @empty {
          <li data-testid="customer-list-empty">No customers yet.</li>
        }
      </ul>
    </div>
  `,
})
export class AdminCustomersComponent implements OnInit {
  private readonly api = inject(ApiClient);

  readonly successText = INVITE_SUCCESS_TEXT;
  readonly duplicateText = INVITE_DUPLICATE_TEXT;

  email = '';
  readonly customers = signal<CustomerSummary[]>([]);
  readonly status = signal('');
  readonly error = signal('');
  readonly submitting = signal(false);

  constructor() {
    if (this.api instanceof MockApiClient) {
      registerCustomerInviteMocks(this.api);
    }
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const list = await this.api.get<CustomerSummary[]>('/api/admin/customers');
      this.customers.set(Array.isArray(list) ? list : []);
    } catch {
      this.customers.set([]);
    }
  }

  async invite(): Promise<void> {
    const email = this.email.trim();
    if (!email) return;
    this.submitting.set(true);
    this.status.set('');
    this.error.set('');
    try {
      const res = await this.api.post<InviteCustomerResponse>('/api/admin/customers/invite', { email });
      if (res?.invitationSent) {
        this.status.set(`Invitation sent to ${res.email}: ${INVITE_SUCCESS_TEXT}.`);
      }
      this.email = '';
      await this.load();
    } catch (err) {
      if (err instanceof ConflictError || (err as { status?: number })?.status === 409) {
        this.error.set(`${email}: ${INVITE_DUPLICATE_TEXT}.`);
      } else {
        this.error.set((err as Error)?.message || 'Invitation failed.');
      }
    } finally {
      this.submitting.set(false);
    }
  }
}

/** In-memory mocks for the customer-invite endpoints (MockApiClient only). */
function registerCustomerInviteMocks(api: MockApiClient): void {
  const store: CustomerSummary[] = [];
  api.registerMock<CustomerSummary[]>('GET', '/api/admin/customers', async () => [...store]);
  api.registerMock<InviteCustomerResponse>('POST', '/api/admin/customers/invite', async (body: unknown) => {
    const email = String((body as { email?: string })?.email ?? '').trim().toLowerCase();
    if (store.some((c) => c.email === email)) {
      throw new ConflictError('Customer already exists');
    }
    const id = crypto.randomUUID();
    store.push({ id, email });
    return { customerId: id, email, invitationSent: true };
  });
}
