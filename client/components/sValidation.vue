<script setup>
    import useVuelidate from '@vuelidate/core';
    import { VsNotification } from 'vuesax-alpha';

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
        <slot :submit="submit" />
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
