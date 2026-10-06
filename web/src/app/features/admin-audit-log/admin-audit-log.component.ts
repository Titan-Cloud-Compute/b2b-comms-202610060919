import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiClient, MockApiClient } from '../../shared/api/api-client';

export interface AuditEntry {
  id: string;
  action: string;
  userId: string;
  createdAt: string;
}

const AUDIT_LOG_PATH = '/api/admin/audit-log';

/** In-memory fixtures for MockApiClient until the backend endpoint is live everywhere. */
const mockEntries: AuditEntry[] = [
  { id: '00000000-0000-4000-8000-000000000001', action: 'user.login', userId: '00000000-0000-4000-8000-0000000000a1', createdAt: '2026-10-01T09:00:00.000Z' },
  { id: '00000000-0000-4000-8000-000000000002', action: 'customer.invite', userId: '00000000-0000-4000-8000-0000000000a1', createdAt: '2026-10-01T09:05:00.000Z' },
];

function registerAuditLogMocks(client: MockApiClient): void {
  client.registerMock('GET', AUDIT_LOG_PATH, async () => [...mockEntries]);
  client.registerMock('POST', AUDIT_LOG_PATH, async (body) => {
    const b = (body ?? {}) as { action?: string; userId?: string };
    const entry: AuditEntry = {
      id: crypto.randomUUID(),
      action: String(b.action ?? ''),
      userId: String(b.userId ?? ''),
      createdAt: new Date().toISOString(),
    };
    mockEntries.push(entry);
    return entry;
  });
}

@Component({
  selector: 'app-admin-audit-log',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <div data-testid="admin-audit-log-screen">
      <h1>Audit Log</h1>

      <section>
        <h2>Admin views audit log</h2>
        <p>a list of AuditEntry records is displayed in chronological order returns 200</p>
        @if (loadError()) {
          <p role="alert">{{ loadError() }}</p>
        }
        <table data-testid="audit-log-table">
          <thead>
            <tr><th>Action</th><th>User</th><th>Recorded at</th></tr>
          </thead>
          <tbody>
            @for (e of entries(); track e.id) {
              <tr data-testid="audit-log-row">
                <td>{{ e.action }}</td>
                <td>{{ e.userId }}</td>
                <td>{{ e.createdAt | date: 'medium' }}</td>
              </tr>
            } @empty {
              <tr><td colspan="3">No audit entries yet.</td></tr>
            }
          </tbody>
        </table>
      </section>

      <section>
        <h2>System records audit entry</h2>
        <p>the AuditEntry is stored and returns 201 with the created record</p>
        <form (ngSubmit)="record()">
          <label>Action <input name="action" [(ngModel)]="action" required /></label>
          <label>User id <input name="userId" [(ngModel)]="userId" required /></label>
          <button type="submit" data-testid="audit-log-record" [disabled]="saving()">Record action</button>
        </form>
        @if (created(); as c) {
          <p data-testid="audit-log-created">Recorded "{{ c.action }}" at {{ c.createdAt | date: 'medium' }}</p>
        }
        @if (saveError()) {
          <p role="alert">{{ saveError() }}</p>
        }
      </section>
    </div>
  `,
})
export class AdminAuditLogComponent implements OnInit {
  private readonly api = inject(ApiClient);

  readonly entries = signal<AuditEntry[]>([]);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saving = signal(false);
  readonly created = signal<AuditEntry | null>(null);

  action = '';
  userId = '';

  constructor() {
    if (this.api instanceof MockApiClient) registerAuditLogMocks(this.api);
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const data = await this.api.get<AuditEntry[]>(AUDIT_LOG_PATH);
      const list = Array.isArray(data) ? data : [];
      this.entries.set(
        [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
      );
      this.loadError.set(null);
    } catch (err: any) {
      this.loadError.set(err?.message ?? 'Could not load the audit log.');
    }
  }

  async record(): Promise<void> {
    if (!this.action.trim() || !this.userId.trim()) return;
    this.saving.set(true);
    this.saveError.set(null);
    try {
      const entry = await this.api.post<AuditEntry>(AUDIT_LOG_PATH, {
        action: this.action.trim(),
        userId: this.userId.trim(),
      });
      this.created.set(entry);
      this.action = '';
      await this.load();
    } catch (err: any) {
      this.saveError.set(err?.message ?? 'Could not record the action.');
    } finally {
      this.saving.set(false);
    }
  }
}
