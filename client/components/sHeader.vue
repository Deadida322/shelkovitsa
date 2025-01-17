<script setup>
import { useAuthStore } from '#imports';
import menu from '~/assets/js/menu';
import useBreakpoints from '~/composables/breakpoints';

const authStore = useAuthStore();
const route = useRoute();
const active = ref(route.path);
const bp = useBreakpoints();
const mobileMenuVisible = ref(false);

const router = useRouter();

watch(active, (val) => {
    router.push(val);
});

watch(() => route.path, (val) => {
    active.value = val;
});
</script>

<template>
    <vs-navbar v-model="active" shadow :center-collapsed="bp.isTablet || bp.isMobile || bp.isSmallMobile" padding-scroll>
        <template #left>
            <div class="logo">
                SHELKOVITSA
            </div>
        </template>
        <vs-navbar-item
            v-for="item in menu"
            :id="item.to"
            :key="item.to"
            :active="active == item.to"
        >
            <div>{{ item.title }} </div>
        </vs-navbar-item>
        <template #right>
            <template v-if="!bp.isSmallMobile && !authStore.user">
                <vs-button type="flat">
                    <nuxt-link to="/signin">
                        Войти
                    </nuxt-link>
                </vs-button>
                <vs-button>
                    <nuxt-link to="/signup">
                        Регистрация
                    </nuxt-link>
                </vs-button>
            </template>
            <template v-else>
                <nuxt-link to="/deliver">
                    <v-btn variant="tonal" append-icon="mdi-cart-outline">
                        Профиль
                    </v-btn>
                </nuxt-link>
            </template>

            <v-btn v-if="bp.isTablet || bp.isMobile || bp.isSmallMobile" size="small" variant="tonal" class="ml-6" icon @click="mobileMenuVisible = !mobileMenuVisible">
                <v-icon>mdi-menu</v-icon>
            </v-btn>
        </template>
    </vs-navbar>

    <s-mobile-sidebar v-model="active" v-model:open="mobileMenuVisible" />
</template>

<style lang="scss">
    .logo {
        color: $primary;
        font-size: 24px;
        font-family: "Open Sans";
        font-weight: 500
    }
</style>
