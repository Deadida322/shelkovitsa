<script setup>
import EditModal from './editModal.vue';

const { $api } = useNuxtApp();
const modalShow = ref(false);
const isDeletedOther = ref(false);
const loading = ref(false);
const products = ref([]);
const page = ref(1);
const totalItems = ref(0);
const editableItem = ref({});
function getProducts() {
    loading.value = true;
    return $api('/api/product-article/admin/getList', {
        method: 'POST',
        body: {
            page: page.value - 1,
            itemsPerPage: 10,
        },
    }).then((res) => {
        products.value = res.data;
        totalItems.value = res.count;
        loading.value = false;
    });
}

getProducts();

async function updateXlsx(file) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('isDeletedOther', isDeletedOther.value);
    loading.value = true;
    try {
        const response = await $api('/api/product-article/uploadProducts', {
            method: 'PUT',
            body: formData,
            responseType: 'blob', // Указываем, что ожидаем бинарный ответ
        });
        getProducts();

        // Создаем ссылку для скачивания файла
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'products-errors.xlsx'); // Имя файла
        document.body.appendChild(link);
        link.click();

        // Очищаем созданные элементы
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
    catch (e) {
        VsNotification({
            title: 'Ошибка!',
            content: e.message,
            position: 'bottom-center',
            border: 'error',
        });
        loading.value = false;
    }
    loading.value = false;
}

const headers = [
    {
        title: 'id',
        value: 'id',
    },
    {
        title: 'Артикул',
        value: 'article',
    },
    {
        title: 'Наименование',
        value: 'name',
    },
    {
        title: 'Описание',
        value: 'description',
    },
    {
        title: 'Цена',
        value: 'price',
    },
    {
        title: 'Удалён?',
        value: 'is_deleted',
    },
    {
        title: 'Виден?',
        value: 'isVisible',
    },
    {
        value: 'actions',
    },
];

function toggleModal(item) {
    modalShow.value = true;
    editableItem.value = item;
}
</script>

<template>
    <div class="admin-products pa-2">
        <EditModal
            v-model="editableItem"
            v-model:visible="modalShow"
            @update-product="getProducts"
        />
        <div class="d-flex align-center">
            <v-file-input
                :loading="loading"
                density="compact"
                hide-details
                label="Загрузить эксель"
                variant="solo-filled"
                @update:model-value="updateXlsx"
            />
            <v-checkbox
                v-model="isDeletedOther"
                v-tooltip="
                    'При установки данного чекбокса, товары, указанные в файле полностью перезапишут текущие'
                "
                class="ml-2"
                color="red"
                hide-details
                :loading="loading"
                label="Обновить целиком"
            />
        </div>
        <v-divider class="my-4" />
        <v-data-table-server
            v-model:page="page"
            :headers="headers"
            :items="products"
            item-key="id"
            :loading="loading"
            items-per-page="10"
            :items-length="totalItems"
            @update:options="getProducts"
        >
            <template #no-data>
                <div class="text-center pa-4">
                    Нет данных
                </div>
            </template>
            <template #item.is_deleted="{ item }">
                <v-checkbox-btn
                    v-model="item.is_deleted"
                    readonly
                />
            </template>
            <template #item.isVisible="{ item }">
                <v-checkbox-btn
                    v-model="item.isVisible"
                    readonly
                />
            </template>
            <template #item.actions="{ item }">
                <v-btn
                    v-model="item.isVisible"
                    icon="mdi-pencil"
                    icon-button
                    size="small"
                    variant="text"
                    @click="toggleModal(item)"
                />
            </template>
        </v-data-table-server>
    </div>
</template>

<style>
    .v-data-table-footer__items-per-page {
        display: none !important;
    }
</style>
