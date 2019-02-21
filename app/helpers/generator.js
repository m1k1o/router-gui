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
        component_type: false,
        
        ethernet: {
            SourceHwAddress: null,
            DestinationHwAddress: null
        },
        arp: {
            Operation: null,
            SenderHardwareAddress: null,
            SenderProtocolAddress: null,
            TargetHardwareAddress: null,
            TargetProtocolAddress: null
        },
        ip: {
            SourceAddress: null,
            DestinationAddress: null,
            TimeToLive: null
        },
        tcp: {
            SourcePort: null,
            DestinationPort: null,
            Flags: null
        },
        udp: {
            SourcePort: null,
            DestinationPort: null
        },
        payload: null
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
                                <button v-on:click="component_type = 'arp'" class="btn btn-primary btn-block">ARP</button>
                            </div>
                            <div class="col-sm-6">
                                <button v-on:click="/*component_type = 'icmp'*/" class="btn btn-primary btn-block disabled">ICMP</button>
                            </div>
                        </div>

                        <div class="form-group row">
                            <div class="col-sm-6">
                                <button v-on:click="component_type = 'tcp'" class="btn btn-primary btn-block">TCP</button>
                            </div>
                            <div class="col-sm-6">
                                <button v-on:click="component_type = 'udp'" class="btn btn-primary btn-block">UDP</button>
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
            <div slot="body" class="form-horizontal" v-if="component_type == 'arp'">
                <eth_gen v-model="ethernet" :interface_mac="interface.mac"></eth_gen>
                <hr>
                <arp_gen v-model="arp"
                    :interface_mac="interface.mac"
                    :interface_ip="interface.ip"
                ></arp_gen>
                
                <send_gen
                    :interface_id="interface_id"
                    :protocol="'ARP'"
                    :data="Object.values({ ...ethernet, ...arp })"
                ></send_gen>
            </div>
            <div slot="body" class="form-horizontal" v-if="component_type == 'icmp'">
                not implemented
            </div>
            <div slot="body" class="form-horizontal" v-if="component_type == 'tcp' || component_type == 'udp'">
                <eth_gen v-model="ethernet"
                    :interface_mac="interface.mac"
                ></eth_gen>
                <hr>
                <ip_gen v-model="ip"
                    :interface_ip="interface.ip"

                    :arp_interface_id="interface_id"
                    @arp:mac="ethernet.DestinationHwAddress = $event"
                ></ip_gen>
                <hr>
                <udp_gen v-model="udp"
                    v-if="component_type == 'udp'"
                ></udp_gen>
                <tcp_gen v-model="tcp"
                    v-if="component_type == 'tcp'"
                ></tcp_gen>
                <hr>
                <payload_gen v-model="payload" ></payload_gen>
                <hr>
                <send_gen
                    v-if="component_type == 'udp'"

                    :interface_id="interface_id"
                    :protocol="'UDP'"
                    :data="Object.values({ ...ethernet, ...ip, ...udp, payload })"
                ></send_gen>
                <send_gen
                    v-if="component_type == 'tcp'"

                    :interface_id="interface_id"
                    :protocol="'TCP'"
                    :data="Object.values({ ...ethernet, ...ip, ...tcp, payload })"
                ></send_gen>
            </div>
            <div slot="body" class="form-horizontal" v-if="component_type == 'rip'">
                not implemented
            </div>
            <div slot="body" class="form-horizontal" v-if="component_type == 'dhcp'">
                not implemented
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
        'eth_gen': {
            props: ['value', 'interface_mac'],
            
            data: () => ({
                use_interface_mac: true
            }),
            computed: {
                SourceHwAddress: {
                    get() {
                        return this.value.SourceHwAddress;
                    },
                    set(newValue) {
                        this.value.SourceHwAddress = newValue;
                        this.$emit('input', this.value);
                    }
                },
                DestinationHwAddress: {
                    get() {
                        return this.value.DestinationHwAddress;
                    },
                    set(newValue) {
                        this.value.DestinationHwAddress = newValue;
                        this.$emit('input', this.value);
                    }
                }
            },
            watch: {
                use_interface_mac: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.SourceHwAddress = this.interface_mac, 0)
                    }
                }
            },
            template: `
                <div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source MAC</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="SourceHwAddress" v-bind:readonly="use_interface_mac && interface_mac" />
                            <label class="form-check form-control-plaintext" v-if="interface_mac">
                                <input type="checkbox" value="1" v-model="use_interface_mac" class="form-check-input"> Use Interface MAC
                            </label>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination MAC</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="DestinationHwAddress" />
                        </div>
                    </div>
                </div>
            `
        },
        'arp_gen': {
            props: ['value', 'interface_mac', 'interface_ip'],
            
            data: () => ({
                use_interface_mac: true,
                use_interface_ip: true,

                operations: {
                    1: 'Request',
                    2: 'Response',
                    3: 'RequestReverse',
                    4: 'ReplyReverse',
                    5: 'DRARPRequest',
                    6: 'DRARPReply',
                    7: 'DRARPError',
                    8: 'InARPRequest',
                    9: 'InARPReply',
                    10: 'ARPNAK',
                    11: 'MARSRequest',
                    12: 'MARSMulti',
                    13: 'MARSMServ',
                    14: 'MARSJoin',
                    15: 'MARSLeave',
                    16: 'MARSNAK',
                    17: 'MARSUnserv',
                    18: 'MARSSJoin',
                    19: 'MARSSLeave',
                    20: 'MARSGrouplistRequest',
                    21: 'MARSGrouplistReply',
                    22: 'MARSRedirectMap',
                    23: 'MaposUnarp',
                    24: 'OP_EXP1',
                    25: 'OP_EXP2'
                }
            }),
            computed: {
                Operation: {
                    get() {
                        return this.value.Operation;
                    },
                    set(newValue) {
                        this.value.Operation = newValue;
                        this.$emit('input', this.value);
                    }
                },
                SenderHardwareAddress: {
                    get() {
                        return this.value.SenderHardwareAddress;
                    },
                    set(newValue) {
                        this.value.SenderHardwareAddress = newValue;
                        this.$emit('input', this.value);
                    }
                },
                SenderProtocolAddress: {
                    get() {
                        return this.value.SenderProtocolAddress;
                    },
                    set(newValue) {
                        this.value.SenderProtocolAddress = newValue;
                        this.$emit('input', this.value);
                    }
                },
                TargetHardwareAddress: {
                    get() {
                        return this.value.TargetHardwareAddress;
                    },
                    set(newValue) {
                        this.value.TargetHardwareAddress = newValue;
                        this.$emit('input', this.value);
                    }
                },
                TargetProtocolAddress: {
                    get() {
                        return this.value.TargetProtocolAddress;
                    },
                    set(newValue) {
                        this.value.TargetProtocolAddress = newValue;
                        this.$emit('input', this.value);
                    }
                },
            },
            watch: {
                use_interface_mac: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.SenderHardwareAddress = this.interface_mac, 0)
                    }
                },
                use_interface_ip: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.SenderProtocolAddress = this.interface_ip, 0)
                    }
                }
            },
            template: `
                <div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Operation</label>
                        <div class="col-sm-8">
                            <select class="form-control" v-model="Operation">
                                <option v-for="(operation, id) in operations" :value="id">{{ operation }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Sender MAC</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="SenderHardwareAddress" v-bind:readonly="use_interface_mac && interface_mac" />
                            <label class="form-check form-control-plaintext" v-if="interface_mac">
                                <input type="checkbox" value="1" v-model="use_interface_mac" class="form-check-input"> Use Interface MAC
                            </label>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Sender IP</label>
                        <div class="col-sm-8">
                            <ip-address-input v-model="SenderProtocolAddress" v-bind:readonly="use_interface_ip && interface_ip" /></ip-address-input>
                            <label class="form-check form-control-plaintext" v-if="interface_ip">
                                <input type="checkbox" value="1" v-model="use_interface_ip" class="form-check-input"> Use Interface IP
                            </label>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Target MAC</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="TargetHardwareAddress" />
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Target IP</label>
                        <div class="col-sm-8">
                            <ip-address-input v-model="TargetProtocolAddress" /></ip-address-input>
                        </div>
                    </div>
                </div>
            `
        },
        'ip_gen': {
            props: ['value', 'interface_ip', 'arp_interface_id'],
            
            data: () => ({
                use_interface_ip: true,
                arp_is_lookingup: false
            }),
            computed: {
                SourceAddress: {
                    get() {
                        return this.value.SourceAddress;
                    },
                    set(newValue) {
                        this.value.SourceAddress = newValue;
                        this.$emit('input', this.value);
                    }
                },
                DestinationAddress: {
                    get() {
                        return this.value.DestinationAddress;
                    },
                    set(newValue) {
                        this.value.DestinationAddress = newValue;
                        this.$emit('input', this.value);
                    }
                },
                TimeToLive: {
                    get() {
                        return this.value.TimeToLive;
                    },
                    set(newValue) {
                        this.value.TimeToLive = newValue;
                        this.$emit('input', this.value);
                    }
                },
            },
            watch: {
                use_interface_ip: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.SourceAddress = this.interface_ip, 0)
                    }
                }
            },
            template: `
                <div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source IP</label>
                        <div class="col-sm-8">
                            <ip-address-input v-model="SourceAddress" v-bind:readonly="use_interface_ip && interface_ip" /></ip-address-input>
                            <label class="form-check form-control-plaintext" v-if="interface_ip">
                                <input type="checkbox" value="1" v-model="use_interface_ip" class="form-check-input"> Use Interface IP
                            </label>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination IP</label>
                        <div class="col-sm-8">
                            <ip-address-input v-if="!arp_interface_id" v-model="DestinationAddress"></ip-address-input>
                            <div class="input-group mb-3" v-else>
                                <ip-address-input v-model="DestinationAddress"></ip-address-input>
                                <div class="input-group-append">
                                    <button class="btn btn-outline-secondary" @click="!arp_is_lookingup && ARP()" v-bind:class="{'disabled': arp_is_lookingup}"> {{ arp_is_lookingup ? 'Processing...' : 'ARP Request' }}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">TimeToLive</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="TimeToLive" />
                        </div>
                    </div>
                </div>
            `,
            methods: {
                ARP() {
                    this.arp_is_lookingup = true
                    
                    ajax("ARP", "Lookup", [
                        this.arp_interface_id,
                        this.DestinationAddress
                    ])
                    .then((response) => {
                        this.$emit('arp:mac', response.mac);
                    }, () => {})
                    .finally(() => {
                        this.arp_is_lookingup = false
                    });
                },
            }
        },
        'tcp_gen': {
            props: ['value'],

            data: () => ({
                flags: {
                    'CWR': 1 << 7,
                    'ECN': 1 << 6,
                    'Urg': 1 << 5,
                    'Ack': 1 << 4,
                    'Psh': 1 << 3,
                    'Rst': 1 << 2,
                    'Syn': 1 << 1,
                    'Fin': 1 << 0,
                }
            }),
            computed: {
                SourcePort: {
                    get() {
                        return this.value.SourcePort;
                    },
                    set(newValue) {
                        this.value.SourcePort = newValue;
                        this.$emit('input', this.value);
                    }
                },
                DestinationPort: {
                    get() {
                        return this.value.DestinationPort;
                    },
                    set(newValue) {
                        this.value.DestinationPort = newValue;
                        this.$emit('input', this.value);
                    }
                },
                Flags: {
                    get() {
                        return this.value.Flags;
                    },
                    set(newValue) {
                        this.value.Flags = newValue;
                        this.$emit('input', this.value);
                    }
                }
            },
            template: `
                <div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source Port</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="SourcePort" />
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination Port</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="DestinationPort" />
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Flags</label>
                        <div class="col-sm-8">
                            <div class="btn-group d-flex mt-1">
                                <button
                                    v-for="(mask, flag) in flags"
                                    v-bind:class="GetFlag(mask) ? 'btn btn-success btn-sm w-100': 'btn btn-danger btn-sm w-100'"
                                    v-on:click="ToggleFlag(mask)"
                                >{{ flag }}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                GetFlag(mask) {
                    return (this.value.Flags & mask) != 0
                },
                ToggleFlag(mask) {
                    this.value.Flags ^= mask;
                }
            }
        },
        'udp_gen': {
            props: ['value'],

            computed: {
                SourcePort: {
                    get() {
                        return this.value.SourcePort;
                    },
                    set(newValue) {
                        this.value.SourcePort = newValue;
                        this.$emit('input', this.value);
                    }
                },
                DestinationPort: {
                    get() {
                        return this.value.DestinationPort;
                    },
                    set(newValue) {
                        this.value.DestinationPort = newValue;
                        this.$emit('input', this.value);
                    }
                }
            },
            template: `
                <div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source Port</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="SourcePort" />
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination Port</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="DestinationPort" />
                        </div>
                    </div>
                </div>
            `
        },
        'payload_gen': {
            props: ['value'],

            computed: {
                Payload: {
                    get() {
                        return this.value;
                    },
                    set(newValue) {
                        this.$emit('input', newValue);
                    }
                }
            },
            template: `
                <div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">String Payload<br><small><i>optional</i></small></label>
                        <div class="col-sm-8">
                            <textarea class="form-control" v-model="Payload" rows="3" />
                        </div>
                    </div>
                </div>
            `
        },
        'send_gen': {
            props: ['protocol', 'interface_id', 'data'],
            data: () => ({
                active: false,
                running: false,
                interval_sec: 5,
                interval: null
            }),
            template: `
                <div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label form-control-plaintext text-right">
                            Repeat <input type="checkbox" value="1" v-model="active" class="ml-1">
                        </label>
                        
                        <div v-if="!active" class="btn-group col-sm-8">
                            <button v-on:click="Send()" class="btn btn-success"> Send </button>
                        </div>

                        <div v-else class="btn-group col-sm-8">
                            <button v-if="!running" v-on:click="RepeatToggle()" class="btn btn-success"> Start </button>
                            <button v-else v-on:click="RepeatToggle()" class="btn btn-danger"> Stop </button>
                            
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text" id="inputGroup-sizing-sm">every</span>
                                </div>
                                <input type="text" class="form-control" v-model="interval_sec" v-bind:readonly="running">
                                <div class="input-group-prepend">
                                    <span class="input-group-text" id="inputGroup-sizing-sm">sec.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                RepeatToggle() {
                    if (this.interval) {
                        this.running = false;
                        clearInterval(this.interval);
                        this.interval = null;
                        return ;
                    }

                    this.Send().then(() => {
                        this.interval = setInterval(() => this.Send(), this.interval_sec * 1000);
                        this.running = true;
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
