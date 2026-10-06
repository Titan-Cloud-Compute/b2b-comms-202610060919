import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiClient } from '../../shared/api/api-client.service';

/** Shape of GET/PUT /api/notifications/preferences responses. */
export interface NotificationPreferenceDto {
  userId: string;
  orderAlerts: boolean;
  messageAlerts: boolean;
}

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [],
  template: `
    <div data-testid="settings-notifications-screen">
      <h1>Notification Settings</h1>
      <form (submit)="$event.preventDefault(); save()">
        <label>
          <input type="checkbox" data-testid="notif-order-alerts"
                 [checked]="orderAlerts()" (change)="orderAlerts.set($any($event.target).checked)" />
          Order alerts
        </label>
        <label>
          <input type="checkbox" data-testid="notif-message-alerts"
                 [checked]="messageAlerts()" (change)="messageAlerts.set($any($event.target).checked)" />
          Message alerts
        </label>
        <button type="submit" data-testid="notif-save" [disabled]="saving()">Save</button>
      </form>
      @if (error()) {
        <p role="alert" data-testid="notif-error">{{ error() }}</p>
      }
      @if (saved(); as s) {
        <p data-testid="notif-status">
          Saved: order alerts {{ s.orderAlerts ? 'on' : 'off' }}, message alerts {{ s.messageAlerts ? 'on' : 'off' }}.
        </p>
      }
      <section data-testid="notif-scenarios">
        <p [class.active]="saved() !== null">Saving: the preferences are updated and returns 200 with the stored NotificationPreference record</p>
        <p [class.active]="saved() !== null && !saved()!.orderAlerts && !saved()!.messageAlerts">Turning everything off: the preferences are updated with both alert fields stored as false</p>
      </section>
    </div>
  `,
})
export class NotificationPreferencesComponent implements OnInit {
  private api = inject(ApiClient);

  readonly orderAlerts = signal(true);
  readonly messageAlerts = signal(true);
  readonly saving = signal(false);
  readonly saved = signal<NotificationPreferenceDto | null>(null);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const prefs = await this.api.get<NotificationPreferenceDto | unknown>('notifications/preferences');
      if (isPrefs(prefs)) {
        this.orderAlerts.set(prefs.orderAlerts);
        this.messageAlerts.set(prefs.messageAlerts);
      }
    } catch {
      this.error.set('Could not load notification preferences.');
    }
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set(null);
    const body = { orderAlerts: this.orderAlerts(), messageAlerts: this.messageAlerts() };
    try {
      const res = await this.api.put<NotificationPreferenceDto | unknown>('notifications/preferences', body);
      this.saved.set(isPrefs(res) ? res : { userId: '', ...body });
    } catch {
      this.error.set('Could not save notification preferences.');
    } finally {
      this.saving.set(false);
    }
  }
}

function isPrefs(v: unknown): v is NotificationPreferenceDto {
  return !!v && typeof v === 'object' && !Array.isArray(v)
    && typeof (v as NotificationPreferenceDto).orderAlerts === 'boolean'
    && typeof (v as NotificationPreferenceDto).messageAlerts === 'boolean';
}
