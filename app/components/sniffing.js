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
                        <template v-for="packet in data" >
                        <tr
                            class="sniffing"
                            style="cursor:pointer;"
                            @click="properties_modal = packet"
                            :class="{
                                'arp': 'arp' in packet,
                                'rip': 'rip' in packet,
                                'tcp': 'tcp' in packet,
                                'udp': !('rip' in packet) && 'udp' in packet,
                            }"
                            v-if="!only_known || only_known && ('arp' in packet || 'lldp' in packet || 'ip' in packet)"
                        >
                            <td class="text-center" v-html="MAC(packet.eth.src_mac)"></td>
                            <td class="text-center" v-html="MAC(packet.eth.dst_mac)"></td>
                            <td>{{ packet.eth.type }}</td>
                            
                            <template v-if="'ip' in packet">
                                <td class="text-center" v-html="IP(packet.ip.src_ip)"></td>
                                <td class="text-center" v-html="IP(packet.ip.dst_ip)"></td>
                                <td>{{ packet.ip.protocol }}</td>
                                
                                <td>
                                    <template v-if="'tcp' in packet">
                                        <span class="ml-3">{{ packet.tcp.src_port }} => {{ packet.tcp.dst_port }}</span>
                                    </template>
                                    <template v-else-if="'udp' in packet">
                                        <span class="ml-3">{{ packet.udp.src_port }} => {{ packet.udp.dst_port }}</span>
                                        
                                        <template v-if="'rip' in packet">
                                            <span class="ml-3">RIPv2 {{ packet.rip.cmd_type}}</span>
                                        </template>
                                    </template>
                                </td>
                            </template>
                            <td colspan="4" v-else-if="'arp' in packet">
                                <span class="ml-3">{{ packet.arp.op }}</span>
                                <span class="ml-3" v-if="packet.arp.op == 'Request'"> Where is <strong>{{ packet.arp.target_ip }}</strong>? Tell <strong>{{ packet.arp.sender_ip }}</strong> </span>
                                <span class="ml-3" v-else> <strong>{{ packet.arp.sender_ip }}</strong> is at <strong>{{ packet.arp.sender_mac }}</strong> </span>
                            </td>
                            <td colspan="4" v-else-if="'lldp' in packet">
                                {{ packet.lldp.system_name }} &bull; {{ packet.lldp.port_description }}
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
                        <h1 class="mb-0"> Packet properties </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <table class="table mb-0">
                        
                            <template v-if="'eth' in data">
                                <tr style="border-top: 2px solid black;"><th>Source MAC</th><td>{{ data.eth.src_mac }}</td></tr>
                                <tr><th>Destination MAC</th><td>{{ data.eth.dst_mac }}</td></tr>
                                <tr style="border-bottom: 2px solid black;"><th>Ether Type</th><td>{{ data.eth.type }}</td></tr>
                            </template>

                            <template v-if="'arp' in data">
                                <tr><th>Operation</th><td>{{ data.arp.op }}</td></tr>
                                <tr><th>Sender MAC</th><td>{{ data.arp.sender_mac }}</td></tr>
                                <tr><th>Sender IP</th><td>{{ data.arp.sender_ip }}</td></tr>
                                <tr><th>Target MAC</th><td>{{ data.arp.target_mac }}</td></tr>
                                <tr style="border-bottom: 2px solid black;"><th>Target IP</th><td>{{ data.arp.target_ip }}</td></tr>
                            </template>

                            <template v-if="'lldp' in data">
                                <tr><th>Chassis ID</th><td>{{ data.lldp.chassis_id }}</td></tr>
                                <tr><th>Port ID</th><td>{{ data.lldp.port_id }}</td></tr>
                                <tr><th>Time To Live</th><td>{{ data.lldp.time_to_live }}</td></tr>
                                <tr><th>Port Description</th><td>{{ data.lldp.port_description }}</td></tr>
                                <tr style="border-bottom: 2px solid black;"><th>System Name</th><td>{{ data.lldp.system_name }}</td></tr>
                            </template>

                            <template v-if="'ip' in data">
                                <tr><th>Source IP</th><td>{{ data.ip.src_ip }}</td></tr>
                                <tr><th>Destination IP</th><td>{{ data.ip.dst_ip }}</td></tr>
                                <tr><th>Time To Live</th><td>{{ data.ip.ttl }}</td></tr>
                                <tr style="border-bottom: 2px solid black;"><th>Protocol</th><td>{{ data.ip.protocol }}</td></tr>
                            </template>

                            <template v-if="'tcp' in data">
                                <tr><th>Source Port</th><td>{{ data.tcp.src_port }}</td></tr>
                                <tr style="border-bottom: 2px solid black;"><th>Destination Port</th><td>{{ data.tcp.dst_port }}</td></tr>
                            </template>

                            <template v-if="'udp' in data">
                                <tr><th>Source Port</th><td>{{ data.udp.src_port }}</td></tr>
                                <tr style="border-bottom: 2px solid black;"><th>Destination Port</th><td>{{ data.udp.dst_port }}</td></tr>
                            </template>

                            <template v-if="'rip' in data">
                                <tr><th>Command</th><td>{{ data.rip.cmd_type }}</td></tr>
                                <tr><th colspan=2>Routes:</th></tr>
                            </template>
                        </table>

                        <table class="table" v-if="'rip' in data">
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
                                <tr v-for="route in data.rip.routes" v-bind:class="{
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
