import type { AboutBlock } from '@qalor/shared';
import { type FormEvent, useEffect, useState } from 'react';
import Navbar from '../components/Navbar/Navbar';
import { useContent } from '../context/ContentContext';
import {
  apiCreateItem,
  apiDeleteItem,
  apiLogin,
  apiRevokeAll,
  apiUpdateItem,
  apiUpdateSite,
  apiUploadFile,
  clearToken,
  getToken,
  type ListItem,
  type ListName,
  setToken,
} from '../lib/api';
import { optimizeUrl } from '../lib/images';
import './Admin.css';

/**
 * The whole admin portal: sign in, edit every section, reorder/add/delete list items,
 * upload images and CVs.
 *
 * Lazy-loaded from App.tsx so none of this ships in the bundle a visitor downloads, and
 * there's no /admin route in the prerendered output — scripts/prerender.mjs only ever
 * captures '/'.
 */
export default function Admin() {
  return <AdminGate />;
}

function AdminGate() {
  const { content, refresh } = useContent();
  const [signedIn, setSignedIn] = useState(() => !!getToken());

  if (!signedIn) return <SignIn onSuccess={() => setSignedIn(true)} />;

  return (
    <AdminPanel
      content={content}
      refresh={refresh}
      onSignOut={() => {
        clearToken();
        setSignedIn(false);
      }}
    />
  );
}

function SignIn({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      setToken(await apiLogin(password));
      onSuccess();
    } catch {
      // Deliberately one message for both a wrong password and an unreachable API: the
      // distinction is useful to an attacker enumerating whether the portal is live.
      setError('Wachtwoord onjuist, of de server is niet bereikbaar.');
    } finally {
      setBusy(false);
      setPassword('');
    }
  }

  return (
    <div className="admin admin-signin">
      <Navbar />
      <main>
        <h1>Beheer</h1>
        <form onSubmit={submit}>
          <div className="admin-field">
            <label htmlFor="password">Wachtwoord</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </div>
          {error && (
            <p className="admin-status error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="admin-btn admin-btn-primary" disabled={busy}>
            {busy ? 'Bezig…' : 'Inloggen'}
          </button>
        </form>
      </main>
    </div>
  );
}

type Tab = 'hero' | 'about' | 'workProcess' | 'projects' | 'team' | 'footer';
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'hero', label: 'Hero' },
  { id: 'about', label: 'Qalor' },
  { id: 'workProcess', label: 'Werkproces' },
  { id: 'projects', label: 'Projecten' },
  { id: 'team', label: 'Team' },
  { id: 'footer', label: 'Footer' },
];

