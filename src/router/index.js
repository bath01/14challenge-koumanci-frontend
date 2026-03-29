import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- Routes publiques (auth) ---
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true }
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true }
    },
    // --- Routes protegees (necessitent un token) ---
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/prejoin/:code',
      name: 'prejoin',
      component: () => import('@/views/PreJoinView.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/room/:code',
      name: 'room',
      component: () => import('@/views/RoomView.vue'),
      props: true,
      meta: { requiresAuth: true }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue')
    }
  ]
})

// --- Navigation guard : protection des routes ---
router.beforeEach((to) => {
  const token = localStorage.getItem('koumanci_token')

  // Route protegee sans token -> rediriger vers login
  if (to.meta.requiresAuth && !token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // Route guest (login/register) avec token -> rediriger vers home
  if (to.meta.guest && token) {
    return { name: 'home' }
  }
})

export default router
