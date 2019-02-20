Vue.component('ip-address-input', {
    props: {
        value: {},
        readonly: {
            type: Boolean,
            default: false
        },
        placeholder: {
            type: String,
            default: ""
        }
    },
    computed: {
        interfaces() {
            return this.$store.state.interfaces.table;
        },
        arps() {
            return this.$store.state.arp.table;
        },
        model: {
            get() {
                return this.value == null ? '' : this.value
            },
            set(value) {
                if(value == "") {
                    this.select = false;
                }
                this.$emit('input', value)
            }
        }
    },
    data: () => ({
        dropdown_opened: false,
        latest: []
    }),
    template: `
        <div class="input-group">
            <input
                class="form-control"

                v-model="model"
                :placeholder="placeholder"
                :readonly="readonly"
            />
            <div class="dropdown-menu" v-bind:class="{'show': dropdown_opened}" style="width:100%;">
                <a class="dropdown-item" href="#" v-for="interface in interfaces" v-if="interface.ip" @click="Put(interface.ip)">{{ interface.ip }}</a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="#" v-for="arp in arps" v-if="arp.ip" @click="Put(arp.ip)">{{ arp.ip }}</a>
            </div>
            <div class="input-group-append">
                <button class="btn btn-outline-secondary" @click="dropdown_opened = !dropdown_opened">{{ dropdown_opened ? '&#9650;' : '&#9660;' }}</button>
            </div>
        </div>
    `,
    methods: {
        Put(ip) {
            this.model = ip;
            this.dropdown_opened = false;
        }
    }
})

Vue.component('ip-mask-input', {
    props: {
        value: {},
        readonly: {
            type: Boolean,
            default: false
        },
        placeholder: {
            type: String,
            default: "255.255.255.255"
        }
    },
    computed: {
        model: {
            get() {
                return this.value == null ? '' : this.value
            },
            set(value) {
                this.$emit('input', value)
            }
        }
    },
    template: `
        <input
            class="form-control"

            v-model="model"
            :placeholder="placeholder"
            :readonly="readonly"
        />
    `
})
