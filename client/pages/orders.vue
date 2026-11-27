<script setup>
import { formatRub } from '~/utils/money';
import { ORDER_STATUSES } from '~/utils/orderStatus';

definePageMeta({
    middleware: ['user'],
});

const { $api } = useNuxtApp();
const filtersStore = useFiltersStore();

/** Меньше page size — пагинация видна уже на демо с несколькими заказами */
const PAGE_SIZE = 5;
const page = ref(1);
const totalItems = ref(0);
const loading = ref(false);
const orders = ref([]);
const expandedId = ref(null);
/** false — активные; true — завершённые (close + cancelled) */
const showCompleted = ref(false);

const pageCount = computed(() => Math.max(1, Math.ceil(totalItems.value / PAGE_SIZE)));
const scope = computed(() => (showCompleted.value ? 'completed' : 'active'));

const statusTitleByValue = Object.fromEntries(ORDER_STATUSES.map((s) => [s.value, s.title]));

function statusTitle(status) {
    return statusTitleByValue[status] ?? status;
}

function formatOrderDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function lineTotal(product) {
    const unit = product.price ?? product.product?.productArticle?.price ?? 0;
    return unit * (product.amount ?? 0);
}

function productArticleId(item) {
    return item?.product?.productArticle?.id ?? null;
}

function productName(item) {
    return item?.product?.productArticle?.name || '—';
}

function toggleExpand(id) {
    expandedId.value = expandedId.value === id ? null : id;
}

function goToCatalog() {
    navigateTo({ path: '/catalog', query: filtersStore.toQuery() });
}

async function getOrders() {
    loading.value = true;
    expandedId.value = null;
    try {
        const res = await $api('/api/order', {
            query: {
                page: page.value - 1,
                itemsPerPage: PAGE_SIZE,
                scope: scope.value,
            },
        });
        orders.value = res?.data ?? [];
        totalItems.value = res?.count ?? 0;
    } catch {
        orders.value = [];
        totalItems.value = 0;
    } finally {
        loading.value = false;
    }
}

watch(showCompleted, () => {
    if (page.value !== 1) {
        page.value = 1;
        return;
    }
    getOrders();
});

watch(page, () => {
    getOrders();
});

onMounted(() => {
    getOrders();
});

useHead({
    title: 'Мои заказы - Шелковица',
    meta: [
        {
            name: 'description',
            content: 'История заказов в личном кабинете интернет-магазина «Шелковица».',
        },
        { name: 'robots', content: 'noindex, nofollow' },
    ],
});
</script>

