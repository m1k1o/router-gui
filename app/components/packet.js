function Validation_Mixin_Factory() {
    return {
        computed: {
            is_valid() {
                for (const id in this.valid) {
                    if(!this.valid[id]){
                        return false;
                    }
                }
                return true;
            }
        },
        data: () => ({
            valid: {}
        }),
        watch: {
            is_valid: {
                immediate: true,
                handler(newValue) {
                    this.$emit('valid', newValue);
                }
            }
        },
        methods: {
            Valid(id, state = true) {
                this.$set(this.valid, id, state);
            }
        }
    }
}

function Packet_Mixin_Factory(defaults) {
    if(Array.isArray(defaults)) {
        var props = defaults;
            
        defaults = {};
        for (const prop of props) {
            defaults[prop] = "";
        }
    } else {
        var props = Object.keys(defaults);
    }

    var computed = {};
    var valid = {};

    // Loop through properties, register getters & setters.
    for (const prop of props) {
        computed[prop] = {
            get() {
                // Lazy initialize
                if((!(prop in this.value))) {
                    this.$set(this.value, prop, typeof defaults[prop] == 'function' ? defaults[prop]() : defaults[prop]);
                }

                return this.value[prop] || defaults[prop];
            },
            set(value) {
                // Is number, greaten than zero or default is number
                if((!isNaN(value) && value != "") || typeof defaults[prop] === 'number') {
                    this.$set(this.value, prop, Number(value));
                } else {
                    this.$set(this.value, prop, value);
                }
                
                this.$emit('input', this.value);
            }
        };

        valid[prop] = true;
    }
    
    return {
        mixins: [Validation_Mixin_Factory()],
        data: () => ({
            valid
        }),
        props: {
            value: {
                type: Object,
                default: ()=> defaults
            },
            readonly: {
                type: Boolean,
                default: false
            }
        },
        computed: {...computed}
    };
}

/*
function Packet_Default_Factory(props) {
    var watch = {};
    
    for (const prop of props) {
        watch["use_"+prop] = {
            immediate: true,
            handler(newVal) {
                !newVal || setTimeout(() => this[props] = this.default[props].value, 0)
            }
        };
    }
    
    return {
        props: {
            defaults: {
                type: Object,
                default: ()=> ({})
            }
        },
        watch,
        mounted() {
            for (const prop of props) {
                if(this.default[props] && this.default[props].default) {
                    this["use_"+prop] = true;
                } else {
                    this[props] = null;
                }
            }
        }
    };
}
*/