function AdminPanel({
  content,
  refresh,
  onSignOut,
}: {
  content: ReturnType<typeof useContent>['content'];
  refresh: () => Promise<void>;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>('hero');

  return (
    <div className="admin">
      <Navbar />
      <main>
        <div className="admin-header">
          <h1>Beheer</h1>
          <div className="admin-actions">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={async () => {
                if (!confirm('Alle sessies (ook deze) uitloggen?')) return;
                await apiRevokeAll();
                onSignOut();
              }}
            >
              Overal uitloggen
            </button>
            <button type="button" className="admin-btn admin-btn-secondary" onClick={onSignOut}>
              Uitloggen
            </button>
          </div>
        </div>

        <div className="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`admin-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'hero' && (
          <SingletonEditor
            id="hero"
            values={content.hero}
            fields={[
              { key: 'headline', label: 'Titel', type: 'text' },
              { key: 'subheadline', label: 'Subtitel', type: 'text' },
              { key: 'image', label: 'Afbeelding', type: 'image' },
            ]}
            onSaved={refresh}
          />
        )}

        {tab === 'about' && <AboutEditor values={content.about} onSaved={refresh} />}

        {tab === 'workProcess' && (
          <>
            <SingletonEditor
              id="workProcessIntro"
              values={content.workProcessIntro}
              fields={[
                { key: 'eyebrow', label: 'Label', type: 'text' },
                { key: 'heading', label: 'Titel', type: 'text' },
              ]}
              onSaved={refresh}
            />
            <ListEditor
              list="workProcessSteps"
              items={content.workProcessSteps}
              fields={[
                { key: 'number', label: 'Nummer', type: 'text' },
                { key: 'title', label: 'Titel', type: 'text' },
                { key: 'body', label: 'Tekst', type: 'textarea' },
                { key: 'image', label: 'Afbeelding', type: 'image' },
                { key: 'alt', label: 'Alt-tekst afbeelding', type: 'text' },
              ]}
              itemLabel={(item) => (item as { title?: string }).title || 'Nieuwe stap'}
              onSaved={refresh}
            />
          </>
        )}

        {tab === 'projects' && (
          <>
            <SingletonEditor
              id="projectsIntro"
              values={content.projectsIntro}
              fields={[
                { key: 'eyebrow', label: 'Label', type: 'text' },
                { key: 'heading', label: 'Titel', type: 'text' },
              ]}
              onSaved={refresh}
            />
            <ListEditor
              list="projects"
              items={content.projects}
              fields={[
                { key: 'name', label: 'Naam', type: 'text' },
                { key: 'role', label: 'Rol/type', type: 'text' },
                { key: 'description', label: 'Omschrijving', type: 'textarea' },
                { key: 'image', label: 'Afbeelding', type: 'image' },
              ]}
              itemLabel={(item) => (item as { name?: string }).name || 'Nieuw project'}
              onSaved={refresh}
              // description can be a string or string[] on the bundled defaults — normalise
              // to one string per line for the textarea, and back on save.
              normalizeIn={(item) => ({
                ...item,
                description: Array.isArray(item.description)
                  ? item.description.join('\n')
                  : item.description,
              })}
              normalizeOut={(draft) => ({
                ...draft,
                description:
                  typeof draft.description === 'string' && draft.description.includes('\n')
                    ? draft.description.split('\n').filter(Boolean)
                    : draft.description,
              })}
            />
          </>
        )}

        {tab === 'team' && (
          <>
            <SingletonEditor
              id="teamIntro"
              values={content.teamIntro}
              fields={[
                { key: 'eyebrow', label: 'Label', type: 'text' },
                { key: 'heading', label: 'Titel', type: 'text' },
              ]}
              onSaved={refresh}
            />
            <ListEditor
              list="team"
              items={content.team}
              fields={[
                { key: 'name', label: 'Naam', type: 'text' },
                { key: 'description', label: 'Functie', type: 'text' },
                { key: 'photoUrl', label: 'Foto', type: 'image' },
                { key: 'pdfPath', label: 'CV (PDF)', type: 'file' },
              ]}
              itemLabel={(item) => {
                const m = item as { name?: string; isImage?: boolean };
                if (m.isImage) return 'Logo (carrousel-afsluiter, geen teamlid)';
                return m.name || 'Nieuw teamlid';
              }}
              onSaved={refresh}
            />
          </>
        )}

        {tab === 'footer' && (
          <SingletonEditor
            id="footer"
            values={content.footer}
            fields={[
              { key: 'tagline', label: 'Ondertitel', type: 'text' },
              { key: 'email', label: 'E-mail', type: 'text' },
              { key: 'phone', label: 'Telefoon', type: 'text' },
              { key: 'address', label: 'Adres', type: 'text' },
              { key: 'addressUrl', label: 'Adres-link (Google Maps)', type: 'text' },
              { key: 'btwNumber', label: 'Btw-nummer', type: 'text' },
              { key: 'iban', label: 'IBAN', type: 'text' },
              { key: 'copyright', label: 'Copyright-tekst', type: 'text' },
            ]}
            onSaved={refresh}
          />
        )}
      </main>
    </div>
  );
}

// ---- shared field config + primitives -----------------------------------------------------

type FieldType = 'text' | 'textarea' | 'image' | 'file';
type FieldConfig = { key: string; label: string; type: FieldType };
type Draft = Record<string, unknown>;

function useStatus() {
  const [status, setStatus] = useState<{ type: 'ok' | 'error'; message: string } | null>(null);
  useEffect(() => {
    if (status?.type !== 'ok') return;
    const t = setTimeout(() => setStatus(null), 2500);
    return () => clearTimeout(t);
  }, [status]);
  return [status, setStatus] as const;
}

