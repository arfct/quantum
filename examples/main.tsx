import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../dist/tokens.css';
import '../src/styles/quantum.css';
import './gallery.css';
import {
  BottomNavigation,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  Fab,
  Icon,
  Snackbar,
  Switch,
  TextField,
} from '../src';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="overline">{title}</h2>
      {children}
    </section>
  );
}

function Gallery() {
  const [dark, setDark] = useState(false);
  const icons = ['home', 'favorite', 'search', 'settings', 'delete', 'share', 'add_circle', 'check_circle'];
  return (
    <main className="gallery">
      <header>
        <h1 className="headline4">Quantum</h1>
        <Switch
          label="Dark theme"
          checked={dark}
          onChange={(on) => {
            setDark(on);
            document.documentElement.dataset.theme = on ? 'dark' : 'light';
          }}
        />
      </header>

      <Section title="Icon">
        <div className="row" style={{ color: 'var(--text-medium)', gap: 16 }}>
          {icons.map((n) => <Icon key={n} name={n} />)}
        </div>
        <div className="row" style={{ color: 'var(--primary)', gap: 16 }}>
          {icons.map((n) => <Icon key={n} name={n} fill />)}
        </div>
      </Section>

      <Section title="Button">
        <div className="row">
          <Button variant="contained">Save</Button>
          <Button variant="contained" icon="add">Add item</Button>
          <Button variant="outlined">Preview</Button>
          <Button>Cancel</Button>
          <Button variant="contained" disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Fab">
        <div className="row">
          <Fab icon="add" aria-label="Create" />
          <Fab icon="edit" mini aria-label="Edit" />
          <Fab icon="navigation" label="Navigate" />
        </div>
      </Section>

      <Section title="Card">
        <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
          <Card
            media
            title="Our changing planet"
            subtitle="by Kurt Wagner"
            actions={<><Button>Read</Button><Button>Bookmark</Button></>}
          >
            Visit ten places on our planet that are undergoing the biggest changes today.
          </Card>
          <Card outlined title="Outlined card" subtitle="No elevation" style={{ width: 280 }}>
            Use outlined cards to group content without adding depth.
          </Card>
        </div>
      </Section>

      <Section title="TextField">
        <div className="row" style={{ gap: 24 }}>
          <TextField label="Name" defaultValue="Ada Lovelace" helperText="As shown on your ID" />
          <TextField label="Email" variant="outlined" helperText="We never share it" />
          <TextField label="Password" type="password" defaultValue="abc" error helperText="Use 8 or more characters" />
        </div>
      </Section>

      <Section title="Chip">
        <div className="row">
          <Chip icon="place">Nearby</Chip>
          <Chip selected>Vegetarian</Chip>
          <Chip selected={false}>Open now</Chip>
          <Chip outlined icon="event">Set date</Chip>
        </div>
      </Section>

      <Section title="Checkbox and Switch">
        <div className="row">
          <Checkbox label="Email updates" defaultChecked />
          <Checkbox label="SMS updates" />
          <Checkbox label="Unavailable" disabled />
        </div>
        <div className="row">
          <Switch label="Wi-Fi" defaultChecked />
          <Switch label="Bluetooth" />
          <Switch label="Airplane mode" disabled />
        </div>
      </Section>

      <Section title="BottomNavigation">
        <div className="col">
          <BottomNavigation
            items={[
              { icon: 'restore', label: 'Recents' },
              { icon: 'favorite', label: 'Favorites' },
              { icon: 'location_on', label: 'Nearby' },
            ]}
          />
        </div>
      </Section>

      <Section title="Dialog">
        <Dialog contained title="Discard draft?" actions={<><Button>Cancel</Button><Button>Discard</Button></>}>
          Your unsent message will be deleted. This cannot be undone.
        </Dialog>
      </Section>

      <Section title="Snackbar">
        <div className="row">
          <Snackbar message="Photo archived" action="Undo" />
        </div>
      </Section>

      <Section title="Squircle">
        <div className="tiles">
          <figure>
            <div className="tile rounded-squircle" style={{ background: 'var(--primary)' }} />
            <figcaption className="caption">24px (default)</figcaption>
          </figure>
          <figure>
            <div className="tile rounded-squircle" style={{ width: 192, background: 'var(--secondary)' }} />
            <figcaption className="caption">24px on a 192 × 96 box</figcaption>
          </figure>
          <figure>
            <div
              className="tile rounded-squircle"
              style={{ background: 'var(--slate-700)', ['--squircle-radius' as string]: '12px' }}
            />
            <figcaption className="caption">12px</figcaption>
          </figure>
        </div>
      </Section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Gallery />
  </StrictMode>,
);
