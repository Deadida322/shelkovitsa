<script setup>
import { useCategoriesStore, useFiltersStore } from '#imports';

const categoriesStore = useCategoriesStore();
const filtersStore = useFiltersStore();
const category = ref(filtersStore.filters.subcategory || '');
watch(() => filtersStore.filters.subcategory, (val) => {
    if (!val) {
        category.value = '';
    }
});
function navigate(item, nest) {
    filtersStore.filters = { category: item.id, subcategory: nest.id };
    navigateTo({ path: '/catalog', query: { ...filtersStore.filters } });
}
</script>

<template>
    <vs-sidebar v-model="category" open>
        <template #logo>
            Женское бельё
        </template>
        <vs-sidebar-group v-for="item in categoriesStore.categories" :id="String(item.id)" :key="item.name">
            <template #header>
                <vs-sidebar-item arrow>
                    {{ item.name }}
                </vs-sidebar-item>
            </template>

            <vs-sidebar-item
                v-for="nest in item.productSubcategories"
                :id="nest.id"
                :key="nest.name"
                @click="navigate(item, nest)"
            >
                {{ nest.name }}
            </vs-sidebar-item>
        </vs-sidebar-group>
    </vs-sidebar>
</template>

<style lang="scss">
    .vs-sidebar {
        position: relative;
        height: fit-content;
        border-radius: 0 0 12px 12px;
        min-width: 300px;
        padding: 10px;
        margin-top: 20px;

        &__logo {
            padding: 0 12px;
            min-height: 60px;
            font-weight: 600;
        }
    }
</style>
