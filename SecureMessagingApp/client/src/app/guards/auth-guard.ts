import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { inject } from '@angular/core/primitives/di';

export const authGuard: CanActivateFn = (route, state) => {
    if(inject(AuthService).isLoggedIn()){
        return true;
    }
    inject(Router).navigate(['/login']);   //if not authenticated, redirect to login page
    return false;
};
