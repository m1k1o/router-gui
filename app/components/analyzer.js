Vue.component('analyzer', {
    template: `
        <div class="card mb-3">
            <div class="card-header">
                <h5 class="card-title my-2">Analyzer</h5>
            </div>

            <div class="card-body form-horizontal">
                <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Generator Interface</label>
                    <div class="col-sm-8">
                        <interface-input v-model="test_case.generator_interface" :running_only="true"></interface-input>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Analyzer Interface</label>
                    <div class="col-sm-8">
                        <interface-input v-model="test_case.analyzer_interface" :running_only="true"></interface-input>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Test Case</label>
                            <div class="col-sm-8">
                                <select class="form-control" v-model="test_case.type">
                                    <option v-for="({name}, id) in tests" :value="id">{{ name }}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="card-body form-horizontal">
                        <component
                            v-if="selected_test && 'component' in selected_test"
                            v-model="test_case" 

                            :is="selected_test.component"
                            :generator_interface="test_case.generator_interface" 
                            :analyzer_interface="test_case.analyzer_interface" 
                        />
                    </div>
                </div>

                <div class="form-group row">
                    <label class="col-sm-4 col-form-label"></label>
                    <div class="col-sm-8">
                        <button class="btn btn-success" @click="Toggle()" v-if="!test.running">START</button>
                        <button class="btn btn-danger" @click="Toggle()" v-else>STOP</button>
                    </div>
                </div>

                <div class="progress mb-3" v-if="test.running">
                    <div class="progress-bar progress-bar-striped" style="width:0;" :style="'animation: progress_animate '+test.time_out+'s ease-in-out forwards;'"></div>
                </div>
                
                <div class="alert alert-danger" v-if="test.error">
                    {{ test.message }}
                </div>

                <template v-else-if="started">
                    <h5>Status: {{ test.status }}</h5>
                    <pre>{{ test.log }}</pre>
                </template>

                <!--
                <div class="card mb-3">
                    <div class="card-header">
                        <button class="btn btn-danger btn-sm float-right">Remove</button>
                        <h5 class="card-title my-1">Test: Dummy Test</h5>
                    </div>
                    <div class="card-body">
                        Lorem ipsum dolor..
                    </div>
                </div>
                -->
            </div>
            
            <!--
            <div class="form-group text-center">
                <button class="btn btn-outline-info m-2"> + Add new Test</button>
            </div>
            -->
        </div>
    `,
    data: () => {
        return {
            started: false,
            test_case: {
                generator_interface: null,
                analyzer_interface: null,
                type: "DummyTest"
            }
        }
    },
    computed: {
        test() {
            return this.$store.state.analyzer.test;
        },
        tests() {
            return this.$store.state.analyzer.tests;
        },
        selected_test() {
            console.log(this.test_case.type, this.$store.state.analyzer.tests[this.test_case.type])
            return this.$store.state.analyzer.tests[this.test_case.type];
        },
    },
    methods: {
        Toggle() {
            this.started = true;

            if(!this.test.running) {
                // start
                this.$store.commit('ANALYZER_CLEAR');
                this.$store.dispatch('WEBSOCKETS_EMIT', {
                    key: 'analyzer',
                    action: 'start',
                    test_case: this.test_case
                });
            
            } else {
                // stop
                this.$store.dispatch('WEBSOCKETS_EMIT', {
                    key: 'analyzer',
                    action: 'stop'
                });
            }
        }
    },
    components: {
        'ARPRequestTest': {
            mixins: [
                Packet_Mixin_Factory(['requested_ip', 'expected_mac'])
            ],
            template: `
                <div class="form-group ">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Reqested IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="requested_ip"
                                :required="true"
                            ></ip-address-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Expected MAC</label>
                        <div class="col-sm-8 input-group">
                            <mac-input
                                v-model="expected_mac"
                                :required="false"
                                placeholder="Unspecified"
                            ></mac-input>
                        </div>
                    </div>
                </div>
            `
        },
        'EchoReplyTest': {
            props: ['generator_interface'],
            mixins: [
                Packet_Mixin_Factory(['ip', 'mac'])
            ],
            data: () => ({
                arp_is_lookingup: false
            }),
            template: `
                <div class="form-group ">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="ip"
                                :required="true"
                            ></ip-address-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">MAC</label>
                        <div class="col-sm-8 input-group">
                            <mac-input
                                v-model="mac"
                                :required="true"
                            ></mac-input>
                            <div class="input-group-append" v-if="generator_interface">
                                <button class="btn btn-outline-secondary" @click="!arp_is_lookingup && ARP()" v-bind:class="{'disabled': arp_is_lookingup}"> {{ arp_is_lookingup ? 'Processing...' : 'ARP Request' }}</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                ARP() {
                    this.arp_is_lookingup = true
                    
                    ajax("ARP", "Lookup", {
                        interface: this.generator_interface,
                        ip: this.ip
                    })
                    .then(({ mac }) => {
                        this.mac = mac;
                    }, () => {})
                    .finally(() => {
                        this.arp_is_lookingup = false
                    });
                }
            }
        }
    }
})