function Field({
  field,
  value,
  onChange,
  onUpload,
  busy,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
  busy: boolean;
}) {
  if (field.type === 'image' || field.type === 'file') {
    const url = typeof value === 'string' ? value : '';
    return (
      <div className="admin-field">
        <label htmlFor={field.key}>{field.label}</label>
        {field.type === 'image' && url && (
          <div className="admin-image-preview">
            <img src={optimizeUrl(url, 120)} alt="" />
          </div>
        )}
        {field.type === 'file' && url && (
          <p className="admin-status">
            Huidig bestand:{' '}
            <a href={url} target="_blank" rel="noreferrer">
              bekijken
            </a>
          </p>
        )}
        <div className="admin-file">
          <input
            id={field.key}
            type="file"
            className="admin-file-input"
            accept={field.type === 'image' ? 'image/*' : 'application/pdf'}
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
          <label htmlFor={field.key} className="admin-file-label">
            Bestand kiezen
          </label>
          <span className="admin-file-name">
            {field.type === 'image' ? 'Geen afbeelding gekozen' : 'Geen bestand gekozen'}
          </span>
        </div>
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="admin-field">
        <label htmlFor={field.key}>{field.label}</label>
        <textarea
          id={field.key}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="admin-field">
      <label htmlFor={field.key}>{field.label}</label>
      <input
        id={field.key}
        type="text"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ---- singleton sections -------------------------------------------------------------------

function SingletonEditor({
  id,
  values,
  fields,
  onSaved,
}: {
  id: string;
  values: Draft;
  fields: FieldConfig[];
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft>(values);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useStatus();

  useEffect(() => setDraft(values), [values]);

  async function save(overrides?: Draft) {
    const next = overrides ? { ...draft, ...overrides } : draft;
    setBusy(true);
    setStatus(null);
    try {
      await apiUpdateSite(id, next);
      await onSaved();
      setStatus({ type: 'ok', message: 'Opgeslagen' });
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function upload(key: string, file: File) {
    setBusy(true);
    setStatus(null);
    try {
      const url = await apiUploadFile(file);
      setDraft((d) => ({ ...d, [key]: url }));
      await save({ [key]: url });
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error).message });
      setBusy(false);
    }
  }

  return (
    <div className="admin-card">
      {fields.map((f) => (
        <Field
          key={f.key}
          field={f}
          value={draft[f.key]}
          busy={busy}
          onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
          onUpload={(file) => upload(f.key, file)}
        />
      ))}
      <div className="admin-actions">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={busy}
          onClick={() => save()}
        >
          Opslaan
        </button>
        {status && <span className={`admin-status ${status.type}`}>{status.message}</span>}
      </div>
    </div>
  );
}

// ---- About's blocks (nested inside the singleton, not a separate list) -------------------

function AboutEditor({ values, onSaved }: { values: Draft; onSaved: () => Promise<void> }) {
  const [draft, setDraft] = useState<Draft>(values);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useStatus();

  useEffect(() => setDraft(values), [values]);

  const blocks = (draft.blocks as AboutBlock[] | undefined) ?? [];

  function updateBlock(id: string, patch: Partial<AboutBlock>) {
    setDraft((d) => ({
      ...d,
      blocks: ((d.blocks as AboutBlock[]) ?? []).map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      await apiUpdateSite('about', draft);
      await onSaved();
      setStatus({ type: 'ok', message: 'Opgeslagen' });
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    setBusy(true);
    setStatus(null);
    try {
      const url = await apiUploadFile(file);
      const next = { ...draft, image: url };
      setDraft(next);
      await apiUpdateSite('about', next);
      await onSaved();
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-card">
      <Field
        field={{ key: 'eyebrow', label: 'Label', type: 'text' }}
        value={draft.eyebrow}
        busy={busy}
        onChange={(v) => setDraft((d) => ({ ...d, eyebrow: v }))}
        onUpload={() => {}}
      />
      <Field
        field={{ key: 'heading', label: 'Titel', type: 'text' }}
        value={draft.heading}
        busy={busy}
        onChange={(v) => setDraft((d) => ({ ...d, heading: v }))}
        onUpload={() => {}}
      />
      <Field
        field={{ key: 'image', label: 'Afbeelding', type: 'image' }}
        value={draft.image}
        busy={busy}
        onChange={() => {}}
        onUpload={upload}
      />

      <h3>Blokken</h3>
      {blocks.map((block) => (
        <div key={block.id} className="admin-card">
          <Field
            field={{ key: `${block.id}-title`, label: 'Titel', type: 'text' }}
            value={block.title}
            busy={busy}
            onChange={(v) => updateBlock(block.id, { title: v })}
            onUpload={() => {}}
          />
          <Field
            field={{ key: `${block.id}-body`, label: 'Tekst', type: 'textarea' }}
            value={block.body}
            busy={busy}
            onChange={(v) => updateBlock(block.id, { body: v })}
            onUpload={() => {}}
          />
        </div>
      ))}

      <div className="admin-actions">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={busy}
          onClick={save}
        >
          Opslaan
        </button>
        {status && <span className={`admin-status ${status.type}`}>{status.message}</span>}
      </div>
    </div>
  );
}

// ---- list sections (projects/team/workProcessSteps) ---------------------------------------

function ListEditor({
  list,
  items,
  fields,
  itemLabel,
  onSaved,
  normalizeIn,
  normalizeOut,
}: {
  list: ListName;
  items: ListItem[];
  fields: FieldConfig[];
  itemLabel: (item: Draft) => string;
  onSaved: () => Promise<void>;
  normalizeIn?: (item: Draft) => Draft;
  normalizeOut?: (draft: Draft) => Draft;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useStatus();
  const sorted = [...items].sort(
    (a, b) => (((a as Draft).order as number) ?? 0) - (((b as Draft).order as number) ?? 0),
  );

  async function withStatus(id: string, fn: () => Promise<void>) {
    setBusy(id);
    setStatus(null);
    try {
      await fn();
      await onSaved();
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error).message });
    } finally {
      setBusy(null);
    }
  }

  async function move(item: Draft, direction: -1 | 1) {
    const index = sorted.findIndex((i) => (i as Draft).id === item.id);
    const neighbor = sorted[index + direction] as Draft | undefined;
    if (!neighbor) return;
    await withStatus(String(item.id), async () => {
      await apiUpdateItem(list, item.id as string | number, { order: neighbor.order ?? 0 });
      await apiUpdateItem(list, neighbor.id as string | number, { order: item.order ?? 0 });
    });
  }

  return (
    <div>
      {sorted.map((item, index) => (
        <ListItemEditor
          key={String((item as Draft).id)}
          list={list}
          item={item as Draft}
          fields={fields}
          label={itemLabel(item as Draft)}
          busy={busy === String((item as Draft).id)}
          isFirst={index === 0}
          isLast={index === sorted.length - 1}
          onMove={(dir) => move(item as Draft, dir)}
          onDelete={() =>
            withStatus(String((item as Draft).id), () =>
              apiDeleteItem(list, (item as Draft).id as string | number),
            )
          }
          onSaved={onSaved}
          normalizeIn={normalizeIn}
          normalizeOut={normalizeOut}
        />
      ))}
      {status && <p className="admin-status error">{status.message}</p>}
      <button
        type="button"
        className="admin-btn admin-btn-secondary"
        onClick={() => withStatus('new', () => apiCreateItem(list).then(() => {}))}
      >
        + Nieuw item
      </button>
    </div>
  );
}

function ListItemEditor({
  list,
  item,
  fields,
  label,
  busy: reordering,
  isFirst,
  isLast,
  onMove,
  onDelete,
  onSaved,
  normalizeIn,
  normalizeOut,
}: {
  list: ListName;
  item: Draft;
  fields: FieldConfig[];
  label: string;
  busy: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onSaved: () => Promise<void>;
  normalizeIn?: (item: Draft) => Draft;
  normalizeOut?: (draft: Draft) => Draft;
}) {
  const [draft, setDraft] = useState<Draft>(() => (normalizeIn ? normalizeIn(item) : item));
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useStatus();

  // Only re-derives the draft when the underlying item actually changes (id or a refresh),
  // not on every parent render — this field-by-field draft would otherwise reset while
  // typing. normalizeIn is a fresh function identity every render (an inline prop in
  // AdminPanel), so including it as a dep would defeat the point of narrowing to `item.id`.
  // biome-ignore lint/correctness/useExhaustiveDependencies: see comment above
  useEffect(() => {
    setDraft(normalizeIn ? normalizeIn(item) : item);
  }, [item.id]);

  async function save(overrides?: Draft) {
    const merged = overrides ? { ...draft, ...overrides } : draft;
    const out = normalizeOut ? normalizeOut(merged) : merged;
    setBusy(true);
    setStatus(null);
    try {
      await apiUpdateItem(list, item.id as string | number, out);
      await onSaved();
      setStatus({ type: 'ok', message: 'Opgeslagen' });
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  async function upload(key: string, file: File) {
    setBusy(true);
    setStatus(null);
    try {
      const url = await apiUploadFile(file);
      setDraft((d) => ({ ...d, [key]: url }));
      await save({ [key]: url });
    } catch (err) {
      setStatus({ type: 'error', message: (err as Error).message });
      setBusy(false);
    }
  }

  return (
    <div className="admin-card">
      <div className="admin-item-header">
        <strong>{label}</strong>
        <div className="admin-reorder">
          <button type="button" disabled={isFirst || reordering} onClick={() => onMove(-1)}>
            ↑
          </button>
          <button type="button" disabled={isLast || reordering} onClick={() => onMove(1)}>
            ↓
          </button>
        </div>
      </div>

      {fields.map((f) => (
        <Field
          key={f.key}
          field={f}
          value={draft[f.key]}
          busy={busy}
          onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
          onUpload={(file) => upload(f.key, file)}
        />
      ))}

      <div className="admin-actions">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          disabled={busy}
          onClick={() => save()}
        >
          Opslaan
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-danger"
          disabled={busy}
          onClick={() => {
            if (confirm(`"${label}" verwijderen?`)) onDelete();
          }}
        >
          Verwijderen
        </button>
        {status && <span className={`admin-status ${status.type}`}>{status.message}</span>}
      </div>
    </div>
  );
}
