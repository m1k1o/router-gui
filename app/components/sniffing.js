Vue.component('sniffing', {
    template: `
        <div class="card mb-3">
            <div class="card-header">
                <div class="float-right">
                    <div class="btn-group">
                        <button class="btn btn-outline-primary" v-on:click="only_known = !only_known">
                        Hide unknown: 
                            <span v-if="only_known" class=" text-success">Yes</span>
                            <span v-else class=" text-danger">No</span>
                        </button>
                    </div>
                    <div class="btn-group">
                        <interface-input @input="Select($event)" :running_only="true"></interface-input>
                    </div>
                </div>
                
                <interface-show :id="active_interface" style="position:absolute;margin-top:-4px;"></interface-show>
                <h5 style="margin-left:55px;" class="card-title my-2">Sniffing</h5>
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
                                'tcp': IsType(packet, 'TCP', 1),
                                'rip': IsType(packet, 'RIP', 2),
                                'dhcp': IsType(packet, 'DHCP', 2),
                                'udp': !IsType(packet, 'RIP', 2)  && !IsType(packet, 'DHCP', 2) && IsType(packet, 'UDP', 1)
                            }"
                            v-if="!only_known || only_known && (IsType(packet, 'ARP') || IsType(packet, 'IP') || IsType(packet, 'LLDP'))"
                        >
                            <td class="text-center" v-html="MAC(packet.source_hw_address)"></td>
                            <td class="text-center" v-html="MAC(packet.destination_hw_address)"></td>
                            <td>{{ ethernet_packet_types[packet.ethernet_packet_type] || packet.ethernet_packet_type }}</td>
                            
                            <template v-if="IsType(packet, 'IP')">
                                <td class="text-center" v-html="IP(Onion(packet).source_address)"></td>
                                <td class="text-center" v-html="IP(Onion(packet).destination_address)"></td>
                                <td>{{ ip_protocol_types[Onion(packet).ip_protocol_type] || Onion(packet).ip_protocol_type }}</td>
                                
                                <td>
                                    <template v-if="IsType(packet, 'TCP', 1) || IsType(packet, 'UDP', 1)">
                                        <span class="ml-3">{{ Onion(packet, 1).source_port }} => {{ Onion(packet, 1).destination_port }}</span>
                                    </template>
                                    
                                    <template v-if="IsType(packet, 'RIP', 2)">
                                        <span class="ml-3">RIPv{{ Onion(packet, 2).version }} {{ rip_command_types[Onion(packet, 2).command_type] || Onion(packet, 2).command_type }}</span>
                                    </template>
                                    <template v-if="IsType(packet, 'DHCP', 2)">
                                        <span class="ml-3">{{ Onion(packet, 2).message_type }} &bull; {{ Onion(packet, 2).transaction_id }}</span>
                                    </template>
                                </td>
                            </template>
                            <td colspan="4" v-else-if="IsType(packet, 'ARP')">
                                <span class="ml-3">{{ arp_operation[Onion(packet).operation] || Onion(packet).operation }}</span>
                                <span class="ml-3" v-if="Onion(packet).operation == 1"> Where is <strong>{{ Onion(packet).target_protocol_address }}</strong>? Tell <strong>{{ Onion(packet).sender_protocol_address }}</strong> </span>
                                <span class="ml-3" v-else> <strong>{{ Onion(packet).sender_protocol_address }}</strong> is at <strong>{{ Onion(packet).sender_hardware_address }}</strong> </span>
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
            active_interface: null,

            only_known: true
        }
    },
    computed: {
        ethernet_packet_types() {
            return this.$store.state.packets.ethernet_packet_type;
        },
        ip_protocol_types() {
            return this.$store.state.packets.ip_protocol;
        },
        rip_command_types() {
            return this.$store.state.packets.rip_command_types;
        },
        arp_operation() {
            return this.$store.state.packets.arp_operation;
        },
        
        data() {
            return this.$store.state.sniffing.data;
        },
        interface() {
            return this.$store.state.interfaces.table[this.active_interface];
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
        Select(id) {
            if(id == ""){
                id = null;
            }

            this.$store.dispatch('SNIFFING_INTERFACE', id)
            this.$store.commit('SNIFFING_CLEAR');
            this.active_interface = id;
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
                        <packet
                            :value="packet"
                            :readonly="true"
                        ></packet>
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
