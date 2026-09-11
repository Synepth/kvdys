import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { SidebarComponent } from './shared/components/sidebar/sidebar';
import { FooterComponent } from './shared/components/footer/footer';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container';
import { AuthService } from './core/services/auth.service';
import { SidebarService } from './core/services/sidebar.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
    FooterComponent,
    ToastContainerComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'frontend';
  readonly authService = inject(AuthService);
  readonly sidebarService = inject(SidebarService);
}

