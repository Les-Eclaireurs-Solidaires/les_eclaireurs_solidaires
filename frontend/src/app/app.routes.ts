import { Routes } from '@angular/router';
import { Home } from './components/pages/home/home';
import { Login } from './authentication/login/login';
import { Register } from './authentication/register/register';
import { Authentication } from './authentication/authentication';
import { MissionsPage } from './components/pages/missions.page/missions.page';
import { MissionDetailPage } from './components/pages/mission-detail-page/mission-detail-page';

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
        path: 'mission/:uuid',
        component: MissionDetailPage
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
