Vue.component("generator_modal", {
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

        interface_id: null,
        component_type: false
    }),
    computed: {
        interface() {
            return this.$store.state.interfaces.table[this.interface_id];
        }
    },
    template: `
        <modal v-if="visible" v-on:close="Close()">
            <div slot="header">
                <h1 class="mb-3"> Generator </h1>
                <div v-if="interface_id != null">
                    <interface-show :id="interface_id" class="float-left mr-3"></interface-show>
                    <span v-bind:title="interface.description">{{ interface.friendly_name }}</span><br><small v-bind:title="interface.name">{{ interface.mac }}</small>
                </div>
            </div>
            <div slot="body" class="form-horizontal" v-if="component_type === false">
                <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Interface</label>
                    <div class="col-sm-8">
                        <interface-input v-model="interface_id" :running_only="true"></interface-input>
                    </div>
                </div>

                <div class="form-group row" v-if="interface_id != null">
                    <label class="col-sm-4 col-form-label">Type</label>
                    <div class="col-sm-8">
                        <div class="form-group row">
                            <div class="col-sm-6">
                                <button v-on:click="/*component_type = 'arp'*/" class="btn btn-primary btn-block disabled">ARP</button>
                            </div>
                            <div class="col-sm-6">
                                <button v-on:click="/*component_type = 'icmp'*/" class="btn btn-primary btn-block disabled">ICMP</button>
                            </div>
                        </div>

                        <div class="form-group row">
                            <div class="col-sm-6">
                                <button v-on:click="component_type = 'TCP'" class="btn btn-primary btn-block">TCP</button>
                            </div>
                            <div class="col-sm-6">
                                <button v-on:click="component_type = 'UDP'" class="btn btn-primary btn-block">UDP</button>
                            </div>
                        </div>

                        <div class="form-group row">
                            <div class="col-sm-6">
                                <button v-on:click="/*component_type = 'rip'*/" class="btn btn-primary btn-block disabled">RIP</button>
                            </div>
                            <div class="col-sm-6">
                                <button v-on:click="/*component_type = 'dhcp'*/" class="btn btn-primary btn-block disabled">DHCP</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div slot="body" class="form-horizontal" v-else>
                <transport_layer
                    v-if="component_type == 'TCP' || component_type == 'UDP'"
                    :protocol="component_type"
                    :interface_id="interface_id"
                ></transport_layer>
                <component
                    v-else
                    :is="component_type"
                    :interface_id="interface_id"
                />
            </div>
            <div slot="footer" v-if="component_type !== false">
                <button v-on:click="component_type = false" class="btn btn-secondary">Cancel</button>
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
    },
    components: {
        'transport_layer': {
            props: ['protocol', 'interface_id'],
            data: () => ({
                data: {
                    SourceHwAddress: null,
                    DestinationHwAddress: null,
                    SourceAddress: null,
                    DestinationAddress: null,
                    TimeToLive: 128,
                    SourcePort: null,
                    DestinationPort: null,
                    Payload: null
                },

                interface_mac: true,
                interface_ip: true,

                arp_is_lookingup: false,

                repeat: {
                    active: false,
                    running: false,
                    interval_sec: 5,
                    interval: null
                }
            }),
            computed: {
                interface() {
                    return this.$store.state.interfaces.table[this.interface_id];
                }
            },
            watch: {
                interface_mac: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.data.SourceHwAddress = this.interface.mac, 0)
                    }
                },
                interface_ip: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.data.SourceAddress = this.interface.ip, 0)
                    }
                }
            },
            template: `
                <div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source MAC</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="data.SourceHwAddress" v-bind:readonly="interface_mac" />
                            <label class="form-check form-control-plaintext">
                                <input type="checkbox" value="1" v-model="interface_mac" class="form-check-input"> Use Interface MAC
                            </label>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination MAC</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="data.DestinationHwAddress" />
                        </div>
                    </div>
                    <hr>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source IP</label>
                        <div class="col-sm-8">
                            <ip-address-input v-model="data.SourceAddress" v-bind:readonly="interface_ip" /></ip-address-input>
                            <label class="form-check form-control-plaintext">
                                <input type="checkbox" value="1" v-model="interface_ip" class="form-check-input"> Use Interface IP
                            </label>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination IP</label>
                        <div class="col-sm-8">
                        
                            <div class="input-group mb-3">
                                <ip-address-input v-model="data.DestinationAddress"></ip-address-input>
                                <div class="input-group-append">
                                    <button class="btn btn-outline-secondary" @click="!arp_is_lookingup && ARP()" v-bind:class="{'disabled': arp_is_lookingup}"> {{ arp_is_lookingup ? 'Processing...' : 'ARP Request' }}</button>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">TimeToLive</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="data.TimeToLive" />
                        </div>
                    </div>
                    <hr>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source Port</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="data.SourcePort" />
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination Port</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="data.DestinationPort" />
                        </div>
                    </div>
                    <hr>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">String Payload<br><small><i>optional</i></small></label>
                        <div class="col-sm-8">
                            <textarea class="form-control" v-model="data.Payload" rows="3" />
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label form-control-plaintext text-right">
                            Repeat <input type="checkbox" value="1" v-model="repeat.active" class="ml-1">
                        </label>
                        
                        <div v-if="!repeat.active" class="btn-group col-sm-8">
                            <button v-on:click="Send()" class="btn btn-success"> SEND </button>
                        </div>

                        <div v-else class="btn-group col-sm-8">
                            <button v-if="!repeat.running" v-on:click="RepeatToggle()" class="btn btn-success"> Start </button>
                            <button v-else v-on:click="RepeatToggle()" class="btn btn-danger"> Stop </button>
                            
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text" id="inputGroup-sizing-sm">every</span>
                                </div>
                                <input type="text" class="form-control" v-model="repeat.interval_sec" v-bind:readonly="repeat.running">
                                <div class="input-group-prepend">
                                    <span class="input-group-text" id="inputGroup-sizing-sm">sec.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                ARP() {
                    this.arp_is_lookingup = true
                    
                    ajax("ARP", "Lookup", [
                        this.interface_id,
                        this.data.DestinationAddress
                    ])
                    .then((response) => {
                        this.data.DestinationHwAddress = response.mac;
                    }, () => {})
                    .finally(() => {
                        this.arp_is_lookingup = false
                    });
                },
                RepeatToggle() {
                    if (this.repeat.interval) {
                        this.repeat.running = false;
                        clearInterval(this.repeat.interval);
                        this.repeat.interval = null;
                        return ;
                    }

                    this.Send().then(() => {
                        this.repeat.interval = setInterval(() => this.Send(), this.repeat.interval_sec * 1000);
                        this.repeat.running = true;
                    })
                },
                Send() {
                    return ajax("Generator", "Send", [
                        this.interface_id,
                        this.protocol,
                        ...Object.values(this.data)
                    ])
                }
            }
        }
    }
})
