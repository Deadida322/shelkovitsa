<script setup>
const shopItems = ref([]);
const route = useRoute();

const { $api } = useNuxtApp();
const page = ref(0);
const pageSize = ref(6);
const category = ref(route.query.category);
console.log(category);
const payload = computed(() => ({
    page: page.value,
    itemsPerPage: pageSize.value,
}));

watch(payload, () => {
    $api('/api/product', { method: 'POST', body: payload.value }).then((res) => {
        shopItems.value = res.data;
    });
}, { immediate: true, deep: true });
</script>

<template>
    <div class="catalog-page">
        <h2 class="text-h6 mt-sm-4 mb-4">
            Каталог
        </h2>
        <client-only>
            <vs-input
                class="s-input"
                placeholder="Поиск в категории"
                icon-after
            >
                <template #icon>
                    <v-icon>mdi-magnify</v-icon>
                </template>
            </vs-input>
        </client-only>
        <v-breadcrumbs :items="['Каталог', 'Категория', 'Подкатегория']" />
        <vs-alert color="#1A5CFF">
            <template #icon>
                <v-icon size="40">
                    mdi-information
                </v-icon>
            </template>
            По вашему запросу найдено 120 вариантов!
        </vs-alert>
        <div class="shops-container">
            <div
                v-for="(item, key) in shopItems"
                :key="key"
                class="shop-item"
            >
                <s-shop-item
                    :item="item"
                    @click="navigateTo(`/catalog/${item.article}`)"
                />
            </div>
        </div>
        <div class="d-flex justify-end mt-10">
            <vs-pagination
                :model-value="page"
                :layout="['prev', 'pager', 'next']"
                :page-size="10"
                :total="400"
                @update:current-page="page = $event - 1"
            />
        </div>
    </div>
</template>

<style lang="scss">
    .shops-container {
        display: grid;
        gap: 14px;
        margin-top: 30px;
        grid-template-columns: repeat(3, 1fr);
        .shop-item {
            flex: 0 0 calc(33.3333% - 10px);
            margin-bottom: 14px;

            @media screen and (max-width: 800px) {
                flex: 0 0 calc(50% - 10px);
            }

            @media screen and (max-width: 450px) {
                flex: 0 0 100%;
                .vs-card {
                    max-width: 100%;
                }
            }
        }
    }

    .about-page {
        &__advantages {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }
    }

    .header {
        &__title {
            color: $primary;

        }

        &__image {
            border-radius: 12px;

            &-container {
                height: 100%;
                padding: 20px;
            }
        }
    }
</style>
