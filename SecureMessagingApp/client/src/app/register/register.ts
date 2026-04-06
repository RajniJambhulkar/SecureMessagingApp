import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../service/auth-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon'; 
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../models/api-response';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  userName: string = '';
  email: string = '';
  password: string = '';
  fullName: string = '';
  profilePicture: string = '/avatar-icon.svg';
  profileImage: File | null = null;

  authService = inject(AuthService);
  snackbar = inject(MatSnackBar);
  router = inject(Router);
  hide = signal(false);

  hidePassword = true;
  loading = false;

 onImageSelected(event: any) {
  const file = event.target.files[0];

  if (file) {
    this.profileImage = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.profilePicture = e.target?.result as string;
      console.log(e.target?.result);
    };
    reader.readAsDataURL(file);
    console.log(this.profilePicture);
  }
}


  onRegister() {
    const formData = new FormData();
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('userName', this.userName);
    formData.append('fullName', this.fullName);
    if (this.profileImage) {
      formData.append('profileImage', this.profileImage);
    }

    this.authService.register(formData).subscribe({
      next: () => {
        this.snackbar.open('Registration successful!', 'Close', { duration: 3000 });
      },
      error: (error: HttpErrorResponse) => {
        let err = error.error as ApiResponse<string>;
        this.snackbar.open(err.error, "Close", { duration: 3000 });
      },
      complete: () => {
        this.router.navigate(['/']);
      }
    });

    // this.loading = true;

    // // simulate API call
    // setTimeout(() => {
    //   this.loading = false;
    //   console.log("User Registered");
    // }, 2000);

  }
};
  

    

