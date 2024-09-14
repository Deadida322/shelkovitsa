<template>
    <vs-navbar shadow v-model="active" :center-collapsed="bp.isTablet || bp.isMobile || bp.isSmallMobile" padding-scroll>
        <template #left>
            <div class="logo">SHELKOVITSA</div>
        </template>
        <vs-navbar-item 
            v-for="item in menu" 
            :id="item.to" 
            :active="active == item.to"
            :key="item.to"
        > 
            <div>{{ item.title }} </div>
        </vs-navbar-item>
        <template #right>
            <template v-if="!bp.isSmallMobile">
                <vs-button type="flat">
                    <nuxt-link to="/signin">Войти</nuxt-link>
                </vs-button>
                <vs-button>
                    <nuxt-link to="/signup">Регистрация</nuxt-link>
                </vs-button>
            </template>
            
            <v-btn v-if="bp.isTablet || bp.isMobile || bp.isSmallMobile" @click="mobileMenuVisible = !mobileMenuVisible" size="small" variant="tonal" class="ml-6" icon>
                <v-icon>mdi-menu</v-icon>
            </v-btn>
        </template>
    </vs-navbar>

    <s-mobile-sidebar v-model="active" v-model:open="mobileMenuVisible"></s-mobile-sidebar>
</template>

<script setup>
    import menu from '~/assets/js/menu';
    import useBreakpoints from '~/composables/breakpoints';
    const active = ref("/about");
    const bp = useBreakpoints();
    const mobileMenuVisible = ref(false);

    const router = useRouter();

    watch(active, (val) => {
        router.push(val);
    })
</script>

<style lang="scss">
    .logo {
        color: $primary;
        font-size: 24px;
        font-family: "Open Sans";
        font-weight: 500
    }
</style>
