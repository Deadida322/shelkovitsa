<template>
    <vs-navbar shadow v-model="active" center-collapsed padding-scroll>
        <template #left>
            <div class="logo">SHELKOVITSA</div>
        </template>
        <vs-navbar-item 
            v-for="item in menu" 
            :id="item.to" 
            :active="active == item.to"
            :key="item.to"
        > 
            <router-link :to="item.to">{{ item.title }} </router-link>
        </vs-navbar-item>
        <template #right>
            <vs-button type="flat"><nuxt-link to="/signin">Войти</nuxt-link></vs-button>
            <vs-button><nuxt-link to="/signup">Регистрация</nuxt-link></vs-button>
        </template>
    </vs-navbar>
</template>

<script setup>
    import menu from '~/assets/js/menu';
    const active = ref("/about");
</script>

<style lang="scss">
    .logo {
        color: $primary;
        font-size: 24px;
        font-family: "Open Sans";
        font-weight: 500
    }
</style>
