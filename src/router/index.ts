import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

// 导入页面组件
import Index from '../pages/Index.vue';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Index',
    component: Index,
    meta: { requiresAuth: true } // 需要登录访问
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true } // 仅未登录用户访问
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true } // 仅未登录用户访问
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

// 路由守卫
router.beforeEach((to, from, next) => {
  // 检查用户登录状态
  const isAuthenticated = localStorage.getItem('token') !== null;

  // 需要登录的页面
  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login' });
    return;
  }

  // 仅未登录用户访问的页面（登录/注册页）
  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: 'Index' });
    return;
  }

  next();
});

export default router;
