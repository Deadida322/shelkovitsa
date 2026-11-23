<script setup>
    import { useCategoriesStore, useFiltersStore, useRouter } from '#imports';
    import debounce from 'lodash/debounce';

    const categoriesStore = useCategoriesStore();
    const filtersStore = useFiltersStore();
    const shopItems = ref([]);
    const router = useRouter();
    const route = useRoute();

    const { $api } = useNuxtApp();

    // 12 делится на 2 и 3 колонки; API разрешает до 20
    const PAGE_SIZE = 12;
    const SORT_OPTIONS = [
        { label: 'По умолчанию', id: 'default' },
        { label: 'Сначала новые', id: 'new' },
        { label: 'Сначала дешевле', id: 'priceAsc' },
        { label: 'Сначала дороже', id: 'priceDesc' },
    ];

    const toArray = value => (value == null ? [] : Array.isArray(value) ? value : [value]);
    function toInt(value) {
        const number = Number.parseInt(value, 10);
        return Number.isInteger(number) && number >= 0 ? number : null;
    }

    // Фильтры в адресе: ссылкой можно поделиться, после перезагрузки они на месте
    const brands = ref(toArray(route.query.brand).map(String));
    const sizes = ref(toArray(route.query.size).map(Number).filter(Number.isInteger));
    const minPrice = ref(toInt(route.query.minPrice));
    const maxPrice = ref(toInt(route.query.maxPrice));
    const priceInput = reactive({ min: minPrice.value ?? '', max: maxPrice.value ?? '' });
    const inStock = ref(route.query.inStock === '1');
    const sort = ref(
        SORT_OPTIONS.some(option => option.id === route.query.sort) ? route.query.sort : 'default',
    );
    // vs-pagination — 1-based; в API уходит page - 1
    const page = ref(Math.max(1, toInt(route.query.page) || 1));
    const search = ref('');

    const activeFiltersCount = computed(
        () => brands.value.length + sizes.value.length + (minPrice.value != null || maxPrice.value != null ? 1 : 0),
    );
    const showFilters = ref(activeFiltersCount.value > 0);

    const updateSearch = debounce(() => {
        filtersStore.filters.search = search.value;
        page.value = 1;
    }, 500);

    const totalItems = ref(0);
    const pageCount = computed(() =>
        Math.max(1, Math.ceil(totalItems.value / PAGE_SIZE) || 1),
    );

    // Область для значений фильтров (бренды, размеры, цены)
    const scopeQuery = computed(() => ({
        ...(filtersStore.filters.search ? { query: filtersStore.filters.search } : null),
        ...(filtersStore.filters.category ? { categoryId: +filtersStore.filters.category } : null),
        ...(filtersStore.filters.subcategory ? { subcategoryId: +filtersStore.filters.subcategory } : null),
    }));
    const payload = computed(() => ({
        page: page.value - 1,
        itemsPerPage: PAGE_SIZE,
        ...scopeQuery.value,
        ...(brands.value.length ? { brand: brands.value } : null),
        ...(sizes.value.length ? { productSizeId: sizes.value } : null),
        ...(minPrice.value != null ? { minPrice: minPrice.value } : null),
        ...(maxPrice.value != null ? { maxPrice: maxPrice.value } : null),
        ...(inStock.value ? { inStock: true } : null),
        ...(sort.value !== 'default' ? { sort: sort.value } : null),
    }));

    watch(search, updateSearch);

    const applyPrice = debounce(() => {
        minPrice.value = toInt(priceInput.min);
        maxPrice.value = toInt(priceInput.max);
    }, 600);
    watch(() => [priceInput.min, priceInput.max], applyPrice);

    function resetPrice() {
        priceInput.min = '';
        priceInput.max = '';
        minPrice.value = null;
        maxPrice.value = null;
    }

    function resetProductFilters() {
        brands.value = [];
        sizes.value = [];
        resetPrice();
        inStock.value = false;
    }

    function toggleSize(id) {
        sizes.value = sizes.value.includes(id)
            ? sizes.value.filter(sizeId => sizeId !== id)
            : [...sizes.value, id];
    }

    // Другая категория — другой набор брендов и размеров
    watch(
        () => [filtersStore.filters.category, filtersStore.filters.subcategory],
        () => {
            resetProductFilters();
            page.value = 1;
        },
    );
    watch(() => filtersStore.filters.search, () => {
        page.value = 1;
    });
    watch([brands, sizes, minPrice, maxPrice, inStock, sort], () => {
        page.value = 1;
    });

    watch(page, () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    const isProductsLoading = ref(true);

    function clearFilters() {
        filtersStore.filters = {};
        filtersStore.clearFilters();
        resetProductFilters();
        sort.value = 'default';
        page.value = 1;
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

    const facets = ref({ brands: [], sizes: [], price: { min: 0, max: 0 } });
    const brandSearch = ref('');
    // Выбранный бренд остаётся в списке, даже если в новой области его нет
    const brandOptions = computed(() => {
        const known = new Set(facets.value.brands.map(brand => brand.name.toLowerCase()));
        const missing = brands.value
            .filter(name => !known.has(name.toLowerCase()))
            .map(name => ({ name, count: 0 }));
        const needle = brandSearch.value.trim().toLowerCase();
        return [...facets.value.brands, ...missing].filter(
            brand => !needle || brand.name.toLowerCase().includes(needle),
        );
    });

    watch(
        scopeQuery,
        () => {
            $api('/api/product-article/filters', { query: scopeQuery.value })
                .then((res) => {
                    facets.value = res;
                })
                .catch(() => {
                    // панель фильтров необязательна: каталог работает и без неё
                });
        },
        { immediate: true, deep: true },
    );

    const sizeNames = computed(() => Object.fromEntries(facets.value.sizes.map(size => [size.id, size.name])));
    const priceLabel = computed(() => {
        if (minPrice.value != null && maxPrice.value != null) {
            return `${minPrice.value} – ${maxPrice.value} ₽`;
        }
        return minPrice.value != null ? `от ${minPrice.value} ₽` : `до ${maxPrice.value} ₽`;
    });

    // Адрес страницы повторяет выбранные фильтры
    watch(
        [
            payload,
            () => filtersStore.filters.category,
            () => filtersStore.filters.subcategory,
        ],
        () => {
            const { category, subcategory } = filtersStore.filters;
            const query = {
                ...(category && subcategory ? { category, subcategory } : null),
                ...(brands.value.length ? { brand: brands.value } : null),
                ...(sizes.value.length ? { size: sizes.value.map(String) } : null),
                ...(minPrice.value != null ? { minPrice: String(minPrice.value) } : null),
                ...(maxPrice.value != null ? { maxPrice: String(maxPrice.value) } : null),
                ...(inStock.value ? { inStock: '1' } : null),
                ...(sort.value !== 'default' ? { sort: sort.value } : null),
                ...(page.value > 1 ? { page: String(page.value) } : null),
            };
            router.replace({ path: route.path, query });
        },
        { deep: true },
    );

    // Устаревший ответ не должен затирать свежий
    let lastRequest = 0;
    watch(
        payload,
        () => {
            const requestId = ++lastRequest;
            isProductsLoading.value = true;
            $api('/api/product-article', {
                query: payload.value,
            }).then((res) => {
                if (requestId !== lastRequest) {
                    return;
                }
                shopItems.value = res.data;
                totalItems.value = res.count;
                isProductsLoading.value = false;
            });
        },
        { immediate: true, deep: true },
    );

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
        <s-search-input-skeleton v-if="isProductsLoading && !shopItems.length" />
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

        <div class="catalog-toolbar mt-4">
            <vs-button
                type="flat"
                class="catalog-toolbar__filters-btn"
                @click="showFilters = !showFilters"
            >
                <v-icon class="mr-1">
                    mdi-tune-variant
                </v-icon>
                Фильтры
                <span
                    v-if="activeFiltersCount"
                    class="catalog-toolbar__badge"
                >{{ activeFiltersCount }}</span>
                <v-icon class="ml-1">
                    {{ showFilters ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                </v-icon>
            </vs-button>

            <label class="catalog-toolbar__stock">
                <vs-switch v-model="inStock" />
                <span>В наличии</span>
            </label>

            <ClientOnly>
                <vs-select
                    v-model="sort"
                    class="catalog-toolbar__sort"
                    placeholder="Сортировка"
                >
                    <vs-option
                        v-for="option in SORT_OPTIONS"
                        :key="option.id"
                        :label="option.label"
                        :value="option.id"
                    >
                        {{ option.label }}
                    </vs-option>
                </vs-select>
                <template #fallback>
                    <div class="catalog-toolbar__sort-fallback" />
                </template>
            </ClientOnly>
        </div>

        <div
            v-show="showFilters"
            class="catalog-filters mt-3"
        >
            <div
                v-if="brandOptions.length || brandSearch"
                class="catalog-filters__block"
            >
                <div class="catalog-filters__title">
                    Бренд
                </div>
                <vs-input
                    v-if="facets.brands.length > 12"
                    v-model="brandSearch"
                    class="s-input mb-2"
                    placeholder="Найти бренд"
                    icon-after
                >
                    <template #icon>
                        <v-icon>mdi-magnify</v-icon>
                    </template>
                </vs-input>
                <vs-checkbox-group
                    v-model="brands"
                    class="catalog-filters__brands"
                >
                    <vs-checkbox
                        v-for="brand in brandOptions"
                        :key="brand.name"
                        :value="brand.name"
                    >
                        {{ brand.name }}
                        <span class="catalog-filters__count">{{ brand.count }}</span>
                    </vs-checkbox>
                </vs-checkbox-group>
            </div>

            <div
                v-if="facets.sizes.length"
                class="catalog-filters__block"
            >
                <div class="catalog-filters__title">
                    Размер (в наличии)
                </div>
                <div class="catalog-filters__sizes">
                    <button
                        v-for="size in facets.sizes"
                        :key="size.id"
                        type="button"
                        class="catalog-filters__size"
                        :class="{ 'catalog-filters__size--active': sizes.includes(size.id) }"
                        @click="toggleSize(size.id)"
                    >
                        {{ size.name }}
                        <span class="catalog-filters__count">{{ size.count }}</span>
                    </button>
                </div>
            </div>

            <div class="catalog-filters__block">
                <div class="catalog-filters__title">
                    Цена, ₽
                </div>
                <div class="catalog-filters__price">
                    <vs-input
                        v-model="priceInput.min"
                        class="s-input"
                        type="number"
                        :placeholder="facets.price.max ? `от ${Math.floor(facets.price.min)}` : 'от'"
                    />
                    <span>–</span>
                    <vs-input
                        v-model="priceInput.max"
                        class="s-input"
                        type="number"
                        :placeholder="facets.price.max ? `до ${Math.ceil(facets.price.max)}` : 'до'"
                    />
                </div>
            </div>
        </div>

        <div
            v-if="activeFiltersCount > 0"
            class="catalog-active mt-3"
        >
            <button
                v-for="brand in brands"
                :key="`brand-${brand}`"
                type="button"
                class="catalog-active__chip"
                @click="brands = brands.filter(name => name !== brand)"
            >
                {{ brand }}
                <v-icon size="14">
                    mdi-close
                </v-icon>
            </button>
            <button
                v-for="size in sizes"
                :key="`size-${size}`"
                type="button"
                class="catalog-active__chip"
                @click="sizes = sizes.filter(id => id !== size)"
            >
                Размер {{ sizeNames[size] || size }}
                <v-icon size="14">
                    mdi-close
                </v-icon>
            </button>
            <button
                v-if="minPrice != null || maxPrice != null"
                type="button"
                class="catalog-active__chip"
                @click="resetPrice()"
            >
                {{ priceLabel }}
                <v-icon size="14">
                    mdi-close
                </v-icon>
            </button>
            <button
                type="button"
                class="catalog-active__reset"
                @click="resetProductFilters()"
            >
                Сбросить все
            </button>
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
            <template v-if="totalItems">
                По вашему запросу найдено {{ totalItems }} вариантов!
            </template>
            <template v-else>
                Ничего не найдено — попробуйте изменить или сбросить фильтры
            </template>
        </vs-alert>
        <div class="shops-container">
            <template v-if="isProductsLoading">
                <div
                    v-for="i in PAGE_SIZE"
                    :key="`skeleton-${i}`"
                    class="shop-item"
                >
                    <s-shop-item-skeleton />
                </div>
            </template>

            <div
                v-for="item in shopItems"
                v-else
                :key="item.id"
                class="shop-item"
            >
                <s-shop-item
                    :item="item"
                    @click="navigateTo(`/catalog/${item.id}`)"
                />
            </div>
        </div>
        <div
            v-if="pageCount > 1"
            class="d-flex justify-end mt-10"
        >
            <!--
                Не прячем через v-show/v-if во время загрузки: индикатор активной страницы
                vs-pagination считает offsetLeft кнопки, у скрытого блока он 0 и «2» рисуется
                поверх «1». key пересоздаёт пагинацию, когда меняется число страниц.
            -->
            <vs-pagination
                :key="`pagination-${pageCount}`"
                v-model:current-page="page"
                :layout="['prev', 'pager', 'next']"
                :page-size="PAGE_SIZE"
                :total="totalItems"
            />
        </div>
    </div>
</template>

<style lang="scss">
    .catalog-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 24px;

        &__filters-btn {
            position: relative;
        }

        &__badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 18px;
            height: 18px;
            margin-left: 6px;
            padding: 0 5px;
            border-radius: 9px;
            background: $primary;
            color: #fff;
            font-size: 11px;
            line-height: 1;
        }

        &__stock {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            user-select: none;
        }

        &__sort {
            min-width: 200px;
            max-width: 240px;
        }

        &__sort-fallback {
            min-width: 200px;
            height: 40px;
            border-radius: 12px;
            background: rgba(0, 0, 0, 0.04);
        }
    }

    .catalog-filters {
        display: grid;
        gap: 20px;
        padding: 16px;
        border-radius: 12px;
        background: #fff;
        box-shadow: 0px 4px 6px 0px rgba(34, 60, 80, 0.2);

        &__title {
            font-weight: 600;
            margin-bottom: 8px;
        }

        &__brands {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 4px 12px;
            max-height: 200px;
            overflow-y: auto;
        }

        &__sizes {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        &__size {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            border: 1px solid rgba(0, 0, 0, 0.16);
            border-radius: 999px;
            background: #fff;
            cursor: pointer;
            font: inherit;
            line-height: 1.2;
            transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;

            &:hover {
                border-color: $primary;
            }

            &--active {
                border-color: $primary;
                color: $primary;
                background: rgba($primary, 0.06);
            }
        }

        &__count {
            color: rgba(0, 0, 0, 0.45);
            font-size: 0.85em;
        }

        &__price {
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 360px;

            .s-input {
                flex: 1;
            }
        }
    }

    .catalog-active {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;

        &__chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            border: none;
            border-radius: 999px;
            background: rgba($primary, 0.1);
            color: $primary;
            cursor: pointer;
            font: inherit;
            line-height: 1.3;
        }

        &__reset {
            border: none;
            background: transparent;
            color: rgba(0, 0, 0, 0.55);
            cursor: pointer;
            font: inherit;
            text-decoration: underline;
            text-underline-offset: 2px;
        }
    }

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
