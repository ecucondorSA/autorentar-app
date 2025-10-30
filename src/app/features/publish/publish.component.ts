import { Component } from '@angular/core'
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone'

@Component({
  selector: 'app-publish',
  standalone: true,
  imports: [IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent],
  template: `
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header>
          <ion-card-title>Publicar Auto</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Publica tu auto para alquilar</p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
})
/* eslint-disable @typescript-eslint/no-extraneous-class -- Placeholder component, will be implemented later */

export class PublishComponent {}
/* eslint-enable @typescript-eslint/no-extraneous-class -- End of placeholder component */
