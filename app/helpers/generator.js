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
        show_expert_settings: false,

        ethernet: {
            SourceHwAddress: null,
            DestinationHwAddress: null
        },
        arp: {
            Operation: 1,
            SenderHardwareAddress: null,
            SenderProtocolAddress: null,
            TargetHardwareAddress: "00:00:00:00:00:00",
            TargetProtocolAddress: null
        },
        icmp: {
            TypeCode: 0,
            ID: null,
            Sequence: null
        },
        ip: {
            SourceAddress: null,
            DestinationAddress: null,
            TimeToLive: null
        },
        tcp: {
            SourcePort: null,
            DestinationPort: null,
            Flags: 0
        },
        udp: {
            SourcePort: null,
            DestinationPort: null
        },
        rip: {
            CommandType: 2,
            Version: 2,
            
            Routes: []  
        },
        dhcp: {
            OperationCode: 1,
            TransactionID: null,
            YourClientIPAddress: null,
            NextServerIPAddress: null,
            ClientMACAddress: null,
            
            Options: []
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
                                <button v-on:click="component_type = 'ARP'" class="btn btn-primary btn-block">ARP</button>
                            </div>
                            <div class="col-sm-6">
                                <button v-on:click="component_type = 'ICMP'" class="btn btn-primary btn-block">ICMP</button>
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
                                <button v-on:click="component_type = 'RIP'" class="btn btn-primary btn-block">RIP</button>
                            </div>
                            <div class="col-sm-6">
                                <button v-on:click="component_type = 'DHCP'" class="btn btn-primary btn-block">DHCP</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else slot="body" class="form-horizontal">
                <h2>{{ component_type }}</h2>
                <div v-if="component_type == 'ARP'">
                    <eth_gen v-model="ethernet"
                        :src="{
                            value: interface.mac,
                            text: 'Use Interface MAC',
                            default: true
                        }"
                        
                        :dst="{
                            value: 'FF:FF:FF:FF:FF:FF',
                            text: 'Use Broadcast',
                            default: true
                        }"
                    ></eth_gen>
                    <hr>
                    <arp_gen v-model="arp"
                        :interface_mac="interface.mac"
                        :interface_ip="interface.ip"
                    ></arp_gen>
                </div>
                <div v-if="component_type == 'ICMP'">
                    <eth_gen v-model="ethernet"
                        :src="{
                            value: interface.mac,
                            text: 'Use Interface MAC',
                            default: true
                        }"
                    ></eth_gen>
                    <hr>
                    <ip_gen v-model="ip"
                        :src="{
                            value: interface.ip,
                            text: 'Use Interface IP',
                            default: true
                        }"

                        :arp_interface_id="interface_id"
                        @arp:mac="ethernet.DestinationHwAddress = $event"
                    ></ip_gen>
                    <hr>
                    <icmp_gen v-model="icmp"></icmp_gen>
                    <hr>
                    <payload_gen v-model="payload" ></payload_gen>
                </div>
                <div v-if="component_type == 'TCP' || component_type == 'UDP'">
                    <eth_gen v-model="ethernet"
                        :src="{
                            value: interface.mac,
                            text: 'Use Interface MAC',
                            default: true
                        }"
                    ></eth_gen>
                    <hr>
                    <ip_gen v-model="ip"
                        :src="{
                            value: interface.ip,
                            text: 'Use Interface IP',
                            default: true
                        }"

                        :arp_interface_id="interface_id"
                        @arp:mac="ethernet.DestinationHwAddress = $event"
                    ></ip_gen>
                    <hr>
                    <udp_gen v-model="udp"
                        v-if="component_type == 'UDP'"
                    ></udp_gen>
                    <tcp_gen v-model="tcp"
                        v-if="component_type == 'TCP'"
                    ></tcp_gen>
                    <hr>
                    <payload_gen v-model="payload" ></payload_gen>
                </div>
                <div v-if="component_type == 'RIP'">
                    <template v-if="!show_expert_settings">
                        <div class="list-group-item d-flex my-3">
                            <div class="w-100">
                                {{ ip.SourceAddress }}:{{ udp.SourcePort }} => <b>{{ ip.DestinationAddress }}:{{ udp.DestinationPort }}</b><br>
                                <small><i>{{ ethernet.SourceHwAddress }} => {{ ethernet.DestinationHwAddress }}</i></small>
                            </div>
                            <div class="mt-2">
                                <button class="btn btn-outline-secondary" @click="show_expert_settings = true;"> Edit </button>
                            </div>
                        </div>
                    </template>
                    <div class="list-group-item mb-3" v-show="show_expert_settings">
                        <div class="text-right mb-3">
                            <button class="btn btn-outline-secondary" @click="show_expert_settings = false;"> Hide </button>
                        </div>
                        <eth_gen v-model="ethernet"
                            :src="{
                                value: interface.mac,
                                text: 'Use Interface MAC',
                                default: true
                            }"
                            
                            :dst="{
                                value: '01:00:5E:00:00:09',
                                text: 'Use RIPv2 Multicast',
                                default: true
                            }"
                        ></eth_gen>
                        <hr>
                        <ip_gen v-model="ip"
                            :src="{
                                value: interface.ip,
                                text: 'Use Interface IP',
                                default: true
                            }"

                            :dst="{
                                value: '224.0.0.9',
                                text: 'Use RIPv2 Multicast',
                                default: true
                            }"

                            :ttl="{
                                value: 1,
                                text: '1 for a packet sent to the Local Network Control Block',
                                default: true
                            }"

                            :arp_interface_id="interface_id"
                            @arp:mac="ethernet.DestinationHwAddress = $event"
                        ></ip_gen>
                        <hr>
                        <udp_gen v-model="udp"
                            :src="{
                                value: '520',
                                text: 'Use RIPv2 Port',
                                default: true
                            }"

                            :dst="{
                                value: '520',
                                text: 'Use RIPv2 Port',
                                default: true
                            }"
                        ></udp_gen>
                    </div>
                    <rip_gen v-model="rip"></rip_gen>
                </div>
                <div v-if="component_type == 'DHCP'">
                    <template v-if="!show_expert_settings">
                        <div class="list-group-item d-flex my-3">
                            <div class="w-100">
                                {{ ip.SourceAddress }}:{{ udp.SourcePort }} => <b>{{ ip.DestinationAddress }}:{{ udp.DestinationPort }}</b><br>
                                <small><i>{{ ethernet.SourceHwAddress }} => {{ ethernet.DestinationHwAddress }}</i></small>
                            </div>
                            <div class="mt-2">
                                <button class="btn btn-outline-secondary" @click="show_expert_settings = true;"> Edit </button>
                            </div>
                        </div>
                    </template>
                    <div class="list-group-item mb-3" v-show="show_expert_settings">
                        <div class="text-right mb-3">
                            <button class="btn btn-outline-secondary" @click="show_expert_settings = false;"> Hide </button>
                        </div>
                        <eth_gen v-model="ethernet"
                            :src="{
                                value: interface.mac,
                                text: 'Use Interface MAC',
                                default: true
                            }"
                            
                            :dst="{
                                value: 'FF:FF:FF:FF:FF:FF',
                                text: 'Use Broadcast',
                                default: true
                            }"
                        ></eth_gen>
                        <hr>
                        <ip_gen v-model="ip"
                            :src="{
                                value: interface.ip,
                                text: 'Use Interface IP',
                                default: true
                            }"

                            :dst="{
                                value: '255.255.255.255',
                                text: 'Use Broadcast',
                                default: true
                            }"

                            :arp_interface_id="interface_id"
                            @arp:mac="ethernet.DestinationHwAddress = $event"
                        ></ip_gen>
                        <hr>
                        <udp_gen v-model="udp"
                            :src="{
                                value: '67',
                                text: 'DHCP Server',
                                default: true
                            }"

                            :dst="{
                                value: '68',
                                text: 'DHCP Client',
                                default: true
                            }"
                        ></udp_gen>
                    </div>
                    <dhcp_gen v-model="dhcp"
                        :interface_ip="interface.ip"
                    ></dhcp_gen>
                </div>
                <hr>
                <send_gen
                    :interface_id="interface_id"
                    :protocol="component_type"
                    :data="ExportData()"
                ></send_gen>
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
        },
        ExportData() {
            switch(this.component_type) {
                case 'ARP':
                    return { ethernet: this.ethernet, arp: this.arp, }
                    
                case 'ICMP':
                    return { ethernet: this.ethernet, ip: this.ip, icmp: this.icmp, payload: this.payload }

                case 'TCP':
                    return { ethernet: this.ethernet, ip: this.ip, tcp: this.tcp, payload: this.payload }
                    
                case 'UDP':
                    return { ethernet: this.ethernet, ip: this.ip, udp: this.udp, payload: this.payload }
                
                case 'RIP':
                    return { ethernet: this.ethernet, ip: this.ip, udp: this.udp, rip: this.rip }
                    
                case 'DHCP':
                    return { ethernet: this.ethernet, ip: this.ip, udp: this.udp, dhcp: this.dhcp}
            
            }
        }
    },
    components: {
        'eth_gen': {
            props: ['value', 'src', 'dst'],
            
            data: () => ({
                use_src: false,
                use_dst: false
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
                use_src: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.SourceHwAddress = this.src.value, 0)
                    }
                },
                use_dst: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.DestinationHwAddress = this.dst.value, 0)
                    }
                }
            },
            mounted() {
                if(this.src && this.src.default) {
                    this.use_src = true;
                } else {
                    this.SourceHwAddress = null;
                }

                if(this.dst && this.dst.default) {
                    this.use_dst = true;
                } else {
                    this.DestinationHwAddress = null;
                }
            },
            template: `
                <div class="form-group">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source MAC</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="SourceHwAddress" v-bind:readonly="use_src && src" />
                            <label class="form-check form-control-plaintext" v-if="src">
                                <input type="checkbox" value="1" v-model="use_src" class="form-check-input"> {{ src.text }}
                            </label>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination MAC</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="DestinationHwAddress" v-bind:readonly="use_dst && dst" />
                            <label class="form-check form-control-plaintext" v-if="dst">
                                <input type="checkbox" value="1" v-model="use_dst" class="form-check-input"> {{ dst.text }}
                            </label>
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
                    3: 'Request Reverse',
                    4: 'Reply Reverse'
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
                <div class="form-group">
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
        'icmp_gen': {
            props: ['value'],
            
            data: () => ({
                type_codes: {
                    "Echo Reply": 0,
                    "Echo": 2048,

                    "Timestamp": 3328,
                    "Timestamp Reply": 3584,

                    "Destination Unreachable": {
                        768: "Net Unreachable",
                        769: "Host Unreachable",
                        770: "Protocol Unreachable",
                        771: "Port Unreachable",
                        772: "Fragmentation Needed and Don't Fragment was Set",
                        773: "Source Route Failed",
                        774: "Destination Network Unknown",
                        775: "Destination Host Unknown",
                        776: "Source Host Isolated",
                        777: "Communication with Destination Network is Administratively Prohibited",
                        778: "Communication with Destination Host is Administratively Prohibited",
                        779: "Destination Network Unreachable for Type of Service",
                        780: "Destination Host Unreachable for Type of Service",
                        781: "Communication Administratively Prohibited",
                        782: "Host Precedence Violation",
                        783: "Precedence cutoff in effect"
                    },
                    "Redirect": {
                        1280: "Redirect Datagram for the Network (or subnet)",
                        1281: "Redirect Datagram for the Host",
                        1282: "Redirect Datagram for the Type of Service and Network",
                        1283: "Redirect Datagram for the Type of Service and Host"
                    },
                    "Router Advertisement": {
                        2304: "Normal router advertisement",
                        //: "Does not route common traffic"
                    },
                    "Router Solicitation": {
                        2560: "Router Advertisement"
                    },
                    "Time Exceeded": {
                        2816: "Time to Live exceeded in Transit",
                        //: "Fragment Reassembly Time Exceeded"
                    },
                    "Parameter Problem": {
                        3072: "Pointer indicates the error",
                        3073: "Missing a Required Option",
                        3074: "Bad Length"
                    },
                    "Photuris": {
                        9728: "Bad SPI",
                        9729: "Authentication Failed",
                        9730: "Decompression Failed",
                        9731: "Decryption Failed",
                        9732: "Need Authentication",
                        9733: "Need Authorization"
                    },
                    /*
                    "Extended Echo Request": {
                        //: "No Error"
                    },
                    "Extended Echo Reply": {
                        //: "No Error",
                        //: "Malformed Query",
                        //: "No Such Interface",
                        //: "No Such Table Entry",
                        //: "Multiple Interfaces Satisfy Query"
                    }
                    */
                }
            }),
            computed: {
                TypeCode: {
                    get() {
                        return this.value.TypeCode;
                    },
                    set(newValue) {
                        this.value.TypeCode = newValue;
                        this.$emit('input', this.value);
                    }
                },
                ID: {
                    get() {
                        return this.value.ID;
                    },
                    set(newValue) {
                        this.value.ID = newValue;
                        this.$emit('input', this.value);
                    }
                },
                Sequence: {
                    get() {
                        return this.value.Sequence;
                    },
                    set(newValue) {
                        this.value.Sequence = newValue;
                        this.$emit('input', this.value);
                    }
                }
            },
            template: `
                <div class="form-group">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Type Code</label>
                        <div class="col-sm-8">
                            <select class="form-control" v-model="TypeCode">
                                <template v-for="(codes, type) in type_codes">
                                    <option v-if="typeof codes !== 'object'" :value="codes">{{ type }}</option>
                                    <optgroup v-else :label="type">
                                        <option v-for="(code, id) in codes" :value="id">{{ code }}</option>
                                    </optgroup>
                                </template>
                            </select>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">ID</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="ID" />
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Sequence</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="Sequence" />
                        </div>
                    </div>
                </div>
            `
        },
        'ip_gen': {
            props: ['value', 'src', 'dst', 'ttl', 'arp_interface_id'],
            
            data: () => ({
                use_src: false,
                use_dst: false,
                use_ttl: false,

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
                use_src: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.SourceAddress = this.src.value, 0)
                    }
                },
                use_dst: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.DestinationAddress = this.dst.value, 0)
                    }
                },
                use_ttl: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.TimeToLive = this.ttl.value, 0)
                    }
                }
            },
            mounted() {
                if(this.src && this.src.default) {
                    this.use_src = true;
                } else {
                    this.SourceAddress = null;
                }

                if(this.dst && this.dst.default) {
                    this.use_dst = true;
                } else {
                    this.DestinationAddress = null;
                }

                if(this.ttl && this.ttl.default) {
                    this.use_ttl = true;
                } else {
                    this.TimeToLive = 255;
                }
            },
            template: `
                <div class="form-group">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source IP</label>
                        <div class="col-sm-8">
                            <ip-address-input v-model="SourceAddress" v-bind:readonly="use_src && src" /></ip-address-input>
                            <label class="form-check form-control-plaintext" v-if="src">
                                <input type="checkbox" value="1" v-model="use_src" class="form-check-input"> {{ src.text }}
                            </label>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination IP</label>
                        <div class="col-sm-8">
                            <ip-address-input v-if="!arp_interface_id" v-model="DestinationAddress" v-bind:readonly="use_dst && dst"></ip-address-input>
                            <div class="input-group" v-else>
                                <ip-address-input v-model="DestinationAddress" v-bind:readonly="use_dst && dst"></ip-address-input>
                                <div class="input-group-append">
                                    <button class="btn btn-outline-secondary" @click="!arp_is_lookingup && !use_dst && ARP()" v-bind:class="{'disabled': arp_is_lookingup || use_dst}"> {{ arp_is_lookingup ? 'Processing...' : 'ARP Request' }}</button>
                                </div>
                            </div>
                            <label class="form-check form-control-plaintext" v-if="dst">
                                <input type="checkbox" value="1" v-model="use_dst" class="form-check-input"> {{ dst.text }}
                            </label>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">TimeToLive</label>
                        <div class="col-sm-8 input-group">
                            <input type="text" class="form-control" v-model="TimeToLive" v-bind:readonly="use_ttl && ttl" />
                            <div class="input-group-append">
                                <span class="input-group-text">hops</span>
                            </div>
                            <label class="form-check form-control-plaintext" v-if="ttl">
                                <input type="checkbox" value="1" v-model="use_ttl" class="form-check-input"> {{ ttl.text }}
                            </label>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                ARP() {
                    this.arp_is_lookingup = true
                    
                    ajax("ARP", "Lookup", {
                        interface: this.arp_interface_id,
                        ip: this.DestinationAddress
                    })
                    .then(({ mac }) => {
                        this.$emit('arp:mac', mac);
                    }, () => {})
                    .finally(() => {
                        this.arp_is_lookingup = false
                    });
                }
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
                <div class="form-group">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Ports</label>
                        <div class="col-sm-8 input-group">
                            <input type="text" class="form-control" v-model="SourcePort" placeholder="Source" />
                            <div class="input-group-prepend input-group-append">
                                <button class="btn input-group-text" @click="Toggle()" title="Toggle">=&gt;</button>
                            </div>
                            <input type="text" class="form-control" v-model="DestinationPort" placeholder="Destination" />
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
                Toggle(){
                    var src_port = this.SourcePort;
                    this.SourcePort = this.DestinationPort;
                    this.DestinationPort = src_port;
                },
                GetFlag(mask) {
                    return (this.value.Flags & mask) != 0
                },
                ToggleFlag(mask) {
                    this.value.Flags ^= mask;
                }
            }
        },
        'udp_gen': {
            props: ['value', 'src', 'dst'],

            data: () => ({
                use_src: false,
                use_dst: false
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
                }
            },
            watch: {
                use_src: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.SourcePort = this.src.value, 0)
                    }
                },
                use_dst: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.DestinationPort = this.dst.value, 0)
                    }
                }
            },
            mounted() {
                if(this.src && this.src.default) {
                    this.use_src = true;
                } else {
                    this.SourcePort = null;
                }

                if(this.dst && this.dst.default) {
                    this.use_dst = true;
                } else {
                    this.DestinationPort = null;
                }
            },
            template: `
                <div class="form-group">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Ports</label>
                        <div class="col-sm-8 input-group">
                            <input type="text" class="form-control" v-model="SourcePort" placeholder="Source" v-bind:readonly="use_src && src" />
                            <div class="input-group-prepend input-group-append">
                                <button class="btn input-group-text" @click="Toggle()" title="Toggle">=&gt;</button>
                            </div>
                            <input type="text" class="form-control" v-model="DestinationPort" placeholder="Destination" v-bind:readonly="use_dst && dst" />
                        </div>

                        <div class="col-sm-4"></div>
                        <div class="col-sm-4">
                            <label class="form-check form-control-plaintext" v-if="src">
                                <input type="checkbox" value="1" v-model="use_src" class="form-check-input"> {{ src.text }}
                            </label>
                        </div>
                        <div class="col-sm-4">
                            <label class="form-check form-control-plaintext" v-if="dst">
                                <input type="checkbox" value="1" v-model="use_dst" class="form-check-input"> {{ dst.text }}
                            </label>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                Toggle(){
                    var src_port = this.SourcePort;
                    this.SourcePort = this.DestinationPort;
                    this.DestinationPort = src_port;

                    if (this.SourcePort != this.DestinationPort) {
                        this.use_src = false
                        this.use_dst = false
                    }
                }
            }
        },
        'rip_gen': {
            props: ['value'],

            data: () => ({
                route: null,
                route_id: null,

                command_types: {
                    1: 'Request',
                    2: 'Response'
                },
                versions: {
                    0: 'Must be Discarded',
                    1: '1',
                    2: '2'
                },
                afis: {
                    0: 'Unspecified',
                    2: 'IP',
                    65535: 'Authentication present'
                }
            }),
            computed: {
                CommandType: {
                    get() {
                        return this.value.CommandType;
                    },
                    set(newValue) {
                        this.value.CommandType = newValue;
                        this.$emit('input', this.value);
                    }
                },
                Version: {
                    get() {
                        return this.value.Version;
                    },
                    set(newValue) {
                        this.value.Version = newValue;
                        this.$emit('input', this.value);
                    }
                },
                Routes: {
                    get() {
                        return this.value.Routes;
                    },
                    set(newValue) {
                        this.value.Routes = newValue;
                        this.$emit('input', this.value);
                    }
                }
            },
            template: `
                <div class="form-group">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Command Type</label>
                        <div class="col-sm-8">
                            <select class="form-control" v-model="CommandType">
                                <option v-for="(command_type, id) in command_types" :value="id">{{ command_type }}</option>
                            </select>
                        </div>
                    </div>

                    <!--
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Version</label>
                        <div class="col-sm-8">
                            <select class="form-control" v-model="Version">
                                <option v-for="(version, id) in versions" :value="id">{{ version }}</option>
                            </select>
                        </div>
                    </div>
                    -->

                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Routes</label>
                        <div class="col-sm-8">
                            <button class="btn btn-info" @click="Open()">+ Add Route</button>
                            <button class="btn btn-warning" @click="Random()">+ Random Route</button>
                        </div>
                    </div>

                    <ul v-if="Routes.length > 0" class="list-group list-group-flush">
                        <li class="list-group-item d-flex" v-for="(route, id) in Routes">
                            <span class="w-100">
                                <strong>{{ route.IP || '--unspecified--' }}</strong><br><small>{{ route.Mask || '--unspecified--' }}</small>
                            </span>
                            <span class="w-100">
                                <span>via {{ route.NextHopIP || '--unspecified--' }}</span><br><small>metric <strong>{{ route.Metric || '--unspecified--' }}</strong></small>
                            </span>
                            <div class="btn-group my-2">
                                <button class="btn btn-info btn-sm" @click="Open(id)">Edit</button>
                                <button class="btn btn-danger btn-sm" @click="Remove(id)">Remove</button>
                            </div>
                        </li>
                    </ul>

                    <modal v-if="route" v-on:close="Close()">
                        <div slot="header">
                            <h1 class="mb-0"> RIP Route </h1>
                        </div>
                        <div slot="body" class="form-horizontal">
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Address Family ID</label>
                                <div class="col-sm-8">
                                    <select class="form-control" v-model="route.AFI">
                                        <option v-for="(afi, id) in afis" :value="id">{{ afi }}</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Route Tag</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control" v-model="route.Tag" />
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">IP Address</label>
                                <div class="col-sm-8">
                                    <ip-address-input v-model="route.IP"></ip-address-input>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Mask</label>
                                <div class="col-sm-8">
                                    <ip-mask-input v-model="route.Mask"></ip-mask-input>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Next Hop IP</label>
                                <div class="col-sm-8">
                                    <ip-address-input v-model="route.NextHopIP"></ip-address-input>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Metric</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control" v-model="route.Metric" />
                                </div>
                            </div>
                        </div>
                        <div slot="footer">
                            <button v-on:click="Action()" class="btn btn-success"> Save Changes </button>
                            <button v-on:click="Close()" class="btn btn-secondary">Cancel</button>
                        </div>
                    </modal>
                </div>
            `,
            methods: {
                Random() {
                    var octets = [248, 240, 224, 192, 128, 0];
                    var octet = octets[Math.floor(Math.random()*octets.length)];

                    var IP = (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255) + 0)+"."+(Math.floor(Math.random() * 255) + 0)+"."+(Math.floor(Math.random() * 255) + 0);
                    var Mask = "255.255." + (Math.random() < 0.5 ? "255."+octet : octet+".0");
                    var NextHopIP = "0.0.0.0";
                    var Metric = Math.random() < 0.2 ? 16 : Math.floor(Math.random()*15)

                    this.value.Routes.push({ AFI: 2, Tag: 0, IP, Mask, NextHopIP, Metric })
                    this.$emit('input', this.value);
                },
                Open(route_id = null) {
                    if (route_id !== null) {
                        this.$set(this, 'route', { ...this.value.Routes[route_id] })
                        this.route_id = route_id;
                    } else {
                        this.$set(this, 'route', {
                            AFI: 2,
                            Tag: null,
                            IP: null,
                            Mask: null,
                            NextHopIP: null,
                            Metric: null
                        })
                        this.route_id = null;
                    }
                },
                Action() {
                    if (this.route_id !== null) {
                        this.$set(this.value.Routes, this.route_id, this.route)
                    } else {
                        this.value.Routes.push(this.route)
                    }

                    this.$emit('input', this.value);
                    this.Close();
                },
                Close() {
                    this.route = null
                    this.route_id = null
                },
                Remove(id) {
                    this.$delete(this.value.Routes, id)
                }
            }
        },
        'dhcp_gen': {
            props: ['value', 'interface_ip'],

            data: () => ({
                use_interface_ip: true,

                operation_codes: {
                    1: 'BOOT REQUEST',
                    2: 'BOOT REPLY'
                },
                message_types: {
                    1: 'DISCOVER',
                    2: 'OFFER',
                    3: 'REQUEST',
                    4: 'DECLINE',
                    5: 'ACK',
                    6: 'NAK',
                    7: 'RELEASE'
                },
                options: {
                    1: {
                        name: 'SubnetMask',
                    },
                    3: {
                        name: 'Router',
                    },
                    6: {
                        name: 'DomainNameServer',
                    },
                    50: {
                        name: 'RequestedIPAddress',
                    },
                    51: {
                        name: 'IPAddressLeaseTime',
                    },
                    53: {
                        name: 'MessageType',
                    },
                    54: {
                        name: 'ServerIdentifier',
                    },
                    55: {
                        name: 'ParameterRequestList',
                    },
                    58: {
                        name: 'RenewalTimeValue',
                    },
                    59: {
                        name: 'RebindingTimeValue',
                    },
                    61: {
                        name: 'ClientIdentifier',
                    }
                }
            }),
            computed: {
                OperationCode: {
                    get() {
                        return this.value.OperationCode;
                    },
                    set(newValue) {
                        this.value.OperationCode = newValue;
                        this.$emit('input', this.value);
                    }
                },
                TransactionID: {
                    get() {
                        return this.value.TransactionID;
                    },
                    set(newValue) {
                        this.value.TransactionID = newValue;
                        this.$emit('input', this.value);
                    }
                },
                YourClientIPAddress: {
                    get() {
                        return this.value.YourClientIPAddress;
                    },
                    set(newValue) {
                        this.value.YourClientIPAddress = newValue;
                        this.$emit('input', this.value);
                    }
                },
                NextServerIPAddress: {
                    get() {
                        return this.value.NextServerIPAddress;
                    },
                    set(newValue) {
                        this.value.NextServerIPAddress = newValue;
                        this.$emit('input', this.value);
                    }
                },
                ClientMACAddress: {
                    get() {
                        return this.value.ClientMACAddress;
                    },
                    set(newValue) {
                        this.value.ClientMACAddress = newValue;
                        this.$emit('input', this.value);
                    }
                },
                Options: {
                    get() {
                        return this.value.Options;
                    },
                    set(newValue) {
                        this.value.Options = newValue;
                        this.$emit('input', this.value);
                    }
                }
            },
            watch: {
                use_interface_ip: {
                    immediate: true,
                    handler(newVal) {
                        !newVal || setTimeout(() => this.NextServerIPAddress = this.interface_ip, 0)
                    }
                }
            },
            template: `
                <div class="form-group">
                    <h3> BOOTP </h3>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Operation Code</label>
                        <div class="col-sm-8 input-group">
                            <select class="form-control" v-model="OperationCode">
                                <option v-for="(operation_code, id) in operation_codes" :value="id">{{ operation_code }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Transaction ID</label>
                        <div class="col-sm-8 input-group">
                            <input type="text" class="form-control" v-model="TransactionID" />
                            <div class="input-group-append">
                                <button class="btn btn-outline-secondary" @click="RandomTransactionID()"> Random </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">(New) Client IP</label>
                        <div class="col-sm-8 input-group">
                            <ip-address-input v-model="YourClientIPAddress"></ip-address-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Next Server IP</label>
                        <div class="col-sm-8">
                            <ip-address-input v-model="NextServerIPAddress" v-bind:readonly="use_interface_ip && interface_ip" /></ip-address-input>
                            <label class="form-check form-control-plaintext" v-if="interface_ip">
                                <input type="checkbox" value="1" v-model="use_interface_ip" class="form-check-input"> Use Interface IP
                            </label>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Client MAC</label>
                        <div class="col-sm-8 input-group">
                            <input type="text" class="form-control" v-model="ClientMACAddress" />
                        </div>
                    </div>

                    <hr>
                    <h3> DHCP Options </h3>
                    <div class="form-group row" v-for="(option, id) in options">
                        <label class="col-sm-4 col-form-label">{{ option.name }}</label>
                        <div class="col-sm-8 input-group">
                            <input type="text" class="form-control" v-model="Options[id]" />
                            <div class="input-group-append" v-if="typeof Options[id] != 'undefined'">
                                <button class="btn btn-outline-danger" @click="$delete(Options, id)"> X </button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                RandomTransactionID() {
                    if (window && window.crypto && window.crypto.getRandomValues && Uint32Array) {
                        var o = new Uint32Array(1);
                        window.crypto.getRandomValues(o);
                        this.TransactionID = o[0];
                    } else {
                        console.warn('Falling back to pseudo-random client seed');
                        this.TransactionID = Math.floor(Math.random() * Math.pow(2, 32));
                    }
                }
            }
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
                <div class="form-group">
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
                <div class="form-group">
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
                    // TODO: REFACTOR
                    return ajax("Generator", "Send", {
                        interface: this.interface_id,
                        protocol: this.protocol,
                        ...this.data
                    })
                }
            }
        }
    }
})
