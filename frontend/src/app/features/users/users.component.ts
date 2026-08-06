import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { UserResponse } from '../../core/services/user';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: UserResponse[] = [];

  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (data: UserResponse[]) => {
        console.log('Backend response:', data);
        this.users = data;
        this.cdr.detectChanges(); // Force template update
      },
      error: (err) => {
        console.error('Failed to fetch users:', err);
      }
    });
  }
}
