function Input_Validation_Mixin(condition = null) {
    return {
        props: {
            value: {
                //type: String,
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
                    this.is_valid = (!this.required && (this.value == "" || this.value == null) ? true :
                        (condition === null ? this.validate(this.value) : condition(this.value))
                    )
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
}

Vue.component('ip-address-input', {
    mixins: [
        Input_Validation_Mixin((value) =>
            /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/.test(value)
        )
    ],
    
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
    mixins: [
        Input_Validation_Mixin((value) =>
            /^(((255\.){3}(255|254|252|248|240|224|192|128|0+))|((255\.){2}(255|254|252|248|240|224|192|128|0+)\.0)|((255\.)(255|254|252|248|240|224|192|128|0+)(\.0+){2})|((255|254|252|248|240|224|192|128|0+)(\.0+){3}))$/.test(value)
        )
    ],
    
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
    mixins: [
        Input_Validation_Mixin((value) =>
            /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(value)
        )
    ],
    
    template: `
        <input
            class="form-control"
            v-bind:value="value"
            v-on:input="$emit('input', $event.target.value)"
            :style="!is_valid ? 'border-color: #dc3545' : ''"
        >
    `
})

Vue.component('number-input', {
    mixins: [Input_Validation_Mixin()],

    props: {
        min: {
            type: Number,
            default: -Infinity
        },
        max: {
            type: Number,
            default: Infinity
        },
        type: {
            type: String,
            validator: (val) => ['uchar', 'ushort', 'uint'].includes(val)
        }
    },
    computed: {
        range() {
            var min = this.min;
            var max = this.max;

            switch(this.type) {
                case 'uchar':
                    min = 0;
                    max = 255;
                    break;
                case 'ushort':
                    min = 0;
                    max = 65535;
                    break;
                case 'uint':
                    min = 0;
                    max = 4294967295;
                    break;
            }

            return {min, max}
        }
    },
    methods: {
        validate(value) {
            var {min, max} = this.range;

            return !isNaN(value) && value >= min && value <= max
        }
    },

    template: `
        <input
            class="form-control"
            v-bind:value="value"
            v-on:input="$emit('input', $event.target.value)"
            :style="!is_valid ? 'border-color: #dc3545' : ''"
        >
    `
})
