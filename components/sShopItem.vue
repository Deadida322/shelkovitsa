<template>
    <vs-card>
        <template #title>
            <h3>{{item.title}}</h3>
        </template>
        <template #img>
            <img :src="`/mock-shop.jpg`" alt="" />
        </template>
        <template #text>
            <p>{{item.description}}</p>
        </template>
        <template #interactions>
            <vs-button color="danger" icon>
                <v-icon>mdi-cart</v-icon>
            </vs-button>
            <v-chip class="ml-4" variant="flat" label>
                {{ item.price }} ₽
            </v-chip>
        </template>
    </vs-card>
</template>

<script setup>
    defineProps({
        item: {
            type: Object,
            default: () => {}
        }
    })
</script>

<style lang="scss" scoped>
    ::v-deep(.vs-card) {
        background-color: #3F0A0E;
    }

    ::v-deep(.vs-card__text) {
        color: white
    }
</style>