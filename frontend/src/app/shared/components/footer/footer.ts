import { Component } from '@angular/core';

export const APP_VERSION = 'v0.11.7';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  appVersion = 'v0.11.7';
}
