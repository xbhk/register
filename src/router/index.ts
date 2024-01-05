import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { createWebHistory} from 'vue-router';
import dashboard from '../components/dashboard.vue';
import Operation from '../components/Operation.vue';
import detect    from '../components/detect.vue';
import login     from '../components/login.vue';


export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login' 
  },
  {
    path: '/login',
    component: login,
    name: 'login',
    props:{
      msg: "登录"
    },
    meta: { requiresAuth: false }
  },
  {
    path: '/digram',
    component: dashboard,
    name: 'dashboard',
    props:{
      msg: "环境资源监测"
    },
    meta: { requiresAuth: true }
  },
  {
    path: '/Operation',
    component: Operation,
    name: 'Operation',
    meta: { requiresAuth: true }
  },
  {
    path: '/detect',
    component: detect,
    name: 'detect',
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  //history: createWebHistory(),
  history: createWebHashHistory(),
  routes: constantRoutes as RouteRecordRaw[],
  // 刷新时，滚动条位置还原
  scrollBehavior: () => ({ left: 0, top: 0 })
});

export function resetRouter() {
  router.replace({ path: '/' });
  location.reload();
}

function isLoggedIn() {
  return !!localStorage.getItem('userToken');
}

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 判断该路由是否需要登录权限
    if (!isLoggedIn()) {
      // 如果未登录，则跳转到登录页面
      next({ path: '/login', query: { redirect: to.fullPath } });
    } else {
      // 如果已登录，在这里可以进行其他的权限验证步骤
      next();
    }
  } else {
    // 对于不需要登录权限的路由，直接放行
    next();
  }
});

export default router;