<template>
    <div class="orders-page">
        <div class="orders-page__toolbar mb-6">
            <div class="text-h6">Мои заказы</div>
            <label class="orders-page__scope">
                <vs-switch v-model="showCompleted" />
                <span>Завершённые</span>
            </label>
        </div>

        <vs-alert v-if="!loading" class="mb-6" color="#1A5CFF">
            <template #icon>
                <v-icon size="40">mdi-information</v-icon>
            </template>
            <template v-if="totalItems">Найдено заказов: {{ totalItems }}</template>
            <template v-else-if="showCompleted">Завершённых заказов пока нет</template>
            <template v-else>
                Активных заказов пока нет —
                <a href="#" class="orders-page__catalog-link" @click.prevent="goToCatalog">
                    перейти в каталог
                </a>
            </template>
        </vs-alert>

        <div v-if="loading" class="orders-page__loading text-center pa-8">Загрузка…</div>

        <div v-else class="orders-page__list">
            <div v-for="order in orders" :key="order.id" class="orders-page__card">
                <button
                    type="button"
                    class="orders-page__row"
                    :aria-expanded="expandedId === order.id"
                    @click="toggleExpand(order.id)"
                >
                    <div class="orders-page__meta">
                        <div class="orders-page__id">№ {{ order.id }}</div>
                        <div class="orders-page__date">{{ formatOrderDate(order.created_at) }}</div>
                    </div>
                    <span
                        class="orders-page__status"
                        :class="`orders-page__status--${order.status}`"
                    >
                        {{ statusTitle(order.status) }}
                    </span>
                    <div class="orders-page__price">{{ formatRub(order.price) }}</div>
                    <v-icon size="small" class="orders-page__chevron">
                        {{ expandedId === order.id ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                    </v-icon>
                </button>

                <div v-if="expandedId === order.id" class="orders-page__details">
                    <div class="orders-page__delivery">
                        <span v-if="order.deliveryType?.name">
                            Доставка: {{ order.deliveryType.name }}
                        </span>
                        <span v-if="order.address">&nbsp;· {{ order.address }}</span>
                        <span v-if="order.region">&nbsp;({{ order.region }})</span>
                    </div>
                    <v-table density="compact" class="orders-page__items">
                        <thead>
                            <tr>
                                <th>Товар</th>
                                <th>Кол-во</th>
                                <th>Размер</th>
                                <th>Цвет</th>
                                <th>Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in order.orderProducts || []" :key="item.id">
                                <td>
                                    <NuxtLink
                                        v-if="productArticleId(item)"
                                        :to="`/catalog/${productArticleId(item)}`"
                                        class="orders-page__product-link"
                                        @click.stop
                                    >
                                        {{ productName(item) }}
                                    </NuxtLink>
                                    <template v-else>{{ productName(item) }}</template>
                                </td>
                                <td>{{ item.amount }}</td>
                                <td>{{ item.product?.productSize?.name || '—' }}</td>
                                <td>{{ item.product?.productColor?.name || '—' }}</td>
                                <td class="orders-page__sum">{{ formatRub(lineTotal(item)) }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </div>
            </div>
        </div>

        <!--
            Показываем пагинацию при любом ненулевом count (не только pageCount > 1),
            чтобы контролы и total были видны; PAGE_SIZE=5 делает несколько страниц на демо.
            key пересоздаёт vs-pagination при смене scope/числа страниц (как в каталоге).
        -->
        <div v-if="totalItems > 0" class="d-flex justify-end mt-10">
            <vs-pagination
                :key="`orders-pagination-${scope}-${pageCount}`"
                v-model:current-page="page"
                :layout="['prev', 'pager', 'next']"
                :page-size="PAGE_SIZE"
                :total="totalItems"
            />
        </div>
    </div>
</template>

<style lang="scss">
.orders-page {
    width: 100%;

    &__toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px 24px;
    }

    &__scope {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        user-select: none;
        font-size: 14px;
    }

    &__catalog-link {
        color: inherit;
        text-decoration: underline;
    }

    &__product-link {
        color: $primary;
        text-decoration: none;

        &:hover {
            text-decoration: underline;
        }
    }

    &__list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    &__card {
        box-shadow: 0px 4px 6px 0px rgba(34, 60, 80, 0.12);
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
    }

    &__row {
        width: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto auto;
        gap: 12px 16px;
        align-items: center;
        padding: 16px 20px;
        border: 0;
        background: transparent;
        text-align: left;
        cursor: pointer;

        @media screen and (max-width: 700px) {
            grid-template-columns: auto minmax(0, 1fr) auto;
            grid-template-areas:
                'chevron meta price'
                'chevron status status';
        }
    }

    &__meta {
        min-width: 0;

        @media screen and (max-width: 700px) {
            grid-area: meta;
        }
    }

    &__id {
        font-weight: 600;
    }

    &__date {
        font-size: 13px;
        opacity: 0.7;
        margin-top: 2px;
    }

    &__status {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        max-width: 100%;
        padding: 3px 10px;
        border: 1px solid rgba(34, 60, 80, 0.28);
        border-radius: 999px;
        font-size: 13px;
        font-weight: 500;
        line-height: 1.3;
        white-space: nowrap;
        color: rgba(34, 60, 80, 0.85);
        background: transparent;

        @media screen and (max-width: 700px) {
            grid-area: status;
        }

        &--create {
            border-color: rgba(34, 60, 80, 0.35);
            color: rgba(34, 60, 80, 0.8);
        }

        &--in_work {
            border-color: #c47a1a;
            color: #9a5c10;
        }

        &--payment {
            border-color: $primary;
            color: $primary;
            background: rgba($primary, 0.04);
        }

        &--delivery {
            border-color: #1a5cff;
            color: #1a5cff;
        }

        &--close {
            border-color: #2e7d4f;
            color: #2e7d4f;
        }

        &--cancelled {
            border-color: rgba(34, 60, 80, 0.28);
            color: rgba(34, 60, 80, 0.55);
        }
    }

    &__price {
        font-weight: 600;
        white-space: nowrap;
        color: $primary;

        @media screen and (max-width: 700px) {
            grid-area: price;
        }
    }

    &__chevron {
        justify-self: end;

        @media screen and (max-width: 700px) {
            grid-area: chevron;
            justify-self: start;
            align-self: center;
        }
    }

    &__details {
        padding: 0 20px 16px;
        border-top: 1px solid rgba(34, 60, 80, 0.08);
    }

    &__delivery {
        font-size: 13px;
        opacity: 0.75;
        padding: 12px 0 8px;
    }

    &__items {
        @media screen and (max-width: 700px) {
            :deep(table) {
                min-width: 520px;
                table-layout: fixed;

                // Товар — больше места под название
                th:nth-child(1),
                td:nth-child(1) {
                    width: 42%;
                }

                // Кол-во — без переноса заголовка
                th:nth-child(2),
                td:nth-child(2) {
                    width: 14%;
                    white-space: nowrap;
                }

                // Размер / Цвет — уже
                th:nth-child(3),
                td:nth-child(3),
                th:nth-child(4),
                td:nth-child(4) {
                    width: 12%;
                }

                th:nth-child(5),
                td:nth-child(5) {
                    width: 20%;
                }
            }
        }
    }

    &__sum {
        white-space: nowrap;
    }
}
</style>
