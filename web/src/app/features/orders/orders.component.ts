import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient, MockApiClient } from '../../shared/api/api-client';

/** Order record as returned by GET/POST /api/orders (contract: Order). */
export interface Order {
  id: string;
  status: string;
  customerId?: string;
  vendorId?: string;
  estimatedDelivery?: string;
}

/** Purchase-order line (contract: OrderItem). */
export interface OrderItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderRequest {
  vendorId: string;
  items: OrderItemInput[];
}

export interface ConfirmOrderRequest {
  estimatedDelivery: string;
}

const CREATE_OUTCOME =
  'the order is stored with status "pending" and returns 201 with the created Order record';
const CONFIRM_OUTCOME =
  'the order is updated to status "confirmed" and displays to the customer as confirmed';

function uuid(): string {
  const c = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Register in-memory handlers for the order endpoints when running against MockApiClient. */
const mockedClients = new WeakSet<MockApiClient>();
function registerOrderMocks(client: MockApiClient): void {
  if (mockedClients.has(client)) return;
  mockedClients.add(client);
  const store: Order[] = [];
  client.registerMock<Order[]>('GET', '/api/orders', async () => store.map(o => ({ ...o })));
  client.registerMock<Order>('POST', '/api/orders', async body => {
    const req = body as CreateOrderRequest;
    const order: Order = { id: uuid(), status: 'pending', customerId: uuid(), vendorId: req?.vendorId };
    store.unshift(order);
    return { ...order };
  });
  // MockApiClient keys on exact paths, so confirm is registered per order id on create.
  const origRequest = client.request.bind(client);
  client.request = (async (path: string, opts: any = {}) => {
    const m = /^\/api\/orders\/([^/]+)\/confirm$/.exec(path);
    if (m && (opts.method ?? 'GET').toUpperCase() === 'PATCH') {
      const order = store.find(o => o.id === m[1]);
      if (!order) throw new Error('Order not found');
      order.status = 'confirmed';
      order.estimatedDelivery = (opts.body as ConfirmOrderRequest)?.estimatedDelivery;
      return { id: order.id, status: order.status };
    }
    return origRequest(path, opts);
  }) as typeof client.request;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div data-testid="orders-screen">
      <h1>Orders</h1>

      <section data-testid="order-scenarios">
        <p data-testid="order-create-outcome">When a customer submits a purchase order, {{ createOutcome }}.</p>
        <p data-testid="order-confirm-outcome">When the vendor confirms it with an estimated delivery date, {{ confirmOutcome }}.</p>
      </section>

      <form data-testid="order-create-form" (ngSubmit)="createOrder()">
        <h2>New purchase order</h2>
        <label>
          Vendor ID
          <input data-testid="order-vendor-id" name="vendorId" [(ngModel)]="vendorId" required />
        </label>
        @for (item of items; track $index) {
          <div data-testid="order-item-row">
            <input name="description{{ $index }}" placeholder="Description" [(ngModel)]="item.description" />
            <input name="quantity{{ $index }}" type="number" min="1" [(ngModel)]="item.quantity" />
            <input name="unitPrice{{ $index }}" type="number" min="0" step="0.01" [(ngModel)]="item.unitPrice" />
          </div>
        }
        <button type="button" (click)="addItem()">Add item</button>
        <button type="submit" data-testid="order-submit">Submit order</button>
      </form>

      @if (error()) {
        <p role="alert" data-testid="order-error">{{ error() }}</p>
      }
      @if (lastCreated(); as created) {
        <p data-testid="order-created">Order {{ created.id }} created with status {{ created.status }}.</p>
      }

      <h2>Your orders</h2>
      <ul data-testid="order-list">
        @for (order of orders(); track order.id) {
          <li data-testid="order-row">
            <span>{{ order.id }}</span> — <strong data-testid="order-status">{{ order.status }}</strong>
            @if (order.status === 'pending') {
              <input type="date" [(ngModel)]="deliveryDates[order.id]" name="delivery-{{ order.id }}" data-testid="order-estimated-delivery" />
              <button type="button" data-testid="order-confirm" (click)="confirmOrder(order)">Confirm</button>
            }
          </li>
        } @empty {
          <li>No orders yet.</li>
        }
      </ul>
    </div>
  `,
})
export class OrdersComponent implements OnInit {
  private readonly api = inject(ApiClient);

  readonly createOutcome = CREATE_OUTCOME;
  readonly confirmOutcome = CONFIRM_OUTCOME;

  readonly orders = signal<Order[]>([]);
  readonly lastCreated = signal<Order | null>(null);
  readonly error = signal<string | null>(null);

  vendorId = '';
  items: OrderItemInput[] = [{ description: '', quantity: 1, unitPrice: 0 }];
  deliveryDates: Record<string, string> = {};

  constructor() {
    if (this.api instanceof MockApiClient) {
      registerOrderMocks(this.api);
    }
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const list = await this.api.get<Order[]>('/api/orders');
      this.orders.set(Array.isArray(list) ? list : []);
    } catch (e: any) {
      this.orders.set([]);
      this.error.set(e?.message || 'Could not load orders');
    }
  }

  addItem(): void {
    this.items = [...this.items, { description: '', quantity: 1, unitPrice: 0 }];
  }

  async createOrder(): Promise<void> {
    this.error.set(null);
    const body: CreateOrderRequest = {
      vendorId: this.vendorId.trim(),
      items: this.items
        .filter(i => i.description.trim())
        .map(i => ({ description: i.description.trim(), quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
    };
    try {
      const created = await this.api.post<Order>('/api/orders', body);
      this.lastCreated.set(created);
      this.vendorId = '';
      this.items = [{ description: '', quantity: 1, unitPrice: 0 }];
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || 'Could not create order');
    }
  }

  async confirmOrder(order: Order): Promise<void> {
    this.error.set(null);
    const estimatedDelivery = this.deliveryDates[order.id];
    if (!estimatedDelivery) {
      this.error.set('Choose an estimated delivery date');
      return;
    }
    try {
      await this.api.patch<Order>(`/api/orders/${order.id}/confirm`, { estimatedDelivery } as ConfirmOrderRequest);
      await this.load();
    } catch (e: any) {
      this.error.set(e?.message || 'Could not confirm order');
    }
  }
}
