<script setup>
import { VsNotification } from 'vuesax-alpha';
import { formatRub } from '~/utils/money';

const { $api } = useNuxtApp();
const page = ref(1);
const totalItems = ref(0);
const loading = ref(false);
const orders = ref([]);
function getOrders() {
    loading.value = true;
    return $api('/api/admin/order', {
        query: {
            page: page.value - 1,
            itemsPerPage: 10,
        },
    }).then((res) => {
        orders.value = res.data;
        totalItems.value = res.count;
        loading.value = false;
    });
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

const statuses = [
    {
        title: 'Создано',
        value: 'create',
    },
    {
        title: 'В работе',
        value: 'in_work',
    },
    {
        title: 'Оплата',
        value: 'payment',
    },
    {
        title: 'В доставке',
        value: 'delivery',
    },
    {
        title: 'Завершено',
        value: 'close',
    },
    {
        title: 'Отменён',
        value: 'cancelled',
    },
];

const headers = [
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
        width: '300px',
    },
];
</script>

<template>
    <div class="admin-orders">
        <v-data-table-server
            v-model:page="page"
            :headers="headers"
            :items="orders"
            item-key="id"
            :loading="loading"
            items-per-page="10"
            :items-length="totalItems"
            show-expand
            @update:options="getOrders"
        >
            <template #no-data>
                <div class="text-center pa-4">Нет данных</div>
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
                                    <td>{{ product.product.productArticle.name }}</td>
                                    <td>{{ product.amount }}</td>
                                    <td>{{ product.product.productSize.name }}</td>
                                    <td>{{ product.product.productColor.name }}</td>
                                    <td>
                                        {{
                                            formatRub(
                                                (product.price ??
                                                    product.product.productArticle.price) *
                                                    product.amount,
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
                {{ formatRub(item.price) }}
            </template>
            <template #[`item.description`]="{ item }">
                {{ item.description || '—' }}
            </template>
            <template #[`item.status`]="{ item }">
                <v-select
                    class="mt-2"
                    variant="solo"
                    density="compact"
                    item-title="title"
                    item-value="value"
                    :model-value="item.status"
                    :items="statuses"
                    :disabled="item.status === 'cancelled'"
                    @update:model-value="updateStatus($event, item.id)"
                >
                    <template #item="{ props, item: statusItem }">
                        <v-list-item v-bind="props" :subtitle="statusItem.label" />
                    </template>
                </v-select>
            </template>
        </v-data-table-server>
    </div>
</template>
