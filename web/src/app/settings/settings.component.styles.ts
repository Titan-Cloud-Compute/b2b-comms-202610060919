/** Extracted inline styles for {@link SettingsComponent}. Moved verbatim out of
 *  settings.component.ts (which exceeded the 500-line module limit). Pure structural
 *  move — the CSS is unchanged. */
export const settingsComponentStyles = `
    :host { display: block; padding: var(--space-6); max-width: 1200px; margin: 0 auto; }
    .page-header { margin-bottom: var(--space-6); }
    h1 { color: var(--color-text-primary); margin-bottom: var(--space-1-5); }
    .muted { color: var(--color-text-secondary); margin: 0; }
    .settings-tabs {
      display: flex; gap: var(--space-1); flex-wrap: wrap;
      border-bottom: 1px solid var(--color-border); margin-bottom: var(--space-5);
    }
    .settings-tab {
      min-height: 44px; padding: var(--space-2-5) var(--space-5); cursor: pointer;
      background: transparent; border: none; border-bottom: 2px solid transparent;
      color: var(--color-text-secondary); font-weight: 600; font-size: var(--font-size-md);
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    }
    .settings-tab:hover { color: var(--color-text-primary); background: var(--color-bg-secondary); }
    .settings-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
    .settings-grid {
      display: grid; gap: var(--space-4);
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }
    .card {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); padding: var(--space-6);
      box-shadow: var(--shadow-sm);
    }
    .card h2 {
      display: flex; align-items: center; gap: var(--space-2-5);
      color: var(--color-text-primary); font-size: var(--font-size-lg); margin-bottom: var(--space-4);
    }
    .badge {
      padding: var(--space-1) var(--space-2-5); border-radius: var(--radius-pill);
      font-size: var(--font-size-xs); font-weight: 700; text-transform: uppercase;
    }
    .badge.ok { background: var(--color-success-bg); color: var(--color-success); }
    .badge.warn { background: var(--color-warning-bg); color: var(--color-warning); }
    .badge.error { background: var(--color-error-bg); color: var(--color-error); }
    .badge.neutral { background: var(--color-bg-secondary); color: var(--color-text-secondary); }
    /* Per-model API-key liveness status card variants. */
    .badge.key-status { display: inline-flex; align-items: center; gap: var(--space-1); }
    .badge.key-status::before {
      content: ''; width: var(--space-2); height: var(--space-2); border-radius: var(--radius-pill);
      background: currentColor; flex-shrink: 0;
    }
    .badge.key-status.neutral::before { opacity: 0.5; }
    .row { margin-bottom: var(--space-3-5); display: flex; flex-direction: column; gap: var(--space-1-5); }
    label { color: var(--color-text-secondary); font-size: var(--font-size-sm); font-weight: 600; }
    input[type=text], input[type=email], select {
      min-height: 44px; padding: var(--space-2) var(--space-3);
      background: var(--color-bg-secondary); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text-primary);
      font-size: var(--font-size-input); width: 100%;
    }
    .btn {
      min-height: 44px; padding: var(--space-2-5) var(--space-5);
      border-radius: var(--radius-sm); cursor: pointer; font-weight: 600;
      border: 1px solid transparent;
    }
    .btn-primary { background: var(--color-primary); color: var(--color-white); }
    .btn-primary:hover { background: var(--color-primary-hover); }
    .btn-danger { background: var(--color-error); color: var(--color-white); }
    .btn-ghost { background: transparent; border-color: var(--color-border); color: var(--color-text-primary); }
    .consent-meta { display: flex; flex-direction: column; gap: var(--space-2-5); margin-bottom: var(--space-4); }
    .consent-meta dt { color: var(--color-text-tertiary); font-size: var(--font-size-sm); }
    .consent-meta dd { color: var(--color-text-primary); margin: var(--space-0-5) 0 0; font-weight: 500; }
    .scope-pill {
      display: inline-block; padding: var(--space-0-5) var(--space-2-5); margin-right: var(--space-1);
      background: var(--color-primary-light); color: var(--color-primary);
      border-radius: var(--radius-pill); font-size: var(--font-size-xs); font-weight: 600;
    }
    .hint { color: var(--color-text-tertiary); font-size: var(--font-size-sm); margin-top: var(--space-2); }
    .toggle-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border-light);
      min-height: 44px;
    }
    .toggle-row:last-child { border-bottom: none; }
    .toggle-row input { width: 20px; height: 20px; }
    .modal-overlay {
      position: fixed; inset: 0; background: var(--color-overlay-backdrop);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
      padding: var(--space-4);
    }
    .modal-dialog {
      background: var(--color-surface); border-radius: var(--radius-md);
      padding: var(--space-6); max-width: 480px; width: 100%;
      box-shadow: var(--shadow-lg);
    }
    .modal-dialog h3 { color: var(--color-text-primary); margin-bottom: var(--space-2); }
    .modal-dialog p { color: var(--color-text-secondary); margin-bottom: var(--space-5); }
    .modal-actions {
      display: flex; gap: var(--space-2-5); justify-content: flex-end; flex-wrap: wrap;
    }
    .modal-dialog input[type=password] {
      min-height: 44px; padding: var(--space-2) var(--space-3); width: 100%;
      background: var(--color-bg-secondary); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text-primary); font-size: var(--font-size-input);
    }
    .masked-key {
      font-family: var(--font-mono);
      padding: var(--space-2) var(--space-3); background: var(--color-bg-secondary);
      border: 1px solid var(--color-border); border-radius: var(--radius-sm);
      color: var(--color-text-primary); word-break: break-all;
    }
    .empty-models { margin-bottom: var(--space-4); }
    .model-list { list-style: none; margin: 0 0 var(--space-4); padding: 0; }
    .model-item {
      display: flex; justify-content: space-between; align-items: center; gap: var(--space-3);
      padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border-light);
      min-height: 44px;
    }
    .model-item:last-child { border-bottom: none; }
    .model-name {
      display: flex; align-items: center; gap: var(--space-2);
      color: var(--color-text-primary); font-weight: 500;
    }
    .model-actions { display: flex; gap: var(--space-1-5); flex-shrink: 0; }
    .btn-sm { min-height: 36px; padding: var(--space-1-5) var(--space-3); font-size: var(--font-size-sm); }
    .btn-danger-text { color: var(--color-error); }
    .add-model-row { margin-bottom: 0; }
    .add-model-controls { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: stretch; }
    .add-model-controls select { flex: 1; min-width: 160px; }
    .add-model-controls input {
      flex: 1; min-width: 160px; min-height: 44px; padding: var(--space-2) var(--space-3);
      background: var(--color-bg-secondary); border: 1px solid var(--color-border);
      border-radius: var(--radius-sm); color: var(--color-text-primary); font-size: var(--font-size-input);
    }
    .add-model-controls .btn { white-space: nowrap; flex-shrink: 0; }
`;
