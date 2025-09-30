<script setup>
import { useCategoriesStore } from '#imports';
import { VsNotification } from 'vuesax-alpha';
import { VFileUpload } from 'vuetify/labs/VFileUpload';

const props = defineProps({
    modelValue: {
        type: Object,
        default: () => {},
    },
    visible: {
        type: Boolean,
        default: false,
    },
});
const emit = defineEmits(['update:visible', 'update:model-value']);
const categoriesStore = useCategoriesStore();
const config = useRuntimeConfig();
const { $api } = useNuxtApp();
const loading = ref(false);
const item = ref({ ...props.modelValue });
const category = ref(item.value.productSubcategory?.productCategory.id);
const subcategory = ref(item.value.productSubcategory);

async function updateImage(image) {
    const formData = new FormData();
    formData.append('image', image, image.name);
    formData.append('productArticleId', item.value.id);
    loading.value = true;
    await $api('/api/product-article/admin/image', { method: 'POST', body: formData }).then(() => {
        loading.value = false;
        VsNotification({
            title: 'Отлично!',
            content: 'Картинка была загружена',
            position: 'bottom-center',
            border: 'success',
        });
        getProduct();
    }).catch(() => {
        VsNotification({
            title: 'Ошибка!',
            content: 'Ошибка загрузки фото',
            position: 'bottom-center',
            border: 'danger',
        });
    });
};

function handleImageError(event) {
    console.error('Ошибка загрузки изображения в админке:', event.target.src);
}

async function updateProduct() {
    await $api('/api/product-article/admin/productArticle', { method: 'PATCH', body: { productArticleId: item.value.id, ...item.value } },
    ).then(() => {
        loading.value = false;
        VsNotification({
            title: 'Отлично!',
            content: 'Продукт был обновлён',
            position: 'bottom-center',
            border: 'success',
        });
        getProduct();
    }).catch(() => {
        VsNotification({
            title: 'Ошибка!',
            content: 'Продукт не был обновлён',
            position: 'bottom-center',
            border: 'danger',
        });
    });
};

function deleteImage(productFileId) {
    $api('/api/product-article/admin/image', { method: 'DELETE', body: { productFileId } }).then(() => {
        loading.value = false;
        VsNotification({
            title: 'Отлично!',
            content: 'Изображение было удалено',
            position: 'bottom-center',
            border: 'success',
        });
        getProduct();
    });
}

function changeLogo(productFileId) {
    $api('/api/product-article/admin/image', { method: 'PATCH', body: { productFileId } }).then(() => {
        loading.value = false;
        getProduct();
        VsNotification({
            title: 'Отлично!',
            content: 'Логотип обновлён',
            position: 'bottom-center',
            border: 'success',
        });
    });
}

function bindSubcategory(id) {
    $api('/api/product-category/subcategory/bindProduct', { method: 'POST', body: {
        productArticleId: item.value.id,
        subcategoryId: id,
    } }).then(() => {
        loading.value = false;
        VsNotification({
            title: 'Отлично!',
            content: 'Категория обновлена',
            position: 'bottom-center',
            border: 'success',
        });
    });
}

async function getProduct() {
    await $api(`/api/product-article/admin/${item.value.id}`, { method: 'POST' }).then((res) => {
        loading.value = false;
        item.value = res;
        category.value = item.value.productSubcategory?.productCategory.id;
        subcategory.value = item.value.productSubcategory;
    });
}

watch(() => props.visible, async () => {
    item.value = props.modelValue;
    getProduct();
});
</script>

<template>
    <v-dialog
        :model-value="visible"
        max-width="600"
        @update:model-value="emit('update:visible', false)"
    >
        <v-card>
            <v-toolbar>
                <v-toolbar-title>Изменить продукт</v-toolbar-title>
                <v-spacer />
                <v-toolbar-items>
                    <v-btn
                        icon="mdi-close"
                        @click="emit('update:visible', false)"
                    />
                </v-toolbar-items>
            </v-toolbar>
            <v-card-text>
                <v-text-field
                    v-model="item.name"
                    hide-details="auto"
                    label="Название"
                    @blur="updateProduct"
                />
                <v-text-field
                    v-model="item.description"
                    hide-details="auto"
                    label="Описание"
                    @blur="updateProduct"
                />
                <v-select
                    v-model="category"
                    label="Категория"
                    item-title="name"
                    item-value="id"
                    :items="categoriesStore.categories"
                />
                <v-select
                    v-model="subcategory"
                    label="Подкатегория"
                    item-title="name"
                    item-value="id"
                    :items="categoriesStore.categories.find(item => item.id === category)?.productSubcategories || []"
                    @update:model-value="bindSubcategory"
                />
                <v-switch
                    v-model="item.isVisible"
                    label="Продукт видимый?"
                    hide-details
                    color="red"
                    @update:model-value="updateProduct"
                />
                <s-carousel
                    class="admin-images-carousel mt-4"
                    :items-per-page="1.8"
                >
                    <s-slide
                        v-for="(file, key) in item.productFiles"
                        :key="key"
                        :class="{
                            logo: file.isLogo,
                        }"
                    >
                        <v-img
                            cover
                            class="carousel-image"
                            height="200px"
                            :src="`${config.public.apiBase}/static/${file.name}`"
                            @error="handleImageError"
                        >
                            <div class="d-flex pa-2">
                                <v-btn
                                    v-if="!file.isLogo"
                                    v-tooltip="'Сделать главной'"
                                    icon="mdi-content-save"
                                    class="mr-2"
                                    icon-button
                                    color="primary"
                                    @click="changeLogo(file.id)"
                                />
                                <v-btn
                                    v-tooltip="'Удалить изображение'"
                                    icon="mdi-delete"
                                    icon-button
                                    color="red"
                                    @click="deleteImage(file.id)"
                                />
                            </div>
                        </v-img>
                    </s-slide>
                </s-carousel>
                <VFileUpload
                    title="Добавить фото"
                    density="compact"
                    variant="comfortable"
                    @update:model-value="updateImage"
                />
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.admin-images-carousel {
    height: 200px
}

.logo {
    border: 3px solid orange;
}
</style>
