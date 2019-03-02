const app = new Vue({
    el: '#app',
    store,
    data: {
        generator_modal: false,

        api_max_tries: 5,
        api_tries: 0,

        api_settings: false,
        api_hostname: "localhost",
        api_port: "7000",
        
        update_interval: null,
        push: null,

        test_readonly: false,
        test_strict: true,
        test_valid: true,
        test_interface_id: null,
        test_packet: 
        {
          "source_hw_address": "00:FF:78:42:5C:B4",
          "destination_hw_address": "00:FF:77:42:5C:B4",
          "ethernet_packet_type": 2048,
          "payload_packet": {
            "source_address": "10.8.8.1",
            "destination_address": "10.8.3.5",
            "time_to_live": 64,
            "ip_protocol_type": 17,
            "payload_packet": {
              "source_port": 53,
              "destination_port": 49870,
              "payload_packet": {
                  "type": "DHCP"
              },
              "type": "UDP"
              
            },
            "type": "IP"
          },
          "type": "Ethernet"
        }
    },
    computed: {
        running() {
            return this.$store.state.running;
        }
    },
    template: `
        <div class="container mt-3">
            <div class="float-right btn-group">
                <button class="btn btn-primary" v-on:click="generator_modal = true">Packet Generator</button>
                
                <button class="btn btn-success" v-on:click="DefaultSettings();" v-if="running">Default Settings</button>
                <button class="btn btn-info" v-on:click="api_settings = true" v-if="!running">API Settings</button>
                <button class="btn btn-danger" v-on:click="Stop();" v-if="running">Pause Requests</button>
                <button class="btn btn-success" v-on:click="Start();" v-if="!running">Start Requests</button>
            </div>

            <h3 class="mb-3">Router</h3>
            
            <interfaces></interfaces>
                
            <div class="card mb-3" :class="test_valid ? 'border-success' : 'border-danger'">
                <div class="card-body pb-0">
                    <div class="float-right">
                        <div class="btn-group">
                            <button class="btn btn-outline-primary" v-bind:class="{'disabled': !running }" v-on:click="running && (test_readonly = !test_readonly)">
                                Type: 
                                <span v-if="!test_readonly" class=" text-success">Editing</span>
                                <span v-else class=" text-danger">Readonly</span>
                            </button>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-outline-primary" v-bind:class="{'disabled': !running }" v-on:click="running && (test_strict = !test_strict)">
                                Strict mode: 
                                <span v-if="test_strict" class=" text-success">Yes</span>
                                <span v-else class=" text-danger">No</span>
                            </button>
                        </div>
                        <div class="btn-group">
                        <interface-input v-model="test_interface_id" :running_only="true"></interface-input>
                        </div>
                    </div>

                    <interface-show :id="test_interface_id" style="position:absolute;"></interface-show>
                    <h5 style="margin-left:55px;margin-top:-5px;" class="card-title mb-0 mt-2">Packet Crafting</h5>
                </div>
                <div class="card-body">

                    <packet
                        v-model="test_packet"
                        :interface_id="test_interface_id"
                        :readonly="test_readonly"
                        :strict="test_strict"
                        @valid="test_valid = $event;"
                    ></packet>
                </div>
            </div>

            <arp></arp>
            <routing></routing>
            <rip></rip>
            <lldp></lldp>
            <sniffing></sniffing>
            <dhcp></dhcp>
            
            <generator_modal
                :opened="generator_modal"
                @closed="generator_modal = false"
            ></generator_modal>
            
            <modal v-if="api_settings" v-on:close="api_settings = false">
                <div slot="header">
                    <h1 class="mb-3"> Settings </h1>
                </div>
                <div slot="body" class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">IP Address</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="api_hostname">
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Port</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="api_port">
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Max Tries</label>
                        <div class="col-sm-8">
                            <input type="text" class="form-control" v-model="api_max_tries">
                        </div>
                    </div>
                </div>
            </modal>
            
            <div class="push" v-if="push">{{ push }}</div>
        </div>
    `,
    methods: {
        DefaultSettings() {
            this.$store.dispatch('INTERFACE_EDIT', {
                id: 1,
                ip: "192.168.1.5",
                mask: "255.255.0.0"
            })

            this.$store.dispatch('INTERFACE_EDIT', {
                id: 3,
                ip: "10.10.0.2",
                mask: "255.255.0.0"
            })
        },

        Push(text) {
            this.push = text;

            setTimeout(() => {
                this.push = null;
            }, 3000);
        },

        Update(){
            this.$store.dispatch('UPDATE')
        },
        Start(){
            if(this.running) return;
            this.$store.dispatch('INITIALIZE').then(() => {
                this.update_interval = setInterval(() => this.Update(), 1000)
            }, () => {})
        },
        Stop(){
            if(!this.running) return;
            clearInterval(this.update_interval);
            this.$store.commit('STOP')
        },
        ApiError() {
            if (this.api_tries++ > this.api_max_tries) {
                this.Stop();
            }
        }
    },
    mounted(){
        setTimeout(() => this.Start(), 0);
    }
});

// TODO: REFACTOR
function ajax(model, controller, body = null) {
    if (body != null && typeof body == 'object') {
        body = JSON.stringify(body);
    }

    return fetch('http://'+app.api_hostname+':'+app.api_port+'/'+model+'/'+controller, { method: 'POST', body })
    .then(function(response) {
        return response.json();
    })
    .then((response) => {
        if(typeof response.error === 'undefined') {
            return response;
        }
        
        console.log("Error Occured.");
        app.api_tries = 0;
        app.Push(response.error);
        throw response.error;
    }, (err) => {
        app.ApiError();
        app.Push(err.toString());
        throw err.toString();
    });
}
