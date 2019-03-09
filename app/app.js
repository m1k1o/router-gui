const app = new Vue({
    el: '#app',
    store,
    data: {
        generator_modal: false,
        connection_modal: false,
        
        update_interval: null,

        push_interval: null,
        push: null
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
                <button class="btn btn-info" v-on:click="connection_modal = true">Connection Settings</button>
            </div>

            <h3 class="mb-3">Network Traffic Analyzer</h3>
            
            <interfaces></interfaces>
            <test-cases></test-cases>
            <analyzer></analyzer>
            <crafting></crafting>
            <sniffing></sniffing>

            <div class="float-right btn-group">
                <button class="btn btn-danger" v-on:click="Stop();" v-if="running">Pause Requests</button>
                <button class="btn btn-success" v-on:click="Start();" v-if="!running">Start Requests</button>
            </div>
            <h3 class="mb-3">Router</h3>
            <arp></arp>
            <routing></routing>
            <rip></rip>
            <lldp></lldp>
            <dhcp></dhcp>
            
            <generator_modal
                :opened="generator_modal"
                @closed="generator_modal = false"
            ></generator_modal>

            <connection_modal
                :opened="connection_modal"
                @closed="connection_modal = false"
            ></connection_modal>
            
            <div class="push" v-if="push">{{ push }}</div>
        </div>
    `,
    methods: {
        Push(text) {
            this.push = text;

            clearInterval(this.push_interval);
            this.push_interval = setTimeout(() => {
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
        }
    },
    mounted() {
        // Only INITIALIZE
        setTimeout(() => {
            this.$store.dispatch('INITIALIZE').then(() => {
                this.$store.commit('STOP')
            }, () => {})
        })

        //setTimeout(() => this.Start(), 0);
    },
    components: {
        'connection_modal': {
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

                hostname: null,
                port: null
            }),
            computed: {
                running() {
                    return this.$store.state.running;
                },
                websockets() {
                    return this.$store.state.websockets;
                }
            },
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-3"> Connection Settings </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">IP Address</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="hostname">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Port</label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="port">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label"></label>
                            <div class="col-sm-8">
                                <button v-on:click="Action()" class="btn btn-success">Save changes</button>    
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Websockets</label>
                            <div class="col-sm-8">
                                <button
                                    v-if="websockets.instance == null"
                                    v-on:click="$store.dispatch('WEBSOCKETS_CONNET')"
                                    class="btn btn-info"
                                > Start </button>
                                <button
                                    v-else
                                    v-on:click="$store.dispatch('WEBSOCKETS_DISCONNECT')"
                                    class="btn btn-danger"
                                > Stop </button>

                                <span v-if="websockets.running" class="text-success">Running</span>
                                <span v-else-if="websockets.instance != null" class="text-warning">Trying to connect...</span>
                                <span v-else class="text-danger">Not Running</span>
                            </div>
                        </div>
                    </div>
                </modal>
            `,
            methods: {
                Open(){
                    this.hostname = this.$store.state.connection.hostname;
                    this.port = this.$store.state.connection.port;

                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.$store.commit('SET_CONNECTION', {
                        hostname: this.hostname,
                        port: this.port
                    })
                }
            }
        }
    }
});

// TODO: REFACTOR
function ajax(model, controller, body = null) {
    if (body != null && typeof body == 'object') {
        body = JSON.stringify(body);
    }

    let { hostname, port } = store.state.connection;
    return fetch('http://'+hostname+':'+port+'/'+model+'/'+controller, { method: 'POST', body })
    .then(res => res.json())
    .then(res => {
        if(typeof res.error === 'undefined') {
            return res;
        }
        
        console.log("Server Error Occured.");
        app.Push(res.error);
        throw res.error;
    }, (err) => {
        app.Stop();
        
        console.log("Client Error Occured.");
        app.Push(err.toString());
        throw err;
    });
}
