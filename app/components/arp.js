Vue.component('arp', {
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <div class="float-right">
                    <button class="btn btn-warning" v-on:click="running && (proxy_modal = true)" v-bind:class="{'disabled': !running}">Proxy</button>
                    <button class="btn btn-info" v-on:click="running && (timers_modal = true)" v-bind:class="{'disabled': !running}">Timers</button>
                    <button class="btn btn-success" v-on:click="running && (lookup_modal = true)" v-bind:class="{'disabled': !running}">Lookup</button>
                </div>

                <h5 class="card-title mb-0 mt-2">ARP</h5>
            </div>
            
            <table class="table mb-0">
                <thead>
                    <tr>
                        <th scope="col">MAC</th>
                        <th scope="col">IP</th>
                        <th scope="col">Cache Timeout ({{ timers.cache_timeout }} s)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, id) in entries" v-bind:class="{'table-success': row.cache_timeout == timers.cache_timeout || row.cache_timeout == timers.cache_timeout-1, 'table-active': row.cache_timeout <= 2}">
                        <td>{{ row.mac }}</td>
                        <td>{{ row.ip }}</td>
                        <td>{{ row.cache_timeout }}</td>
                    </tr>
                </tbody>
            </table>

            <proxy_modal
                :opened="proxy_modal"
                @closed="proxy_modal = false"
            ></proxy_modal>
            
            <timers_modal
                :opened="timers_modal"
                @closed="timers_modal = false"
            ></timers_modal>

            <lookup_modal
                :opened="lookup_modal"
                @closed="lookup_modal = false"
            ></lookup_modal>
        </div>
    `,
    data: () => {
        return {
            proxy_modal: false,
            timers_modal: false,
            lookup_modal: false
        }
    },
    computed: {
        entries() {
            return this.$store.state.arp.table;
        },
        timers() {
            return this.$store.state.arp.timers;
        },
        running() {
            return this.$store.state.running;
        }
    },
    components: {
        'proxy_modal': {
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
                    proxy: {}
                }
            },
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-0"> Proxy ARP Settings </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">
                                Proxy ARP:&nbsp;<span v-if="proxy.enabled" class="text-success">Running</span> <span v-else class="text-danger">Stopped</span>
                            </label>
                            <div class="btn-group col-sm-8">
                                <button v-if="!proxy.enabled" v-on:click="proxy.enabled = true" class="btn btn-info"> Start </button>
                                <button v-else v-on:click="proxy.enabled = false" class="btn btn-danger"> Stop </button>
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
                    this.proxy = {
                        ...this.$store.state.arp.proxy
                    }
                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.$store.dispatch('ARP_PROXY', this.proxy).then(() => {
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
                        <h1 class="mb-0"> ARP Timers </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Cache Timeout <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.cache_timeout">
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Request Timeout <small>(ms</small>)</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.request_timeout">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Request Interval <small>(ms</small>)</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.request_interval">
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
                        ...this.$store.state.arp.timers
                    }
                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.$store.dispatch('ARP_TIMERS', this.timers).then(() => {
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
                mac: null,
                interface: null
            }),
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-0"> ARP Lookup </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">IP Address</label>
                            <div class="col-sm-8">
                                <ip-address-input v-model="ip"></ip-address-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Interface</label>
                            <div class="col-sm-8">
                                <interface-input v-model="interface" :running_only="true"></interface-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label"></label>
                            <div class="btn-group col-sm-8">
                                <button v-if="is_lookingup" class="btn btn-success disabled"> Processing... </button>
                                <button v-else v-on:click="Action()" class="btn btn-success"> Lookup </button>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">MAC Address</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control-plaintext" v-model="mac">
                            </div>
                        </div>
                    </div>
                </modal>
            `,
            methods: {
                Open(){
                    this.ip = null;
                    this.mac = null;
                    this.interface = null;
                    
                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    ajax("ARP", "Lookup", [
                        this.interface,
                        this.ip
                    ])
                    .then((response) => {
                        this.mac = response.mac || '--unknown--';
                    }, () => {})
                    .finally(() => {
                        this.is_lookingup = false
                    });
                }
            }
        }
    }
})
