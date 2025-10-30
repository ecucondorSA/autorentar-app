import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(
            (m) => m.LoginComponent
          ),
      },
      {
        path: 'cars',
        loadComponent: () =>
          import('./features/cars/car-list/car-list.component').then(
            (m) => m.CarListComponent
          ),
      },
      {
        path: 'cars/:id',
        loadComponent: () =>
          import('./features/cars/car-detail/car-detail.component').then(
            (m) => m.CarDetailComponent
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full',
      },
    ],
  },
];
