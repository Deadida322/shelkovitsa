<template>
    <div class="s-footer">
        <div class="s-footer__col">
            <div class="s-footer__title">SHELKOVITSA.RU</div>
            <div class="s-footer__item">ОГРН: 10255323423423472</div>
            <div class="s-footer__item">ООО “Магма”</div>
        </div>
        <div class="s-footer__col">
            <div class="s-footer__title">КОНТАКТЫ</div>
            <div class="s-footer__item">8 999 723 38 09</div>
            <div class="s-footer__item">8 999 723 38 09</div>
        </div>
        <div class="s-footer__col">
            <div class="s-footer__title">ПРАВИЛА</div>
            <div class="s-footer__item">Условия возврата товара</div>
            <div class="s-footer__item">Политика конфиденциальности</div>
        </div>
        <div class="s-footer__watermark">© Webgib 2024</div>
    </div>
</template>

<style lang="scss">
    .s-footer {
        background-color: $primary-opacity;
        width: 100vw;
        display: flex;
        padding: 40px 160px;
        padding-bottom: 80px;
        position: relative;

        &__col {
            width: 33%;
            display: flex;
            flex-direction: column;
        }

        &__title {
            font-size: 16px;
            width: fit-content;
            border-bottom: 2px solid $primary;
            margin-bottom: 40px;
            padding-bottom: 4px;
        }

        &__item {
            margin-bottom: 20px;
            font-size: 14px;
        }

        &__watermark {
            position: absolute;
            left: 0;
            bottom: 0;
            display: flex;
            width: 100vw;
            justify-content: center;
            background-color: #3F0A0E;
            height: 40px;
            align-items: center;
            color: white;
            font-weight: 400;
            font-size: 12px;
        }
    }
</style>