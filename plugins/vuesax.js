import Vuesax, { ID_INJECTION_KEY } from 'vuesax-alpha'
import 'vuesax-alpha/theme-chalk/index.css'
console.log(ID_INJECTION_KEY)
export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(Vuesax);
    nuxtApp.vueApp.provide(ID_INJECTION_KEY, {
        prefix: Math.floor(Math.random() * 10000),
        current: 0,
    })
})
