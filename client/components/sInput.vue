<script setup>
import useVuelidate from '@vuelidate/core';
import { email as emailFunc, helpers, minLength as minLengthFunc, required as requiredFunc } from '@vuelidate/validators';
import useComponentValue from '~/composables/componentValue';

const props = defineProps({
    modelValue: {
        required: true,
        default: '',
        type: [String, Number],
    },
    required: {
        type: Boolean,
        default: false,
    },
    icon: {
        type: String,
        default: '',
    },
    email: {
        type: Boolean,
        default: false,
    },
    customRules: {
        type: Object,
        default: () => {},
    },
    minLength: {
        type: Number,
        required: false,
    },
});

const emit = defineEmits(['update:model-value']);
const { modelValue, required, icon, email, customRules, minLength } = toRefs(props);
const componentValue = useComponentValue({ modelValue, emit });

const rules = computed(() => ({
    required: required.value ? helpers.withMessage('Укажите поле', requiredFunc) : true,
    email: email.value ? helpers.withMessage('Неверный формат почты', emailFunc) : true,
    minLength: minLength.value ? helpers.withMessage(`Минимальная длина поля ${minLength.value} поля`, minLengthFunc(minLength)) : true,
    ...customRules.value,
}));

const $v = useVuelidate(rules, componentValue);
const computedErrors = computed(() => $v.value.$errors?.[0]?.$message);
const attrs = useAttrs();
</script>

<template>
    <vs-input
        v-model="componentValue"
        class="s-input"
        :state="computedErrors ? 'danger' : ''"
        placeholder="Ваш логин"
        v-bind="attrs"
        @blur="$v.$touch()"
        @input="$v.$reset()"
    >
        <template v-if="icon" #icon>
            <v-icon>{{ `mdi-${icon}` }}</v-icon>
        </template>
        <template v-if="computedErrors" #message-danger>
            {{ computedErrors }}
        </template>
    </vs-input>
</template>
