import router from './router'
import store from './store'
import storage from 'store' // 第三方插件
import NProgress from 'nprogress' // 第三方插件 progress bar
import '@/components/NProgress/nprogress.less' // progress bar custom style
import notification from 'ant-design-vue/es/notification'
import { setDocumentTitle, domTitle } from '@/utils/domUtil'
import { ACCESS_TOKEN } from '@/store/mutation-types'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const allowList = ['login', 'register', 'registerResult'] // no redirect allowList
const loginRoutePath = '/user/login'
const defaultRoutePath = '/dashboard/workplace'

// generate dynamic router 登录后生成路由
function generateRoutes (roles, to, from, next) {
  store.dispatch('GenerateRoutes', { roles }).then(() => {
    // 根据roles权限生成可访问的路由表
    // VueRouter@3.5.0+ New API
    store.getters.addRouters.forEach(r => { // 将接口返回权限路由一次添加到路由表中
      router.addRoute(r)
    })
    // 请求带有 redirect 重定向时，登录自动重定向到该地址
    const redirect = decodeURIComponent(from.query.redirect || to.path)
    if (to.path === redirect) {
      // set the replace: true so the navigation will not leave a history record
      next({ ...to, replace: true })
    } else {
      // 跳转到目的路由
      next({ path: redirect })
    }
  })
}

router.beforeEach((to, from, next) => {
  NProgress.start() // start progress bar
  to.meta && typeof to.meta.title !== 'undefined' && setDocumentTitle(`to.meta.title - ${domTitle}`)
  /* has token */
  if (storage.get(ACCESS_TOKEN)) {
    // 已登录
    if (to.path === loginRoutePath) { // 登录态下跳转登录页 不允许 next到首页
      next({ path: defaultRoutePath })
      NProgress.done()
    } else { // 跳转到其他页面：1.首次登录
      // check login user.roles is null
      if (store.getters.roles.length === 0) {
        // request login userInfo
        store
          .dispatch('GetInfo') // 根据登录的token获取用户路由信息
          .then(res => {
            const roles = res.result && res.result.role // 接口获取用户信息
            generateRoutes(roles, to, from, next)
          })
          .catch(() => {
            notification.error({
              message: '错误',
              description: '请求用户信息失败，请重试'
            })
            // 失败时，获取用户信息失败时，调用登出，来清空历史保留信息
            store.dispatch('Logout').then(() => {
              next({ path: loginRoutePath, query: { redirect: to.fullPath } })
            })
          })
      } else {
        next()
      }
    }
  } else {
    // 未登录
    if (allowList.includes(to.name)) {
      // 在免登录名单，直接进入
      next()
    } else {
      next({ path: loginRoutePath, query: { redirect: to.fullPath } })
      NProgress.done() // if current page is login will not trigger afterEach hook, so manually handle it
    }
  }
})

router.afterEach(() => {
  NProgress.done() // finish progress bar
})

// 1. 登录页面调用login接口登录，login接口请求成功，在cookie中写入SET_TOKEN
// 2. 登录成功后，跳转路由到 / 路径，触发beforeEach， 调用getInfo接口请求权限，这里框架给了两种选择：
//    a) 接口返回角色拍平路由表，前端将拍平的路由表生成完整的路由
//    b) 接口返回角色路由权限，根据权限过滤出有权限的路由
// beforeEach => store.dispatch('GetInfo') => store.dispatch('GenerateRoutes', { roles })
