import { asyncRouterMap, constantRouterMap } from '@/config/router.config'
import cloneDeep from 'lodash.clonedeep'

/**
 * 过滤账户是否拥有某一个权限，并将菜单从加载列表移除
 *
 * @param permission 权限列表
 * @param route 路由
 * @returns {boolean}
 */
function hasPermission (permission, route) {
  // 路由meta配置了permission 判断权限 未配置不需要权限
  if (route.meta && route.meta.permission) {
    let flag = false
    for (let i = 0, len = permission.length; i < len; i++) {
      flag = route.meta.permission.includes(permission[i])
      if (flag) {
        return true
      }
    }
    return false
  }
  return true
}

/**
 * 单账户多角色时，使用该方法可过滤角色不存在的菜单
 *
 * @param roles
 * @param route
 * @returns {*}
 */
// eslint-disable-next-line
function hasRole(roles, route) {
  if (route.meta && route.meta.roles) {
    return route.meta.roles.includes(roles.id)
  } else {
    return true
  }
}

/**
 * 从配置表中 生成有权限的路由 动态生成最终路由表
 * @param {*} routerMap 配置的路由表
 * @param {*} roles 接口请求登录用户角色
 * @returns
 */
function filterAsyncRouter (routerMap, roles) {
  // 遍历路由表中的每个路由
  const accessedRouters = routerMap.filter(route => {
    // 判断这个路由是否有权限
    if (hasPermission(roles.permissionList, route)) {
      // 有儿子
      if (route.children && route.children.length) {
        // 递归儿子
        route.children = filterAsyncRouter(route.children, roles)
      }
      return true
    }
    return false
  })
  return accessedRouters
}

const permission = {
  state: {
    routers: constantRouterMap, // 最终动态生成的路由表
    addRouters: []
  },
  mutations: {
    SET_ROUTERS: (state, routers) => {
      state.addRouters = routers
      // 鉴权路由和无需权限路由表拼接 生成完整路由
      state.routers = constantRouterMap.concat(routers)
    }
  },
  actions: {
    GenerateRoutes ({ commit }, data) {
      return new Promise(resolve => {
        const { roles } = data
        const routerMap = cloneDeep(asyncRouterMap) // 深拷贝路由配置文件
        const accessedRouters = filterAsyncRouter(routerMap, roles)
        commit('SET_ROUTERS', accessedRouters)
        resolve()
      })
    }
  }
}

export default permission
