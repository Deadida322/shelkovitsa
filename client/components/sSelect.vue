<script setup>
import useVuelidate from '@vuelidate/core';
import { helpers, required as requiredFunc } from '@vuelidate/validators';
import useComponentValue from '~/composables/componentValue';

const props = defineProps({
    modelValue: {
        required: true,
        default: '',
        type: [String, Number],
    },
    options: {
        type: Array,
        default: () => [],
    },
    labelKey: {
        type: String,
        default: 'label',
    },
    valueKey: {
        type: String,
        default: 'id',
    },
    required: {
        type: Boolean,
        default: false,
    },
    customRules: {
        type: Object,
        default: () => {},
    },
});
const emit = defineEmits(['update:model-value']);
const { modelValue, required, customRules } = toRefs(props);
const attrs = useAttrs();

const componentValue = useComponentValue({ modelValue, emit });

const rules = computed(() => ({
    required: required.value ? helpers.withMessage('Укажите поле', requiredFunc) : true,
    ...customRules.value,
}));

const $v = useVuelidate(rules, componentValue);
const computedErrors = computed(() => $v.value.$errors?.[0]?.$message);
</script>

<template>
    <vs-select
        v-bind="attrs"
        v-model="componentValue"
        :state="computedErrors ? 'danger' : ''"
        @blur="$v.$touch()"
        @input="$v.$reset()"
    >
        <template #default>
            <vs-option
                v-for="option in options"
                :key="option"
                :label="option[labelKey]"
                :value="option[valueKey]"
            >
                {{ option[labelKey] }}
            </vs-option>
        </template>

        <template v-if="computedErrors" #message-danger>
            {{ computedErrors }}
        </template>
    </vs-select>
</template>
