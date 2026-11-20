<script setup>
    import debounce from 'lodash/debounce';
    import { VsNotification } from 'vuesax-alpha';
    import EditModal from './editModal.vue';

    const { $api } = useNuxtApp();
    const modalShow = ref(false);
    const isDeletedOther = ref(false);
    const loading = ref(false);
    const products = ref([]);
    const page = ref(1);
    const itemsPerPage = ref(10);
    const totalItems = ref(0);
    const editableItem = ref({});

    // Фильтры списка. status: '' — все артикулы, включая архивные
    const STATUS_OPTIONS = [
        { title: 'Все', value: '' },
        { title: 'Опубликованные', value: 'published' },
        { title: 'Скрытые', value: 'hidden' },
        { title: 'В архиве', value: 'archive' },
    ];
    const SORT_OPTIONS = [
        { title: 'Сначала новые', value: 'new' },
        { title: 'Сначала старые', value: 'default' },
        { title: 'Сначала дешевле', value: 'priceAsc' },
        { title: 'Сначала дороже', value: 'priceDesc' },
    ];
    const status = ref('');
    const search = ref('');
    const categoryId = ref(null);
    const subcategoryId = ref(null);
    const brands = ref([]);
    const noImage = ref(false);
    const noStock = ref(false);
    const sort = ref('new');

    const categoriesStore = useCategoriesStore();
    const categoryItems = computed(() =>
        categoriesStore.categories.map(({ id, name }) => ({ title: name, value: id })),
    );
    const subcategoryItems = computed(() => {
        const category = categoriesStore.categories.find(({ id }) => id === categoryId.value);
        return (category?.productSubcategories ?? []).map(({ id, name }) => ({ title: name, value: id }));
    });

    const brandItems = ref([]);
    function getBrands() {
        return $api('/api/admin/product-article/filters')
            .then((res) => {
                brandItems.value = res.brands.map(brand => ({
                    title: `${brand.name} (${brand.count})`,
                    value: brand.name,
                }));
            })
            .catch(() => {
                // без списка брендов остальные фильтры работают
            });
    }

    const activeFiltersCount = computed(() =>
        [
            status.value,
            search.value.trim(),
            categoryId.value,
            subcategoryId.value,
            brands.value.length,
            noImage.value,
            noStock.value,
        ].filter(Boolean).length,
    );

    // Ответ на устаревший запрос не должен затирать свежий
    let lastRequest = 0;
    function getProducts() {
        const requestId = ++lastRequest;
        loading.value = true;
        return $api('/api/admin/product-article', {
            query: {
                page: page.value - 1,
                itemsPerPage: itemsPerPage.value,
                sort: sort.value,
                ...(status.value ? { status: status.value } : null),
                ...(search.value.trim() ? { query: search.value.trim() } : null),
                ...(categoryId.value ? { categoryId: categoryId.value } : null),
                ...(subcategoryId.value ? { subcategoryId: subcategoryId.value } : null),
                ...(brands.value.length ? { brand: brands.value } : null),
                ...(noImage.value ? { noImage: true } : null),
                ...(noStock.value ? { noStock: true } : null),
            },
        }).then((res) => {
            if (requestId !== lastRequest) {
                return;
            }
            products.value = res.data;
            totalItems.value = res.count;
            loading.value = false;
        }).catch(() => {
            if (requestId === lastRequest) {
                loading.value = false;
            }
        });
    }

    function resetFilters() {
        status.value = '';
        search.value = '';
        categoryId.value = null;
        subcategoryId.value = null;
        brands.value = [];
        noImage.value = false;
        noStock.value = false;
    }

    // Фильтры и сортировка возвращают на первую страницу и перезапрашивают список
    const reload = debounce(() => {
        if (page.value === 1) {
            getProducts();
        }
        else {
            page.value = 1;
        }
    }, 400);
    watch([status, search, categoryId, subcategoryId, brands, noImage, noStock, sort], reload);
    watch(categoryId, () => {
        subcategoryId.value = null;
    });
    watch([page, itemsPerPage], getProducts);

    getProducts();
    getBrands();

    // Layout грузит категории при SSR без куки админа (только с опубликованными товарами),
    // а в карточке товара нужны все подкатегории
    onMounted(() => categoriesStore.getCategories());

    // После правки карточки или импорта список и бренды могли измениться
    function refresh() {
        getBrands();
        return getProducts();
    }

    async function updateXlsx(file) {
        const formData = new FormData();
        formData.append('file', file, file.name);
        formData.append('isDeletedOther', isDeletedOther.value);
        loading.value = true;
        try {
            const response = await $api('/api/admin/product-article/import', {
                method: 'POST',
                body: formData,
                responseType: 'blob', // Указываем, что ожидаем бинарный ответ
            });
            refresh();

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
            title: 'Бренд',
            value: 'brand',
        },
        {
            title: 'Цена',
            value: 'price',
        },
        {
            title: 'Остаток',
            value: 'totalAmount',
        },
        {
            title: 'Фото',
            value: 'photo',
        },
        {
            title: 'Статус',
            value: 'status',
        },
        {
            value: 'actions',
        },
    ];

    function statusOf(item) {
        if (item.is_deleted) {
            return { title: 'В архиве', color: 'error' };
        }
        return item.isVisible
            ? { title: 'Опубликован', color: 'success' }
            : { title: 'Скрыт', color: undefined };
    }

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
            @update-product="refresh"
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

        <div class="admin-products__filters">
            <v-btn-toggle
                v-model="status"
                color="primary"
                variant="outlined"
                density="comfortable"
                mandatory
                divided
            >
                <v-btn
                    v-for="option in STATUS_OPTIONS"
                    :key="option.value"
                    :value="option.value"
                >
                    {{ option.title }}
                </v-btn>
            </v-btn-toggle>
            <v-text-field
                v-model="search"
                class="admin-products__search"
                label="Поиск: артикул, название, бренд"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                clearable
            />
        </div>
        <div class="admin-products__filters mt-3">
            <v-select
                v-model="categoryId"
                :items="categoryItems"
                label="Категория"
                variant="outlined"
                density="compact"
                hide-details
                clearable
            />
            <v-select
                v-model="subcategoryId"
                :items="subcategoryItems"
                :disabled="!categoryId"
                label="Тип"
                variant="outlined"
                density="compact"
                hide-details
                clearable
            />
            <v-autocomplete
                v-model="brands"
                :items="brandItems"
                label="Бренд"
                variant="outlined"
                density="compact"
                hide-details
                multiple
                chips
                closable-chips
                clearable
            />
            <v-select
                v-model="sort"
                :items="SORT_OPTIONS"
                label="Сортировка"
                variant="outlined"
                density="compact"
                hide-details
            />
        </div>
        <div class="d-flex flex-wrap align-center mt-1">
            <v-checkbox
                v-model="noImage"
                label="Без фото"
                density="compact"
                hide-details
            />
            <v-checkbox
                v-model="noStock"
                class="ml-4"
                label="Нет в наличии"
                density="compact"
                hide-details
            />
            <v-btn
                v-if="activeFiltersCount"
                class="ml-4"
                size="small"
                variant="text"
                prepend-icon="mdi-close"
                @click="resetFilters()"
            >
                Сбросить фильтры
            </v-btn>
            <v-spacer />
            <span class="text-medium-emphasis">Найдено: {{ totalItems }}</span>
        </div>

        <v-data-table-server
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            class="mt-2"
            :headers="headers"
            :items="products"
            item-key="id"
            :loading="loading"
            :items-per-page-options="[10, 20]"
            items-per-page-text="Строк на странице"
            :items-length="totalItems"
        >
            <template #no-data>
                <div class="text-center pa-4">
                    Нет данных
                </div>
            </template>
            <template #item.price="{ item }">
                {{ item.price }} ₽
            </template>
            <template #item.totalAmount="{ item }">
                <span :class="{ 'text-error': !item.totalAmount }">{{ item.totalAmount ?? 0 }}</span>
            </template>
            <template #item.photo="{ item }">
                <v-icon
                    v-if="item.productFiles?.length"
                    color="success"
                    icon="mdi-image-check-outline"
                />
                <v-icon
                    v-else
                    v-tooltip="'Нет фото'"
                    color="error"
                    icon="mdi-image-off-outline"
                />
            </template>
            <template #item.status="{ item }">
                <v-chip
                    size="small"
                    variant="flat"
                    :color="statusOf(item).color"
                >
                    {{ statusOf(item).title }}
                </v-chip>
            </template>
            <template #item.actions="{ item }">
                <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click="toggleModal(item)"
                />
            </template>
        </v-data-table-server>
    </div>
</template>

<style lang="scss">
    .admin-products {
        &__filters {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 12px;

            > .v-input {
                min-width: 200px;
                flex: 1 1 200px;
            }
        }

        &__search {
            max-width: 420px;
        }
    }
</style>
