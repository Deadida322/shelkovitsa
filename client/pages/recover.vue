<script setup>
import { helpers } from '@vuelidate/validators';
import { VsNotification } from 'vuesax-alpha';

const route = useRoute();
const { $api } = useNuxtApp();

const token = computed(() => {
    const value = route.query.token;
    return typeof value === 'string' ? value : '';
});
const hasToken = computed(() => Boolean(token.value));

const forgotForm = ref({ mail: '' });
const resetForm = ref({ password: '', rePassword: '' });
const isLoading = ref(false);

const rePasswordValidation = computed(() => ({
    rePassword: helpers.withMessage(
        'Пароли должны совпадать',
        () => resetForm.value.password === resetForm.value.rePassword,
    ),
}));

async function requestReset() {
    isLoading.value = true;
    try {
        await $api('/api/auth/forgot', {
            method: 'POST',
            body: { mail: forgotForm.value.mail },
        });
        VsNotification({
            title: 'Готово',
            content:
                'Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля',
            position: 'bottom-center',
            border: 'success',
        });
    } catch ({ response }) {
        VsNotification({
            title: 'Ошибка!',
            content: response?._data?.error?.message || 'Не удалось отправить письмо',
            position: 'bottom-center',
            border: 'danger',
        });
    } finally {
        isLoading.value = false;
    }
}

async function submitNewPassword() {
    isLoading.value = true;
    try {
        await $api('/api/auth/reset', {
            method: 'POST',
            body: {
                token: token.value,
                password: resetForm.value.password,
                rePassword: resetForm.value.rePassword,
            },
        });
        VsNotification({
            title: 'Пароль обновлён',
            content: 'Теперь можно войти с новым паролем',
            position: 'bottom-center',
            border: 'success',
        });
        setTimeout(() => navigateTo('/signin'), 800);
    } catch ({ response }) {
        VsNotification({
            title: 'Ошибка!',
            content: response?._data?.error?.message || 'Ссылка недействительна',
            position: 'bottom-center',
            border: 'danger',
        });
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div class="login-page d-flex flex-column align-center">
        <div class="login-page__header text-h6 text-center mb-12">Восстановление пароля</div>

        <vs-alert color="#1A5CFF">
            <template #icon>
                <v-icon size="40">mdi-information</v-icon>
            </template>
            <template v-if="hasToken">
                Задайте новый пароль. Ссылка из письма действует ограниченное время.
            </template>
            <template v-else>
                Укажите email аккаунта — мы пришлём ссылку для сброса пароля.
            </template>
        </vs-alert>

        <div class="auth-card">
            <div class="text-center text-h6 mb-4">
                {{ hasToken ? 'Новый пароль' : 'Забыли пароль?' }}
            </div>

            <s-form
                v-if="!hasToken"
                :loading="isLoading"
                button-label="Отправить ссылку"
                @submit="requestReset"
            >
                <div class="auth-card__form">
                    <s-input
                        v-model="forgotForm.mail"
                        class="s-input"
                        placeholder="Ваш email"
                        icon="email-outline"
                        required
                        email
                    />
                </div>
                <template #actions-prepend>
                    <div class="actions__links">
                        <nuxt-link to="/signin">Вернуться ко входу</nuxt-link>
                    </div>
                </template>
            </s-form>

            <s-form
                v-else
                :loading="isLoading"
                button-label="Сохранить пароль"
                @submit="submitNewPassword"
            >
                <div class="auth-card__form">
                    <s-input
                        v-model="resetForm.password"
                        class="s-input"
                        placeholder="Новый пароль"
                        icon="lock-outline"
                        required
                        type="password"
                        :min-length="8"
                    />
                    <s-input
                        v-model="resetForm.rePassword"
                        class="s-input"
                        placeholder="Повторите пароль"
                        icon="lock-outline"
                        required
                        type="password"
                        :min-length="8"
                        :custom-rules="rePasswordValidation"
                    />
                </div>
                <template #actions-prepend>
                    <div class="actions__links">
                        <nuxt-link to="/signin">Вернуться ко входу</nuxt-link>
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
