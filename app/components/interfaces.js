Vue.component('interfaces', {
    props: ['services'],
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
                            <button v-if="!i.running" v-on:click="Toggle(id)" class="btn" v-bind:class="i.ip && i.mask ? 'btn-info' : 'btn-secondary disabled'"> Start </button>
                            <button v-else v-on:click="Toggle(id)" class="btn btn-danger"> Stop </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <interface_modal
                :id="interface_modal"
                :services="services"

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
            props: ['id', 'opened', 'services'],
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
                            <div class="float-left eth mr-3"><img src="images/eth.png"><span class="id">{{ interface.id }}</span></div>
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
                                    v-on:click="Toggle()"
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
                        <div v-for="service in services" class="form-group row">
                            <label class="col-sm-4 col-form-label">
                                {{ service.name }}
                            </label>
                            <div class="col-sm-8">
                                <button
                                    v-if="!$store.getters[service.running][id]"
                                    v-on:click="((service.must_be_runnig && interface.running) || !service.must_be_runnig) && service.start(id)"
                                    v-bind:class="{'disabled': !((service.must_be_runnig && interface.running) || !service.must_be_runnig) }"
                                    class="btn btn-info"
                                > Start </button>
                                <button
                                    v-else
                                    v-on:click="((service.must_be_runnig && interface.running) || !service.must_be_runnig)  && service.stop(id)"
                                    class="btn btn-danger"
                                > Stop </button>

                                <span v-if="id in $store.getters[service.running] && $store.getters[service.running][id]" class="text-success">Running</span>
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
                }
            }
        }
    }
})
