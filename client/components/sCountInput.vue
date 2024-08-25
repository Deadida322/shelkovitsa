<script setup>
    const props = defineProps({
        modelValue: {
            type: Number,
            default: 1
        },
        label: {
            type: String,
            default: ""
        },
        max: {
            type: Number,
            default: 1000
        }
    });

    const emit = defineEmits(['update:model-value'])

    const count = computed({
        get: () => props.modelValue,
        set: (val) => emit('update:model-value', val > props.max ? props.max : val)
    })
</script>

<template>
    <div class="s-count">
        <div class="s-count__label">
            {{  label  }}
        </div>
        <div class="s-count-input">
            <vs-button 
                size="small"
                class="s-count-input__less"
                @click="count ? count -= 1 : void 0"
            >
                -
            </vs-button>
            <client-only>
                <vs-input
                    class="s-count-input__input"
                    type="number"
                    width="20px"
                    v-model="count"
                />
            </client-only>
            <vs-button 
                @click="count < max ? count += 1 : void 0" 
                size="small" 
                class="s-count-input__more"
            >
                +
            </vs-button>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.s-count-input {
    display: flex;
    gap: 4px;
    align-items: center;
    position: relative;
    margin-left: 10px;
    margin-right: 10px;

    ::v-deep(.s-count-input__input) {
        width: 60px !important;
        padding-left: 22px;
        padding-right: 10px;
    }

    &__less {
        position: absolute;
        top: 8px;
        left: 0;
        transform: translateX(-50%);
    }

    &__more {
        position: absolute;
        top: 8px;
        right: 0;
        transform: translateX(50%);
    }

}

.s-count {
    display: flex;
    gap: 4px;
    align-items: center;
}


</style>    