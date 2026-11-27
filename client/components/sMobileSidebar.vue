<script setup>
import useBreakpoints from '@/composables/breakpoints';

const open = defineModel('open', { type: Boolean, default: false });
const bp = useBreakpoints();
const authStore = useAuthStore();
const attrs = useAttrs();

watch(open, (isOpen) => {
    if (import.meta.client) {
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }
});

onBeforeUnmount(() => {
    if (import.meta.client) {
        document.body.style.overflow = '';
    }
});

function close() {
    open.value = false;
}

function onItemClick() {
    close();
}

async function onLogout() {
    close();
    await authStore.logout();
}
</script>

<template>
    <div v-if="open" class="mobile-menu-backdrop" aria-hidden="true" @click="close" />
    <vs-sidebar class="sidebar" v-bind="attrs" absolute :open="open">
        <vs-sidebar-item id="/" class="mr-4" @click="onItemClick">
            <template #icon>
                <v-icon size="small">mdi-home-outline</v-icon>
            </template>
            О нас
        </vs-sidebar-item>
        <vs-sidebar-item id="/catalog" @click="onItemClick">
            <template #icon>
                <v-icon size="small">mdi-format-list-bulleted</v-icon>
            </template>
            Каталог
        </vs-sidebar-item>
        <vs-sidebar-item id="/deliver" @click="onItemClick">
            <template #icon>
                <v-icon size="small">mdi-package</v-icon>
            </template>
            Доставка
        </vs-sidebar-item>
        <vs-sidebar-item id="/contacts" @click="onItemClick">
            <template #icon>
                <v-icon size="small">mdi-phone</v-icon>
            </template>
            Контакты
        </vs-sidebar-item>
        <client-only>
            <vs-sidebar-item v-if="authStore.user" id="/orders" @click="onItemClick">
                <template #icon>
                    <v-icon size="small">mdi-clipboard-list-outline</v-icon>
                </template>
                Заказы
            </vs-sidebar-item>
        </client-only>
        <template #footer>
            <div class="footer d-flex flex-column">
                <client-only>
                    <div v-if="authStore.user" class="d-flex">
                        <vs-button type="flat" @click="onLogout">Выйти</vs-button>
                    </div>
                    <div v-else-if="bp.isSmallMobile || bp.isMobile || bp.isTablet" class="d-flex">
                        <vs-button type="flat" @click="close">
                            <nuxt-link to="/signin">Войти</nuxt-link>
                        </vs-button>
                        <vs-button>
                            <nuxt-link to="/signup" @click="close">Регистрация</nuxt-link>
                        </vs-button>
                    </div>
                </client-only>
                <div class="phone mt-2 text-center">
                    <v-icon size="x-small">mdi-phone</v-icon>
                    <a href="tel:+79255859439" class="s-footer__item a">+7 925 585 94 39</a>
                </div>
            </div>
        </template>
    </vs-sidebar>
</template>

<style lang="scss">
.mobile-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1090;
    background: rgba(0, 0, 0, 0.35);
}

.sidebar {
    height: 100% !important;
    margin-top: 0 !important;
    padding-top: 60px !important;
    z-index: 1100 !important;
    // закрытое меню не должно раздувать горизонтальный scroll
    &:not(.is-open) {
        visibility: hidden !important;
        pointer-events: none !important;
    }
    &.vs-sidebar.is-open {
        position: fixed !important;
        border-radius: 0 10px 10px 0 !important;
        margin-top: 0 !important;
        visibility: visible !important;
    }
}
</style>
