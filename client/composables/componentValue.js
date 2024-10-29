export default function useComponentValue({ modelValue, emit }) {
    return computed({
        set: val => emit('update:model-value', val),
        get: () => modelValue?.value,
    });
}
