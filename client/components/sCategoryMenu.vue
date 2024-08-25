<script setup lang="ts">
import categoryMenu from '~/assets/js/categoryMenu';
const category = ref("")
</script>

<template>
    <vs-sidebar v-model="category" open>
        <template #logo>
            Женское бельё
        </template>
        <vs-sidebar-group v-for="item in categoryMenu" :id="item.title">
            <template #header>
                <vs-sidebar-item arrow>
                    {{item.title}}
                </vs-sidebar-item>
            </template>

            <vs-sidebar-item v-for="nest in item.nested" :id="nest">
                {{nest}}
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
