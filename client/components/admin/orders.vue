<script setup>
import debounce from 'lodash/debounce';
import { VsNotification } from 'vuesax-alpha';
import { formatRub } from '~/utils/money';
import {
    getSelectableStatuses,
    isTerminalStatus,
    ORDER_STATUS_VALUES,
    ORDER_STATUSES,
} from '~/utils/orderStatus';

const { $api } = useNuxtApp();
const route = useRoute();
const router = useRouter();
const page = ref(1);
const totalItems = ref(0);
const loading = ref(false);
const orders = ref([]);
const deliveryTypes = ref([]);
const searchInput = ref('');
let skipNextOptionsFetch = false;
let applyingFromRoute = false;
let skipUrlSync = false;
let ignoreNextRouteWatch = false;

const FILTER_QUERY_KEYS = ['q', 'status', 'deliveryTypeId', 'page'];

const filters = reactive({
    query: '',
    status: null,
    deliveryTypeId: null,
});

const statuses = ORDER_STATUSES;
const statusFilterOptions = [{ title: 'Все', value: null }, ...statuses];

const deliveryFilterOptions = computed(() => [
    { title: 'Все', value: null },
    ...deliveryTypes.value.map((item) => ({
        title: item.name,
        value: item.id,
    })),
]);

const hasActiveFilters = computed(
    () =>
        Boolean(filters.query?.trim()) || filters.status != null || filters.deliveryTypeId != null,
);

const headers = [
    {
        key: 'data-table-expand',
        width: '48px',
        sortable: false,
    },
    {
        title: 'id',
        value: 'id',
    },
    {
        title: 'ФИО',
        value: 'fio',
    },
    {
        title: 'Телефон',
        value: 'tel',
    },
    {
        title: 'Почта',
        value: 'mail',
    },
    {
        title: 'Сумма',
        value: 'price',
    },
    {
        title: 'Комментарий',
        value: 'description',
    },
    {
        title: 'Регион',
        value: 'region',
    },
    {
        title: 'Адрес',
        value: 'address',
    },
    {
        title: 'Способ доставки',
        value: 'deliveryType.name',
    },
    {
        title: 'Статус',
        value: 'status',
        minWidth: '180px',
    },
];

