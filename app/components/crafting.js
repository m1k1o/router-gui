Vue.component('crafting', {
    template: `
        <div class="card mb-3" :class="!empty_packet ? (valid ? 'border-success' : 'border-danger') : ''">
            <div class="card-header">
                <div class="float-right">
                    <div class="btn-group">
                        <button class="btn btn-outline-primary" v-on:click="readonly = !readonly">
                            Type: 
                            <span v-if="!readonly" class=" text-success">Editing</span>
                            <span v-else class=" text-danger">Readonly</span>
                        </button>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-outline-primary" v-on:click="strict = !strict">
                            Strict mode: 
                            <span v-if="strict" class=" text-success">Yes</span>
                            <span v-else class=" text-danger">No</span>
                        </button>
                    </div>
                    <div class="btn-group">
                        <interface-input v-model="interface_id" :running_only="true"></interface-input>
                    </div>
                </div>

                <interface-show :id="interface_id" style="position:absolute;margin-top:-4px;"></interface-show>
                <h5 style="margin-left:55px;" class="card-title my-2">Packet Crafter</h5>
            </div>
            <div class="card-body">
                <packet
                    v-model="packet"
                    :interface_id="interface_id"
                    :readonly="readonly"
                    :strict="strict"
                    @valid="valid = $event;"
                ></packet>
                <send_packet v-if="interface_id && valid && !empty_packet"
                    :interface_id="interface_id"
                    :packet="packet"
                ></send_packet>
            </div>
        </div>
    `,
    data: () => {
        return {
            readonly: false,
            strict: true,
            valid: true,
            interface_id: null,
            packet: {}
        }
    },
    computed: {
        empty_packet() {
            return Object.values(this.packet).length == 0;
        }
    },
    components: {
        'send_packet': {
            props: ['interface_id', 'packet'],
            data: () => ({
                active: false,
                running: false,
                interval_sec: 5,
                interval: null
            }),
            template: `
                <div class="mt-3">
                    <div class="form-group row mb-0">
                        <label class="col-sm-4 col-form-label form-control-plaintext text-right">
                            Repeat <input type="checkbox" value="1" v-model="active" class="ml-1">
                        </label>
                        
                        <div v-if="!active" class="btn-group col-sm-8">
                            <button v-on:click="Send()" class="btn btn-success"> Send </button>
                        </div>

                        <div v-else class="btn-group col-sm-8">
                            <button v-if="!running" v-on:click="RepeatToggle()" class="btn btn-success"> Start </button>
                            <button v-else v-on:click="RepeatToggle()" class="btn btn-danger"> Stop </button>
                            
                            <div class="input-group input-group-sm">
                                <div class="input-group-prepend">
                                    <span class="input-group-text" id="inputGroup-sizing-sm">every</span>
                                </div>
                                <input type="text" class="form-control" v-model="interval_sec" v-bind:readonly="running">
                                <div class="input-group-prepend">
                                    <span class="input-group-text" id="inputGroup-sizing-sm">sec.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                RepeatToggle() {
                    if (this.interval) {
                        this.running = false;
                        clearInterval(this.interval);
                        this.interval = null;
                        return ;
                    }

                    this.Send().then(() => {
                        this.interval = setInterval(() => this.Send(), this.interval_sec * 1000);
                        this.running = true;
                    })
                },
                Send() {
                    return ajax("Packets", "Send", {
                        interface: this.interface_id,
                        packet: this.packet
                    })
                }
            },
            beforeDestroy() {
                clearInterval(this.interval);
            }
        }
    }
})
