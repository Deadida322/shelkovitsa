<script setup>
    import { NuxtLink } from '#components';
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
        mobileMenuVisible.value = false;
    });
</script>

<template>
    <vs-navbar
        v-model="active"
        shadow
        :center-collapsed="bp.isTablet || bp.isMobile || bp.isSmallMobile"
        padding-scroll
    >
        <template #left>
            <NuxtLink to="/">
                <div class="logo">
                    SHELKOVITSA
                </div>
            </NuxtLink>
        </template>
        <vs-navbar-item
            v-for="item in menu"
            :id="item.to"
            :key="item.to"
            class="d-none d-sm-flex"
            :active="active === item.to"
        >
            <div>{{ item.title }} </div>
        </vs-navbar-item>
        <template #right>
            <client-only>
                <template v-if="authStore.user">
                    <NuxtLink to="/deliver">
                        <v-btn
                            variant="tonal"
                            size="small"
                            icon="mdi-cart-outline"
                        />
                    </NuxtLink>
                </template>
                <template v-else-if="!authStore.loading">
                    <vs-button class="d-none d-sm-block" type="flat">
                        <NuxtLink to="/signin">
                            Войти
                        </NuxtLink>
                    </vs-button>
                    <NuxtLink to="/signup">
                        <vs-button class="d-none d-sm-block">
                            Регистрация
                        </vs-button>
                    </NuxtLink>
                </template>
            </client-only>

            <v-btn
                class="d-sm-none d-block ml-6"
                size="small"
                variant="tonal"
                icon
                @click="mobileMenuVisible = !mobileMenuVisible"
            >
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
