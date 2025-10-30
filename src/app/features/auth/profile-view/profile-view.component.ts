import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div data-testid="profile-view-container">
      <h2>Profile View</h2>
      <div data-testid="name-display">Name:</div>
      <div data-testid="email-display">Email:</div>
      <button data-testid="edit-button">Edit Profile</button>
    </div>
  `,
})
export class ProfileViewComponent {
  // Stub component - prevent empty class error
  readonly isLoading = signal(false);
}
