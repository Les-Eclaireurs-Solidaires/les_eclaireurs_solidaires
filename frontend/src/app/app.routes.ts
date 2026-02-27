import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './authentication/login/login';
import { Register } from './authentication/register/register';
import { Authentication } from './authentication/authentication';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'login',
        component: Authentication,
        children: [
                {
                    path: '',
                    component: Login
                },
                {
                    path: 'register',
                    component: Register
                }
            ]
    },    
];
