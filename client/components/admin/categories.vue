<script setup>
    const { $api } = useNuxtApp();
    const categories = ref([]);
    const editableCategory = ref({});
    const editableSubCategory = ref({});

    function getCategories() {
        $api('/api/product-category').then((data) => {
            categories.value = data;
        });
    }
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
                :key="category"
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
