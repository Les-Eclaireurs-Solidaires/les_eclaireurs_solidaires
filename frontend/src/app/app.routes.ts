import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Login } from './authentication/login/login';
import { Register } from './authentication/register/register';
import { Authentication } from './authentication/authentication';
import { MissionsPage } from './components/missions.page/missions.page';
import { MissionDetail } from './components/mission-detail/mission-detail';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'missions',
        component: MissionsPage
    },
    {
        path: 'missions/:id',
        component: MissionDetail
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
