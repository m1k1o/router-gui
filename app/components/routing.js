Vue.component('routing', {
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <div class="float-right">
                    <button class="btn btn-primary" v-on:click="running && (lookup_modal = true)" v-bind:class="{'disabled': !running}">Lookup</button>
                    <button class="btn btn-primary" v-on:click="running && (interfaces_modal = true)" v-bind:class="{'disabled': !running}">Interfaces</button>
                </div>

                <h5 class="card-title mb-0 mt-2">Routing Table</h5>
            </div>
            
            <table class="table mb-0">
                <thead>
                    <tr>
                        <th scope="col">Type</th>
                        <th scope="col">Network</th>
                        <!--<th scope="col">Mask</th>-->
                        <th scope="col">Next Hop</th>
                        <th scope="col" style="width: 1%;"></th>
                        <th scope="col" style="width: 1%;">
                            <button class="btn btn-outline-primary btn-sm btn-block" type="button" v-on:click="running && (add_static = true)" v-bind:class="{'disabled': !running}">+ Add Static</button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(row, id) in entries"
                        v-bind:class="{
                            'table-secondary': !row.interface ? false : !interfaces[row.interface].running
                        }"
                        v-bind:title="(!row.interface ? false : !interfaces[row.interface].running) ? 'Interface is down.' : ''"
                    >
                        <td>{{ row.type }}</td>
                        <td>{{ row.network }}</td>
                        <!--<td>{{ row.ip }}</td>
                        <td>{{ row.mask }}</td>-->
                        <td>{{ row.next_hop }}</td>
                        <td><interface-show :id="row.interface"></interface-show></td>
                        <td>
                            <button v-if="row.type =='Static'" class="btn btn-danger btn-sm btn-block" type="button" v-on:click="RemoveRoute(id)">Remove</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <add_static_modal
                :opened="add_static"
                @closed="add_static = false"
            ></add_static_modal>

            <lookup_modal
                :opened="lookup_modal"
                @closed="lookup_modal = false"
            ></lookup_modal>

            <services_modal
                :service_name="'routing'"

                :opened="interfaces_modal"
                @closed="interfaces_modal = false"
            ></services_modal>
        </div>
    `,
    data: () => {
        return {
            add_static: false,
            lookup_modal: false,
            interfaces_modal: false
        }
    },
    computed: {
        entries() {
            return this.$store.state.routing.table;
        },
        running() {
            return this.$store.state.running;
        },
        interfaces() {
            return this.$store.state.interfaces.table;
        }
    },
    methods: {
        RemoveRoute(id){
            this.$store.dispatch('ROUTING_STATIC_REMOVE', id);
        }
    },
    components: {
        'add_static_modal': {
            props: ['opened'],
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
                visible: false,

                data: {
                    ip: null,
                    mask: null,
                    next_hop_ip: null,
                    interface: null
                }
            }),
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-3"> Add Static Route </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">IP Address</label>
                            <div class="col-sm-8">
                                <ip-address-input v-model="data.ip"></ip-address-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Mask</label>
                            <div class="col-sm-8">
                                <ip-mask-input v-model="data.mask"></ip-mask-input>
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Next Hop IP</label>
                            <div class="col-sm-8">
                                <ip-address-input v-model="data.next_hop_ip"></ip-address-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Interface</label>
                            <div class="col-sm-8">
                                <interface-input v-model="data.interface"></interface-input>
                            </div>
                        </div>
                    </div>
                    <div slot="footer">
                        <button v-on:click="Action()" class="btn btn-success">Add route</button>
                        <button v-on:click="Close()" class="btn btn-secondary">Cancel</button>
                    </div>
                </modal>
            `,
            methods: {
                Open(){
                    this.data.ip =  null;
                    this.data.mask =  null;
                    this.data.next_hop_ip =  null;
                    this.data.interface =  null;

                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.$store.dispatch('ROUTING_STATIC_ADD', this.data).then(() => {
                        this.Close();
                    })
                }
            }
        },
        'lookup_modal': {
            props: ['opened'],
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
                visible: false,

                is_lookingup: false,

                ip: null,
                found_entry: null,
                found: null
            }),
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-0"> Routing Table Lookup </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">IP Address</label>
                            <div class="col-sm-8">
                                <ip-address-input v-model="ip"></ip-address-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label"></label>
                            <div class="btn-group col-sm-8">
                                <button v-if="is_lookingup" class="btn btn-success disabled"> Processing... </button>
                                <button v-else v-on:click="Action()" class="btn btn-success"> Lookup </button>
                            </div>
                        </div>
                        <template v-if="found === true">
                            <hr>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Network</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control-plaintext" v-model="found_entry.network">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Next Hop</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control-plaintext" v-model="found_entry.next_hop">
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Interface</label>
                                <div class="col-sm-8">
                                    <interface-show :id="found_entry.interface"></interface-show>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Type</label>
                                <div class="col-sm-8">
                                <input type="text" class="form-control-plaintext" v-model="found_entry.type">
                                </div>
                            </div>
                        </template>
                        <template v-if="found === false">
                            <hr>
                            <div class="alert alert-danger"> No matching Route found. </div>
                        </template>
                    </div>
                </modal>
            `,
            methods: {
                Open(){
                    this.$set(this, 'found_entry', {
                        ip: null,
                        mask: null,
                        network: null,
                        next_hop: null,
                        interface: null,
                        type: null,
                    });
                    this.found = null;
                    this.ip = null;

                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.is_lookingup = true
                    
                    ajax("Routing", "Lookup", [
                        this.ip
                    ])
                    .then((response) => {
                        console.log(response);
                        if(typeof response.found !== 'undefined' && response.found === false) {
                            this.found = false;
                            return;
                        }
                        
                        this.found = true;
                        this.$set(this, 'found_entry', response);
                    }, () => {})
                    .finally(() => {
                        this.is_lookingup = false
                    });
                }
            }
        }
    }
})
