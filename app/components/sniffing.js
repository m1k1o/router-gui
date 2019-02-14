Vue.component('sniffing', {
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <div class="float-right">
                    <button class="btn btn-primary" v-bind:class="{'disabled': !running}" v-on:click="running && (interfaces_modal = true)">Interfaces</button>
                </div>

                <h5 class="card-title mb-0 mt-2">Sniffing</h5>
            </div>

            <div id="sniffing" style="height:500px;overflow:auto;">
            <ul class="list-group list-group-flush">
            <template
            v-for="packet in data">
                <li
                    class="list-group-item sniffing"
                    @click="properties_modal = packet"
                    :class="{
                        'arp': 'arp' in packet,
                        'rip': 'rip' in packet,
                        'tcp': 'tcp' in packet,
                        'udp': 'udp' in packet,
                    }"
                >
                    <interface-show :id="packet.interface" class="float-left mr-3"></interface-show>
                    <span class="text-center" style="width:130px;">
                        <span v-html="MAC(packet.interface, packet.eth.src_mac)"></span><br>
                        <span v-html="MAC(packet.interface, packet.eth.dst_mac)"></span>
                    </span>
                    <span class="ml-3">{{ packet.eth.type }}</span>
                
                    <template v-if="'arp' in packet">
                        <span class="ml-3">{{ packet.arp.op }}</span>
                        <span class="ml-3" v-if="packet.arp.op == 'Request'"> Where is <strong>{{ packet.arp.target_ip }}</strong> ? Tell <strong>{{ packet.arp.sender_ip }}</strong> </span>
                        <span class="ml-3" v-else> <strong>{{ packet.arp.sender_ip }}</strong> is at <strong>{{ packet.arp.sender_mac }}</strong> </span>
                    </template>
                    
                    <template v-if="'ip' in packet">
                        <span class="text-center" style="width:130px;">
                            <span v-html="MAC(packet.interface, packet.ip.src_ip)"></span><br>
                            <span v-html="MAC(packet.interface, packet.ip.dst_ip)"></span>
                        </span>
                        <span class="ml-3">{{ packet.ip.protocol }}</span>
                    </template>

                    <template v-if="'tcp' in packet">
                        <span class="ml-3">{{ packet.tcp.src_port }} <br> {{ packet.tcp.dst_port }}</span>
                    </template>
                    <template v-else-if="'udp' in packet">
                        <span class="ml-3">{{ packet.udp.src_port }} <br> {{ packet.udp.dst_port }}</span>
                    </template>

                    <template v-if="'rip' in packet">
                        <span class="ml-3">RIPv2 {{ packet.rip.cmd_type}}</span>
                        <span class="ml-3">{{ IP(packet.interface, packet.ip.src_ip) }}:{{ packet.udp.src_port }} <br> {{ IP(packet.interface, packet.ip.dst_ip) }}:{{ packet.udp.dst_port }}</span>
                    </template>
                </li>
                </template>
            </ul>
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
        Scroll() {
            var container = this.$el.querySelector("#sniffing");
            container.scrollTop = container.scrollHeight;
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