Vue.component("packet", {
    mixins: [Validation_Mixin_Factory()],
    props: {
        value: {
            type: Object,
            default: ()=> ({})
        },
        validate: {
            type: Boolean,
            default: false
        },
        readonly: {
            type: Boolean,
            default: false
        }
    },
    data: () => ({
        layers: [],
        valid: []
    }),

    watch: {
        value: {
            immediate: true,
            handler() {
                if (Object.keys(this.value).length == 0) {
                    this.layers = []
                    return;
                }

                var data = this.value;
                var resp = [data]
                var valid = [true]

                while ('payload_packet' in data) {
                    data = data.payload_packet;
                    resp.push(data);
                    valid.push(true)
                }

                this.layers = resp;
            }
        }
    },
    computed: {
        plain_packets() {
            return this.$store.state.packets.plain;
        }
    },
    // TODO: Refactor
    methods: {
        RemoveLayer(id) {
            // Delete layer
            this.$delete(this.layers, id)
            this.$delete(this.valid, id)

            // If it is first layer
            if (id == 0) {
                if('payload_packet' in this.value) {
                    var value = this.value.payload_packet;
                } else {
                    var value = {};
                }
                this.$emit('input', value)
                return;
            }
            
            // Convert layers to packet structure
            var resp = this.layers[0];
            if(this.layers.length > 1) {
                var iterator = resp;
                for (var i in this.layers) {
                    iterator['payload_packet'] = this.layers[i];
                    iterator = iterator['payload_packet'];
                }
            }
            
            // Save data
            this.$emit('input', resp)
        },
        UpdateLayer(id, data) {
            this.$set(this.layers, id, data)
            this.$emit('input', this.value)
        }
    },
    template: `
        <div>
            <template v-for="(layer, id) in layers">
                <div class="card mb-3" :class="valid[id] ? 'border-success' : 'border-danger'">
                    <div class="card-header">
                        <button class="btn btn-danger btn-sm float-right" @click="RemoveLayer(id)" v-if="!readonly">Remove</button>
                        <h5 class="my-1"> {{ plain_packets[layer.type] }} </h5>
                    </div>
                    <div class="card-body">
                        <component
                            :value="layer"
                            @input="UpdateLayer(id, $event)"
                            @valid="Valid(id, $event)"

                            :is="layer.type"
                            :readonly="readonly"
                        />
                    </div>
                </div>
            </template>
        </div>
    `,
    components: {
        'Ethernet': {
            mixins: [
                Packet_Mixin_Factory({
                    'source_hw_address': "",
                    'destination_hw_address': "",
                    'ethernet_packet_type': 2048
                })
            ],
            computed: {
                types() {
                    return this.$store.state.packets.ethernet_packet_type;
                }
            },
            template: `
                <div class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source MAC</label>
                        <div class="col-sm-8">
                            <mac-input
                                v-model="source_hw_address"
                                @valid="Valid('source_hw_address', $event)"
                                :disabled="readonly"
                            ></mac-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination MAC</label>
                        <div class="col-sm-8">
                            <mac-input
                                v-model="destination_hw_address"
                                @valid="Valid('destination_hw_address', $event)"
                                :disabled="readonly"
                            ></mac-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Type</label>
                        <div class="col-sm-8">
                            <select class="form-control" v-model="ethernet_packet_type" :disabled="readonly">
                                <option v-for="(text, id) in types" :value="id">{{ text }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            `
        },
        'ARP': {
            mixins: [
                Packet_Mixin_Factory({
                    'operation': 1,
                    'sender_hardware_address': "",
                    'sender_protocol_address': "",
                    'target_hardware_address': "00:00:00:00:00:00",
                    'target_protocol_address': ""
                })
            ],
            computed: {
                operations() {
                    return this.$store.state.packets.arp_operation;
                }
            },
            template: `
                <div class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Operation</label>
                        <div class="col-sm-8">
                            <select class="form-control" v-model="operation" :disabled="readonly">
                                <option v-for="(text, id) in operations" :value="id">{{ text }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Sender MAC</label>
                        <div class="col-sm-8">
                            <mac-input
                                v-model="sender_hardware_address"
                                @valid="Valid('sender_hardware_address', $event)"
                                :disabled="readonly"
                            ></mac-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Sender IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="sender_protocol_address"
                                @valid="Valid('sender_protocol_address', $event)"
                                :disabled="readonly"
                            ></ip-address-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Target MAC</label>
                        <div class="col-sm-8">
                            <mac-input
                                v-model="target_hardware_address"
                                @valid="Valid('target_hardware_address', $event)"
                                :disabled="readonly"
                            ></mac-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Target IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="target_protocol_address"
                                @valid="Valid('target_protocol_address', $event)"
                                :disabled="readonly"
                            ></ip-address-input>
                        </div>
                    </div>
                </div>
            `
        },
        'ICMP': {
            mixins: [
                Packet_Mixin_Factory({
                    'type_code': 0,
                    'id': 0,
                    'sequence': 0
                })
            ],
            computed: {
                type_codes() {
                    return this.$store.state.packets.icmp_type_code;
                }
            },
            template: `
                <div class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Type Code</label>
                        <div class="col-sm-8">
                            <select class="form-control" v-model="type_code" :disabled="readonly">
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
                            <input type="text" class="form-control" v-model="id" :disabled="readonly" />
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Sequence</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="sequence" :disabled="readonly" />
                        </div>
                    </div>
                </div>
            `
        },
        'IP': {
            mixins: [
                Packet_Mixin_Factory({
                    'source_address': "",
                    'destination_address': "",
                    'time_to_live': 128,
                    'ip_protocol_type': 0
                })
            ],
            computed: {
                protocols() {
                    return this.$store.state.packets.ip_protocol;
                }
            },
            template: `
                <div class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="source_address"
                                @valid="Valid('source_address', $event)"
                                :disabled="readonly"
                            ></ip-address-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="destination_address"
                                @valid="Valid('destination_address', $event)"
                                :disabled="readonly"
                            ></ip-address-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">time_to_live</label>
                        <div class="col-sm-8 input-group">
                            <input type="text" class="form-control" v-model="time_to_live" :disabled="readonly" />
                            <div class="input-group-append">
                                <span class="input-group-text">hops</span>
                            </div>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Protocol</label>
                        <div class="col-sm-8">
                            <select class="form-control" v-model="ip_protocol_type" :disabled="readonly">
                                <option v-for="(text, id) in protocols" :value="id">{{ text }}</option>
                            </select>
                        </div>
                    </div>
                </div>
            `
        },
        'TCP': {
            mixins: [
                Packet_Mixin_Factory([
                    'source_port',
                    'destination_port',
                    'flags'
                ])
            ],
            
            data: () => ({
                flags_masks: {
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

            template: `
                <div class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Ports</label>
                        <div class="col-sm-8 input-group">
                            <port-input
                                v-model="source_port"
                                @valid="Valid('source_port', $event)"
                                :disabled="readonly"
                                placeholder="Source"
                            ></port-input>
                            <div class="input-group-prepend input-group-append">
                                <span class="input-group-text">=&gt;</span>
                            </div>
                            <port-input
                                v-model="destination_port"
                                @valid="Valid('destination_port', $event)"
                                :disabled="readonly"
                                placeholder="Destination"
                            ></port-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Flags</label>
                        <div class="col-sm-8">
                            <div class="btn-group d-flex mt-1">
                                <button
                                    v-for="(mask, flag) in flags_masks"
                                    v-bind:class="GetFlag(mask) ? 'btn btn-success btn-sm w-100': 'btn btn-danger btn-sm w-100'"
                                    v-on:click="ToggleFlag(mask)"
                                    :disabled="readonly"
                                >{{ flag }}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                GetFlag(mask) {
                    return (this.flags & mask) != 0
                },
                ToggleFlag(mask) {
                    this.flags ^= mask;
                }
            }
        },
        'UDP': {
            mixins: [
                Packet_Mixin_Factory([
                    'source_port',
                    'destination_port'
                ])
            ],
            
            template: `
                <div class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Ports</label>
                        <div class="col-sm-8 input-group">
                            <port-input
                                v-model="source_port"
                                @valid="Valid('source_port', $event)"
                                :disabled="readonly"
                                placeholder="Source"
                            ></port-input>
                            <div class="input-group-prepend input-group-append">
                                <span class="input-group-text">=&gt;</span>
                            </div>
                            <port-input
                                v-model="destination_port"
                                @valid="Valid('destination_port', $event)"
                                :disabled="readonly"
                                placeholder="Destination"
                            ></port-input>
                        </div>
                    </div>
                </div>
            `
        },
        // TODO: Refactor
        'RIP': {
            mixins: [
                Packet_Mixin_Factory({
                    'command_type': 2,
                    'version': 2,
                    'routes': () => []
                })
            ],
            computed: {
                command_types() {
                    return this.$store.state.packets.rip_command_types;
                },
                versions() {
                    return this.$store.state.packets.rip_versions;
                },
                afis() {
                    return this.$store.state.packets.rip_afis;
                }
            },

            data: () => ({
                route: null,
                route_id: null
            }),
            template: `
                <div class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Command Type</label>
                        <div class="col-sm-8">
                            <select class="form-control" v-model="command_type" :disabled="readonly">
                                <option v-for="(command_type, id) in command_types" :value="id">{{ command_type }}</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">version</label>
                        <div class="col-sm-8">
                            <select class="form-control" v-model="version" :disabled="readonly">
                                <option v-for="(version, id) in versions" :value="id">{{ version }}</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Routes</label>
                        <div class="col-sm-8">
                            <button class="btn btn-info" @click="Open()" v-if="!readonly">+ Add Route</button>
                            <button class="btn btn-warning" @click="Random()" v-if="!readonly">+ Random Route</button>
                        </div>
                    </div>

                    <ul v-if="routes.length > 0" class="list-group list-group-flush">
                        <li class="list-group-item d-flex" v-for="(route, id) in routes">
                            <span class="w-100">
                                <strong>{{ route.ip || '--unspecified--' }}</strong><br><small>{{ route.mask || '--unspecified--' }}</small>
                            </span>
                            <span class="w-100">
                                <span>via {{ route.next_hop || '--unspecified--' }}</span><br><small>metric <strong>{{ route.metric || '--unspecified--' }}</strong></small>
                            </span>
                            <div class="btn-group my-2" v-if="!readonly">
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
                                    <select class="form-control" v-model="route.afi">
                                        <option v-for="(afi, id) in afis" :value="id">{{ afi }}</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Route Tag</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control" v-model="route.route_tag" />
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">IP Address</label>
                                <div class="col-sm-8">
                                    <ip-address-input v-model="route.ip"></ip-address-input>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Mask</label>
                                <div class="col-sm-8">
                                    <ip-mask-input v-model="route.mask"></ip-mask-input>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Next Hop</label>
                                <div class="col-sm-8">
                                    <ip-address-input v-model="route.next_hop"></ip-address-input>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Metric</label>
                                <div class="col-sm-8">
                                    <input type="text" class="form-control" v-model="route.metric" />
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

                    var ip = (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255) + 0)+"."+(Math.floor(Math.random() * 255) + 0)+"."+(Math.floor(Math.random() * 255) + 0);
                    var mask = "255.255." + (Math.random() < 0.5 ? "255."+octet : octet+".0");
                    var next_hop = "0.0.0.0";
                    var metric = Math.random() < 0.2 ? 16 : Math.floor(Math.random()*15)

                    this.routes.push({ afi: 2, route_tag: 0, ip, mask, next_hop, metric })
                    this.$emit('input', this.value);
                },
                Open(route_id = null) {
                    if (route_id !== null) {
                        this.$set(this, 'route', { ...this.routes[route_id] })
                        this.route_id = route_id;
                    } else {
                        this.$set(this, 'route', {
                            afi: 2,
                            route_tag: "",
                            ip: "",
                            mask: "",
                            next_hop: "",
                            metric: ""
                        })
                        this.route_id = null;
                    }
                },
                Action() {
                    if (this.route_id !== null) {
                        this.$set(this.routes, this.route_id, this.route)
                    } else {
                        this.routes.push(this.route)
                    }

                    this.$emit('input', this.value);
                    this.Close();
                },
                Close() {
                    this.route = null
                    this.route_id = null
                },
                Remove(id) {
                    this.$delete(this.routes, id)
                    this.$emit('input', this.value);
                }
            }
        },
        'DHCP': {
            mixins: [
                Packet_Mixin_Factory({
                    operation_code: 1,
                    transaction_id: "",
                    your_client_ip_address: "",
                    next_server_ip_address: "",
                    client_mac_address: "",
                    options: () => [],
                })
            ],
            computed: {
                operation_codes() {
                    return this.$store.state.packets.dhcp_operation_codes;
                },
                dhcp_options() {
                    return this.$store.state.packets.dhcp_options;
                }
            },
            template: `
                <div class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Operation Code</label>
                        <div class="col-sm-8 input-group">
                            <select class="form-control" v-model="operation_code" :disabled="readonly">
                                <option v-for="(operation_code, id) in operation_codes" :value="id">{{ operation_code }}</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Transaction ID</label>
                        <div class="col-sm-8 input-group">
                            <input type="text" class="form-control" v-model="transaction_id" :disabled="readonly" />
                            <div class="input-group-append" v-if="!readonly">
                                <button class="btn btn-outline-secondary" @click="RandomTransactionID()"> Random </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">(New) Client IP</label>
                        <div class="col-sm-8 input-group">
                            <ip-address-input
                                v-model="your_client_ip_address"
                                @valid="Valid('your_client_ip_address', $event)"
                                :disabled="readonly"
                            ></ip-address-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Next Server IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="next_server_ip_address"
                                @valid="Valid('next_server_ip_address', $event)"
                                :disabled="readonly"
                            ></ip-address-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Client MAC</label>
                        <div class="col-sm-8 input-group">
                            <mac-input
                                v-model="client_mac_address"
                                @valid="Valid('client_mac_address', $event)"
                                :disabled="readonly"
                            ></mac-input>
                        </div>
                    </div>
                    
                    <h6>DHCP Options</h6>
                    
                    <div class="form-group text-center" v-if="!readonly">
                        <!--<button class="btn btn-outline-info m-2" @click="AddOption()">Unknown option</button>-->
                        <button class="btn btn-outline-info m-2" v-for="(option, id) in dhcp_options" @click="AddOption(id)">{{ option.name }}</button>
                    </div>

                    <div class="form-group card" v-for="(option, id) in options">
                        <div class="card-header">
                            <button class="btn btn-danger btn-sm float-right" @click="$delete(options, id)" v-if="!readonly">Remove</button>
                            <h5 class="my-1"> {{ option.type in dhcp_options ? dhcp_options[option.type].name : 'Unknown Option' }}</h5>
                        </div>

                        <div class="card-body">
                            <component
                                :is="option.type in dhcp_options ? dhcp_options[option.type].component : 'DHCPUnknownOption'"

                                v-model="options[id]"
                                :readonly="readonly"
                            />
                        </div>
                    </div>
                </div>
            `,
            methods: {
                RandomTransactionID() {
                    if (window && window.crypto && window.crypto.getRandomValues && Uint32Array) {
                        var o = new Uint32Array(1);
                        window.crypto.getRandomValues(o);
                        this.transaction_id = o[0];
                    } else {
                        console.warn('Falling back to pseudo-random client seed');
                        this.transaction_id = Math.floor(Math.random() * Math.pow(2, 32));
                    }
                },
                AddOption(type) {
                    this.options.push({ type: Number(type) });
                },
                RemoveOption(id) {
                    this.$delete(this.options, id)
                }
            },
            components: {
                'DHCPIPAddressesOption': {
                    mixins: [
                        Packet_Mixin_Factory({
                            ip_addresses: () => [],
                        })
                    ],
                    template: `
                        <div class="form-horizontal">
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">IP Addresses</label>
                                <div class="col-sm-8">
                                    <button class="btn btn-info" @click="Add()" v-if="!readonly">+ Add IP</button>
                                    <button class="btn btn-warning" @click="Random()" v-if="!readonly">+ Random IP</button>

                                    <div class="input-group mt-3" v-for="(ip, id) in ip_addresses">
                                        <ip-address-input
                                            :value="ip"
                                            @input="$set(ip_addresses, id, $event)"
                                            
                                            :disabled="readonly"
                                            :required="true"
                                        ></ip-address-input>
                                        <div class="input-group-append" v-if="!readonly">
                                            <button class="btn btn-outline-danger" @click="Remove(id)">X</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    methods: {
                        Random() {
                            var ip = (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255) + 0)+"."+(Math.floor(Math.random() * 255) + 0)+"."+(Math.floor(Math.random() * 255) + 0);
                            this.ip_addresses.push(ip);
                        },
                        Add() {
                            this.ip_addresses.push("");
                        },
                        Remove(id) {
                            this.$delete(this.ip_addresses, id)
                        }
                    }
                },
                'DHCPIPAddressOption': {
                    mixins: [
                        Packet_Mixin_Factory(['ip_address'])
                    ],
                    template: `
                        <div class="form-horizontal">
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">IP Address</label>
                                <div class="col-sm-8 input-group">
                                    <ip-address-input
                                        v-model="ip_address"
                                        :disabled="readonly"
                                        :required="true"
                                    ></ip-address-input>
                                    <div class="input-group-append" v-if="!readonly">
                                        <button class="btn btn-outline-secondary" @click="Random()">Random IP</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    methods: {
                        Random() {
                            var ip = (Math.floor(Math.random() * 255) + 1)+"."+(Math.floor(Math.random() * 255) + 0)+"."+(Math.floor(Math.random() * 255) + 0)+"."+(Math.floor(Math.random() * 255) + 0);
                            this.ip_address = ip;
                        }
                    }
                },
                'DHCPUIntOption': {
                    mixins: [
                        Packet_Mixin_Factory(['seconds'])
                    ],
                    template: `
                        <div class="form-horizontal">
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Seconds</label>
                                <div class="col-sm-8 input-group">
                                    <input
                                        type="text"
                                        class="form-control"
                                        v-model="seconds"
                                        :disabled="readonly"
                                    />
                                    <div class="input-group-append" v-if="!readonly">
                                        <button class="btn btn-outline-secondary" @click="Random()">Random</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `,
                    methods: {
                        Random() {
                            this.seconds = (Math.floor(Math.random() * 3600) + 1);
                        }
                    }
                },
                'DHCPMessageTypeOption': {
                    mixins: [
                        Packet_Mixin_Factory(['message_type'])
                    ],
                    computed: {
                        message_types() {
                            return this.$store.state.packets.dhcp_message_types;
                        }
                    },
                    template: `
                        <div class="form-horizontal">
                            <div class="form-group row">
                                <label class="col-sm-4 col-form-label">Message Type</label>
                                <div class="col-sm-8 input-group">
                                    <select class="form-control" v-model="message_type" :disabled="readonly">
                                        <option v-for="(text, id) in message_types" :value="id">{{ text }}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    `
                },
                'DHCPParameterRequestListOption': {
                    mixins: [
                        Packet_Mixin_Factory({
                            codes: []
                        })
                    ],
                    computed: {
                        dhcp_options() {
                            return this.$store.state.packets.dhcp_options;
                        }
                    },
                    template: `
                        <div class="form-horizontal">
                            <div class="text-center" v-if="!readonly">
                                <div class="btn-group m-2" v-for="(option, id) in dhcp_options">
                                    <span class="form-control-plaintext px-2" style="border: 1px solid #ccc;"> {{ option.name }}</span>
                                    <button class="btn btn-danger" v-if="codes.includes(id)" @click="Remove(id)"> X </button>
                                    <button class="btn btn-success" v-else @click="Add(id)"> + </button>
                                </div>
                            </div>
                            <div class="form-group row" v-else>
                                <label class="col-sm-4 col-form-label">DHCP Options</label>
                                <div class="col-sm-8">
                                    <p v-for="(option, id) in dhcp_options" v-if="codes.includes(id)"> {{ option.name }} </p>
                                </div>
                            </div>
                        </div>
                    `,
                    methods: {
                        Add(code) {
                            var id = this.codes.indexOf(code);
                            if (id == -1) {
                                this.codes.push(code);
                            }
                        },
                        Remove(code) {
                            var id = this.codes.indexOf(code);
                            if (id > -1) {
                                this.$delete(this.codes, id)
                            }
                        }
                    }
                },
                'DHCPClientIdentifierOption': {
                    mixins: [
                        Packet_Mixin_Factory([
                            'physical_address'
                        ])
                    ],
                    template: `
                        <div class="form-horizontal">
                            <template v-if="value.id_value && value.physical_address == null">
                                <div class="form-group row">
                                    <label class="col-sm-4 col-form-label">ID Type</label>
                                    <div class="col-sm-8 input-group">
                                        <input
                                            class="form-control"
                                            :value="value.id_type"
                                            :disabled="true"
                                        />
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label class="col-sm-4 col-form-label">ID Value <small><i>base64 encoded</i></small></label>
                                    <div class="col-sm-8 input-group">
                                        <input
                                            class="form-control"
                                            :value="value.id_value"
                                            :disabled="true"
                                        />
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label class="col-sm-4 col-form-label"></label>
                                    <div class="col-sm-8">
                                        <p><i><b>Note:</b> Editing binary data is not supported. In order to add custom MAC Address to this field, you must remove existing data.</i></p>
                                        <button class="btn btn-danger" @click="RemoveBinary()"> Remove </button>
                                    </div>
                                </div>
                            </template>
                            <div class="form-group row" v-else>
                                <label class="col-sm-4 col-form-label">Physical Address</label>
                                <div class="col-sm-8 input-group">
                                    <mac-input
                                        v-model="physical_address"
                                        :disabled="readonly"
                                        :required="true"
                                    ></mac-input>
                                </div>
                            </div>
                        </div>
                    `,
                    methods: {
                        RemoveBinary() {
                            delete this.value.id_type;
                            delete this.value.id_value;

                            this.physical_address = "";
                        }
                    }
                },
                'DHCPUnknownOption': {
                    mixins: [
                        Packet_Mixin_Factory([
                            'type',
                            'raw_data'
                        ])
                    ],
                    template: `
                        <div class="form-horizontal">
                            <template>
                                <div class="form-group row">
                                    <label class="col-sm-4 col-form-label">Type</label>
                                    <div class="col-sm-8 input-group">
                                        <input
                                            class="form-control"
                                            :value="type"
                                            :disabled="true"
                                        />
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label class="col-sm-4 col-form-label">Value <small><i>base64 encoded</i></small></label>
                                    <div class="col-sm-8 input-group">
                                        <input
                                            class="form-control"
                                            :value="raw_data"
                                            :disabled="true"
                                        />
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label class="col-sm-4 col-form-label"></label>
                                    <div class="col-sm-8">
                                        <p><i><b>Note:</b> Editing binary data is not supported.</i></p>
                                    </div>
                                </div>
                            </template>
                        </div>
                    `
                }
            }
        },
    }
});