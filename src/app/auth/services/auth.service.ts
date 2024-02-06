import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthStatus, CheckTokenResponse, LoginResponse, User } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl: string = environment.baseUrl;
  private _currentUser?: User;
  private _authStatus?: AuthStatus;
  
  constructor(
    private readonly http: HttpClient
    ) { }

    private setAuthentication(user: User, token: string): boolean {
      this._currentUser = user;
      this._authStatus = AuthStatus.authenticated;
      localStorage.setItem('token', token);

      return true;
    }
    
    get currentUser(): User | undefined {
      if ( !this._currentUser ) return undefined;
      return { ...this._currentUser };
    }
    
    get authStatus(): AuthStatus {
      if ( !this._authStatus ) return AuthStatus.checking;
      return this._authStatus;
    
    }

    login( email: string, password: string ) : Observable<boolean> {

      const url = `${ this.baseUrl }/auth/login`;
      const body = { email, password };

      return this.http.post<LoginResponse>( url, body )
        .pipe(
          map( ({ user, token }) => this.setAuthentication( user, token )),

          catchError( err => throwError(() => err.error.message )
          )
        )

      
    }

    //checkAuthentication //create this endpoint
    checkAuthStatus(): Observable<boolean> {
      const url = `${ this.baseUrl }/auth/check-token`;
      const token = localStorage.getItem('token');

      if ( !token ) return of(false);

      const headers = new HttpHeaders()
        .set('Authorization', `Bearer ${ token }`);

      return this.http.get<CheckTokenResponse>(url, { headers })
        .pipe(
          map( ({ token, user }) => this.setAuthentication( user, token )),
          catchError( () => {
            this._authStatus = AuthStatus.notAuthenticated;
            return of(false)
          })
        )
    }

    logout() {
      this._currentUser = undefined;
      localStorage.clear();
    }

}
