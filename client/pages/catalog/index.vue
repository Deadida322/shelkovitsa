<script setup>
    import { useCategoriesStore, useFiltersStore, useRouter } from '#imports';
    import debounce from 'lodash/debounce';

    const categoriesStore = useCategoriesStore();
    const filtersStore = useFiltersStore();
    const shopItems = ref([]);
    const router = useRouter();

    const { $api } = useNuxtApp();
    const page = ref(0);
    const pageSize = ref(6);
    const search = ref('');

    const updateSearch = debounce(() => {
        filtersStore.filters.search = search.value;
        page.value = 0;
        router.replace({ path: router.currentRoute.value.path });
    }, 500);

    const totalItems = ref(6);
    const payload = computed(() => ({
        page: page.value,
        search: filtersStore.filters.search,
        itemsPerPage: pageSize.value,
        ...(filtersStore.filters.subcategory
            ? {
                categoryId: +filtersStore.filters.category,
                subcategoryId: +filtersStore.filters.subcategory,
            }
            : null),
    }));

    watch(search, updateSearch);

    const isProductsLoading = ref(true);

    function clearFilters() {
        filtersStore.filters = {};
        filtersStore.clearFilters();
        page.value = 0;
        router.replace({ path: router.currentRoute.value.path });
    }

    const breadcrumbs = computed(() => {
        const result = ['Каталог'];
        if (filtersStore.filters.category) {
            result.push(
                categoriesStore.categoriesMap[filtersStore.filters.category],
            );
        }
        if (filtersStore.filters.subcategory) {
            result.push(
                categoriesStore.subcategoriesMap[
                    filtersStore.filters.subcategory
                ],
            );
        }
        return result;
    });

    watch(
        payload,
        () => {
            isProductsLoading.value = true;
            $api('/api/product-article/getList', {
                method: 'POST',
                body: payload.value,
            }).then((res) => {
                shopItems.value = res.data;
                totalItems.value = res.count;
                isProductsLoading.value = false;
            });
        },
        { immediate: true, deep: true },
    );

    // Добавляем SEO улучшения без удаления существующего кода
    useHead({
        title: 'Каталог товаров - Шелковица',
        meta: [
            {
                name: 'description',
                content:
                    'Каталог товаров интернет-магазина нижнего белья "Шелковица" - широкий выбор женского и мужского белья, нижнее белье высокого качества.',
            },
            {
                name: 'keywords',
                content:
                    'каталог, товары, нижнее белье, женское белье, мужское белье, белье купить, каталог белья',
            },
            { property: 'og:title', content: 'Каталог товаров - Шелковица' },
            {
                property: 'og:description',
                content:
                    'Каталог товаров интернет-магазина нижнего белья "Шелковица" - широкий выбор женского и мужского белья, нижнее белье высокого качества.',
            },
            { property: 'og:type', content: 'website' },
            { property: 'og:url', content: 'https://shelkovitsa.ru/catalog' },
            { name: 'twitter:card', content: 'summary_large_image' },
        ],
        link: [{ rel: 'canonical', href: 'https://shelkovitsa.ru/catalog' }],
    });
</script>

<template>
    <div class="catalog-page">
        <Head>
            <Title>Каталог</Title>
            <Meta
                name="description"
                content="Каталог товаров магазина Шелковица"
            />
        </Head>
        <h2 class="text-h6 mt-sm-4 mb-4">
            Каталог
        </h2>
        <s-search-input-skeleton v-if="isProductsLoading" />
        <vs-input
            v-else
            v-model="search"
            class="s-input"
            placeholder="Поиск в категории"
            icon-after
        >
            <template #icon>
                <v-icon>mdi-magnify</v-icon>
            </template>
        </vs-input>
        <div
            v-if="breadcrumbs.length > 1"
            class="d-flex align-center"
        >
            <v-breadcrumbs :items="breadcrumbs" />
            <v-btn
                v-tooltip="'Очистить фильтры'"
                size="x-small"
                icon="mdi-close"
                variant="plain"
                @click="clearFilters()"
            />
        </div>
        <vs-alert
            v-if="!isProductsLoading"
            class="mt-2"
            color="#1A5CFF"
        >
            <template #icon>
                <v-icon size="40">
                    mdi-information
                </v-icon>
            </template>
            По вашему запросу найдено {{ totalItems }} вариантов!
        </vs-alert>
        <div class="shops-container">
            <template v-if="isProductsLoading">
                <div
                    v-for="i in 6"
                    :key="`skeleton-${i}`"
                    class="shop-item"
                >
                    <s-shop-item-skeleton />
                </div>
            </template>

            <div
                v-for="(item, key) in shopItems"
                v-else
                :key="item.id + key"
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
                v-if="!isProductsLoading"
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
        @media screen and (max-width: 800px) {
            grid-template-columns: repeat(2, 1fr);
        }

        @media screen and (max-width: 450px) {
            grid-template-columns: repeat(1, 1fr);
            .vs-card {
                max-width: 100%;
            }
        }
        .shop-item {
            margin-bottom: 14px;
            @media screen and (max-width: 450px) {
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
