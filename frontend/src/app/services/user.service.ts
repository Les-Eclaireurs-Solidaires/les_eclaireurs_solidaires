import { inject, Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DisplayMode, UserModel } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private userSubject: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>(new UserModel());
  public user$: Observable<UserModel> = this.userSubject.asObservable();

  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isAuthenticated$: Observable<boolean> = this.isAuthenticated.asObservable();

  private displayMode: BehaviorSubject<DisplayMode> = new BehaviorSubject<DisplayMode>(
    'VOLUNTEER_MODE',
  );
  public displayMode$: Observable<DisplayMode> = this.displayMode.asObservable();

  router: Router = inject(Router);

  constructor() {}

  public login(user: UserModel): void {
    this.userSubject.next(user);
    this.isAuthenticated.next(true);
  }

  public logout(): void {
    this.userSubject.next(new UserModel());
    this.isAuthenticated.next(false);
    this.router.navigate(['login']);
  }

  public get IsAuthenticated(): boolean {
    return this.isAuthenticated.getValue();
  }

  public setDisplayMode(mode: DisplayMode): void {
    this.displayMode.next(mode);
  }
}
