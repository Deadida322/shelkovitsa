<script setup>
    import { useCategoriesStore, useFiltersStore, useRouter } from '#imports';
    import debounce from 'lodash/debounce';
    import { storeToRefs } from 'pinia';
    import { clampPriceRange, toInt } from '~/utils/catalogFilters';

    const categoriesStore = useCategoriesStore();
    const filtersStore = useFiltersStore();
    const { filters } = storeToRefs(filtersStore);
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

    // Ссылка с query важнее стора; иначе оставляем стор (возврат с карточки товара)
    const queryKeys = ['q', 'brand', 'size', 'minPrice', 'maxPrice', 'inStock', 'sort', 'page', 'category', 'subcategory'];
    if (queryKeys.some(key => route.query[key] != null && route.query[key] !== '')) {
        filtersStore.applyFromQuery(route.query);
    }

    const priceInput = reactive({
        min: filters.value.minPrice ?? '',
        max: filters.value.maxPrice ?? '',
    });
    // поле поиска — локальный buffer; в стор/URL пишем с debounce
    const search = ref(filters.value.search || '');

    const activeFiltersCount = computed(
        () => filters.value.brands.length
            + filters.value.sizes.length
            + (filters.value.minPrice != null || filters.value.maxPrice != null ? 1 : 0),
    );
    const showFilters = ref(activeFiltersCount.value > 0 || Boolean(filters.value.search));

    const updateSearch = debounce((value) => {
        filters.value.search = value;
        filters.value.page = 1;
    }, 500);
    watch(search, updateSearch);

    const totalItems = ref(0);
    const pageCount = computed(() =>
        Math.max(1, Math.ceil(totalItems.value / PAGE_SIZE) || 1),
    );

    const scopeQuery = computed(() => ({
        ...(filters.value.search.trim() ? { query: filters.value.search.trim() } : null),
        ...(filters.value.category ? { categoryId: +filters.value.category } : null),
        ...(filters.value.subcategory ? { subcategoryId: +filters.value.subcategory } : null),
    }));
    const filterQuery = computed(() => ({
        ...scopeQuery.value,
        ...(filters.value.brands.length ? { brand: filters.value.brands } : null),
        ...(filters.value.sizes.length ? { productSizeId: filters.value.sizes } : null),
        ...(filters.value.minPrice != null ? { minPrice: filters.value.minPrice } : null),
        ...(filters.value.maxPrice != null ? { maxPrice: filters.value.maxPrice } : null),
        ...(filters.value.inStock ? { inStock: true } : null),
    }));
    const payload = computed(() => ({
        page: filters.value.page - 1,
        itemsPerPage: PAGE_SIZE,
        ...filterQuery.value,
        ...(filters.value.sort !== 'default' ? { sort: filters.value.sort } : null),
    }));

    const lastPriceSide = 'max';

    function resetPrice() {
        priceInput.min = '';
        priceInput.max = '';
        filters.value.minPrice = null;
        filters.value.maxPrice = null;
        filters.value.page = 1;
    }

    function resetProductFilters() {
        filtersStore.resetProductFilters();
        priceInput.min = '';
        priceInput.max = '';
    }

    function toggleSize(id) {
        const sizes = filters.value.sizes;
        filters.value.sizes = sizes.includes(id)
            ? sizes.filter(sizeId => sizeId !== id)
            : [...sizes, id];
        filters.value.page = 1;
    }

    watch(
        () => [
            filters.value.brands,
            filters.value.sizes,
            filters.value.minPrice,
            filters.value.maxPrice,
            filters.value.inStock,
            filters.value.sort,
        ],
        () => {
            filters.value.page = 1;
        },
    );

    watch(() => filters.value.page, () => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });

    const isProductsLoading = ref(true);

    function clearFilters() {
        filtersStore.clearFilters();
        search.value = '';
        priceInput.min = '';
        priceInput.max = '';
    }

    const breadcrumbs = computed(() => {
        const result = ['Каталог'];
        if (filters.value.category) {
            result.push(categoriesStore.categoriesMap[filters.value.category]);
        }
        if (filters.value.subcategory) {
            result.push(categoriesStore.subcategoriesMap[filters.value.subcategory]);
        }
        return result;
    });

    const facets = ref({ brands: [], sizes: [], price: { min: 0, max: 0 } });

    /** Макс. цена самого дорогого товара в текущей выдаче фасетов */
    const catalogPriceMax = computed(() => {
        const raw = facets.value.price?.max;
        return raw != null && raw > 0 ? Math.ceil(raw) : null;
    });

    /** Применяем фильтр только когда ушли из блока цены */
    function applyPrice() {
        const emptyMin = priceInput.min === '' || priceInput.min == null;
        const emptyMax = priceInput.max === '' || priceInput.max == null;
        let min = emptyMin ? null : toInt(priceInput.min);
        let max = emptyMax ? null : toInt(priceInput.max);
        if (!emptyMin && min == null) {
            priceInput.min = '';
        }
        if (!emptyMax && max == null) {
            priceInput.max = '';
        }

        ({ min, max } = clampPriceRange(min, max, {
            productMax: catalogPriceMax.value,
            side: lastPriceSide,
        }));

        priceInput.min = min == null ? '' : min;
        priceInput.max = max == null ? '' : max;

        if (filters.value.minPrice === min && filters.value.maxPrice === max) {
            return;
        }
        filters.value.minPrice = min;
        filters.value.maxPrice = max;
        filters.value.page = 1;
    }

    function onPriceBlockFocusOut(event) {
        if (event.currentTarget.contains(event.relatedTarget)) {
            return;
        }
        applyPrice();
    }

    /** Скролл страницы не должен крутить value number-инпута */
    function onPriceWheel(event) {
        const target = event.target;
        if (target instanceof HTMLInputElement && target.type === 'number') {
            target.blur();
        }
    }

    const brandSearch = ref('');
    const brandOptions = computed(() => {
        const known = new Set(facets.value.brands.map(brand => brand.name.toLowerCase()));
        const missing = filters.value.brands
            .filter(name => !known.has(name.toLowerCase()))
            .map(name => ({ name, count: 0 }));
        const needle = brandSearch.value.trim().toLowerCase();
        return [...facets.value.brands, ...missing].filter(
            brand => !needle || brand.name.toLowerCase().includes(needle),
        );
    });
    const sizeNameCache = ref({});
    const sizeOptions = computed(() => {
        const known = new Set(facets.value.sizes.map(size => size.id));
        const missing = filters.value.sizes
            .filter(id => !known.has(id))
            .map(id => ({ id, name: sizeNameCache.value[id] || String(id), count: 0 }));
        return [...facets.value.sizes, ...missing];
    });

    watch(
        filterQuery,
        () => {
            $api('/api/product-article/filters', { query: filterQuery.value })
                .then((res) => {
                    facets.value = res;
                    sizeNameCache.value = {
                        ...sizeNameCache.value,
                        ...Object.fromEntries(res.sizes.map(size => [size.id, size.name])),
                    };
                    // подтянуть уже выбранные цены к актуальным границам
                    if (filters.value.minPrice != null || filters.value.maxPrice != null) {
                        const { min, max } = clampPriceRange(
                            filters.value.minPrice,
                            filters.value.maxPrice,
                            { productMax: catalogPriceMax.value, side: lastPriceSide },
                        );
                        if (min !== filters.value.minPrice || max !== filters.value.maxPrice) {
                            filters.value.minPrice = min;
                            filters.value.maxPrice = max;
                            priceInput.min = min ?? '';
                            priceInput.max = max ?? '';
                        }
                    }
                })
                .catch(() => {});
        },
        { immediate: true, deep: true },
    );

    const sizeNames = computed(() => ({
        ...sizeNameCache.value,
        ...Object.fromEntries(facets.value.sizes.map(size => [size.id, size.name])),
    }));
    const priceLabel = computed(() => {
        if (filters.value.minPrice != null && filters.value.maxPrice != null) {
            return `${filters.value.minPrice} – ${filters.value.maxPrice} ₽`;
        }
        return filters.value.minPrice != null
            ? `от ${filters.value.minPrice} ₽`
            : `до ${filters.value.maxPrice} ₽`;
    });

    // URL зеркалит стор, пока мы на /catalog (не на /catalog/:id)
    watch(
        () => filtersStore.toQuery(),
        (query) => {
            if (route.path !== '/catalog') {
                return;
            }
            router.replace({ path: '/catalog', query });
        },
        { deep: true, immediate: true },
    );

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
                <vs-switch v-model="filters.inStock" />
                <span>В наличии</span>
            </label>

            <ClientOnly>
                <vs-select
                    v-model="filters.sort"
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
                    v-model="filters.brands"
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
                v-if="sizeOptions.length"
                class="catalog-filters__block"
            >
                <div class="catalog-filters__title">
                    Размер (в наличии)
                </div>
                <div class="catalog-filters__sizes">
                    <button
                        v-for="size in sizeOptions"
                        :key="size.id"
                        type="button"
                        class="catalog-filters__size"
                        :class="{ 'catalog-filters__size--active': filters.sizes.includes(size.id) }"
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
                <div
                    class="catalog-filters__price"
                    @focusout="onPriceBlockFocusOut"
                    @wheel.capture="onPriceWheel"
                >
                    <vs-input
                        v-model="priceInput.min"
                        class="s-input catalog-filters__price-input"
                        type="number"
                        :min="0"
                        :max="catalogPriceMax != null ? catalogPriceMax - 1 : undefined"
                        :placeholder="facets.price.max ? `от ${Math.floor(facets.price.min)}` : 'от'"
                        @focus="lastPriceSide = 'min'"
                    />
                    <span>–</span>
                    <vs-input
                        v-model="priceInput.max"
                        class="s-input catalog-filters__price-input"
                        type="number"
                        :min="1"
                        :max="catalogPriceMax ?? undefined"
                        :placeholder="facets.price.max ? `до ${Math.ceil(facets.price.max)}` : 'до'"
                        @focus="lastPriceSide = 'max'"
                    />
                </div>
            </div>
        </div>

        <div
            v-if="activeFiltersCount > 0 || search.trim()"
            class="catalog-active mt-3"
        >
            <button
                v-if="search.trim()"
                type="button"
                class="catalog-active__chip"
                @click="search = ''; filters.search = ''; filters.page = 1"
            >
                «{{ search.trim() }}»
                <v-icon size="14">
                    mdi-close
                </v-icon>
            </button>
            <button
                v-for="brand in filters.brands"
                :key="`brand-${brand}`"
                type="button"
                class="catalog-active__chip"
                @click="filters.brands = filters.brands.filter(name => name !== brand); filters.page = 1"
            >
                {{ brand }}
                <v-icon size="14">
                    mdi-close
                </v-icon>
            </button>
            <button
                v-for="size in filters.sizes"
                :key="`size-${size}`"
                type="button"
                class="catalog-active__chip"
                @click="filters.sizes = filters.sizes.filter(id => id !== size); filters.page = 1"
            >
                Размер {{ sizeNames[size] || size }}
                <v-icon size="14">
                    mdi-close
                </v-icon>
            </button>
            <button
                v-if="filters.minPrice != null || filters.maxPrice != null"
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
                @click="resetProductFilters(); search = ''; filters.search = ''"
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
                v-model:current-page="filters.page"
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

        &__price-input {
            /* без стрелок вверх/вниз — скролл не меняет цену */
            input[type='number'] {
                -moz-appearance: textfield;
                appearance: textfield;

                &::-webkit-outer-spin-button,
                &::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
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
