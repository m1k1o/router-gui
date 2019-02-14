Vue.component('sniffing', {
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <div class="float-right">
                    <!--<button class="btn btn-primary" v-bind:class="{'disabled': !running}" v-on:click="running && (interfaces_modal = true)">Interfaces</button>-->

                    <!--
                    <template v-for="(interface, interface_id) in interfaces" v-if="interface.running">
                        <interface-show :id="interface_id" class="float-left mr-3" v-on:click.native="Select(interface_id)" style="cursor:pointer;"></interface-show>
                    </template>
                    <button class="btn btn-danger" v-if="active_interface != null" v-on:click="Select(null)">Stop</button>
                    -->

                    <interface-input :value="active_interface" @input="Select($event)" :running_only="true"></interface-input>
                </div>

                <interface-show :id="active_interface" class="float-left mr-3"></interface-show>
                <h5 class="card-title mb-0 mt-2">Sniffing</h5>
                
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
                        <th> Ethernet Payload </th>
                    </thead>
                    <tbody>
                        <template v-for="packet in data" >
                        <tr
                            class="sniffing"
                            @click="properties_modal = packet"
                            :class="{
                                'arp': 'arp' in packet,
                                'rip': 'rip' in packet,
                                'tcp': 'tcp' in packet,
                                'udp': !('rip' in packet) && 'udp' in packet,
                            }"
                        >
                            <td class="text-center" v-html="MAC(packet.interface, packet.eth.src_mac)"></td>
                            <td class="text-center" v-html="MAC(packet.interface, packet.eth.dst_mac)"></td>
                            <td>{{ packet.eth.type }}</td>
                            
                            <template v-if="'ip' in packet">
                                <td class="text-center" v-html="IP(packet.interface, packet.ip.src_ip)"></td>
                                <td class="text-center" v-html="IP(packet.interface, packet.ip.dst_ip)"></td>
                                <td>{{ packet.ip.protocol }}</td>
                                
                                <td>
                                    <template v-if="'tcp' in packet">
                                        <span class="ml-3">{{ packet.tcp.src_port }} to {{ packet.tcp.dst_port }}</span>
                                    </template>
                                    <template v-else-if="'udp' in packet">
                                        <span class="ml-3">{{ packet.udp.src_port }} to {{ packet.udp.dst_port }}</span>
                                    </template>

                                    <template v-if="'rip' in packet">
                                        <span class="ml-3">RIPv2 {{ packet.rip.cmd_type}}</span>
                                    </template>
                                </td>
                            </template>
                            <td colspan="4" v-else-if="'arp' in packet">
                                <span class="ml-3">{{ packet.arp.op }}</span>
                                <span class="ml-3" v-if="packet.arp.op == 'Request'"> Where is <strong>{{ packet.arp.target_ip }}</strong> ? Tell <strong>{{ packet.arp.sender_ip }}</strong> </span>
                                <span class="ml-3" v-else> <strong>{{ packet.arp.sender_ip }}</strong> is at <strong>{{ packet.arp.sender_mac }}</strong> </span>
                            </td>
                            <td colspan="4" v-else-if="'lldp' in packet">
                                LLDP Payload
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

            <services_modal
                :service_name="'sniffing'"

                :opened="interfaces_modal"
                @closed="interfaces_modal = false"
            ></services_modal>
        </div>
    `,
    data: () => {
        return {
            properties_modal: false,
            interfaces_modal: false
        }
    },
    computed: {
        data() {
            return this.$store.state.sniffing.data;
        },
        active_interface() {
            return this.$store.state.sniffing.interface;
        },/*
        active_interface:{
            get() {
                console.log(this.$store.state.sniffing.interface);
                return this.$store.state.sniffing.interface;
            },
            set(interface) {
                if(interface == ""){
                    interface = null;
                }

                this.$store.commit('SNIFFING_CLEAR');
                this.$store.dispatch('SNIFFING_INTERFACE', interface);
            }
        },*/

        interfaces() {
            return this.$store.state.interfaces.table;
        },
        running() {
            return this.$store.state.running;
        }
    },
    methods: {
        MAC(interface_id, mac){
            if(mac == "FF:FF:FF:FF:FF:FF") {
                return '<i title="'+mac+'">broadcast</i>';
            }
            if(mac.indexOf("01:00:5E:") == 0) {
                return '<i title="'+mac+'">multicast</i>';
            }

            if(typeof this.interfaces[interface_id] === 'undefined' || this.interfaces[interface_id].mac != mac) {
                return mac;
            }
            
            return '<strong title="'+mac+'">my mac</strong>';
        },
        IP(interface_id, ip){
            if(ip == "255.255.255.255") {
                return '<i title="'+ip+'">broadcast</i>';
            }

            if(typeof this.interfaces[interface_id] === 'undefined' || this.interfaces[interface_id].ip != ip) {
                return ip;
            }
            
            return '<strong title="'+ip+'">my ip</strong>';
        },
        Select(interface) {
            if(interface == ""){
                interface = null;
            }

            this.$store.commit('SNIFFING_CLEAR');
            this.$store.dispatch('SNIFFING_INTERFACE', interface);
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
                        <pre>{{ data }}</pre>
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
