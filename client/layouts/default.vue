<script setup>
import { useCartStore } from '#imports';
import { watch } from 'vue';
import { useCategoriesStore } from '~/stores/categories';
import { useMappingStore } from '~/stores/mapping';

const categoriesStore = useCategoriesStore();
const mappingStore = useMappingStore();
const cartStore = useCartStore();

cartStore.initializeCart();
const route = useRoute();
const isAdminPage = computed(() => route.path.startsWith('/admin'));
watch(
    () => route.fullPath,
    (newPath) => {
        if (newPath === '/deliver' || newPath.startsWith('/admin')) {
            cartStore.isDisabled = true;
        } else {
            cartStore.isDisabled = false;
        }
    },
    {
        immediate: true,
    },
);

// Оптимизируем загрузку данных с помощью prefetch
useAsyncData(
    async () => {
        // Загружаем категории и маппинг параллельно
        await Promise.allSettled([
            categoriesStore.getCategories(),
            mappingStore.getColors(),
            mappingStore.getSizes(),
        ]);
    },
    {
        server: true,
        lazy: false,
    },
);
</script>

<template>
    <div class="shelkovitsa-main">
        <s-header />
        <div class="shelkovitsa-body">
            <div class="shelkovitsa-body__main">
                <slot />
            </div>
            <div v-if="!isAdminPage" class="shelkovitsa-body__menu">
                <ClientOnly>
                    <s-category-menu />
                </ClientOnly>
            </div>
        </div>
        <s-footer class="mt-12" />
        <ClientOnly>
            <s-cart v-if="!cartStore.isDisabled" />
        </ClientOnly>
    </div>
</template>

<style lang="scss">
.shelkovitsa-main {
    overflow-x: clip;
    max-width: 100%;
}

.shelkovitsa-body {
    min-height: calc(100vh - 400px);
    margin-top: 100px;
    padding: 0 160px;
    display: flex;
    gap: 40px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;

    @media screen and (max-width: 1200px) {
        padding: 0 8px;
    }

    &__menu {
        min-width: 300px;

        @media screen and (max-width: 1000px) {
            display: none;
        }
    }

    &__main {
        width: 100%;
    }
}
</style>
