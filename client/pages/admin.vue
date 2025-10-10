<script setup>
    import adminCategories from '@/components/admin/categories';
    import adminOrders from '@/components/admin/orders';
    import adminProducts from '@/components/admin/products';

    definePageMeta({
        middleware: [
            'auth',
        ],
    });

    const tab = ref('products');
    const tabs = ['products', 'orders', 'categories'];
    const componentsMap = {
        products: adminProducts,
        categories: adminCategories,
        orders: adminOrders,
    };
</script>

<template>
    <div class="admin-page">
        <h2 class="text-h6 mt-4">
            Администрирование продуктов
        </h2>
        <v-card class="v-card mt-4">
            <v-tabs
                v-model="tab"
                align-tabs="start"
                color="red-accent-4"
            >
                <v-tab value="products">
                    Продукты
                </v-tab>
                <v-tab value="categories">
                    Категории
                </v-tab>
                <v-tab value="orders">
                    Заказы
                </v-tab>
            </v-tabs>
            <v-card-text>
                <v-tabs-window v-model="tab">
                    <v-tabs-window-item
                        v-for="n in tabs"
                        :key="n"
                        :value="n"
                    >
                        <component :is="componentsMap[tab] " />
                    </v-tabs-window-item>
                </v-tabs-window>
            </v-card-text>
        </v-card>
    </div>
</template>

<style lang="scss" scoped>
.about-page {
    @media screen and (max-width: 600px) {
        margin-top: -80px;
    }

    &__advantages {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }
}
</style>
