import { Routes } from '@angular/router';
import { Home } from './shared/pages/home/home';
import { MissionsPage } from './domain/mission/pages/missions.page/missions.page';
import { Authentication } from './domain/authentication/pages/authentication/authentication';
import { Login } from './domain/authentication/components/login/login';
import { Register } from './domain/authentication/components/register/register';
import { DashboardPage } from './domain/user/pages/dashboard.page/dashboard.page';
import { MissionDetailPage } from './domain/mission/pages/mission-detail-page/mission-detail-page';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'mission/:uuid',
    component: MissionDetailPage,
  },
  {
    path: 'missions',
    component: MissionsPage,
  },
  {
    path: 'login',
    component: Authentication,
    children: [
      {
        path: '',
        component: Login,
      },
      {
        path: 'register',
        component: Register,
      },
    ],
  },
  {
    path: 'dashboard',
    component: DashboardPage,
    children: [
      {
        path: 'profile',
        loadComponent: () =>
          import('./domain/user/pages/components/profil.page/profil.page').then(
            (m) => m.ProfilPage,
          ),
      },
      {
        path: 'myMissions',
        loadComponent: () =>
          import('./domain/user/pages/components/my-missions-page/my-missions-page').then(
            (m) => m.MyMissionsPage,
          ),
      },
      {
        path: 'myMissionCreated',
        loadComponent: () =>
          import('./domain/user/pages/components/my-missions-created/my-missions-created').then(
            (m) => m.MyMissionsCreated,
          ),
      },
      {
        path: 'myMissionOrganized',
        loadComponent: () =>
          import('./domain/user/pages/components/my-missions-organized/my-missions-organized').then(
            (m) => m.MyMissionsOrganized,
          ),
      },
      {
        path: 'createMission',
        loadComponent: () =>
          import('./domain/mission/pages/mission-form-page/mission-form-page').then(
            (m) => m.MissionFormPage,
          ),
      },
      {
        path: 'mission/:uuid',
        loadComponent: () =>
          import('./domain/mission/pages/mission-detail-page/mission-detail-page').then(
            (m) => m.MissionDetailPage,
          ),
      },
      {
        path: 'mission/:uuid/edit',
        loadComponent: () =>
          import('./domain/mission/pages/mission-form-page/mission-form-page').then(
            (m) => m.MissionFormPage,
          ),
      },
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
    ],
  },
];
