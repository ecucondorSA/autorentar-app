import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ion-footer data-testid="app-footer">
      <ion-toolbar>
        <div class="footer__content">
          <div data-testid="copyright">© {{ year }} AutoRentar</div>
          <nav data-testid="social-links" class="footer__links">
            <a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>
            <a href="https://facebook.com" target="_blank" rel="noopener">Facebook</a>
          </nav>
          <nav data-testid="legal-links" class="footer__links">
            <a href="/terminos">Términos</a>
            <a href="/privacidad">Privacidad</a>
          </nav>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
    .footer__content {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .footer__links {
      display: flex;
      gap: 0.75rem;
    }

    a {
      color: inherit;
      text-decoration: none;
    }
    `,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FooterComponent {
  readonly year = new Date().getFullYear();
}
