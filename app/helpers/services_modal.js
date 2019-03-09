Vue.component("services_modal", {
    props: ['service_name', 'opened'],
    watch: { 
        opened: function(newVal, oldVal) {
            if(!oldVal && newVal) {
                this.Open();
            }
            
            if(oldVal && !newVal) {
                this.Close();
            }
        }
    },
    data: () => ({
        visible: false
    }),
    computed: {
        interfaces() {
            return this.$store.state.interfaces.table;
        },
        service() {
            return this.$store.state.interfaces.services[this.service_name];
        }
    },
    template: `
        <modal v-if="visible" v-on:close="Close()">
            <div slot="header">
                <h1 class="mb-3"> Service: {{ service.description }} </h1>
            </div>
            <div slot="body" class="form-horizontal">
                <table class="table">
                    <tr v-for="(interface, interface_id) in interfaces">
                        <td width="1%"><interface-show :id="interface_id"></interface-show></td>
                        <td class="text-center">
                            <span v-if="((service.only_running_interface && interface.running) || !service.only_running_interface) && interface.services[service_name]" class="text-success">Running</span>
                            <span v-else-if="interface.services[service_name]" class="text-warning">Waiting until interface starts</span>
                            <span v-else class="text-danger">Not Running</span>
                        </td>
                        <td width="1%">
                            <button
                                v-if="!interface.services[service_name]"
                                v-on:click="Toggle(interface_id)"
                                class="btn btn-info"
                            > Start </button>
                            <button
                                v-else
                                v-on:click="Toggle(interface_id)"
                                class="btn btn-danger"
                            > Stop </button>
                        </td>
                    </tr>
                </table>
            </div>
        </modal>
    `,
    methods: {
        Open(){
            this.visible = true;
        },
        Close(){
            this.visible = false;
            this.$emit("closed");
        },
        Toggle(interface) {
            this.$store.dispatch('SERVICE_TOGGLE', { interface, service: this.service_name });
        }
    }
})
