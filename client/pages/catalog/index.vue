<script setup>
import { useCategoriesStore, useFiltersStore } from '#imports';

const categoriesStore = useCategoriesStore();
const filtersStore = useFiltersStore();
const shopItems = ref([]);

const { $api } = useNuxtApp();
const page = ref(0);
const pageSize = ref(6);

const totalItems = ref(6);
const payload = computed(() => ({
    page: page.value,
    itemsPerPage: pageSize.value,
    ...(filtersStore.filters.subcategory
        ? {
                categoryId: +filtersStore.filters.category,
                subcategoryId: +filtersStore.filters.subcategory,
            }
        : null),
}));

const breadcrumbs = computed(() => {
    const result = ['Каталог'];
    if (filtersStore.filters.category)
        result.push(categoriesStore.categoriesMap[filtersStore.filters.category]);
    if (filtersStore.filters.subcategory)
        result.push(categoriesStore.subcategoriesMap[filtersStore.filters.subcategory]);
    return result;
});

watch(payload, () => {
    $api('/api/product-article', { method: 'POST', body: payload.value }).then((res) => {
        shopItems.value = res.data;
        totalItems.value = res.count;
    });
}, { immediate: true, deep: true });
</script>

<template>
    <div class="catalog-page">
        <h2 class="text-h6 mt-sm-4 mb-4">
            Каталог
        </h2>
        <client-only>
            <vs-input
                class="s-input"
                placeholder="Поиск в категории"
                icon-after
            >
                <template #icon>
                    <v-icon>mdi-magnify</v-icon>
                </template>
            </vs-input>
        </client-only>
        <div v-if="breadcrumbs.length > 1" class="d-flex align-center">
            <v-breadcrumbs :items="breadcrumbs" />
            <v-btn
                v-tooltip="'Очистить фильтры'"
                size="x-small"
                icon="mdi-close"
                variant="plain"
                @click="filtersStore.clearFilters"
            />
        </div>
        <vs-alert class="mt-2" color="#1A5CFF">
            <template #icon>
                <v-icon size="40">
                    mdi-information
                </v-icon>
            </template>
            По вашему запросу найдено {{ totalItems }} вариантов!
        </vs-alert>
        <div class="shops-container">
            <div
                v-for="(item, key) in shopItems"
                :key="key"
                class="shop-item"
            >
                <s-shop-item
                    :item="item"
                    @click="navigateTo(`/catalog/${item.id}`)"
                />
            </div>
        </div>
        <div class="d-flex justify-end mt-10">
            <vs-pagination
                :model-value="page"
                :layout="['prev', 'pager', 'next']"
                :page-size="pageSize"
                :total="totalItems"
                @update:current-page="page = $event - 1"
            />
        </div>
    </div>
</template>

<style lang="scss">
    .shops-container {
        display: grid;
        gap: 14px;
        margin-top: 30px;
        grid-template-columns: repeat(3, 1fr);
        .shop-item {
            flex: 0 0 calc(33.3333% - 10px);
            margin-bottom: 14px;

            @media screen and (max-width: 800px) {
                flex: 0 0 calc(50% - 10px);
            }

            @media screen and (max-width: 450px) {
                flex: 0 0 100%;
                .vs-card {
                    max-width: 100%;
                }
            }
        }
    }

    .about-page {
        &__advantages {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
    }

    .header {
        &__title {
            color: $primary;

        }

        &__image {
            border-radius: 12px;

            &-container {
                height: 100%;
                padding: 20px;
            }
        }
    }
</style>
