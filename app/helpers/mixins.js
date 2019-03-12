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
                    this.is_valid = (!this.required && (this.value === "" || this.value == null) ? true :
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

function Validation_Mixin_Factory() {
    return {
        computed: {
            is_valid() {
                for (const id in this.valid) {
                    if(!this.valid[id]){
                        return false;
                    }
                }
                return true;
            }
        },
        data: () => ({
            valid: {}
        }),
        watch: {
            is_valid: {
                immediate: true,
                handler(newValue) {
                    this.$emit('valid', newValue);
                }
            }
        },
        methods: {
            Valid(id, state = true) {
                this.$set(this.valid, id, state);
            }
        }
    }
}

function Model_Mixin_Factory(defaults) {
    if(Array.isArray(defaults)) {
        var props = defaults;
            
        defaults = {};
        for (const prop of props) {
            defaults[prop] = "";
        }
    } else {
        var props = Object.keys(defaults);
    }

    var computed = {};
    var valid = {};

    // Loop through properties, register getters & setters.
    for (const prop of props) {
        computed[prop] = {
            get() {
                // If is default value not present and is not null, include it
                if((!(prop in this.value)) && defaults[prop] !== null && defaults[prop] !== "") {
                    this.$set(this.value, prop, typeof defaults[prop] == 'function' ? defaults[prop]() : defaults[prop]);
                }

                // If is value not present or null, return it as empty string
                return typeof this.value[prop] === 'undefined' || this.value[prop] === null ? "" : this.value[prop];
            },
            set(value) {
                // If is value empty, don't include it
                if(typeof value === 'undefined' || value === null || value === "") {
                    this.$delete(this.value, prop);
                } else {
                    // If is property number, include it as number
                    if(!isNaN(value) && value !== "") {
                        this.$set(this.value, prop, Number(value));
                    } else {
                        this.$set(this.value, prop, value);
                    }
                }
                
                this.$emit('input', this.value);
            }
        };

        valid[prop] = true;
    }
    
    return {
        mixins: [Validation_Mixin_Factory()],
        data: () => ({
            valid
        }),
        props: {
            value: {
                type: Object,
                default: ()=> defaults
            },
            readonly: {
                type: Boolean,
                default: false
            }
        },
        computed: {...computed}
    };
}