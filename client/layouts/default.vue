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
    watch(
        () => route.fullPath,
        (newPath) => {
            if (newPath === '/deliver') {
                cartStore.isDisabled = true;
            }
            else {
                cartStore.isDisabled = false;
            }
        },
        {
            immediate: true,
        },
    );

    useAsyncData(async () => {
        categoriesStore.getCategories();
        mappingStore.getColors();
        mappingStore.getSizes();
    });
</script>

<template>
    <div class="shelkovitsa-main">
        <s-header />
        <div class="shelkovitsa-body">
            <div class="shelkovitsa-body__main">
                <slot />
            </div>
            <div class="shelkovitsa-body__menu">
                <s-category-menu />
            </div>
        </div>
        <s-footer class="mt-12" />
        <s-cart v-if="!cartStore.isDisabled" />
    </div>
</template>

<style lang="scss">
.shelkovitsa-body {
    min-height: calc(100vh - 400px);
    margin-top: 100px;
    padding: 0 160px;
    display: flex;
    gap: 40px;
    width: 100%;

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
