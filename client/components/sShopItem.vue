<script setup>
defineProps({
    item: {
        type: Object,
        default: () => {},
    },
});
</script>

<template>
    <vs-card>
        <template #title>
            <h3>{{ item.name }}</h3>
        </template>
        <template #img>
            <img src="/mock-shop.jpg" alt="">
        </template>
        <template #text>
            <p>{{ item.description }}</p>
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

<style lang="scss" scoped>
    ::v-deep(.vs-card) {
        background-color: #3F0A0E;
        flex-direction: column;
        display: flex;
        height: 100%;
    }

    ::v-deep(.vs-card__img img) {
        max-width: 100%;
        max-height: 100%;
        width: unset;
        flex: 1;
        object-fit: cover;
        height: 100%;
    }
    ::v-deep(.vs-card__img) {
        flex: 1;
    }

    .vs-card-content {
        height: 100% !important;
    }
    ::v-deep(.vs-card__text) {
        color: white
    }
</style>
