<script setup>
import { NuxtLink } from '#components';
import { useAuthStore, useFiltersStore } from '#imports';
import useBreakpoints from '@/composables/breakpoints';
import menu from '~/assets/js/menu';

const authStore = useAuthStore();
const filtersStore = useFiltersStore();
const route = useRoute();
const active = ref(route.path);
const bp = useBreakpoints();
const mobileMenuVisible = ref(false);
/**
 * До mount SSR HTML и клиент должны совпасть:
 * - ширина viewport на SSR неизвестна
 * - /me на SSR часто без access_token (кука API-хоста) → user расходится
 */
const navReady = ref(false);

const router = useRouter();

const isNavCompact = computed(() => navReady.value && bp.isNavCompact);
const isNavWide = computed(() => !navReady.value || bp.isNavWide);

/** Базовое меню на SSR/гидрации; «ЗАКАЗЫ» — только после mount */
const menuItems = computed(() => {
    const items = [...menu];
    if (!navReady.value || !authStore.user) return items;
    const contactsIdx = items.findIndex((item) => item.to === '/contacts');
    const insertAt = contactsIdx >= 0 ? contactsIdx : items.length;
    items.splice(insertAt, 0, { title: 'ЗАКАЗЫ', to: '/orders' });
    return items;
});

onMounted(() => {
    navReady.value = true;
});

watch(active, (val) => {
    // «Каталог» всегда с сохранёнными фильтрами (возврат с карточки товара)
    if (val === '/catalog') {
        router.push({ path: '/catalog', query: filtersStore.toQuery() });
        return;
    }
    router.push(val);
});

watch(
    () => route.path,
    (val) => {
        active.value = val;
        mobileMenuVisible.value = false;
    },
);

watch(isNavCompact, (compact) => {
    if (!compact) mobileMenuVisible.value = false;
});

function isMenuActive(to) {
    if (to === '/catalog') {
        return route.path.startsWith('/catalog');
    }
    return active.value === to;
}
</script>

<template>
    <vs-navbar v-model="active" shadow :center-collapsed="isNavCompact" padding-scroll>
        <template #left>
            <NuxtLink to="/">
                <div class="logo">SHELKOVITSA</div>
            </NuxtLink>
        </template>
        <vs-navbar-item
            v-for="item in menuItems"
            v-show="isNavWide"
            :id="item.to"
            :key="item.to"
            :active="isMenuActive(item.to)"
        >
            <div>{{ item.title }}</div>
        </vs-navbar-item>
        <template #right>
            <client-only>
                <template v-if="authStore.user">
                    <NuxtLink v-if="authStore.user.isAdmin" to="/admin" class="mr-2">
                        <v-btn
                            variant="tonal"
                            size="small"
                            icon="mdi-cog-outline"
                            title="Админка"
                        />
                    </NuxtLink>
                    <v-btn
                        v-show="isNavWide"
                        variant="tonal"
                        size="small"
                        icon="mdi-logout"
                        title="Выйти"
                        @click="authStore.logout()"
                    />
                </template>
                <template v-else-if="!authStore.loading">
                    <NuxtLink v-show="isNavWide" to="/signin">
                        <vs-button type="flat">Войти</vs-button>
                    </NuxtLink>

                    <NuxtLink v-show="isNavWide" to="/signup">
                        <vs-button>Регистрация</vs-button>
                    </NuxtLink>
                </template>
            </client-only>

            <v-btn
                v-show="isNavCompact"
                class="ml-6"
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
    font-family: 'Open Sans';
    font-weight: 500;
}
</style>
