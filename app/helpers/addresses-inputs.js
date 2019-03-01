var Input_Validation_Mixin = {
    props: {
        value: {
            type: String,
            default: ""
        },
        required: {
            type: Boolean,
            default: false
        }
    },
    data: () => ({
        is_valid: false
    }),
    watch: {
        value: {
            immediate: true,
            handler() {
                this.is_valid = (!this.required && (this.value == "" || this.value == null) ? true : this.regex.test(this.value))
            }
        },
        is_valid: {
            immediate: true,
            handler() {
                this.$emit('valid', this.is_valid)
            }
        }
    }
}

Vue.component('ip-address-input', {
    props: ['value'],

    mixins: [Input_Validation_Mixin],
    data: () => ({
        regex: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
    }),
    
    template: `
        <input
            class="form-control"
            v-bind:value="value"
            v-on:input="$emit('input', $event.target.value)"
            :style="!is_valid ? 'border-color: #dc3545' : ''"
        >
    `
})

Vue.component('ip-mask-input', {
    props: ['value'],

    mixins: [Input_Validation_Mixin],
    data: () => ({
        regex: /^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$/
    }),
    
    template: `
        <input
            class="form-control"
            v-bind:value="value"
            v-on:input="$emit('input', $event.target.value)"
            placeholder="255.255.255.255"
            :style="!is_valid ? 'border-color: #dc3545' : ''"
        >
    `
})

Vue.component('mac-input', {
    props: ['value'],

    mixins: [Input_Validation_Mixin],
    data: () => ({
        regex: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
    }),

    template: `
        <input
            class="form-control"
            v-bind:value="value"
            v-on:input="$emit('input', $event.target.value)"
            :style="!is_valid ? 'border-color: #dc3545' : ''"
        >
    `
})
