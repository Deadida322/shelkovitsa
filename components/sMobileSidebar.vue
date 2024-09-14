<script setup>
    import useBreakpoints from '@/composables/breakpoints';
    const bp = useBreakpoints();
    const attrs = useAttrs();
</script>

<template>
    <vs-sidebar class="sidebar" v-bind="attrs" absolute>
        <vs-sidebar-item class="mr-4" id="/about">
            <template #icon>
                <v-icon size="small">mdi-home-outline</v-icon>
            </template>
            О нас
        </vs-sidebar-item>
        <vs-sidebar-item id="/catalog">
            <template #icon>
                <v-icon size="small">mdi-format-list-bulleted</v-icon>
            </template>
            Каталог
        </vs-sidebar-item>
        <vs-sidebar-item id="/deliver">
            <template #icon>
                <v-icon size="small">mdi-package</v-icon>
            </template>
            Доставка
        </vs-sidebar-item>
        <vs-sidebar-item id="/contacts">
            <template #icon>
                <v-icon size="small">mdi-phone</v-icon>
            </template>
            Контакты
        </vs-sidebar-item>
        <template #footer>
            <div class="footer d-flex flex-column">
                <div class="d-flex" v-if="bp.isSmallMobile">
                    <vs-button type="flat">
                        <nuxt-link to="/signin">Войти</nuxt-link>
                    </vs-button>
                    <vs-button>
                        <nuxt-link to="/signup">Регистрация</nuxt-link>
                    </vs-button>
                </div>
                <div class="phone mt-2 text-center">
                    <v-icon size="x-small">mdi-phone</v-icon>
                    8 999 999 99 88
                </div>
            </div>
        </template>
    </vs-sidebar>
</template>


<style lang="scss">
    .sidebar {
        height: 100% !important;
        margin-top: 0 !important;
        padding-top: 60px !important;
        z-index: 8;
        &.vs-sidebar.is-open {
            position: fixed !important;
            border-radius: 0 10px 10px 0 !important;
            margin-top: 0 !important;
        }
    }
</style>