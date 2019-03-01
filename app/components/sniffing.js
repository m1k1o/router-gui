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
