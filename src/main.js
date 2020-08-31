import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import NProgress from 'nprogress' // 引入nprogress插件
import 'nprogress/nprogress.css' // 这个nprogress样式必须引入
import axios from 'axios'
import echarts from 'echarts'
import ZkTable from 'vue-table-with-tree-grid'
import VueQuillEditor from 'vue-quill-editor'
import 'quill/dist/quill.core.css' // import styles
import 'quill/dist/quill.snow.css' // for snow theme
import 'quill/dist/quill.bubble.css' // for bubble theme
import { hasPermission } from './utils/permissionDirect'

const Plugins = [ hasPermission ]
Plugins.map((plugin) => {
  Vue.use(plugin)
})

Vue.use(VueQuillEditor)
Vue.use(ZkTable)
Vue.use(echarts)

NProgress.configure({ ease: 'ease', speed: 500 })
NProgress.configure({ minimum: 0.3 })
Vue.prototype.$http = axios

// 这是线上的API接口,如果使用本地的可以注释选择本地的服务

// axios.defaults.baseURL = 'https://www.zykhome.club/api/'
axios.defaults.baseURL = 'http://www.localhost:8002/'

/**
 *  axios请求拦截器
 */
axios.interceptors.request.use(config => {
  NProgress.start() // 设置加载进度条(开始..)
  config.headers.Authorization = window.localStorage.getItem('JWT_TOKEN')
  return config
}
  , error => {
  return Promise.reject(error)
})

/**
 * axios响应拦截器
 */
axios.interceptors.response.use(
  function (response) {
    NProgress.done() // 设置加载进度条(结束..)
    if (response.data.code === 2001) { // 如果返回的code==2001说明token错误或者token过期
      window.localStorage.clear()
      // var vm=new Vue();
      // vm.$message.error("您的登入状态已失效,请您重新登入~")
      return router.push('/login')
    } else {
      return response
    }
  },
  function (error) {
    return Promise.reject(error)
  }
)
/**
 * 自定义权限指令
 */

Vue.config.productionTip = false
Vue.use(ElementUI)
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
