<script setup>
import debounce from 'lodash/debounce';
import { formatRub } from '~/utils/money';
import EditModal from './editModal.vue';

const { $api } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const categoriesStore = useCategoriesStore();

const modalShow = ref(false);
const isDeletedOther = ref(false);
const loading = ref(false);
const products = ref([]);
const page = ref(1);
const itemsPerPage = ref(10);
const totalItems = ref(0);
const editableItem = ref({});
const brandOptions = ref([]);
const searchInput = ref('');
let skipNextOptionsFetch = false;
let applyingFromRoute = false;
let skipUrlSync = false;
let ignoreNextRouteWatch = false;

const STATUS_VALUES = ['published', 'hidden', 'active', 'archive'];
const SORT_VALUES = ['new', 'priceAsc', 'priceDesc', 'default'];
const FILTER_QUERY_KEYS = [
    'q',
    'status',
    'categoryId',
    'subcategoryId',
    'brand',
    'image',
    'stock',
    'sort',
    'page',
    'itemsPerPage',
];
const TRI_VALUES = ['any', 'with', 'without'];

const statusOptions = [
    { value: 'published', title: 'Опубликованные' },
    { value: 'hidden', title: 'Скрытые' },
    { value: 'active', title: 'Все активные' },
    { value: 'archive', title: 'Архив' },
];

const sortOptions = [
    { value: 'new', title: 'Сначала новые' },
    { value: 'priceAsc', title: 'Цена ↑' },
    { value: 'priceDesc', title: 'Цена ↓' },
    { value: 'default', title: 'По популярности' },
];

const imageOptions = [
    { value: 'any', title: 'Не важно' },
    { value: 'with', title: 'С фото' },
    { value: 'without', title: 'Без фото' },
];

const stockOptions = [
    { value: 'any', title: 'Не важно' },
    { value: 'with', title: 'В наличии' },
    { value: 'without', title: 'Нет остатка' },
];

const filters = reactive({
    status: 'published',
    categoryId: null,
    subcategoryId: null,
    brand: null,
    image: 'any',
    stock: 'any',
    sort: 'new',
});

const subcategoryOptions = computed(() => {
    const category = categoriesStore.adminCategories.find((item) => item.id === filters.categoryId);
    return category?.productSubcategories ?? [];
});

const hasActiveFilters = computed(() => {
    return Boolean(
        searchInput.value.trim() ||
        filters.categoryId ||
        filters.subcategoryId ||
        filters.brand ||
        filters.image !== 'any' ||
        filters.stock !== 'any' ||
        filters.status !== 'published' ||
        filters.sort !== 'new',
    );
});

