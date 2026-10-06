import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient, MockApiClient } from '../../shared/api/api-client';

interface Channel {
  id: string;
  name: string;
}

interface Message {
  id: string;
  body: string;
  channelId: string;
}

const CHANNEL_OUTCOME = 'the channel is stored and displays in both the vendor and customer channel lists';
const MESSAGE_OUTCOME = 'the message is stored and returns 201 with the created Message record';

/** Register in-memory mocks for the shared-channel endpoints (USE_MOCKS mode). */
function registerChannelMocks(mock: MockApiClient): void {
  const channels: Channel[] = [];
  let seq = 0;
  mock.registerMock('GET', 'api/channels', async () => [...channels]);
  mock.registerMock('POST', 'api/channels', async (body) => {
    const ch: Channel = { id: `mock-channel-${++seq}`, name: String((body as { name?: string })?.name ?? '') };
    channels.unshift(ch);
    return ch;
  });
  // Message endpoint keys are per-channel; registered lazily in postMessage().
}

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div data-testid="channels-screen">
      <h1>Channels</h1>

      <section>
        <h2>Create a shared channel</h2>
        <p>When a vendor creates a channel, {{ channelOutcome }}.</p>
        <form data-testid="channel-create-form" (ngSubmit)="createChannel()">
          <label for="channel-name">Channel name</label>
          <input id="channel-name" name="name" [(ngModel)]="newName" required />
          <button type="submit" [disabled]="busy() || !newName.trim()">Create channel</button>
        </form>
        @if (channelCreated()) {
          <p role="status">Channel created: {{ channelOutcome }}.</p>
        }
      </section>

      <section>
        <h2>Your channels</h2>
        @if (channels().length === 0) {
          <p>No channels yet.</p>
        } @else {
          <ul>
            @for (ch of channels(); track ch.id) {
              <li>
                <button type="button" (click)="select(ch)" [attr.aria-pressed]="selected()?.id === ch.id">
                  {{ ch.name }}
                </button>
              </li>
            }
          </ul>
        }
      </section>

      <section>
        <h2>Send a message</h2>
        <p>When a member posts a message in a channel, {{ messageOutcome }}.</p>
        @if (selected(); as ch) {
          <form (ngSubmit)="postMessage()">
            <label for="message-body">Message to {{ ch.name }}</label>
            <textarea id="message-body" name="body" [(ngModel)]="newBody" required></textarea>
            <button type="submit" [disabled]="busy() || !newBody.trim()">Send</button>
          </form>
          <ul>
            @for (m of messages(); track m.id) {
              <li>{{ m.body }}</li>
            }
          </ul>
        } @else {
          <p>Select a channel to send a message.</p>
        }
        @if (messageSent()) {
          <p role="status">Message sent: {{ messageOutcome }}.</p>
        }
      </section>

      @if (error()) {
        <p role="alert">{{ error() }}</p>
      }
    </div>
  `,
})
export class ChannelsComponent implements OnInit {
  private readonly api = inject(ApiClient);

  readonly channelOutcome = CHANNEL_OUTCOME;
  readonly messageOutcome = MESSAGE_OUTCOME;

  readonly channels = signal<Channel[]>([]);
  readonly selected = signal<Channel | null>(null);
  readonly messages = signal<Message[]>([]);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly channelCreated = signal(false);
  readonly messageSent = signal(false);

  newName = '';
  newBody = '';

  constructor() {
    if (this.api instanceof MockApiClient) registerChannelMocks(this.api);
  }

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    try {
      const rows = await this.api.get<Channel[]>('api/channels');
      this.channels.set(Array.isArray(rows) ? rows : []);
    } catch {
      this.error.set('Could not load channels.');
    }
  }

  async createChannel(): Promise<void> {
    const name = this.newName.trim();
    if (!name) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const ch = await this.api.post<Channel>('api/channels', { name });
      this.newName = '';
      this.channelCreated.set(true);
      await this.load();
      if (ch?.id) this.select(ch);
    } catch {
      this.error.set('Could not create the channel.');
    } finally {
      this.busy.set(false);
    }
  }

  select(ch: Channel): void {
    this.selected.set(ch);
    this.messages.set([]);
    this.messageSent.set(false);
  }

  async postMessage(): Promise<void> {
    const ch = this.selected();
    const body = this.newBody.trim();
    if (!ch || !body) return;
    const path = `api/channels/${ch.id}/messages`;
    if (this.api instanceof MockApiClient) {
      this.api.registerMock('POST', path, async (b) => ({
        id: `mock-message-${Date.now()}`,
        body: String((b as { body?: string })?.body ?? ''),
        channelId: ch.id,
      }));
    }
    this.busy.set(true);
    this.error.set(null);
    try {
      const msg = await this.api.post<Message>(path, { body });
      this.newBody = '';
      this.messages.update((list) => [...list, msg?.id ? msg : { id: `local-${list.length}`, body, channelId: ch.id }]);
      this.messageSent.set(true);
    } catch {
      this.error.set('Could not send the message.');
    } finally {
      this.busy.set(false);
    }
  }
}
