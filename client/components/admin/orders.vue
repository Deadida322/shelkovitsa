<script setup>
import { VsNotification } from 'vuesax-alpha';

const { $api } = useNuxtApp();
const page = ref(1);
const totalItems = ref(0);
const loading = ref(false);
const orders = ref([]);
function getOrders() {
    loading.value = true;
    return $api('/api/order/admin', { method: 'POST', body: {
        page: page.value - 1,
        itemsPerPage: 10,
    } }).then((res) => {
        orders.value = res.data;
        totalItems.value = res.count;
        loading.value = false;
    });
};

function updateStatus(status, orderId) {
    return $api('/api/order/admin/changeStatus', { method: 'PATCH', body: {
        status,
        orderId,
    } }).then(() => {
        VsNotification({
            title: 'Отлично!',
            content: 'Статус был обновлён',
            position: 'bottom-center',
            border: 'success',
        });
    });
}

const statusesMap = {
    create: 'Создано',
    in_work: 'В работе',
    payment: 'Оплата',
    delivery: 'В доставке',
    close: 'Завершено',
};

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
        title: 'Почта',
        value: 'mail',
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
                <div class="text-center pa-4">
                    Нет данных
                </div>
            </template>
            <template #expanded-row="{ item, columns }">
                <tr>
                    <td :colspan="columns.length">
                        <v-table>
                            <thead>
                                <tr>
                                    <th>
                                        Название
                                    </th>
                                    <th>
                                        Количество
                                    </th>
                                    <th>
                                        Размер
                                    </th>
                                    <th>
                                        Цвет
                                    </th>
                                    <th>
                                        Стоимость
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="product in item.orderProducts"
                                    :key="product.product.name"
                                >
                                    <td>{{ product.product.productArticle.name }}</td>
                                    <td>{{ product.amount }}</td>
                                    <td>{{ product.product.productSize.name }}</td>
                                    <td>{{ product.product.productColor.name }}</td>
                                    <td>{{ product.product.productArticle.price * product.amount }}</td>
                                </tr>
                            </tbody>
                        </v-table>
                    </td>
                </tr>
            </template>
            <template #item.status="{ item }">
                <v-select
                    class="mt-2"
                    variant="solo"
                    density="compact"
                    item-title="title"
                    item-value="value"
                    :value="statusesMap[item.status]"
                    :items="statuses"
                    @update:model-value="updateStatus($event, item.id)"
                >
                    <template #item="{ props, item }">
                        <v-list-item v-bind="props" :subtitle="item.label" />
                    </template>
                </v-select>
            </template>
        </v-data-table-server>
    </div>
</template>
