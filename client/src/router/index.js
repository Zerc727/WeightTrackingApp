import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';

const routes = [
  { path: '/', redirect: '/tracking' },
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  { path: '/tracking', component: () => import('../views/tracking/TrackingView.vue') },
  { path: '/tracking/new', component: () => import('../views/tracking/WorkoutView.vue') },
  { path: '/tracking/:id', component: () => import('../views/tracking/WorkoutView.vue') },
  { path: '/reports', component: () => import('../views/reports/ReportsView.vue') },
  {
    path: '/settings',
    component: () => import('../views/settings/SettingsView.vue'),
    children: [
      { path: '', redirect: '/settings/exercises' },
      { path: 'exercises', component: () => import('../views/settings/ExercisesSettings.vue') },
      { path: 'users', component: () => import('../views/settings/UsersSettings.vue'), meta: { adminOnly: true } },
      { path: 'password', component: () => import('../views/settings/PasswordSettings.vue') }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  // Access store after pinia is initialized
  const auth = useAuthStore();

  if (!auth.isLoggedIn && !to.meta.public) {
    return '/login';
  }
  if (auth.isLoggedIn && to.path === '/login') {
    return '/tracking';
  }
  if (auth.isLoggedIn && auth.mustChangePassword && to.path !== '/settings/password') {
    return '/settings/password';
  }
  if (to.meta.adminOnly && !auth.isAdmin) {
    return '/settings/exercises';
  }
});

export default router;
