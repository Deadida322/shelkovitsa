<script setup>
    import useComponentValue from '~/composables/componentValue';
    import useVuelidate from '@vuelidate/core';
    import { email as emailFunc, required as requiredFunc, helpers } from '@vuelidate/validators';

    const props = defineProps({
        modelValue: {
            required: true,
            default: "",
            type: [String, Number]
        },
        required: {
            type: Boolean,
            default: false
        },
        icon: {
            type: String,
            default: ""
        },
        email: {
            type: Boolean,
            default: false
        }
    });

    const { modelValue, required, icon, email } = toRefs(props);
    const emit = defineEmits(["update:model-value"])

    const componentValue = useComponentValue({ modelValue, emit});

    const rules = computed(() => ({
            required: required.value ? helpers.withMessage('Укажите поле', requiredFunc) : true,
            email: email.value ? helpers.withMessage('Неверный формат почты', emailFunc) : true
        })
    )

    const $v = useVuelidate(rules, componentValue);
    const computedErrors = computed(() => $v.value.$errors?.[0]?.$message);
    const attrs = useAttrs()
</script>


<template>
    <vs-input 
        class="s-input"
        :state="computedErrors ? 'danger': ''"
        v-model="componentValue"
        placeholder="Ваш логин"
        @blur="$v.$touch()"
        @input="$v.$reset()"
        v-bind="attrs"
    >
        <template v-if="icon" #icon>
            <v-icon>{{`mdi-${icon}`}}</v-icon>
        </template>
        <template v-if="computedErrors" #message-danger> {{ computedErrors }} </template>
    </vs-input>
</template>