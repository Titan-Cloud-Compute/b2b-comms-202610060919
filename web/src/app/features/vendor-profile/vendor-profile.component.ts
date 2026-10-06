import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient, MockApiClient } from '../../shared/api/api-client';

// Shapes per the vendor-onboarding contract (no @contracts/vendor-onboarding module is published in web yet).
interface VendorProfileRecord {
  id: string;
  companyName: string;
  contactEmail: string;
}

interface VendorDocument {
  id: string;
  filename: string;
  status: string;
}

@Component({
  selector: 'app-vendor-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div data-testid="vendor-profile-screen">
      <h1>Vendor Profile</h1>

      <section>
        <h2>Company profile</h2>
        <p>Submit your company profile and contact details — the profile is stored and returns 201 with the created VendorProfile record.</p>
        <form data-testid="vendor-profile-form" (ngSubmit)="submitProfile()">
          <label>
            Company name
            <input name="companyName" data-testid="vendor-company-name" [(ngModel)]="companyName" required />
          </label>
          <label>
            Contact email
            <input name="contactEmail" type="email" data-testid="vendor-contact-email" [(ngModel)]="contactEmail" required />
          </label>
          <button type="submit" data-testid="vendor-profile-submit" [disabled]="savingProfile">Save profile</button>
        </form>
        @if (profile) {
          <p data-testid="vendor-profile-saved">Profile saved for {{ profile.companyName }} ({{ profile.contactEmail }}).</p>
        }
        @if (profileError) {
          <p data-testid="vendor-profile-error" role="alert">{{ profileError }}</p>
        }
      </section>

      <section>
        <h2>Compliance documents</h2>
        <p>Upload a required compliance document — the document is stored with status "pending" and displays in the vendor document library.</p>
        <form data-testid="vendor-document-form" (ngSubmit)="uploadDocument()">
          <label>
            Filename
            <input name="filename" data-testid="vendor-document-filename" [(ngModel)]="filename" required />
          </label>
          <button type="submit" data-testid="vendor-document-submit" [disabled]="uploading">Upload document</button>
        </form>
        @if (documentError) {
          <p data-testid="vendor-document-error" role="alert">{{ documentError }}</p>
        }

        <h3>Document library</h3>
        <ul data-testid="vendor-document-library">
          @for (doc of documents; track doc.id) {
            <li data-testid="vendor-document-item">{{ doc.filename }} — {{ doc.status }}</li>
          } @empty {
            <li>No documents uploaded yet.</li>
          }
        </ul>
      </section>
    </div>
  `,
})
export class VendorProfileComponent implements OnInit {
  private readonly api = inject(ApiClient);

  companyName = '';
  contactEmail = '';
  filename = '';
  profile: VendorProfileRecord | null = null;
  documents: VendorDocument[] = [];
  savingProfile = false;
  uploading = false;
  profileError = '';
  documentError = '';

  ngOnInit(): void {
    this.registerMocks();
    void this.loadDocuments();
  }

  /** Mock handlers for USE_MOCKS mode until the backend endpoints are deployed. */
  private registerMocks(): void {
    if (!(this.api instanceof MockApiClient)) return;
    const store: VendorDocument[] = [];
    const uid = () => (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
    this.api.registerMock('GET', '/api/vendor/documents', async () => [...store]);
    this.api.registerMock('POST', '/api/vendor/documents', async (body: any) => {
      const doc: VendorDocument = { id: uid(), filename: String(body?.filename ?? ''), status: 'pending' };
      store.push(doc);
      return doc;
    });
    this.api.registerMock('POST', '/api/vendor/profile', async (body: any) => ({
      id: uid(),
      companyName: String(body?.companyName ?? ''),
      contactEmail: String(body?.contactEmail ?? ''),
    }));
  }

  async loadDocuments(): Promise<void> {
    try {
      const docs = await this.api.get<VendorDocument[]>('/api/vendor/documents');
      this.documents = Array.isArray(docs) ? docs : [];
    } catch {
      this.documents = [];
    }
  }

  async submitProfile(): Promise<void> {
    if (!this.companyName.trim() || !this.contactEmail.trim()) {
      this.profileError = 'Company name and contact email are required.';
      return;
    }
    this.savingProfile = true;
    this.profileError = '';
    try {
      this.profile = await this.api.post<VendorProfileRecord>('/api/vendor/profile', {
        companyName: this.companyName.trim(),
        contactEmail: this.contactEmail.trim(),
      });
    } catch (e: any) {
      this.profileError = e?.message || 'Could not save profile.';
    } finally {
      this.savingProfile = false;
    }
  }

  async uploadDocument(): Promise<void> {
    if (!this.filename.trim()) {
      this.documentError = 'Filename is required.';
      return;
    }
    this.uploading = true;
    this.documentError = '';
    try {
      const doc = await this.api.post<VendorDocument>('/api/vendor/documents', {
        filename: this.filename.trim(),
      });
      if (doc && doc.id) {
        this.documents = [...this.documents, doc];
      } else {
        await this.loadDocuments();
      }
      this.filename = '';
    } catch (e: any) {
      this.documentError = e?.message || 'Could not upload document.';
    } finally {
      this.uploading = false;
    }
  }
}