function toInt(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function filtersFromQuery(query = {}) {
    const q = typeof query.q === 'string' ? query.q : '';
    const status = ORDER_STATUS_VALUES.includes(query.status) ? query.status : null;
    return {
        searchInput: q,
        query: q,
        status,
        deliveryTypeId: toInt(query.deliveryTypeId),
        page: toInt(query.page) || 1,
    };
}

function filtersToRouteQuery() {
    const query = {};
    const q = filters.query?.trim();
    if (q) {
        query.q = q;
    }
    if (filters.status != null) {
        query.status = filters.status;
    }
    if (filters.deliveryTypeId != null) {
        query.deliveryTypeId = String(filters.deliveryTypeId);
    }
    if (page.value > 1) {
        query.page = String(page.value);
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
    filters.query = parsed.query;
    filters.status = parsed.status;
    filters.deliveryTypeId = parsed.deliveryTypeId;
    page.value = parsed.page;
    nextTick(() => {
        applyingFromRoute = false;
        skipUrlSync = false;
    });
}

function buildApiQuery() {
    const query = {
        page: page.value - 1,
        itemsPerPage: 10,
    };
    const q = filters.query?.trim();
    if (q) {
        query.query = q;
    }
    if (filters.status != null) {
        query.status = filters.status;
    }
    if (filters.deliveryTypeId != null) {
        query.deliveryTypeId = filters.deliveryTypeId;
    }
    return query;
}

function getOrders() {
    loading.value = true;
    return $api('/api/admin/order', {
        query: buildApiQuery(),
    })
        .then((res) => {
            orders.value = res.data;
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
    getOrders();
}

const reloadFromStartDebounced = debounce(reloadFromStart, 300);

function onTableOptions() {
    if (skipNextOptionsFetch) {
        skipNextOptionsFetch = false;
        syncRouteQuery();
        return;
    }
    syncRouteQuery();
    getOrders();
}

function clearFilters() {
    searchInput.value = '';
    filters.query = '';
    filters.status = null;
    filters.deliveryTypeId = null;
    reloadFromStart();
}

async function loadDeliveryTypes() {
    try {
        deliveryTypes.value = await $api('/api/delivery-type');
    } catch {
        deliveryTypes.value = [];
    }
}

function statusOptionsFor(order) {
    return getSelectableStatuses(order.status, statuses);
}

function productArticleId(orderProduct) {
    return orderProduct?.product?.productArticle?.id ?? null;
}

function productName(orderProduct) {
    return orderProduct?.product?.productArticle?.name || '—';
}

/** Открывает карточку артикула в админке (EditModal), в т.ч. архив / без остатка. */
function productArticleAdminRoute(articleId) {
    return {
        path: '/admin',
        query: {
            tab: 'products',
            articleId: String(articleId),
        },
    };
}

function updateStatus(status, orderId) {
    return $api(`/api/admin/order/${orderId}`, {
        method: 'PATCH',
        body: {
            status,
        },
    })
        .then(() => {
            const order = orders.value.find((o) => o.id === orderId);
            if (order) order.status = status;
            VsNotification({
                title: 'Отлично!',
                content: 'Статус был обновлён',
                position: 'bottom-center',
                border: 'success',
            });
        })
        .catch((err) => {
            const message =
                err?.data?.error?.message ||
                err?.data?.message ||
                err?.message ||
                'Не удалось обновить статус';
            VsNotification({
                title: 'Ошибка',
                content: Array.isArray(message) ? message.join(', ') : String(message),
                position: 'bottom-center',
                border: 'danger',
            });
            return getOrders();
        });
}

watch(searchInput, (value) => {
    if (applyingFromRoute) {
        return;
    }
    filters.query = value ?? '';
    reloadFromStartDebounced();
});

watch(
    () => [filters.status, filters.deliveryTypeId],
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
        getOrders();
    },
);

applyFromRoute();
onMounted(() => {
    loadDeliveryTypes();
});
</script>

<template>
    <div class="admin-orders">
        <div class="admin-orders__filters">
            <div class="admin-orders__fields">
                <v-text-field
                    v-model="searchInput"
                    density="compact"
                    hide-details
                    clearable
                    label="ФИО, телефон или почта"
                    prepend-inner-icon="mdi-magnify"
                    variant="solo-filled"
                    class="admin-orders__search"
                />
                <v-select
                    v-model="filters.status"
                    :items="statusFilterOptions"
                    item-title="title"
                    item-value="value"
                    density="compact"
                    hide-details
                    label="Статус"
                    variant="solo-filled"
                    class="admin-orders__field"
                />
                <v-select
                    v-model="filters.deliveryTypeId"
                    :items="deliveryFilterOptions"
                    item-title="title"
                    item-value="value"
                    density="compact"
                    hide-details
                    label="Способ доставки"
                    variant="solo-filled"
                    class="admin-orders__field"
                />
            </div>

            <div class="admin-orders__toolbar">
                <div class="admin-orders__meta text-medium-emphasis text-caption">
                    Найдено: {{ totalItems }}
                </div>
                <v-btn
                    v-if="hasActiveFilters"
                    variant="text"
                    color="red-accent-4"
                    size="small"
                    @click="clearFilters"
                >
                    Сбросить
                </v-btn>
            </div>
        </div>

        <v-data-table-server
            v-model:page="page"
            :headers="headers"
            :items="orders"
            item-key="id"
            :loading="loading"
            items-per-page="10"
            :items-length="totalItems"
            show-expand
            expand-on-click
            class="admin-orders__table"
            @update:options="onTableOptions"
        >
            <template #no-data>
                <div class="text-center pa-4">
                    Ничего не найдено — измените или сбросьте фильтры
                </div>
            </template>
            <template #expanded-row="{ item, columns }">
                <tr>
                    <td :colspan="columns.length">
                        <v-table>
                            <thead>
                                <tr>
                                    <th>Название</th>
                                    <th>Количество</th>
                                    <th>Размер</th>
                                    <th>Цвет</th>
                                    <th>Стоимость</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="product in item.orderProducts" :key="product.id">
                                    <td>
                                        <NuxtLink
                                            v-if="productArticleId(product)"
                                            :to="
                                                productArticleAdminRoute(productArticleId(product))
                                            "
                                            class="admin-orders__product-link"
                                            @click.stop
                                        >
                                            {{ productName(product) }}
                                        </NuxtLink>
                                        <template v-else>{{ productName(product) }}</template>
                                    </td>
                                    <td>{{ product.amount }}</td>
                                    <td>{{ product.product?.productSize?.name || '—' }}</td>
                                    <td>{{ product.product?.productColor?.name || '—' }}</td>
                                    <td class="admin-orders__price">
                                        {{
                                            formatRub(
                                                (product.price ??
                                                    product.product?.productArticle?.price ??
                                                    0) * product.amount,
                                            )
                                        }}
                                    </td>
                                </tr>
                            </tbody>
                        </v-table>
                    </td>
                </tr>
            </template>
            <template #[`item.tel`]="{ item }">
                {{ item.tel }}
            </template>
            <template #[`item.price`]="{ item }">
                <span class="admin-orders__price">{{ formatRub(item.price) }}</span>
            </template>
            <template #[`item.description`]="{ item }">
                {{ item.description || '—' }}
            </template>
            <template #[`item.status`]="{ item }">
                <div class="admin-orders__status-cell" @click.stop>
                    <v-select
                        class="admin-orders__status-select mt-2"
                        :class="[
                            `admin-orders__status-select--${item.status}`,
                            {
                                'admin-orders__status-select--terminal': isTerminalStatus(
                                    item.status,
                                ),
                            },
                        ]"
                        variant="solo-filled"
                        density="compact"
                        hide-details
                        item-title="title"
                        item-value="value"
                        :model-value="item.status"
                        :items="statusOptionsFor(item)"
                        :disabled="isTerminalStatus(item.status)"
                        @update:model-value="updateStatus($event, item.id)"
                    />
                </div>
            </template>
        </v-data-table-server>
    </div>
</template>

<style scoped lang="scss">
@use '~/assets/order-status-chip' as *;

$admin-order-statuses: create, in_work, payment, delivery, close, cancelled;

.admin-orders {
    &__filters {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 8px;
    }

    &__fields {
        display: grid;
        grid-template-columns: minmax(0, 2fr) repeat(2, minmax(0, 1fr));
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
        min-width: 0;

        @media screen and (max-width: 960px) {
            grid-column: 1 / -1;
        }

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

    &__status-select {
        min-width: 180px;

        :deep(.v-field) {
            border-radius: 999px;
            box-shadow: none;
        }

        :deep(.v-field__overlay) {
            border-radius: 999px;
            opacity: 0;
        }

        :deep(.v-field__input) {
            min-height: 32px;
            padding-top: 3px;
            padding-bottom: 3px;
            font-size: 13px;
            font-weight: 500;
        }

        :deep(.v-select__selection-text) {
            font-size: 13px;
            font-weight: 500;
            color: currentColor;
        }

        :deep(.v-field__append-inner .v-icon) {
            color: currentColor;
            opacity: 0.75;
        }

        @each $status in $admin-order-statuses {
            &--#{$status} :deep(.v-field) {
                @include order-status-chip-variant($status);
            }
        }

        &--terminal {
            opacity: 0.65;
        }
    }

    &__price {
        white-space: nowrap;
    }

    &__product-link {
        color: rgb(var(--v-theme-primary));
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

    &__table {
        :deep(tbody > tr.v-data-table__tr) {
            cursor: pointer;
        }

        @media screen and (max-width: 800px) {
            :deep(table) {
                min-width: 720px;
            }
        }
    }

    &__status-cell {
        cursor: default;
    }
}
</style>
