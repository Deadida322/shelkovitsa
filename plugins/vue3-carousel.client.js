import { Carousel, Slide, Pagination, Navigation } from 'vue3-carousel'

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.component(`s-carousel`, Carousel);
    nuxtApp.vueApp.component(`s-slide`, Slide);
    nuxtApp.vueApp.component(`s-pagination`, Pagination);
    nuxtApp.vueApp.component(`s-navigation`, Navigation);
})