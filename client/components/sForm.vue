<script setup>
import useVuelidate from '@vuelidate/core';
import { VsNotification } from 'vuesax-alpha';

defineProps({
    buttonLabel: {
        type: String,
        default: 'Отправить',
    },
    loading: {
        type: Boolean,
        default: false,
    },
});
const emit = defineEmits(['submit']);
const $v = useVuelidate();
function submit() {
    $v.value.$touch();
    if (!$v.value.$invalid) {
        emit('submit');
    }
    else {
        VsNotification({
            title: 'Ошибка!',
            content: 'Проверьте корректность заполнения формы',
            position: 'bottom-center',
            border: 'danger',
        });
    }
}
</script>

<template>
    <div class="form">
        <slot />
        <div class="form__actions actions">
            <div class="actions__links">
                <slot name="actions-prepend" />
            </div>
            <div class="actions__append">
                <vs-button :disabled="loading" :loading="loading" @click="submit">
                    {{ buttonLabel }}
                </vs-button>
                <slot name="actions-append" />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .form {
        &__actions {
            display: flex;
            justify-content: space-between;
        }
    }
</style>
