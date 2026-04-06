import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/api-response';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  
  private baseUrl = 'http://localhost:5000/api/account';
  private token = "token";
  private httpClient = inject(HttpClient);


   // ✅ Signal instead of getter
  currentLoggedUser = signal<User | null>(this.loadUserFromStorage());

  private loadUserFromStorage(): User | null {
    const raw = localStorage.getItem('user');
    if (!raw || raw === '{}') return null;
    return JSON.parse(raw);
  }
  
  register(data: FormData): Observable<ApiResponse<string>> {
    return this.httpClient.post<ApiResponse<string>>(`${this.baseUrl}/register`, data)
      .pipe(tap((response) => {
        localStorage.setItem(this.token, response.data);
      }));
  }

  login(email: string, password: string): Observable<ApiResponse<string>> {
    return this.httpClient.post<ApiResponse<string>>(`${this.baseUrl}/login`, { email, password })
      .pipe(tap((response) => {
        if (response.isSuccess) {
          localStorage.setItem(this.token, response.data);
          this.me().subscribe({
              next: (res) => console.log('ME API SUCCESS', res),
              error: (err) => console.error('ME API ERROR', err)
            });
        }
        return response;
      }));

  }

  me(): Observable<ApiResponse<User>> {
    return this.httpClient.get<ApiResponse<User>>(`${this.baseUrl}/me`, {
      headers: {
        "Authorization": `Bearer ${this.getAccessToken}`,
      },
    })
      .pipe(tap((response) => {
        if (response.isSuccess) {
          localStorage.setItem('user', JSON.stringify(response.data));
          console.log('User saved:', response.data);
          this.currentLoggedUser.set(response.data); // Update signal with user data
          
        }
      }
      ));
  }

  get getAccessToken(): string | null {
    return localStorage.getItem(this.token) || '';
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.token);
  }
  
  logout() {
    localStorage.removeItem(this.token);
    localStorage.removeItem('user');
    this.currentLoggedUser.set(null); // Clear user signal on logout
  }

  // get currentLoggedUser(): User | null {
  //   const user: User = JSON.parse(localStorage.getItem('user') || '{}');
  //   return user;
  // }
}

