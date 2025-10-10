<script setup>
    import { useAuthStore } from '@/stores/auth';
    import { VsNotification } from 'vuesax-alpha';

    const authStore = useAuthStore();
    const user = ref({
        mail: '',
        password: '',
    });

    const isLoading = ref(false);

    async function onSubmit() {
        isLoading.value = true;
        await authStore.login(user.value).catch(({ response }) => {
            VsNotification({
                title: 'Ошибка!',
                content: response?._data?.error?.message,
                position: 'bottom-center',
                border: 'danger',
            });
        });
        isLoading.value = false;
    }
</script>

<template>
    <div class="login-page d-flex flex-column align-center">
        <div class="login-page__header text-h6 text-center mb-12">
            Авторизация
        </div>

        <vs-alert color="#1A5CFF">
            <template #icon>
                <v-icon size="40">
                    mdi-information
                </v-icon>
            </template>
            Вы можете
            <nuxt-link to="/signin">
                войти в аккаунт
            </nuxt-link>
            или
            <nuxt-link to="/signup">
                зарегистрировать его
            </nuxt-link>,
            чтобы получить дополнительные возможности, а также восстановить пароль
        </vs-alert>
        <div class="auth-card">
            <div class="text-center text-h6 mb-4">
                Войти в аккаунт
            </div>
            <s-form :loading="isLoading" @submit="onSubmit">
                <div class="auth-card__form">
                    <s-input
                        v-model="user.mail"
                        class="s-input"
                        placeholder="Ваш логин"
                        icon="account-outline"
                        required
                        email
                    />
                    <s-input
                        v-model="user.password"
                        class="s-input"
                        placeholder="Введите пароль"
                        icon="lock-outline"
                        required
                        type="password"
                    />
                </div>
                <template #actions-prepend>
                    <div class="actions__links">
                        <nuxt-link to="/signup">
                            Ещё нет аккаунта?
                        </nuxt-link>
                    </div>
                </template>
            </s-form>
        </div>
    </div>
</template>

<style lang="scss">
.auth-card {
    box-shadow: 0px 4px 6px 0px rgba(34, 60, 80, 0.2);
    border-radius: 12px;
    padding: 20px;
    margin-top: 40px;
    width: 600px;

    max-width: 100%;

    &__form {
        gap: 20px;
        display: flex;
        flex-direction: column;
    }

    .actions {
        margin-top: 20px;
        display: flex;
        justify-content: space-between;

        &__links {
            display: flex;
            gap: 20px;
            font-size: 12px;
        }
    }
}

.s-input {
    width: 100%;
}
</style>
