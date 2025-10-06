<script setup>
    import useBreakpoints from '@/composables/breakpoints';

    const emit = defineEmits(['update:open']);
    const bp = useBreakpoints();
    const attrs = useAttrs();
    function onItemClick() {
        emit('update:open', false);
    }
</script>

<template>
    <vs-sidebar
        class="sidebar"
        v-bind="attrs"
        absolute
    >
        <vs-sidebar-item
            id="/"
            class="mr-4"
            @click="onItemClick"
        >
            <template #icon>
                <v-icon size="small">
                    mdi-home-outline
                </v-icon>
            </template>
            О нас
        </vs-sidebar-item>
        <vs-sidebar-item id="/catalog" @click="onItemClick">
            <template #icon>
                <v-icon size="small">
                    mdi-format-list-bulleted
                </v-icon>
            </template>
            Каталог
        </vs-sidebar-item>
        <vs-sidebar-item id="/deliver" @click="onItemClick">
            <template #icon>
                <v-icon size="small">
                    mdi-package
                </v-icon>
            </template>
            Доставка
        </vs-sidebar-item>
        <vs-sidebar-item id="/contacts" @click="onItemClick">
            <template #icon>
                <v-icon size="small">
                    mdi-phone
                </v-icon>
            </template>
            Контакты
        </vs-sidebar-item>
        <template #footer>
            <div class="footer d-flex flex-column">
                <div v-if="bp.isSmallMobile" class="d-flex">
                    <vs-button type="flat" @click="emit('update:open', false)">
                        <nuxt-link to="/signin">
                            Войти
                        </nuxt-link>
                    </vs-button>
                    <vs-button>
                        <nuxt-link to="/signup" @click="emit('update:open', false)">
                            Регистрация
                        </nuxt-link>
                    </vs-button>
                </div>
                <div class="phone mt-2 text-center">
                    <v-icon size="x-small">
                        mdi-phone
                    </v-icon>
                    <a href="tel:+79255859439" class="s-footer__item a">
                        +7 925 585 94 39
                    </a>
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
