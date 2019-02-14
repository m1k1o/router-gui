Vue.component('lldp', {
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <div class="float-right">
                    <button class="btn btn-primary" v-on:click="running && (settings_modal = true)" v-bind:class="{'disabled': !running}">Settings</button>
                    <button class="btn btn-primary" v-bind:class="{'disabled': !running}" v-on:click="running && (interfaces_modal = true)">Interfaces</button>
                </div>

                <h5 class="card-title mb-0 mt-2">Link Layer Discovery Protocol</h5>
            </div>
            
            <ul class="list-group list-group-flush">
                <li class="list-group-item" v-for="entry in entries">
                    <div class="float-right mt-3">{{ entry.time_to_live }}</div>
                    <interface-show :id="entry.interface" class="float-left mr-3"></interface-show>
                    <strong>{{ entry.system_name }}</strong> &bull; {{ entry.port_description }} <br><small>{{ entry.chassis_id }}</small>
                </li>
            </ul>

            <services_modal
                :service_name="'lldp'"

                :opened="interfaces_modal"
                @closed="interfaces_modal = false"
            ></services_modal>

            <settings_modal
                :opened="settings_modal"
                @closed="settings_modal = false"
            ></settings_modal>
        </div>
    `,
    data: () => {
        return {
            interfaces_modal: false,
            settings_modal: false
        }
    },
    methods: {
        Clear() {

        }
    },
    computed: {
        entries() {
            return this.$store.state.lldp.table;
        },
        running() {
            return this.$store.state.running;
        }
    },
    components: {
        'settings_modal': {
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
                    settings: {}
                }
            },
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-0"> LLDP Settings </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Advertisements Interval <small>(s)</small></label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="settings.adv_interval">
                        </div>
                    </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Advertised TTL</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="settings.time_to_live">
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">System Name</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="settings.system_name">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">System Description</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="settings.system_description">
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
                    this.settings = {
                        ...this.$store.state.lldp.settings
                    }
                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.$store.dispatch('LLDP_SETTINGS', this.settings).then(() => {
                        this.Close();
                    })
                }
            }
        },
    }
})
