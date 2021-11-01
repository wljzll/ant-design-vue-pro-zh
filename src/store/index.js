import Vue from 'vue'
import Vuex from 'vuex'

import app from './modules/app'
import user from './modules/user'

// 两种路由生成方式：1. 接口返回权限列表，前端配置路由对象，结合接口返回的权限，动态生成完整的路由表 2. 接口返回拍平的路由表，前端根据id和parentId关系，生成路由表
// default router permission control
import permission from './modules/permission'

import getters from './getters'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    app,
    user,
    permission
  },
  state: {},
  mutations: {},
  actions: {},
  getters
})
