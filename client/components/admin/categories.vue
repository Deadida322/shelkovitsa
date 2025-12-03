<script setup>
    const { $api } = useNuxtApp();
    const editableCategory = ref({});
    const editableSubCategory = ref({});
    const categoriesStore = useCategoriesStore();
    const { getCategories } = categoriesStore;
    const { categories } = storeToRefs(categoriesStore);
    getCategories();

    const choosen = ref(0);
    const onSubSave = ref(() => {
        $api('/api/product-category/subcategory/create', { method: 'POST', body: editableSubCategory.value }).then(() => {
            editableSubCategory.value = {};
            getCategories();
        });
    });

    function onSave() {
        $api('/api/product-category/create', { method: 'POST', body: { name: editableCategory.value.name } }).then(() => {
            editableCategory.value = {};
            getCategories();
        });
    }

    function onDeleteSubCategory(id) {
        $api(`/api/product-category/subcategory/delete/${id}`, { method: 'DELETE' }).then(() => {
            editableCategory.value = {};
            getCategories();
        }).catch(({ response }) => {
            VsNotification({
                title: 'Ошибка!',
                content: response?._data?.error?.message,
                position: 'bottom-center',
                border: 'danger',
            });
        });
    }
    function onDeleteCategory(id) {
        $api(`/api/product-category/delete/${id}`, { method: 'DELETE' }).then(() => {
            editableCategory.value = {};
            getCategories();
        }).catch(({ response }) => {
            VsNotification({
                title: 'Ошибка!',
                content: response?._data?.error?.message,
                position: 'bottom-center',
                border: 'danger',
            });
        });
    }
    function onSubAdd(category) {
        editableSubCategory.value.categoryId = category.id;
        editableSubCategory.value.name = '';
    }
</script>

<template>
    <v-card class="pa-2">
        <v-expansion-panels
            v-model="choosen"
            variant="accordeon"
            @update:model-value="editableSubCategory = {}"
        >
            <v-expansion-panel
                v-for="category in categories"
                :key="category.id"
                :title="category.name"
            >
                <v-expansion-panel-text class="pa-2">
                    <ul>
                        <li
                            v-for="subcategory in category.productSubcategories"
                            :key="subcategory"
                            class="mb-2"
                        >
                            {{ subcategory.name }}
                            <v-btn
                                size="x-small"
                                color="error"
                                class="ml-2"
                                icon="mdi-trash-can-outline"
                                @click="onDeleteSubCategory(subcategory.id)"
                            />
                        </li>
                    </ul>
                    <div class="d-flex justify-center">
                        <template v-if="editableSubCategory.categoryId >= 0">
                            <s-validation
                                v-slot="{ submit }"
                                class="d-flex flex-column w-100"
                                @submit="onSubSave"
                            >
                                <s-input
                                    v-model="editableSubCategory.name"
                                    placeholder="Подкатегория"
                                    required
                                    density="compact"
                                    variant="solo"
                                />
                                <v-btn
                                    class="mt-2"
                                    prepend-icon="mdi-ыфму"
                                    color="red"
                                    @click="submit"
                                >
                                    Сохранить
                                </v-btn>
                            </s-validation>
                        </template>
                        <template v-else>
                            <v-btn
                                prepend-icon="mdi-plus"
                                color="red"
                                @click="onSubAdd(category)"
                            >
                                Подкатегория
                            </v-btn>
                        </template>
                    </div>
                    <div class="d-flex">
                        <v-spacer />
                        <v-btn
                            size="small"
                            color="error"
                            class="ml-2 mt-4"
                            append-icon="mdi-trash-can-outline"
                            @click="onDeleteCategory(category.id)"
                        >
                            Удалить категорию
                        </v-btn>
                    </div>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>
        <div class="mt-4 d-flex justify-center">
            <template v-if="editableCategory.isAdd">
                <s-validation
                    v-slot="{ submit }"
                    class="d-flex flex-column w-100"
                    @submit="onSave"
                >
                    <s-input
                        v-model="editableCategory.name"
                        placeholder="Категория"
                        required
                        density="compact"
                        variant="solo"
                    />
                    <v-btn
                        class="mt-2"
                        prepend-icon="mdi-ыфму"
                        color="red"
                        @click="submit"
                    >
                        Сохранить
                    </v-btn>
                </s-validation>
            </template>
            <template v-else>
                <v-btn
                    prepend-icon="mdi-plus"
                    color="red"
                    @click="editableCategory.isAdd = true"
                >
                    Категория
                </v-btn>
            </template>
        </div>
    </v-card>
</template>
