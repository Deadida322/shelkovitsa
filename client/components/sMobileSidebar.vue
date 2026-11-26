<script setup>
    import { useCategoriesStore, useFiltersStore } from '#imports';
    import useBreakpoints from '@/composables/breakpoints';

    const open = defineModel('open', { type: Boolean, default: false });
    const bp = useBreakpoints();
    const authStore = useAuthStore();
    const categoriesStore = useCategoriesStore();
    const filtersStore = useFiltersStore();
    const attrs = useAttrs();
    const expandedCategory = ref(null);

    watch(open, (isOpen) => {
        if (import.meta.client) {
            document.body.style.overflow = isOpen ? 'hidden' : '';
        }
        if (!isOpen) {
            expandedCategory.value = null;
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

    function toggleCategory(id) {
        expandedCategory.value = expandedCategory.value === id ? null : id;
    }

    async function goSubcategory(category, subcategory) {
        filtersStore.setCategory(category.id, subcategory.id);
        close();
        await navigateTo({ path: '/catalog', query: filtersStore.toQuery() });
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
</script>

<template>
    <div
        v-if="open"
        class="mobile-menu-backdrop"
        aria-hidden="true"
        @click="close"
    />
    <vs-sidebar
        class="sidebar mobile-nav-sidebar"
        v-bind="attrs"
        absolute
        :open="open"
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

        <div class="mobile-nav-cats">
            <div class="mobile-nav-cats__title">
                Женское бельё
            </div>
            <button
                v-for="item in categoriesStore.categories"
                :key="item.id"
                type="button"
                class="mobile-nav-cats__group"
                :class="{ 'mobile-nav-cats__group--open': expandedCategory === item.id }"
                @click="toggleCategory(item.id)"
            >
                <span>{{ item.name }}</span>
                <v-icon size="18">
                    {{ expandedCategory === item.id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                </v-icon>
            </button>
            <template
                v-for="item in categoriesStore.categories"
                :key="`subs-${item.id}`"
            >
                <template v-if="expandedCategory === item.id">
                    <button
                        v-for="nest in item.productSubcategories"
                        :key="nest.id"
                        type="button"
                        class="mobile-nav-cats__item"
                        @click="goSubcategory(item, nest)"
                    >
                        {{ nest.name }}
                    </button>
                </template>
            </template>
        </div>

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
                <client-only>
                    <div v-if="authStore.user" class="d-flex">
                        <vs-button type="flat" @click="onLogout">
                            Выйти
                        </vs-button>
                    </div>
                    <div v-else-if="bp.isSmallMobile || bp.isMobile || bp.isTablet" class="d-flex">
                        <vs-button type="flat" @click="close">
                            <nuxt-link to="/signin">
                                Войти
                            </nuxt-link>
                        </vs-button>
                        <vs-button>
                            <nuxt-link to="/signup" @click="close">
                                Регистрация
                            </nuxt-link>
                        </vs-button>
                    </div>
                </client-only>
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
        &.vs-sidebar.is-open {
            position: fixed !important;
            border-radius: 0 10px 10px 0 !important;
            margin-top: 0 !important;
        }
    }

    .mobile-nav-cats {
        padding: 8px 16px 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        margin-bottom: 8px;

        &__title {
            font-weight: 600;
            font-size: 0.95rem;
            margin-bottom: 8px;
            color: rgba(0, 0, 0, 0.7);
        }

        &__group {
            display: flex;
            width: 100%;
            align-items: center;
            justify-content: space-between;
            padding: 10px 4px;
            border: none;
            background: transparent;
            font: inherit;
            text-align: left;
            cursor: pointer;
            color: inherit;

            &--open {
                color: $primary;
            }
        }

        &__item {
            display: block;
            width: 100%;
            padding: 8px 12px 8px 16px;
            border: none;
            background: transparent;
            font: inherit;
            text-align: left;
            cursor: pointer;
            color: rgba(0, 0, 0, 0.75);

            &:active {
                color: $primary;
            }
        }
    }
</style>
