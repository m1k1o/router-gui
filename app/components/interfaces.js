Vue.component('interfaces', {
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title mb-0">Available Interfaces</h5>
            </div>

            <table class="table mb-0">
                <thead>
                    <tr>
                        <th scope="col" style="width: 1%;">ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">IP</th>
                        <th scope="col" style="width: 1%;"></th>
                        <th scope="col" style="width: 1%;"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(i, id) in entries" v-bind:class="{'table-success': i.running}">
                        <td><interface-show :id="id"></interface-show></td>
                        <td><span v-bind:title="i.description">{{ i.friendly_name }}</span><br><small v-bind:title="i.name">{{ i.mac }}</small></td>
                        <td>{{ i.ip }}<br><small>{{ i.mask }}</small></td>
                        <td>
                            <button class="btn btn-success mt-1" v-on:click="Edit(id)">Edit</button>
                        </td>
                        <td>
                            <button v-if="!i.running" v-on:click="i.ip && i.mask && Toggle(id)" class="btn" v-bind:class="i.ip && i.mask ? 'btn-info' : 'btn-secondary disabled'"> Start </button>
                            <button v-else v-on:click="Toggle(id)" class="btn btn-danger"> Stop </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <interface_modal
                :id="interface_modal"

                :opened="interface_modal !== false"
                @closed="interface_modal = false"
            ></interface_modal>
        </div>
    `,
    data: () => {
        return {
            interface_modal: false
        }
    },
    computed: {
        entries() {
            return this.$store.state.interfaces.table;
        },
        running() {
            return this.$store.state.running;
        }
    },
    methods: {
        Edit(id){
            this.interface_modal = id;
        },
        Toggle(id) {
            this.$store.dispatch('INTERFACE_TOGGLE', id);
        }
    },
    components: {
        'interface_modal': {
            props: ['id', 'opened'],
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
            computed: {
                interface() {
                    return this.$store.state.interfaces.table[this.id];
                },
                services() {
                    return this.$store.state.interfaces.services;
                }
            },
            data() {
                return {
                    visible: false,
                    
                    ip_address: null,
                    subnet_mask: null
                }
            },
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-3"> Edit Interface </h1>
                        <div class="">
                            <div class="float-left eth mr-3"><img src="images/eth.png"><span class="id">{{ id }}</span></div>
                            <span v-bind:title="interface.description">{{ interface.friendly_name }}</span><br><small v-bind:title="interface.name">{{ interface.mac }}</small>
                        </div>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">
                                Status:&nbsp;<span v-if="interface.running" class="text-success">Running</span> <span v-else class="text-danger">Stopped</span>
                            </label>
                            <div class="btn-group col-sm-8">
                                <button
                                    v-if="!interface.running"
                                    v-on:click="interface.ip && interface.mask && Toggle()"
                                    v-bind:class="{'disabled': !interface.ip || !interface.mask}"
                                    class="btn btn-success"
                                > Start </button>
                                <button v-else v-on:click="Toggle()" class="btn btn-danger"> Stop </button>
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">IP Address</label>
                            <div class="col-sm-8">
                                <ip-address-input v-model="ip_address" v-bind:placeholder="interface.ip"></ip-address-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Mask</label>
                            <div class="col-sm-8">
                                <ip-mask-input v-model="subnet_mask" v-bind:placeholder="interface.mask"></ip-mask-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label"></label>
                            <div class="btn-group col-sm-8">
                                <button v-if="interface.ip == ip_address  && interface.mask == subnet_mask" class="btn btn-success disabled"> All changes saved </button>
                                <button v-else v-on:click="Action()" class="btn btn-success"> Save Changes </button>
                            </div>
                        </div>
                        
                        <hr v-if="Object.keys(services).length > 0">
                        <div v-for="(service, service_name) in services" v-if="!service.anonymous" class="form-group row">
                            <label class="col-sm-4 col-form-label">
                                {{ service.description }}
                            </label>
                            <div class="col-sm-8">
                                <button
                                    v-if="!interface.services[service_name]"
                                    v-on:click="ServiceToggle(id, service_name)"
                                    class="btn btn-info"
                                > Start </button>
                                <button
                                    v-else
                                    v-on:click="ServiceToggle(id, service_name)"
                                    class="btn btn-danger"
                                > Stop </button>

                                <span v-if="((service.only_running_interface && interface.running) || !service.only_running_interface) && interface.services[service_name]" class="text-success">Running</span>
                                <span v-else-if="interface.services[service_name]" class="text-warning">Waiting until interface starts</span>
                                <span v-else class="text-danger">Not Running</span>
                            </div>
                        </div>
                    </div>
                </modal>
            `,
            methods: {
                Open(){
                    this.ip_address = this.interface.ip;
                    this.subnet_mask = this.interface.mask;
                    
                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.$store.dispatch('INTERFACE_EDIT', {
                        id: this.id,
                        ip: this.ip_address,
                        mask: this.subnet_mask
                    });
                },
                Toggle() {
                    this.$store.dispatch('INTERFACE_TOGGLE', this.id);
                },
                ServiceToggle(interface, service) {
                    this.$store.dispatch('SERVICE_TOGGLE', { interface, service });
                }
            }
        }
    }
})

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
