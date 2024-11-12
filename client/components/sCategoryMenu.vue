<script setup lang="ts">
import { useCategoriesStore } from '#imports';

const categoriesStore = useCategoriesStore();
const category = ref('');
</script>

<template>
    <vs-sidebar v-model="category" open>
        <template #logo>
            Женское бельё
        </template>
        <vs-sidebar-group v-for="item in categoriesStore.categories" :id="item.name" :key="item.name">
            <template #header>
                <vs-sidebar-item arrow>
                    {{ item.name }}
                </vs-sidebar-item>
            </template>

            <vs-sidebar-item v-for="nest in item.productSubcategories" :id="nest.name" :key="nest.name">
                {{ nest.name }}
            </vs-sidebar-item>
        </vs-sidebar-group>
    </vs-sidebar>
</template>

<style lang="scss">
    .vs-sidebar {
        position: relative;
        height: fit-content;
        border-radius: 0 0 12px 12px;
        min-width: 300px;
        padding: 10px;
        margin-top: 20px;

        &__logo {
            padding: 0 12px;
            min-height: 60px;
            font-weight: 600;
        }
    }
</style>
