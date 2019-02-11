Vue.component('interface-input', {
    props: {
        value: {},
        running_only: {
            type: Boolean,
            default: null
        }
    },
    computed: {
        interfaces() {
            return this.$store.state.interfaces.table;
        }
    },
    template: `
        <select
            class="form-control"
            v-bind:value="value"
            v-on:input="$emit('input', $event.target.value)"
        >
            <option value="">--not selected--</option>
            <optgroup v-if="running_only !== false" label="Running">
                <option v-for="(interface, id) in interfaces" v-if="interface.running" :value="id">{{ interface.friendly_name }}</option>
            </optgroup>
            <optgroup v-if="running_only !== true" label="Not Running">
                <option v-for="(interface, id) in interfaces" v-if="!interface.running" :value="id">{{ interface.friendly_name }}</option>
            </optgroup>
        </select>
    `
})

Vue.component('interface-show', {
    props: ['id'],
    computed: {
        interface() {
            return this.$store.state.interfaces.table[this.id];
        }
    },
    template: `
        <span v-if="id" class="eth" :title="interface.friendly_name + '\\n' + interface.mac + '\\n' + interface.ip">
            <img v-bind:src="interface.running ? 'images/eth_active.png' : 'images/eth.png'">
            <span class="id"> {{ id }} </span>
        </span>
        <span v-else class="eth">
            <img src="images/eth.png">
            <span class="id">?</span>
        </span>
    `
})
