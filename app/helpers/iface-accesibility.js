Vue.component('interface-input', {
    props: {
        value: {},
        running_only: {
            type: Boolean,
            default: null
        },
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
        interface() {
            return this.model ? this.$store.state.interfaces.table[this.model] : '';
        },
        model: {
            get() {
                return this.value == null ? '' : this.value
            },
            set(value) {
                this.$emit('input', value)
            }
        }
    },
    data: () => ({
        dropdown_opened: false
    }),
    template: `
        <div class="input-group">
            <span class="form-control" @click="dropdown_opened = !dropdown_opened">{{ interface.friendly_name }}</span>
            <div class="dropdown-menu" v-bind:class="{'show': dropdown_opened && !readonly}" style="width:100%;">
                <a class="dropdown-item" href="#" @click="Select('')"><i>Not Selected</i></a>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="#" v-for="(interface, id) in interfaces" v-if="interface.ip" @click="Select(id)">
                    <interface-show :id="id" class="float-left mr-3"></interface-show>
                    <span v-bind:title="interface.description">{{ interface.friendly_name }}</span><br><small v-bind:title="interface.name">{{ interface.mac }}</small>
                </a>
            </div>
            <div class="input-group-append">
                <button class="btn btn-outline-secondary" @click="dropdown_opened = !dropdown_opened">{{ dropdown_opened ? '&#9650;' : '&#9660;' }}</button>
            </div>
        </div>
        <!--
        <select class="form-control" v-model="model">
            <option value="">--not selected--</option>
            <optgroup v-if="running_only !== false" label="Running">
                <option v-for="(interface, id) in interfaces" v-if="interface.running" :value="id">{{ interface.friendly_name }}</option>
            </optgroup>
            <optgroup v-if="running_only !== true" label="Not Running">
                <option v-for="(interface, id) in interfaces" v-if="!interface.running" :value="id">{{ interface.friendly_name }}</option>
            </optgroup>
        </select>
        -->
    `,
    methods: {
        Select(id) {
            this.model = id;
            this.dropdown_opened = false;
        }
    }
})

Vue.component('interface-show', {
    props: ['id'],
    computed: {
        interface() {
            return this.$store.state.interfaces.table[this.id];
        }
    },
    template: `
        <span v-if="id != null && typeof interface != 'undefined'" class="eth" :title="interface.friendly_name + '\\n' + interface.mac + '\\n' + (interface.ip || '--no IP--')">
            <img v-bind:src="interface.running ? 'images/eth_active.png' : 'images/eth.png'">
            <span class="id"> {{ id }} </span>
        </span>
        <span v-else class="eth">
            <img src="images/eth.png">
            <span class="id">?</span>
        </span>
    `
})
