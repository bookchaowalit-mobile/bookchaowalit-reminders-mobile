import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React from 'react';

const Home: React.FC = () => (
  <IonPage>
    <IonHeader><IonToolbar><IonTitle>Reminders</IonTitle></IonToolbar></IonHeader>
    <IonContent className="ion-padding">
      <h2>Reminders</h2>
      <p>Reminders — Mobile app (ionic)</p>
    </IonContent>
  </IonPage>
);
export default Home;
