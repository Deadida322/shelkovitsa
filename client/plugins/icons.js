import * as VuesaxAlphaIconsVue from '@vuesax-alpha/icons-vue';

export default defineNuxtPlugin((nuxtApp) => {
    for (const [key, component] of Object.entries(VuesaxAlphaIconsVue)) {
        nuxtApp.vueApp.component(`VsIcon${key}`, component);
    }
});
