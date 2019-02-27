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
                
                <button class="btn btn-success" v-on:click="DefaultSettings();" v-if="running">Default Settings</button>
                <button class="btn btn-info" v-on:click="api_settings = true" v-if="!running">API Settings</button>
                <button class="btn btn-danger" v-on:click="Stop();" v-if="running">Pause Requests</button>
                <button class="btn btn-success" v-on:click="Start();" v-if="!running">Start Requests</button>
            </div>

            <h3 class="mb-3">Router</h3>
            
            <interfaces></interfaces>
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
