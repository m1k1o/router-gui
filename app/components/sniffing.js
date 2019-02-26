Vue.component('sniffing', {
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <div class="float-right">
                    <interface-input :value="active_interface" @input="Select($event)" :running_only="true"></interface-input>
                </div>
                <div class="float-right mt-2 mr-2">
                    <span style="display:inline-block;">Hide unknown: <input type="checkbox" value="1" v-model="only_known"></span>
                </div>

                <interface-show :id="active_interface" style="position:absolute;"></interface-show>
                <h5 style="margin-left:55px;margin-top:-5px;" class="card-title mb-0 mt-2">Sniffing</h5>
            </div>

            <div v-auto-scroll style="width:100%;height:500px;overflow:auto;">
                <table class="table table-sm" style="width:100%;" v-if="data.length > 0">
                    <thead>
                        <th width="1%"> Src MAC </th>
                        <th width="1%"> Dst MAC </th>
                        <th width="1%"> Eth&nbsp;Type </th>
                        <th width="1%"> Src&nbsp;IP </th>
                        <th width="1%"> Dst&nbsp;IP </th>
                        <th width="1%"> Protocol </th>
                        <th></th>
                    </thead>
                    <tbody>
                        <template v-for="packet in data">
                        <tr
                            class="sniffing"
                            style="cursor:pointer;"
                            @click="properties_modal = packet"
                            :class="{
                                'arp': IsType(packet, 'ARP'),
                                'lldp': IsType(packet, 'LLDP'),
                                'tcp': IsType(packet, 'TCP', 1),
                                'rip': IsType(packet, 'RIP', 2),
                                'dhcp': IsType(packet, 'DHCP', 2),
                                'udp': !IsType(packet, 'RIP', 2)  && !IsType(packet, 'DHCP', 2) && IsType(packet, 'UDP', 1)
                            }"
                            v-if="!only_known || only_known && (IsType(packet, 'ARP') || IsType(packet, 'IP') || IsType(packet, 'LLDP'))"
                        >
                            <td class="text-center" v-html="MAC(packet.source_hw_address)"></td>
                            <td class="text-center" v-html="MAC(packet.destination_hw_address)"></td>
                            <td>{{ packet.ethernet_packet_type }}</td>
                            
                            <template v-if="IsType(packet, 'IP')">
                                <td class="text-center" v-html="IP(Onion(packet).source_address)"></td>
                                <td class="text-center" v-html="IP(Onion(packet).destination_address)"></td>
                                <td>{{ Onion(packet).ip_protocol_type }}</td>
                                
                                <td>
                                    <template v-if="IsType(packet, 'TCP', 1) || IsType(packet, 'UDP', 1)">
                                        <span class="ml-3">{{ Onion(packet, 1).source_port }} => {{ Onion(packet, 1).destination_port }}</span>
                                    </template>
                                    
                                    <template v-if="IsType(packet, 'RIP', 2)">
                                        <span class="ml-3">RIPv{{ Onion(packet, 2).version }} {{ Onion(packet, 2).command_type}}</span>
                                    </template>
                                    <template v-if="IsType(packet, 'DHCP', 2)">
                                        <span class="ml-3">DHCP {{ Onion(packet, 2).message_type }} &bull; {{ Onion(packet, 2).transaction_id }}</span>
                                    </template>
                                </td>
                            </template>
                            <td colspan="4" v-else-if="IsType(packet, 'ARP')">
                                <span class="ml-3">{{ Onion(packet).operation }}</span>
                                <span class="ml-3" v-if="Onion(packet).operation == 'Request'"> Where is <strong>{{ Onion(packet).target_protocol_address }}</strong>? Tell <strong>{{ Onion(packet).sender_protocol_address }}</strong> </span>
                                <span class="ml-3" v-else> <strong>{{ Onion(packet).sender_protocol_address }}</strong> is at <strong>{{ Onion(packet).sender_hardware_address }}</strong> </span>
                            </td>
                            <td colspan="4" v-else-if="IsType(packet, 'LLDP')">
                                <!--{{ packet.lldp.system_name }} &bull; {{ packet.lldp.port_description }}-->
                            </td>
                            <td colspan="4" v-else>
                                --unknown--
                            </td>
                        </tr>
                        </template>
                    </tbody>
                </table>
            </div>
            
            <properties_modal
                :packet="properties_modal"

                :opened="properties_modal"
                @closed="properties_modal = false"
            ></properties_modal>
        </div>
    `,
    data: () => {
        return {
            properties_modal: false,

            only_known: true
        }
    },
    computed: {
        data() {
            return this.$store.state.sniffing.data;
        },
        active_interface() {
            return this.$store.state.sniffing.interface;
        },
        interface() {
            return this.$store.state.interfaces.table[this.active_interface];
        },
        running() {
            return this.$store.state.running;
        }
    },
    methods: {
        MAC(mac){
            if(mac == "FF:FF:FF:FF:FF:FF") {
                return '<i title="'+mac+'">broadcast</i>';
            }
            if(mac.indexOf("01:00:5E:") == 0) {
                return '<i title="'+mac+'">multicast</i>';
            }

            if(typeof this.interface === 'undefined' || this.interface.mac != mac) {
                return mac;
            }
            
            return '<strong title="'+mac+'">my&nbsp;mac</strong>';
        },
        IP(ip){
            if(ip == "255.255.255.255") {
                return '<i title="'+ip+'">broadcast</i>';
            }

            if(typeof this.interface === 'undefined' || this.interface.ip != ip) {
                return ip;
            }
            
            return '<strong title="'+ip+'">my&nbsp;ip</strong>';
        },
        // TODO: Refactor
        IsType(packet, type, level = 0) {
            do {
                if ('payload_packet' in packet) {
                    packet = packet.payload_packet;
                }
                else {
                    return false;
                }
            } while (level-- > 0);
            
            return packet.type == type;
        },
        // TODO: Refactor
        Onion(packet, level = 0) {
            do {
                if ('payload_packet' in packet) {
                    packet = packet.payload_packet;
                }
                else {
                    return null;
                }
            } while (level-- > 0);

            return packet;
        },
        Select(interface) {
            if(interface == ""){
                interface = null;
            }

            this.$store.dispatch('SNIFFING_INTERFACE', interface).then(() => {
                this.$store.commit('SNIFFING_CLEAR');
            })
        }
    },
    components: {
        'properties_modal': {
            props: ['opened', 'packet'],
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
                data() {
                    return this.packet;
                },
                layers() {
                    var data = this.data;

                    var resp = [data]
                    while ('payload_packet' in data) {
                        data = data.payload_packet;
                        resp.push(data);
                    }
                    return resp;
                },
                rip() {
                    var data = this.data;
                    
                    while ('payload_packet' in data) {
                        data = data.payload_packet;
                        
                        if (data.type == "RIP") {
                            return data;
                        }
                    }
                    return null;
                },
                dhcp() {
                    var data = this.data;
                    
                    while ('payload_packet' in data) {
                        data = data.payload_packet;
                        
                        if (data.type == "DHCP") {
                            return data;
                        }
                    }
                    return null;
                },
            },
            data() {
                return {
                    visible: false
                }
            },
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-0"> Properties </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <table class="table mb-0">
                            <template v-for="packet in layers">
                                <template v-if="packet.type == 'Ethernet'">
                                    <tr style="border-top: 2px solid black;"><th>Source MAC</th><td>{{ packet.source_hw_address }}</td></tr>
                                    <tr><th>Destination MAC</th><td>{{ packet.destination_hw_address }}</td></tr>
                                    <tr style="border-bottom: 2px solid black;"><th>Ether Type</th><td>{{ packet.ethernet_packet_type }}</td></tr>
                                </template>

                                <template v-else-if="packet.type == 'ARP'">
                                    <tr><th>Operation</th><td>{{ packet.operation }}</td></tr>
                                    <tr><th>Sender MAC</th><td>{{ packet.sender_hardware_address }}</td></tr>
                                    <tr><th>Sender IP</th><td>{{ packet.sender_protocol_address }}</td></tr>
                                    <tr><th>Target MAC</th><td>{{ packet.target_hardware_address }}</td></tr>
                                    <tr style="border-bottom: 2px solid black;"><th>Target IP</th><td>{{ packet.target_protocol_address }}</td></tr>
                                </template>

                                <template v-else-if="packet.type == 'LLDP'">
                                    <!--
                                    <tr><th>Chassis ID</th><td>{{ packet.chassis_id }}</td></tr>
                                    <tr><th>Port ID</th><td>{{ packet.port_id }}</td></tr>
                                    <tr><th>Time To Live</th><td>{{ packet.time_to_live }}</td></tr>
                                    <tr><th>Port Description</th><td>{{ packet.port_description }}</td></tr>
                                    <tr style="border-bottom: 2px solid black;"><th>System Name</th><td>{{ packet.system_name }}</td></tr>
                                    -->
                                </template>

                                <template v-else-if="packet.type == 'IP'">
                                    <tr><th>Source IP</th><td>{{ packet.source_address }}</td></tr>
                                    <tr><th>Destination IP</th><td>{{ packet.destination_address }}</td></tr>
                                    <tr><th>Time To Live</th><td>{{ packet.time_to_live }}</td></tr>
                                    <tr style="border-bottom: 2px solid black;"><th>Protocol</th><td>{{ packet.ip_protocol_type }}</td></tr>
                                </template>

                                <template v-else-if="packet.type == 'TCP' || packet.type == 'UDP'">
                                    <tr><th>Source Port</th><td>{{ packet.source_port }}</td></tr>
                                    <tr style="border-bottom: 2px solid black;"><th>Destination Port</th><td>{{ packet.destination_port }}</td></tr>
                                </template>

                                <template v-else-if="packet.type == 'TCP'">
                                    <!-- FLAGS -->
                                </template>

                                <template v-else-if="packet.type == 'RIP'">
                                    <tr><th>Command</th><td>{{ packet.command_type }}</td></tr>
                                    <tr><th>Version</th><td>{{ packet.version }}</td></tr>
                                    <tr><th colspan=2>Routes:</th></tr>
                                </template>

                                <template v-else-if="packet.type == 'DHCP'">
                                    <tr><th>Operation Code</th><td>{{ packet.operation_code }}</td></tr>
                                    <tr><th>Transaction ID</th><td>{{ packet.transaction_id }}</td></tr>
                                    <tr><th>Client IP</th><td>{{ packet.your_client_ip_address }}</td></tr>
                                    <tr><th>Server IP</th><td>{{ packet.next_server_ip_address }}</td></tr>
                                    <tr><th>Client Mac</th><td>{{ packet.client_mac_address }}</td></tr>
                                    <tr><th>Message Type</th><td>{{ packet.message_type }}</td></tr>
                                    <tr><th colspan="2">DHCP Options:</th></tr>
                                </template>

                                <template v-if="'payload_data' in packet">
                                    <tr><th>Payload Data<br><i>base 64 encoded</i></th><td><textarea class="form-control form-control-plaintext" readonly rows="5">{{ packet.payload_data }}</textarea></td></tr>
                                </template>
                            </template>
                        </table>
                        
                        <table class="table" v-if="rip != null">
                            <thead>
                                <tr>
                                    <th>AFI</th>
                                    <th>TAG</th>
                                    <th>IP</th>
                                    <th>Mask</th>
                                    <th>Next&nbsp;Hop</th>
                                    <th>Metric</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="route in rip.routes" v-bind:class="{
                                    'table-danger': route.metric == 16
                                }">
                                    <td>{{ route.afi }}</td>
                                    <td>{{ route.route_tag }}</td>
                                    <td>{{ route.ip }}</td>
                                    <td>{{ route.mask }}</td>
                                    <td>{{ route.next_hop }}</td>
                                    <td>{{ route.metric }}</td>
                                </tr>
                            </tbody>
                        </table>

                        <pre v-if="dhcp != null">{{ dhcp.options }}</pre>

                        <!--
                        <pre>{{ data }}</pre>
                        -->
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
                }
            }
        }
    }
})
