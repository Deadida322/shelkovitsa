<script setup>
    const user = ref({});
</script>

<template>
    <div class="login-page d-flex flex-column align-center">
        <div class="login-page__header text-h6 text-center mb-12">
            Восстановление пароля
        </div>

        <vs-alert color="#1A5CFF" type="info">
            <template #icon>
                <v-icon size="40">mdi-information</v-icon>
            </template>
            Вы можете <nuxt-link to="/signin">войти в аккаунт</nuxt-link> или <nuxt-link to="/signup">зарегистрировать его</nuxt-link>, чтобы получить дополнительные возможности, а также восстановить пароль
        </vs-alert>
        <div class="auth-card">
            <div class="text-center text-h6 mb-4">
                Восстановить пароль
            </div>
            <div class="auth-card__form">
                <vs-input class="s-input" v-model="user.login" placeholder="Укажите email">
                    <template #icon>
                        <v-icon>mdi-email-outline</v-icon>
                    </template>
                </vs-input>
            </div>
            <div class="auth-card__actions actions">
                <div class="actions__links">
                    <nuxt-link to="/signin">Уже етсь аккаунт?</nuxt-link>
                </div>
                <div class="actions__button">
                    <vs-button>Отправить письмо</vs-button>
                </div>
            </div>
            
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