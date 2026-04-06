import { CanActivateFn } from '@angular/router';
import { AuthService } from '../service/auth-service';
import { inject } from '@angular/core/primitives/di';

export const loginGuard: CanActivateFn = (route, state) => {
  if(inject(AuthService).isLoggedIn()){
    return false;
  }
  return true; 
};
