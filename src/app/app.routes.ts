import type { Routes } from '@angular/router';

export const routes: Routes = [
  // ==================== AUTH ROUTES (Priority 1) ====================
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },

  // ==================== MAIN APP with LAYOUT ====================
  {
    path: '',
    loadComponent: () =>
      import('./shared/layout/layout.component').then((m) => m.LayoutComponent),
    children: [
      // ==================== HOME & EXPLORE TABS ====================
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then(
            (m) => m.HomeComponent
          ),
      },
      {
        path: 'explore',
        loadComponent: () =>
          import('./features/explore/explore.component').then(
            (m) => m.ExploreComponent
          ),
      },

      // ==================== BOOKINGS FEATURE (Priority 2) ====================
      {
        path: 'bookings',
        children: [
          // List bookings
          {
            path: '',
            loadComponent: () =>
              import('./features/bookings/bookings.component').then(
                (m) => m.BookingsComponent
              ),
          },
          // Booking detail view
          {
            path: ':id',
            loadComponent: () =>
              import(
                './features/bookings/booking-detail/booking-detail.component'
              ).then((m) => m.BookingDetailComponent),
          },
          // New booking form
          {
            path: 'new',
            loadComponent: () =>
              import(
                './features/bookings/booking-form/booking-form.component'
              ).then((m) => m.BookingFormComponent),
          },
          // Booking confirmation
          {
            path: ':id/confirmation',
            loadComponent: () =>
              import(
                './features/bookings/booking-confirmation/booking-confirmation.component'
              ).then((m) => m.BookingConfirmationComponent),
          },
        ],
      },

      // ==================== CARS FEATURE ====================
      {
        path: 'cars',
        children: [
          // Car list
          {
            path: '',
            loadComponent: () =>
              import('./features/cars/car-list/car-list.component').then(
                (m) => m.CarListComponent
              ),
          },
          // Car detail
          {
            path: ':id',
            loadComponent: () =>
              import('./features/cars/car-detail/car-detail.component').then(
                (m) => m.CarDetailComponent
              ),
          },
        ],
      },

      // ==================== MY CARS TAB (Owner) ====================
      {
        path: 'my-cars',
        loadComponent: () =>
          import('./features/my-cars/my-cars.component').then(
            (m) => m.MyCarsComponent
          ),
      },

      // ==================== PUBLISH TAB (Owner) ====================
      {
        path: 'publish',
        loadComponent: () =>
          import('./features/publish/publish.component').then(
            (m) => m.PublishComponent
          ),
      },

      // ==================== WALLET FEATURE (Priority 3) ====================
      {
        path: 'wallet',
        loadComponent: () =>
          import('./features/wallet/wallet.component').then(
            (m) => m.WalletComponent
          ),
      },

      // ==================== ACCOUNT & PROFILE (Priority 1) ====================
      {
        path: 'account',
        loadComponent: () =>
          import('./features/account/account.component').then(
            (m) => m.AccountComponent
          ),
      },
      {
        path: 'auth',
        children: [
          // Profile view
          {
            path: 'profile',
            loadComponent: () =>
              import(
                './features/auth/profile-view/profile-view.component'
              ).then((m) => m.ProfileViewComponent),
          },
          // Profile edit
          {
            path: 'profile/edit',
            loadComponent: () =>
              import(
                './features/auth/profile-edit/profile-edit.component'
              ).then((m) => m.ProfileEditComponent),
          },
        ],
      },

      // ==================== LEGACY ROUTES (Backwards Compatibility) ====================
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
