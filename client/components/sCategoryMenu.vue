<script setup>
import { useCategoriesStore, useFiltersStore } from '#imports';
import SCategoryMenuSkeleton from './sCategoryMenuSkeleton.vue';

const categoriesStore = useCategoriesStore();
const filtersStore = useFiltersStore();
const category = ref(filtersStore.filters.subcategory || '');
watch(
    () => filtersStore.filters.subcategory,
    (val) => {
        if (!val) {
            category.value = '';
        }
    },
);
async function navigate(item, nest) {
    // новая категория сбрасывает бренд/размер/цену; поиск и сортировку тоже
    filtersStore.setCategory(item.id, nest.id);
    await navigateTo({ path: '/catalog', query: filtersStore.toQuery() });
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

// idle/pending — ещё не знаем, пустой сайт или грузится; success/error + [] — прячем меню
const isCategoriesLoading = computed(
    () => categoriesStore.status === 'pending' || categoriesStore.status === 'idle',
);
const hasCategories = computed(() => categoriesStore.categories.length > 0);
</script>

<template>
    <vs-sidebar v-if="isCategoriesLoading || hasCategories" v-model="category" open>
        <template #logo>Женское бельё</template>
        <SCategoryMenuSkeleton v-if="isCategoriesLoading" />
        <template v-else>
            <vs-sidebar-group
                v-for="item in categoriesStore.categories"
                :id="String(item.name)"
                :key="item.name"
            >
                <template #header>
                    <vs-sidebar-item arrow>
                        {{ item.name }}
                    </vs-sidebar-item>
                </template>

                <vs-sidebar-item
                    v-for="nest in item.productSubcategories"
                    :id="String(nest.id)"
                    :key="nest.name"
                    @click="navigate(item, nest)"
                >
                    {{ nest.name }}
                </vs-sidebar-item>
            </vs-sidebar-group>
        </template>
    </vs-sidebar>
</template>

<style lang="scss" scoped>
.skeleton-text {
    height: 1rem;
    width: 80%;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
    border-radius: 4px;
}

@keyframes loading {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}
</style>

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