function toInt(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function toTri(value) {
    return TRI_VALUES.includes(value) ? value : 'any';
}

function filtersFromQuery(query = {}) {
    const status = STATUS_VALUES.includes(query.status) ? query.status : 'published';
    const sort = SORT_VALUES.includes(query.sort) ? query.sort : 'new';
    const q = typeof query.q === 'string' ? query.q : '';
    const pageNum = toInt(query.page) || 1;
    const perPage = toInt(query.itemsPerPage);
    return {
        searchInput: q,
        status,
        categoryId: toInt(query.categoryId),
        subcategoryId: toInt(query.subcategoryId),
        brand: typeof query.brand === 'string' && query.brand ? query.brand : null,
        image: toTri(query.image),
        stock: toTri(query.stock),
        sort,
        page: pageNum,
        itemsPerPage: perPage === 20 ? 20 : 10,
    };
}

function filtersToRouteQuery() {
    const query = {};
    const q = searchInput.value.trim();
    if (q) {
        query.q = q;
    }
    if (filters.status !== 'published') {
        query.status = filters.status;
    }
    if (filters.categoryId) {
        query.categoryId = String(filters.categoryId);
    }
    if (filters.subcategoryId) {
        query.subcategoryId = String(filters.subcategoryId);
    }
    if (filters.brand) {
        query.brand = filters.brand;
    }
    if (filters.image !== 'any') {
        query.image = filters.image;
    }
    if (filters.stock !== 'any') {
        query.stock = filters.stock;
    }
    if (filters.sort !== 'new') {
        query.sort = filters.sort;
    }
    if (page.value > 1) {
        query.page = String(page.value);
    }
    if (itemsPerPage.value !== 10) {
        query.itemsPerPage = String(itemsPerPage.value);
    }
    return query;
}

function buildApiQuery() {
    const query = {
        page: page.value - 1,
        itemsPerPage: itemsPerPage.value,
        status: filters.status,
        sort: filters.sort,
    };
    const q = searchInput.value.trim();
    if (q) {
        query.query = q;
    }
    if (filters.categoryId) {
        query.categoryId = filters.categoryId;
    }
    if (filters.subcategoryId) {
        query.subcategoryId = filters.subcategoryId;
    }
    if (filters.brand) {
        query.brand = filters.brand;
    }
    if (filters.image !== 'any') {
        query.image = filters.image;
    }
    if (filters.stock !== 'any') {
        query.stock = filters.stock;
    }
    return query;
}

function syncRouteQuery() {
    if (skipUrlSync) {
        return;
    }
    const kept = {};
    if (route.query.tab) {
        kept.tab = route.query.tab;
    }
    const next = { ...kept, ...filtersToRouteQuery() };
    const same =
        FILTER_QUERY_KEYS.every(
            (key) => String(route.query[key] ?? '') === String(next[key] ?? ''),
        ) && String(route.query.tab ?? '') === String(next.tab ?? '');
    if (same) {
        return;
    }
    ignoreNextRouteWatch = true;
    router.replace({ query: next });
}

function applyFromRoute() {
    applyingFromRoute = true;
    skipUrlSync = true;
    const parsed = filtersFromQuery(route.query);
    searchInput.value = parsed.searchInput;
    filters.status = parsed.status;
    filters.categoryId = parsed.categoryId;
    filters.subcategoryId = parsed.subcategoryId;
    filters.brand = parsed.brand;
    filters.image = parsed.image;
    filters.stock = parsed.stock;
    filters.sort = parsed.sort;
    page.value = parsed.page;
    itemsPerPage.value = parsed.itemsPerPage;
    nextTick(() => {
        applyingFromRoute = false;
        skipUrlSync = false;
    });
}

function getProducts() {
    loading.value = true;
    return $api('/api/admin/product-article', {
        query: buildApiQuery(),
    })
        .then((res) => {
            products.value = res.data;
            totalItems.value = res.count;
        })
        .finally(() => {
            loading.value = false;
        });
}

function reloadFromStart() {
    if (page.value !== 1) {
        skipNextOptionsFetch = true;
        page.value = 1;
    }
    syncRouteQuery();
    getProducts();
}

const reloadFromStartDebounced = debounce(reloadFromStart, 300);

async function loadBrandOptions() {
    try {
        const res = await $api('/api/admin/product-article/filters');
        brandOptions.value = (res.brands ?? []).map((item) => item.name);
    } catch {
        brandOptions.value = [];
    }
}

function onTableOptions(options) {
    page.value = options.page;
    itemsPerPage.value = options.itemsPerPage;
    if (skipNextOptionsFetch) {
        skipNextOptionsFetch = false;
        syncRouteQuery();
        return;
    }
    syncRouteQuery();
    getProducts();
}

function clearFilters() {
    searchInput.value = '';
    filters.status = 'published';
    filters.categoryId = null;
    filters.subcategoryId = null;
    filters.brand = null;
    filters.image = 'any';
    filters.stock = 'any';
    filters.sort = 'new';
    reloadFromStart();
}

function statusLabel(item) {
    if (item.is_deleted) {
        return 'Архив';
    }
    return item.isVisible ? 'Опубликован' : 'Скрыт';
}

function statusColor(item) {
    if (item.is_deleted) {
        return 'grey';
    }
    return item.isVisible ? 'success' : 'warning';
}

function toggleModal(item) {
    modalShow.value = true;
    editableItem.value = item;
}

watch(searchInput, () => {
    if (applyingFromRoute) {
        return;
    }
    reloadFromStartDebounced();
});

watch(
    () => filters.categoryId,
    () => {
        if (applyingFromRoute) {
            return;
        }
        filters.subcategoryId = null;
    },
);

watch(
    () => [
        filters.status,
        filters.categoryId,
        filters.subcategoryId,
        filters.brand,
        filters.image,
        filters.stock,
        filters.sort,
    ],
    () => {
        if (applyingFromRoute) {
            return;
        }
        reloadFromStart();
    },
);

watch(
    () => FILTER_QUERY_KEYS.map((key) => route.query[key]).join('|'),
    () => {
        if (ignoreNextRouteWatch) {
            ignoreNextRouteWatch = false;
            return;
        }
        if (skipUrlSync) {
            return;
        }
        applyFromRoute();
        getProducts();
    },
);

// Layout грузит категории при SSR без куки админа (только с опубликованными товарами),
// а в карточке товара нужны все подкатегории
applyFromRoute();
onMounted(() => {
    categoriesStore.getAdminCategories();
    loadBrandOptions();
});

async function updateXlsx(file) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('isDeletedOther', isDeletedOther.value);
    loading.value = true;
    try {
        const response = await $api('/api/admin/product-article/import', {
            method: 'POST',
            body: formData,
            responseType: 'blob',
        });
        getProducts();
        loadBrandOptions();

        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'products-errors.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (e) {
        VsNotification({
            title: 'Ошибка!',
            content: e.message,
            position: 'bottom-center',
            border: 'error',
        });
    } finally {
        loading.value = false;
    }
}

