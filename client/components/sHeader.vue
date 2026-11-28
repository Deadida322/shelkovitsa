<script setup>
import { NuxtLink } from '#components';
import { useAuthStore, useFiltersStore } from '#imports';
import menu from '~/assets/js/menu';
import useBreakpoints from '~/composables/breakpoints';
import { useDisplay } from 'vuetify';

const authStore = useAuthStore();
const filtersStore = useFiltersStore();
const route = useRoute();
const active = ref(route.path);
const bp = useBreakpoints();
const display = useDisplay();
const mobileMenuVisible = ref(false);
const centerCollapsed = computed(() => display.xs.value || display.sm.value || display.md.value);

const router = useRouter();

/** Центровое меню: «ЗАКАЗЫ» только для авторизованных */
const menuItems = computed(() => {
    const items = [...menu];
    if (!authStore.user) return items;
    const contactsIdx = items.findIndex((item) => item.to === '/contacts');
    const insertAt = contactsIdx >= 0 ? contactsIdx : items.length;
    items.splice(insertAt, 0, { title: 'ЗАКАЗЫ', to: '/orders' });
    return items;
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

function isMenuActive(to) {
    if (to === '/catalog') {
        return route.path.startsWith('/catalog');
    }
    return active.value === to;
}
</script>

<template>
    <vs-navbar v-model="active" shadow :center-collapsed="centerCollapsed" padding-scroll>
        <template #left>
            <NuxtLink to="/">
                <div class="logo">SHELKOVITSA</div>
            </NuxtLink>
        </template>
        <vs-navbar-item
            v-for="item in menuItems"
            :id="item.to"
            :key="item.to"
            class="d-none d-sm-flex"
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
                        class="d-none d-sm-flex"
                        variant="tonal"
                        size="small"
                        icon="mdi-logout"
                        title="Выйти"
                        @click="authStore.logout()"
                    />
                </template>
                <template v-else-if="!authStore.loading">
                    <NuxtLink to="/signin">
                        <vs-button class="d-none d-sm-block" type="flat">Войти</vs-button>
                    </NuxtLink>

                    <NuxtLink to="/signup">
                        <vs-button class="d-none d-sm-block">Регистрация</vs-button>
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
    font-family: 'Open Sans';
    font-weight: 500;
}
</style>
