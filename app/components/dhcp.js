Vue.component('dhcp', {
    template: `
        <div class="card mb-3">
            <div class="card-header">
                <div class="float-right">
                    <button class="btn btn-primary" v-on:click="running && (pools_modal = true)" v-bind:class="{'disabled': !running}">Pools</button>
                    <button class="btn btn-primary" v-on:click="running && (timers_modal = true)" v-bind:class="{'disabled': !running}">Timers</button>
                    <button class="btn btn-primary" v-on:click="running && (interfaces_modal = true)" v-bind:class="{'disabled': !running}">Interfaces</button>
                </div>

                <h5 class="card-title my-2">DHCP</h5>
            </div>
            
            <table class="table mb-0">
                <thead>
                    <tr>
                        <th scope="col" width="1%"></th>
                        <th scope="col">MAC</th>
                        <th scope="col">IP</th>
                        <th scope="col">Status</th>
                        <th scope="col" style="width: 1%;">
                            <button class="btn btn-outline-primary btn-sm btn-block" type="button" v-on:click="running && (add_static = true)" v-bind:class="{'disabled': !running}">+ Add Static</button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(row, id) in entries"
                        v-bind:class="{
                            'table-success' : row.is_available,
                            'table-info' : row.is_leased,
                            'table-warning' : row.is_offered
                        }"
                    >
                        <td><interface-show :id="row.interface"></interface-show></td>
                        <td>{{ row.mac }}</td>
                        <td>{{ row.ip }}</td>
                        
                        <td v-if="row.is_available"><i>available</i></td>
                        <td v-else-if="row.is_leased"><i>leased ({{ row.lease_expires_in }} sec.)</i></td>
                        <td v-else-if="row.is_offered"><i>offered ({{ row.offer_expires_in }} sec.)</i></td>
                        <td v-else><i>--unknown--</i></td>

                        <td v-if="row.is_dynamic">
                            <i>Dynamic</i>
                        </td>
                        <td v-else>
                            <button class="btn btn-danger btn-sm btn-block" type="button" v-on:click="RemoveLease(id)">Remove</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <pools_modal
                :opened="pools_modal"
                @closed="pools_modal = false"
            ></pools_modal>

            <add_static_modal
                :opened="add_static"
                @closed="add_static = false"
            ></add_static_modal>

            <timers_modal
                :opened="timers_modal"
                @closed="timers_modal = false"
            ></timers_modal>
            
            <services_modal
                :service_name="'dhcp'"

                :opened="interfaces_modal"
                @closed="interfaces_modal = false"
            ></services_modal>
        </div>
    `,
    data: () => {
        return {
            pools_modal: false,
            add_static: false,
            timers_modal: false,
            interfaces_modal: false
        }
    },
    methods: {
        RemoveLease(id) {
            this.$store.dispatch('DHCP_STATIC_REMOVE', id);
        }
    },
    computed: {
        entries() {
            return this.$store.state.dhcp.table;
        },
        timers() {
            return this.$store.state.dhcp.timers;
        },
        running() {
            return this.$store.state.running;
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
                    mac: null,
                    interface: null
                }
            }),
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-3"> Add DHCP Static Entry </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">MAC Address</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="data.mac">
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Interface</label>
                            <div class="col-sm-8">
                                <interface-input v-model="data.interface"></interface-input>
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">IP Address</label>
                            <div class="col-sm-8">
                                <ip-address-input v-model="data.ip"></ip-address-input>
                            </div>
                        </div>
                    </div>
                    <div slot="footer">
                        <button v-on:click="Action()" class="btn btn-success">Add Entry</button>
                        <button v-on:click="Close()" class="btn btn-secondary">Cancel</button>
                    </div>
                </modal>
            `,
            methods: {
                Open(){
                    this.data.interface =  null;
                    this.data.ip =  null;
                    this.data.mac =  null;

                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.$store.dispatch('DHCP_STATIC_ADD', this.data).then(() => {
                        this.Close();
                    })
                }
            }
        },
        'timers_modal': {
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
            data() {
                return {
                    visible: false,
                    timers: {}
                }
            },
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-0"> DHCP Timers </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Lease Timeout <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.lease_timeout">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Offer Timeout <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.offer_timeout">
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Renewal Timeout <small>(ms</small>)</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.renewal_timeout">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Rebinding Interval <small>(ms</small>)</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.rebinding_timeout">
                            </div>
                        </div>
                    </div>
                    <div slot="footer">
                        <button v-on:click="Action()" class="btn btn-success"> Save Changes </button>
                        <button v-on:click="Close()" class="btn btn-secondary">Cancel</button>
                    </div>
                </modal>
            `,
            methods: {
                Open(){
                    this.timers = {
                        ...this.$store.state.dhcp.timers
                    }
                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.$store.dispatch('DHCP_TIMERS', this.timers).then(() => {
                        this.Close();
                    })
                }
            }
        },
        'pools_modal': {
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
                new_visible: false,

                new_pool: {
                    interface: null,
                    first_ip: null,
                    last_ip: null,
                    is_dynamic: true
                }
            }),
            computed: {
                pools() {
                    return this.$store.state.dhcp.pools;
                }
            },
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-3" v-if="!new_visible"> DHCP Pools </h1>
                        <h1 class="mb-3" v-else> Add new DHCP Pool </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <template v-if="!new_visible">
                            <table class="table" v-if="Object.keys(pools).length > 0">
                                <thead>
                                    <tr>
                                        <th scope="col" width="1%"></th>
                                        <th scope="col">First IP</th>
                                        <th scope="col">Last IP</th>
                                        <th scope="col">Type</th>
                                        <th scope="col"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(pool, interface) in pools">
                                        <td width="1%"><interface-show :id="interface"></interface-show></td>
                                        <td>
                                            {{ pool.first_ip }}
                                        </td>
                                        <td>
                                            {{ pool.last_ip }}
                                        </td>
                                        <!--<td :title="'Available: ' + pool.available + '\\nAllocated: ' + pool.allocated">
                                            {{ Math.round(pool.allocated / pool.available * 100)  }}%
                                        </td>-->
                                        <td width="1%">
                                            <button v-if="pool.is_dynamic" class="btn btn-info btn-sm" type="button" v-on:click="Toggle(interface)">Dynamic</button>
                                            <button v-else class="btn btn-info btn-sm" type="button" v-on:click="Toggle(interface)">Static</button>
                                        </td>
                                        <td width="1%">
                                            <button class="btn btn-danger btn-sm btn-block" type="button" v-on:click="Remove(interface)">Remove</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <button v-on:click="NewOpen()" class="btn btn-success"> + Add new DHCP Pool </button>
                        </template>

                        <template v-else>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Interface</label>
                                <div class="col-sm-8">
                                    <interface-input v-model="new_pool.interface"></interface-input>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">First IP</label>
                                <div class="col-sm-8">
                                    <ip-address-input v-model="new_pool.first_ip"></ip-address-input>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Last IP</label>
                                <div class="col-sm-8">
                                    <ip-address-input v-model="new_pool.last_ip"></ip-address-input>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Type</label>
                                <div class="col-sm-8">
                                    <button v-if="new_pool.is_dynamic" class="btn btn-info btn-sm" type="button" v-on:click="new_pool.is_dynamic = false">Dynamic</button>
                                    <button v-else class="btn btn-info btn-sm" type="button" v-on:click="new_pool.is_dynamic = true">Static</button>
                                </div>
                            </div>
                        </template>
                    </div>
                    <div slot="footer" v-if="new_visible">
                        <button v-on:click="NewSave()" class="btn btn-success"> Add new  </button>
                        <button v-on:click="NewClose()" class="btn btn-secondary">Cancel</button>
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

                Remove(interface) {
                    this.$store.dispatch('DHCP_POOL_REMOVE', interface);
                },
                Toggle(interface) {
                    this.$store.dispatch('DHCP_POOL_TOGGLE', interface);
                },

                
                NewOpen(){
                    this.new_visible = true;

                    this.new_pool.interface = null;
                    this.new_pool.first_ip = null;
                    this.new_pool.last_ip = null;
                    this.new_pool.is_dynamic = true;
                },
                NewClose(){
                    this.new_visible = false;
                },
                NewSave() {
                    this.$store.dispatch('DHCP_POOL_ADD', this.new_pool).then(() => {
                        this.NewClose();
                    })
                }
            }
        }
    }
})
