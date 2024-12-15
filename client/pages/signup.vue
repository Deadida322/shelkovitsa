<script setup>
import { helpers } from '@vuelidate/validators';
import { VsNotification } from 'vuesax-alpha';

const { $api } = useNuxtApp();
const user = ref({});
const rePasswordValidation = computed(() => ({
    rePassword: helpers.withMessage('Пароли должны совпадать', () => user.value.password === user.value.rePassword),
}));

function onSubmit() {
    $api('/api/auth/register', { method: 'POST', body: user.value }).catch(({ response }) => {
        VsNotification({
            title: 'Ошибка!',
            content: response?._data?.error?.message,
            position: 'bottom-center',
            border: 'danger',
        });
    });
}
</script>

<template>
    <div class="login-page d-flex flex-column align-center">
        <div class="login-page__header text-h6 text-center mb-12">
            Регистрация
        </div>
        <vs-alert
            color="#1A5CFF"
            type="info"
        >
            <template #icon>
                <v-icon size="40">
                    mdi-information
                </v-icon>
            </template>
            Вы можете <nuxt-link to="/signin">
                войти в аккаунт
            </nuxt-link> или <nuxt-link to="/signup">
                зарегистрировать его
            </nuxt-link>, чтобы получить дополнительные возможности, а также восстановить пароль
        </vs-alert>
        <div class="auth-card">
            <s-form button-label="Зарегистрироваться" @submit="onSubmit">
                <div class="text-center text-h6 mb-4">
                    Зарегистрировать аккаунт
                </div>
                <div class="auth-card__form">
                    <s-input
                        v-model="user.mail"
                        class="s-input"
                        required
                        email
                        placeholder="Ваш email"
                        icon="email-outline"
                    />
                    <s-input
                        v-model="user.fio"
                        class="s-input"
                        required
                        placeholder="ФИО"
                        icon="account-outline"
                    />
                    <s-input
                        v-model="user.password"
                        class="s-input"
                        placeholder="Введите пароль"
                        type="password"
                        icon="lock-outline"
                        required
                        :min-length="8"
                    >
                        <template #icon>
                            <v-icon>mdi-lock-outline</v-icon>
                        </template>
                    </s-input>
                    <s-input
                        v-model="user.rePassword"
                        class="s-input"
                        placeholder="Повторите пароль"
                        type="password"
                        :custom-rules="rePasswordValidation"
                        icon="lock-outline"
                    />
                </div>
                <template #actions-prepend>
                    <div class="actions__links">
                        <nuxt-link to="/signin">
                            Уже есть аккаунт?
                        </nuxt-link>
                        <nuxt-link to="/recover">
                            Забыли пароль?
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

            a:hover {
                text-decoration: underline;
            }
        }
    }
}

.s-input {
    width: 100%;
}
</style>
