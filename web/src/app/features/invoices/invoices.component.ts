import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient, MockApiClient } from '../../shared/api/api-client';

interface Invoice {
  id: string;
  orderId: string;
  amount: number;
}

interface InvoiceDownload {
  id: string;
  downloadUrl: string;
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div data-testid="invoices-screen">
      <h1>Invoices</h1>

      <section>
        <h2>Generate invoice</h2>
        <p>Generate an invoice for a confirmed order: the invoice is created and returns 201 with the invoice id available for download.</p>
        <form data-testid="invoice-generate-form" (ngSubmit)="generate()">
          <label>
            Order ID
            <input data-testid="invoice-order-id" name="orderId" [(ngModel)]="orderId" required />
          </label>
          <label>
            Amount
            <input data-testid="invoice-amount" name="amount" type="number" step="0.01" [(ngModel)]="amount" required />
          </label>
          <button type="submit" data-testid="invoice-generate-submit" [disabled]="busy">Generate invoice</button>
        </form>
        @if (created) {
          <p data-testid="invoice-created">Invoice created: <span data-testid="invoice-id">{{ created.id }}</span></p>
        }
      </section>

      <section>
        <h2>Download invoice</h2>
        <p>Request the invoice download link: the response returns 200 with a downloadUrl pointing to the stored invoice.</p>
        <form data-testid="invoice-download-form" (ngSubmit)="download()">
          <label>
            Invoice ID
            <input data-testid="invoice-download-id" name="invoiceId" [(ngModel)]="invoiceId" required />
          </label>
          <button type="submit" data-testid="invoice-download-submit" [disabled]="busy">Get download link</button>
        </form>
        @if (downloadUrl) {
          <a data-testid="invoice-download-link" [href]="downloadUrl" target="_blank" rel="noopener">Download invoice</a>
        }
      </section>

      @if (error) {
        <p data-testid="invoice-error" role="alert">{{ error }}</p>
      }
    </div>
  `,
})
export class InvoicesComponent {
  private readonly api = inject(ApiClient);

  orderId = '';
  amount: number | null = null;
  invoiceId = '';
  created: Invoice | null = null;
  downloadUrl = '';
  error = '';
  busy = false;

  constructor() {
    const api = this.api;
    if (api instanceof MockApiClient) {
      // Mock until the backend lands: MockApiClient matches exact paths, so the
      // download handler is registered per generated invoice id.
      api.registerMock('POST', '/api/invoices', async (body: any) => {
        const inv: Invoice = { id: crypto.randomUUID(), orderId: body?.orderId, amount: Number(body?.amount) };
        api.registerMock('GET', `/api/invoices/${encodeURIComponent(inv.id)}/download`, async () => ({
          id: inv.id,
          downloadUrl: `/api/invoices/${inv.id}/file`,
        }));
        return inv;
      });
    }
  }

  async generate(): Promise<void> {
    this.error = '';
    this.busy = true;
    try {
      this.created = await this.api.post<Invoice>('/api/invoices', {
        orderId: this.orderId,
        amount: Number(this.amount),
      });
      this.invoiceId = this.created.id;
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to generate invoice';
    } finally {
      this.busy = false;
    }
  }

  async download(): Promise<void> {
    this.error = '';
    this.downloadUrl = '';
    const id = this.invoiceId.trim();
    if (!id) return;
    this.busy = true;
    try {
      const res = await this.api.get<InvoiceDownload>(`/api/invoices/${encodeURIComponent(id)}/download`);
      this.downloadUrl = res.downloadUrl;
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to get download link';
    } finally {
      this.busy = false;
    }
  }
}
