import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../service/auth-service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiResponse } from '../models/api-response';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/internal/operators/finalize';

@Component({
  selector: 'app-login',
  imports: [MatInputModule, MatIconModule, FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email!:string;
  password!:string;

  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private router = inject(Router);

  hide = signal(false);
  hidePassword = true;
  loading = false;

  onLogin() {

  if (this.loading) return;

  this.loading = true;

  this.authService.login(this.email, this.password)
   .pipe(
      finalize(() => setTimeout(() => this.loading = false, 300)) // ✅ always executes
    )
  .subscribe({
    next: () => {
      this.snackBar.open("Login successful", "Close", { duration: 2000 });
      this.router.navigate(['/']); 
    },
    error: (err: HttpErrorResponse) => {
      let error = err.error as ApiResponse<string>;
      this.snackBar.open(error.error, "Close", { duration: 3000 });
    }
    
  });

}
}

