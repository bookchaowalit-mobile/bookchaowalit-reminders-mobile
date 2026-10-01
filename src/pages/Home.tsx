import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonItemDivider,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  type Reminder,
  type ReminderGroups,
  type Repeat,
  REPEATS,
  complete,
  formatDue,
  groupReminders,
  parseReminders,
  toLocalInput,
  validateReminder,
} from '../lib/reminders';

const STORAGE_KEY = 'reminders:v1';

function load(): Reminder[] {
  try {
    return parseReminders(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

const SECTIONS: [keyof ReminderGroups, string][] = [
  ['overdue', 'Overdue'],
  ['today', 'Today'],
  ['upcoming', 'Upcoming'],
  ['done', 'Done'],
];

const Home: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>(load);
  const [title, setTitle] = useState('');
  const [due, setDue] = useState(() => toLocalInput(Date.now() + 3_600_000));
  const [repeat, setRepeat] = useState<Repeat>('none');
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
    } catch {
      // Storage can be unavailable (private mode); keep working in memory.
    }
  }, [reminders]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const groups = useMemo(() => groupReminders(reminders, now), [reminders, now]);

  const add = () => {
    const dueTs = new Date(due).getTime();
    const problem = validateReminder(title, dueTs);
    setError(problem);
    if (problem) return;
    setReminders((list) => [
      ...list,
      { id: `${Date.now()}-${list.length}`, title: title.trim(), due: dueTs, repeat, done: false },
    ]);
    setTitle('');
  };

  const toggle = (r: Reminder) =>
    setReminders((list) =>
      list.map((x) => (x.id !== r.id ? x : r.done ? { ...x, done: false } : complete(x, Date.now()))),
    );
  const remove = (id: string) => setReminders((list) => list.filter((x) => x.id !== id));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Reminders</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonList inset>
          <IonItem>
            <IonInput
              label="Remind me to"
              labelPlacement="stacked"
              maxlength={120}
              onIonInput={(e) => setTitle(String(e.detail.value ?? ''))}
              placeholder="Pay the electricity bill"
              value={title}
            />
          </IonItem>
          <IonItem>
            <IonInput
              label="When"
              labelPlacement="stacked"
              onIonInput={(e) => setDue(String(e.detail.value ?? ''))}
              type="datetime-local"
              value={due}
            />
          </IonItem>
          <IonItem>
            <IonSelect label="Repeat" onIonChange={(e) => setRepeat(e.detail.value)} value={repeat}>
              {REPEATS.map((r) => (
                <IonSelectOption key={r} value={r}>
                  {r}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </IonList>
        {error && (
          <IonText color="danger" role="alert">
            <p>{error}</p>
          </IonText>
        )}
        <IonButton expand="block" onClick={add}>
          Add reminder
        </IonButton>

        {reminders.length === 0 && (
          <p className="ion-text-center">
            <IonNote>No reminders yet.</IonNote>
          </p>
        )}
        <IonList>
          {SECTIONS.filter(([key]) => groups[key].length > 0).map(([key, label]) => (
            <React.Fragment key={key}>
              <IonItemDivider color={key === 'overdue' ? 'danger' : undefined}>
                <IonLabel>
                  {label} ({groups[key].length})
                </IonLabel>
              </IonItemDivider>
              {groups[key].map((r) => (
                <IonItemSliding key={r.id}>
                  <IonItem>
                    <IonCheckbox
                      aria-label={r.done ? `Mark ${r.title} not done` : `Complete ${r.title}`}
                      checked={r.done}
                      onIonChange={() => toggle(r)}
                      slot="start"
                    />
                    <IonLabel className="ion-text-wrap">
                      <h3 style={r.done ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}>{r.title}</h3>
                      <p>
                        {formatDue(r.due, now)}
                        {r.repeat !== 'none' && ` · repeats ${r.repeat}`}
                      </p>
                    </IonLabel>
                    <IonButton aria-label={`Delete ${r.title}`} fill="clear" onClick={() => remove(r.id)} slot="end">
                      Delete
                    </IonButton>
                  </IonItem>
                  <IonItemOptions side="end">
                    <IonItemOption color="danger" onClick={() => remove(r.id)}>
                      Delete
                    </IonItemOption>
                  </IonItemOptions>
                </IonItemSliding>
              ))}
            </React.Fragment>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};
export default Home;
