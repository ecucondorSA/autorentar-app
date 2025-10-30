import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div data-testid="profile-edit-container">
      <h2>Edit Profile</h2>
      <form data-testid="profile-edit-form">
        <input data-testid="name-input" type="text" placeholder="Name" />
        <input data-testid="email-input" type="email" placeholder="Email" />
        <button data-testid="save-button" type="submit">Save</button>
      </form>
    </div>
  `,
})
export class ProfileEditComponent {
  // Stub component - prevent empty class error
  readonly isLoading = signal(false);
}
