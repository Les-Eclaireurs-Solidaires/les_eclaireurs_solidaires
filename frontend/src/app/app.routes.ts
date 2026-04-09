import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { MissionsPage } from './pages/missions.page/missions.page';
import { MissionDetailPage } from './pages/mission-detail-page/mission-detail-page';
import { Authentication } from './domain/authentication/authentication';
import { Login } from './domain/authentication/login/login';
import { Register } from './domain/authentication/register/register';
import { DashboardPage } from './pages/dashboard.page/dashboard.page';
import { authGuard } from './core/guards/auth.guard';

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
    {
        path: 'dashboard',
        component: DashboardPage,
        canActivate: [authGuard]
    },    
    {
        path: 'edit-mission/:uuid',
        component: MissionDetailPage
    },
    {
        path: 'mission/:uuid',
        component: MissionDetailPage
    },
    
];
