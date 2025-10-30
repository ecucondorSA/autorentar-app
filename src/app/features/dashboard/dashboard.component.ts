import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>AutoRentar</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Dashboard</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Bienvenido a AutoRentar</p>
          <p>Dashboard en desarrollo...</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Component class is intentionally empty (template-only component)
export class DashboardComponent {}
