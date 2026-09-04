import { Component } from '@angular/core';

export const APP_VERSION = 'v0.1.21';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  appVersion = 'v0.1.21';
}
