<script setup>
defineProps({
    item: {
        type: Object,
        default: () => {},
    },
});
</script>

<template>
    <div class="advantage__item">
        <div class="advantage__icon">
            <v-icon
                size="64px" color="red-darken-4"
            >
                {{ item.icon }}
            </v-icon>
        </div>
        <div class="advantage__description">
            <div class="advantage__title">
                {{ item.title }}
            </div>
            <div class="advantage__text">
                {{ item.text }}
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    .advantage {
        &__item {
            display: flex;
            box-shadow: 0px 4px 6px 0px rgba(34, 60, 80, 0.2);
            gap: 20px;
            border-radius: 12px;
            padding: 24px;
            align-items: center;

            @media screen and (max-width: 600px) {
                padding: 12px;
                flex-direction: column;
                text-align: center;
            }
        }

        &__title {
            color: $primary;
            font-size: 18px;
            font-weight: 600;

            @media screen and (max-width: 600px) {
                font-size: 16px;
            }
        }

        &__text {
            @media screen and (max-width: 600px) {
                font-size: 14px;
            }
        }
    }
</style>
