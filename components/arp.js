Vue.component('arp', {
    props: ['running', 'fetch_data', 'table'],
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <div class="float-right">
                    <button class="btn btn-success" v-on:click="running && (lookup = true)" v-bind:class="{'disabled': !running}">Lookup</button>
                    <button class="btn btn-info" v-on:click="running && (settings = true)" v-bind:class="{'disabled': !running}">Settings</button>
                </div>

                <h5 class="card-title mb-0 mt-2">ARP</h5>
            </div>
            
            <table class="table mb-0">
                <thead>
                    <tr>
                        <th scope="col">MAC</th>
                        <th scope="col">IP</th>
                        <th scope="col">Cache Timeout</th>
                    </tr>
                </thead>
                <tbody>
                    <!--<tr v-for="(row, id) in entries" v-bind:class="{'table-success': row.cache_timeout == settings.cache_timeout || row.cache_timeout == settings.cache_timeout-1, 'table-active': row.cache_timeout <= 2}">-->
                    <tr v-for="(row, id) in entries">
                        <td>{{ row.mac }}</td>
                        <td>{{ row.ip }}</td>
                        <td>{{ row.cache_timeout }}</td>
                    </tr>
                </tbody>
            </table>
            
            <settings_modal
                :opened="settings"
                @closed="settings = false"
            ></settings_modal>

            <lookup_modal
                :opened="lookup"
                @closed="lookup = false"
            ></lookup_modal>
        </div>
    `,
    data: () => {
        return {
            entries: [],
            
            settings: false,
            lookup: false
        }
    },
    methods: {
        Update(){
            ajax("ARP", "Table").then((response) => {
                this.entries = response;
            }, () => {})
        },
        Initialize(){
            this.Update();
        }
    },
    watch: { 
        table: function(newVal, oldVal) {
            this.entries = newVal;
        }
    },
    mounted() {
        if(this.fetch_data) {
            this.Initialize();
            setInterval(() => this.Update(), 1000)
        }
    },
    components: {
        'settings_modal': {
            props: ['opened'],
            data: () => ({
                data: false
            }),
            template: `
                <modal v-if="data" v-on:close="Close()" v-cloak>
                    <div slot="header">
                        <h1 class="mb-0"> ARP Settings </h1>
                    </div>
                    <div slot="body">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">
                                Proxy ARP:&nbsp;<span v-if="data.proxy_enabled" class="text-success">Running</span> <span v-else class="text-danger">Stopped</span></label>
                            <div class="btn-group col-sm-8">
                                <button v-if="!data.proxy_enabled" v-on:click="data.proxy_enabled = true" class="btn btn-info"> Start </button>
                                <button v-else v-on:click="data.proxy_enabled = false" class="btn btn-danger"> Stop </button>
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Cache Timeout <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="data.cache_timeout">
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Request Timeout <small>(ms</small>)</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="data.timeout">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Request Interval <small>(ms</small>)</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="data.interval">
                            </div>
                        </div>
                    </div>
                    <div slot="footer">
                        <button v-on:click="Action()" class="btn btn-success"> Save Changes </button>
                        <button v-on:click="Close()" class="btn btn-secondary">Cancel</button>
                    </div>
                </modal>
            `,
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
            methods: {
                Open(){
                    ajax("ARP", "Settings").then((response) => {
                        this.$set(this, 'data', response);
                    }, () => {
                        this.Close();
                    })
                },
                Close(){
                    this.data = false;
                    this.$emit("closed");
                },
                Action(){
                    ajax("ARP", "Settings", Object.values(this.data).join('\n')).then((response) => {
                        this.data = response;
                        this.Close();
                    }, () => {});
                }
            }
        },
        'lookup_modal': {
            props: ['opened'],
            data: () => ({
                is_lookingup: false,
                data: false
            }),
            template: `
                <modal v-if="data" v-on:close="Close()" v-cloak>
                    <div slot="header">
                        <h1 class="mb-0"> ARP Lookup </h1>
                    </div>
                    <div slot="body">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">IP Address</label>
                            <div class="col-sm-8">
                                <ip-address-input v-model="data.ip"></ip-address-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Interface</label>
                            <div class="col-sm-8">
                                <interface-input v-model="data.interface"></interface-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label"></label>
                            <div class="btn-group col-sm-8">
                            
                                <button v-if="is_lookingup" class="btn btn-success disabled"> Processing... </button>
                                <button v-else v-on:click="Action()" class="btn btn-success"> Lookup </button>
                            </div>
                        </div>
                        <div class="form-group row mb-0">
                            <label class="col-sm-4 col-form-label">MAC Address</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control-plaintext" v-model="data.mac">
                            </div>
                        </div>
                    </div>
                </modal>
            `,
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
            methods: {
                Open(){
                    this.$set(this, 'data', {
                        ip: null,
                        mac: null,
                        interface: null
                    });
                },
                Close(){
                    this.data = false;
                    this.$emit("closed");
                },
                Action(){
                    ajax("ARP", "Lookup", [this.data.interface, this.data.ip].join('\n')).then((response) => {
                        this.data.mac = response.mac || '--unknown--';
                    }, () => {}).finally(() => {
                        this.is_lookingup = false
                    });
                }
            }
        }
    }
})
