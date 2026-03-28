import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/prejoin/:code',
      name: 'prejoin',
      component: () => import('@/views/PreJoinView.vue'),
      props: true
    },
    {
      path: '/room/:code',
      name: 'room',
      component: () => import('@/views/RoomView.vue'),
      props: true
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('@/views/AboutView.vue')
    }
  ]
})

export default router
