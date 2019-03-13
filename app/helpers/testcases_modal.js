Vue.component('testcases_modal', {
    props: ['opened', 'generator_interface', 'analyzer_interface'],
    watch: { 
        opened: function(newVal, oldVal) {
            if(!oldVal && newVal) {
                this.Open(newVal);
            }
            
            if(oldVal && !newVal) {
                this.Close();
            }
        }
    },
    data() {
        return {
            visible: false,
            valid: true,

            index: false,
            test_case: null
        }
    },
    computed: {
        test_cases() {
            return this.$store.state.test_cases;
        },
        test_status() {
            return this.$store.state.analyzer.test_status;
        },
        test_presets() {
            return this.$store.state.analyzer.test_presets;
        },
        selected_test() {
            return this.$store.state.analyzer.test_presets[this.test_case.type];
        }
    },
    template: `
        <modal v-if="visible" v-on:close="Close()">
            <div slot="header">
                <h1 class="mb-0"> Test Case </h1>
            </div>
            <div slot="body" class="form-horizontal">
                <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Test Case</label>
                    <div class="col-sm-8">
                        <select class="form-control" v-model="test_case.type">
                            <option v-for="({name}, id) in test_presets" :value="id">{{ name }}</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Name</label>
                    <div class="col-sm-8">
                        <input type="text" class="form-control" v-model="test_case.name" placeholder="Use default" />
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Description</label>
                    <div class="col-sm-8">
                        <textarea class="form-control" v-model="test_case.description" placeholder="Use default" />
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Timeout <small>sec.</small></label>
                    <div class="col-sm-8">
                        <input type="text" class="form-control" v-model="test_case.timeout_sec" placeholder="Use default" />
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Timeout <small>status</small></label>
                    <div class="col-sm-8">
                        <select class="form-control" v-model="test_case.timeout_status">
                            <option :value="test_status.Timeout">Timeout</option>
                            <option :value="test_status.Success">Success</option>
                            <option :value="test_status.Error">Error</option>
                        </select>
                    </div>
                </div>
                <hr>
                <component
                    v-if="selected_test && 'component' in selected_test"
                    v-model="test_case" 
    
                    :is="selected_test.component"
                    :generator_interface="generator_interface" 
                    :analyzer_interface="analyzer_interface"
                    @valid="valid = $event"
                />
            </div>
            <div slot="footer">
                <button class="btn btn-success" @click="Action()" :disabled="!valid">Save Changes</button>
                <button class="btn btn-secondary" @click="Close()">Cancel</button>
            </div>
        </modal>
    `,
    methods: {
        Open(index) {
            this.visible = true;

            if(index === true) {
                this.$set(this, 'test_case', {
                    type: "DummyTest"
                });
                this.index = null;
            } else {
                this.$set(this, 'test_case', { ...this.test_cases[index]});
                this.index = index;
            }
        },
        Close() {
            this.visible = false;
            this.$emit("closed");
        },
        Action() {
            this.$store.dispatch('ANALYZER_STORAGE_PUT', {
                index: this.index,
                test_case: this.test_case
            }).then(() => {
                this.test_case = null;
                this.$emit("closed");
            })
        }
    },
    components: {
        'ARPResponseTest': {
            mixins: [
                Model_Mixin_Factory(['requested_ip', 'expected_mac'])
            ],
            template: `
                <div class="form-group ">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Reqested IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="requested_ip"
                                :required="true"
                                @valid="Valid('requested_ip', $event)"
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
                                @valid="Valid('expected_mac', $event)"
                            ></mac-input>
                        </div>
                    </div>
                </div>
            `
        },
        'ARPRequestTest': {
            mixins: [
                Model_Mixin_Factory(['device_mac', 'expected_ip'])
            ],
            template: `
                <div class="form-group ">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Device MAC</label>
                        <div class="col-sm-8 input-group">
                            <mac-input
                                v-model="device_mac"
                                :required="false"
                                placeholder="Unspecified"
                                @valid="Valid('device_mac', $event)"
                            ></mac-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Expected IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="expected_ip"
                                :required="false"
                                placeholder="Unspecified"
                                @valid="Valid('expected_ip', $event)"
                            ></ip-address-input>
                        </div>
                    </div>
                </div>
            `
        },
        'ICMPEchoReplyTest': {
            props: ['generator_interface'],
            mixins: [
                Model_Mixin_Factory(['destination_mac', 'destination_ip'])
            ],
            data: () => ({
                arp_is_lookingup: false
            }),
            template: `
                <div class="form-group ">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination MAC</label>
                        <div class="col-sm-8 input-group">
                            <mac-input
                                v-model="destination_mac"
                                :required="true"
                                @valid="Valid('destination_mac', $event)"
                            ></mac-input>
                            <div class="input-group-append" v-if="generator_interface">
                                <button class="btn btn-outline-secondary" @click="!arp_is_lookingup && ARP()" v-bind:class="{'disabled': arp_is_lookingup}"> {{ arp_is_lookingup ? 'Processing...' : 'ARP Request' }}</button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Destination IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="destination_ip"
                                :required="true"
                                @valid="Valid('destination_ip', $event)"
                            ></ip-address-input>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                ARP() {
                    this.arp_is_lookingup = true
                    
                    ajax("ARP", "Lookup", {
                        interface: this.generator_interface,
                        ip: this.destination_ip
                    })
                    .then(({ mac }) => {
                        this.destination_mac = mac;
                    }, () => {})
                    .finally(() => {
                        this.arp_is_lookingup = false
                    });
                }
            }
        },
        'ICMPEchoRequestTest': {
            props: ['generator_interface'],
            mixins: [
                Model_Mixin_Factory(['source_mac', 'source_ip'])
            ],
            data: () => ({
                arp_is_lookingup: false
            }),
            template: `
                <div class="form-group ">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source MAC</label>
                        <div class="col-sm-8 input-group">
                            <mac-input
                                v-model="source_mac"
                                :required="false"
                                placeholder="Unspecified"
                                @valid="Valid('source_mac', $event)"
                            ></mac-input>
                            <div class="input-group-append" v-if="generator_interface">
                                <button class="btn btn-outline-secondary" @click="!arp_is_lookingup && ARP()" v-bind:class="{'disabled': arp_is_lookingup}"> {{ arp_is_lookingup ? 'Processing...' : 'ARP Request' }}</button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Source IP</label>
                        <div class="col-sm-8">
                            <ip-address-input
                                v-model="source_ip"
                                :required="false"
                                placeholder="Unspecified"
                                @valid="Valid('source_ip', $event)"
                            ></ip-address-input>
                        </div>
                    </div>
                </div>
            `,
            methods: {
                ARP() {
                    this.arp_is_lookingup = true
                    
                    ajax("ARP", "Lookup", {
                        interface: this.generator_interface,
                        ip: this.source_ip
                    })
                    .then(({ mac }) => {
                        this.source_mac = mac;
                    }, () => {})
                    .finally(() => {
                        this.arp_is_lookingup = false
                    });
                }
            }
        }
    }
})
