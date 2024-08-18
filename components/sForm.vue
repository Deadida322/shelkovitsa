<script setup>
    import useVuelidate from '@vuelidate/core';
    import { VsNotification } from 'vuesax-alpha'
    const $v = useVuelidate();
    const props = defineProps({
        buttonLabel: {
            type: String,
            default: "Отправить"
        }
    });
    const emit = defineEmits(['submit']);

    const submit = () => {
        if(!$v.value.$invalid)
            emit('submit')
        else
            VsNotification({
                title: 'Ошибка!',
                content: 'Проверьте корректность заполнения формы',
                position: 'bottom-center',
                border: 'danger'
            })
    };
</script>

<template>
    <div class="form">
        <slot></slot>
        <div class="form__actions actions">
            <div class="actions__links">
                <slot name="actions-prepend"></slot>
            </div>
            <div class="actions__append">
                <vs-button @click="submit">{{ buttonLabel }}</vs-button>
                <slot name="actions-append"></slot>
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