const headers = [
    { title: 'ID', value: 'id', width: '72px', sortable: false },
    { title: 'Артикул', value: 'article', width: '120px', sortable: false },
    { title: 'Наименование', value: 'name', sortable: false },
    { title: 'Бренд', value: 'brand', width: '120px', sortable: false },
    { title: 'Цена', value: 'price', width: '100px', sortable: false },
    { title: 'Остаток', value: 'totalAmount', width: '96px', sortable: false },
    { title: 'Статус', value: 'status', width: '140px', sortable: false },
    { title: '', value: 'actions', width: '56px', sortable: false },
];
</script>

<template>
    <div class="admin-products pa-2">
        <EditModal
            v-model="editableItem"
            v-model:visible="modalShow"
            @update-product="getProducts"
        />

        <div class="admin-products__import">
            <v-file-input
                :loading="loading"
                density="compact"
                hide-details
                label="Загрузить эксель"
                variant="solo-filled"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                @update:model-value="updateXlsx"
            />
            <v-checkbox
                v-model="isDeletedOther"
                v-tooltip="'Товары из файла полностью перезапишут текущие'"
                class="admin-products__rewrite"
                color="red"
                hide-details
                :loading="loading"
                label="Обновить целиком"
            />
        </div>

        <v-divider class="my-4" />

        <div class="admin-products__filters">
            <div class="admin-products__statuses">
                <v-chip-group v-model="filters.status" mandatory selected-class="text-red-accent-4">
                    <v-chip
                        v-for="option in statusOptions"
                        :key="option.value"
                        :value="option.value"
                        filter
                        variant="outlined"
                        size="small"
                    >
                        {{ option.title }}
                    </v-chip>
                </v-chip-group>
                <div class="admin-products__status-hint text-caption text-medium-emphasis">
                    «Все активные» — опубликованные и скрытые вместе, без архива
                </div>
            </div>

            <div class="admin-products__fields">
                <v-text-field
                    v-model="searchInput"
                    density="compact"
                    hide-details
                    clearable
                    label="Поиск по артикулу, названию, бренду"
                    prepend-inner-icon="mdi-magnify"
                    variant="solo-filled"
                    class="admin-products__search"
                />
                <v-select
                    v-model="filters.categoryId"
                    :items="categoriesStore.adminCategories"
                    item-title="name"
                    item-value="id"
                    density="compact"
                    hide-details
                    clearable
                    label="Категория"
                    variant="solo-filled"
                    class="admin-products__field"
                />
                <v-select
                    v-model="filters.subcategoryId"
                    :items="subcategoryOptions"
                    item-title="name"
                    item-value="id"
                    density="compact"
                    hide-details
                    clearable
                    :disabled="!filters.categoryId"
                    label="Подкатегория"
                    variant="solo-filled"
                    class="admin-products__field"
                />
                <v-autocomplete
                    v-model="filters.brand"
                    :items="brandOptions"
                    density="compact"
                    hide-details
                    clearable
                    label="Бренд"
                    variant="solo-filled"
                    class="admin-products__field"
                />
                <v-select
                    v-model="filters.sort"
                    :items="sortOptions"
                    item-title="title"
                    item-value="value"
                    density="compact"
                    hide-details
                    label="Сортировка"
                    variant="solo-filled"
                    class="admin-products__field"
                />
                <v-select
                    v-model="filters.image"
                    :items="imageOptions"
                    item-title="title"
                    item-value="value"
                    density="compact"
                    hide-details
                    label="Фото"
                    variant="solo-filled"
                    class="admin-products__field"
                />
                <v-select
                    v-model="filters.stock"
                    :items="stockOptions"
                    item-title="title"
                    item-value="value"
                    density="compact"
                    hide-details
                    label="Остаток"
                    variant="solo-filled"
                    class="admin-products__field"
                />
            </div>

            <div class="admin-products__toolbar">
                <div class="admin-products__meta text-medium-emphasis text-caption">
                    Найдено: {{ totalItems }}
                </div>
                <v-btn
                    v-if="hasActiveFilters"
                    variant="text"
                    color="red-accent-4"
                    size="small"
                    @click="clearFilters"
                >
                    Сбросить фильтры
                </v-btn>
            </div>
        </div>

        <v-data-table-server
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="products"
            item-key="id"
            :loading="loading"
            :items-length="totalItems"
            :items-per-page-options="[10, 20]"
            class="admin-products__table"
            @update:options="onTableOptions"
        >
            <template #no-data>
                <div class="text-center pa-4">
                    Ничего не найдено — измените или сбросьте фильтры
                </div>
            </template>
            <template #[`item.name`]="{ item }">
                <div class="admin-products__name">
                    {{ item.name }}
                </div>
            </template>
            <template #[`item.brand`]="{ item }">
                {{ item.brand || '—' }}
            </template>
            <template #[`item.price`]="{ item }">
                <span class="text-no-wrap">{{ formatRub(item.price) }}</span>
            </template>
            <template #[`item.totalAmount`]="{ item }">
                {{ item.totalAmount ?? 0 }}
            </template>
            <template #[`item.status`]="{ item }">
                <v-chip size="small" label :color="statusColor(item)" variant="tonal">
                    {{ statusLabel(item) }}
                </v-chip>
            </template>
            <template #[`item.actions`]="{ item }">
                <v-btn icon="mdi-pencil" size="small" variant="text" @click="toggleModal(item)" />
            </template>
        </v-data-table-server>
    </div>
</template>

<style scoped lang="scss">
.admin-products {
    &__import {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }

    &__rewrite {
        flex: 0 0 auto;
        min-width: 180px;
    }

    &__filters {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 8px;
    }

    &__status-hint {
        margin-top: 4px;
    }

    &__fields {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
        align-items: start;

        @media screen and (max-width: 960px) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        @media screen and (max-width: 600px) {
            grid-template-columns: minmax(0, 1fr);
        }
    }

    &__search {
        grid-column: 1 / -1;
        min-width: 0;

        :deep(.v-field__input) {
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    &__field {
        min-width: 0;
    }

    &__toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-height: 32px;
    }

    &__name {
        max-width: 320px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        @media screen and (max-width: 600px) {
            max-width: 180px;
        }
    }

    &__table {
        :deep(.v-data-table-footer__items-per-page) {
            display: flex;
        }

        @media screen and (max-width: 800px) {
            :deep(table) {
                min-width: 720px;
            }
        }
    }
}
</style>
