import type { Routes } from '@angular/router';

export const routes: Routes = [
  // Login (without layout)
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },

  // App with tabs layout
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      // Home tab
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then(
            (m) => m.HomeComponent
          ),
      },
      // Explore tab (renter)
      {
        path: 'explore',
        loadComponent: () =>
          import('./features/explore/explore.component').then(
            (m) => m.ExploreComponent
          ),
      },
      // Bookings tab (renter)
      {
        path: 'bookings',
        loadComponent: () =>
          import('./features/bookings/bookings.component').then(
            (m) => m.BookingsComponent
          ),
      },
      // My Cars tab (owner)
      {
        path: 'my-cars',
        loadComponent: () =>
          import('./features/my-cars/my-cars.component').then(
            (m) => m.MyCarsComponent
          ),
      },
      // Publish tab (owner)
      {
        path: 'publish',
        loadComponent: () =>
          import('./features/publish/publish.component').then(
            (m) => m.PublishComponent
          ),
      },
      // Wallet tab
      {
        path: 'wallet',
        loadComponent: () =>
          import('./features/wallet/wallet.component').then(
            (m) => m.WalletComponent
          ),
      },
      // Account tab
      {
        path: 'account',
        loadComponent: () =>
          import('./features/account/account.component').then(
            (m) => m.AccountComponent
          ),
      },

      // Legacy routes (backwards compatibility)
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

      // Default redirect
      {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full',
      },
    ],
  },
];
