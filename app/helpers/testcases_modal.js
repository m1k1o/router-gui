Vue.component('testcases_modal', {
    props: ['opened'],
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
                    :generator_interface="test_case.generator_interface" 
                    :analyzer_interface="test_case.analyzer_interface" 
                />
            </div>
            <div slot="footer">
                <button class="btn btn-success" @click="Action()">Save Changes</button>
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
        'ARPRequestTest': {
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
                Model_Mixin_Factory(['ip', 'mac'])
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
