Vue.component('test-cases', {
    template: `
        <div class="card mb-3" v-if="editing === false">
            <div class="card-header">
                <div class="float-right">
                    <button class="btn btn-primary" @click="import_modal = true">Import</button>
                    <button class="btn btn-primary" @click="Export()">Export</button>
                </div>

                <h5 class="card-title my-2">Test Cases</h5>
            </div>
            
            <div class="card-body">
                <ul class="list-group">
                    <li class="list-group-item" v-for="(test_case, index) in test_cases">
                        <div class="float-right">
                            <button class="btn btn-primary btn-sm" @click="Edit(index)">Edit</button>
                            <button class="btn btn-danger btn-sm" @click="Remove(index)">Remove</button>
                        </div>
                        <div>
                            <strong>{{ test_case.name }}</strong><br><small>{{ test_case.description }}</small>
                        </div>
                    </li>
                </ul>

                <div class="text-center">
                    <button class="btn btn-outline-info m-2" @click="Edit(null)">+ Create Test Case</button>
                </div>
            </div>

            <import_modal
                :opened="import_modal"
                @closed="import_modal = false"
            />
        </div>
        <div class="card mb-3" v-else>
            <div class="card-header">
                <div class="form-group row  mb-0">
                    <h5 class="col-sm-4 card-title my-2">Test Case</h5>
                    <div class="col-sm-8">
                        <select class="form-control" v-model="test_case.type">
                            <option v-for="({name}, id) in test_presets" :value="id">{{ name }}</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="card-body">
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
                    <label class="col-sm-4 col-form-label">Timeout <small>sec</small></label>
                    <div class="col-sm-8">
                        <input type="text" class="form-control" v-model="test_case.timeout_sec" placeholder="Use default" />
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

                <div class="text-right">
                    <button class="btn btn-success" @click="Save()">Save Changes</button>
                    <button class="btn btn-secondary" @click="editing = false">Cancel</button>
                </div>
            </div>
        </div>
    `,
    data: () => {
        return {
            import_modal: false,
            editing: false,

            test_case: null
        }
    },
    methods: {
        Import() {
            return ajax("Analyzer", "ExportTestCases").then(data => {
                this.DownloadObjectAsJson(data, "test_scenarios")
            });
        },
        Export() {
            return ajax("Analyzer", "ExportTestCases").then(data => {
                this.DownloadObjectAsJson(data, "test_scenarios")
            });
        },
        DownloadObjectAsJson(exportObj, exportName) {
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
            var el = document.createElement('a');
            el.setAttribute("href", dataStr);
            el.setAttribute("download", exportName + ".json");
            document.body.appendChild(el); // required for firefox
            el.click();
            el.remove();
        },
        Edit(index) {
            this.editing = index;
            if(index === null) {
                this.$set(this, 'test_case', { type: "DummyTest" });
            } else {
                this.$set(this, 'test_case', this.test_cases[index]);
            }
        },
        Save() {
            if(this.editing === false) {
                return;
            }
            
            this.$store.dispatch('ANALYZER_STORAGE_PUT', {
                index: this.editing,
                test_case: this.test_case
            }).then(() => {
                this.editing = false;
                this.test_case = null;
            })
        },
        Remove(index) {
            this.$store.dispatch('ANALYZER_STORAGE_REMOVE', index)
        }
    },
    computed: {
        test_cases() {
            return this.$store.state.test_cases;
        },
        test_presets() {
            return this.$store.state.analyzer.test_presets;
        },
        selected_test() {
            return this.$store.state.analyzer.test_presets[this.test_case.type];
        }
    },
    components: {
        'import_modal': {
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
            data() {
                return {
                    visible: false,
                    data: {},
                    error: false
                }
            },
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-0"> Import Test Cases </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">
                                From Text
                            </label>
                            <div class="btn-group col-sm-8">
                                <textarea class="form-control" v-model="data" rows="5" />
                            </div>
                        </div>

                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">
                                From File
                            </label>
                            <div class="btn-group col-sm-8">
                                <input type="file" class="form-control" ref="file" @change="HandleFile($event)" />
                            </div>
                        </div>

                        <div class="alert alert-danger" v-if="error">{{error}}</div>
                    </div>
                    <div slot="footer">
                        <button v-on:click="Action()" class="btn btn-success">Import data</button>
                        <button v-on:click="Close()" class="btn btn-secondary">Cancel</button>
                    </div>
                </modal>
            `,
            methods: {
                HandleFile(event) {
                    this.error = false;

                    var el = this.$refs.file;
                    var file = el.files[0];

                    if(!/(json|text)/.test(file.type)) {
                        this.error = "Unknown filetype '"+file.type+"'";
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.data = e.target.result;
                        this.Action();
                    };
                    reader.readAsText(file);
                },
                Open() {
                    this.error = false;
                    this.data = "";
                    this.visible = true;

                    setTimeout(() => {
                        var file = this.$refs.file;
                        console.log(file.files);
                    }, 0)
                },
                Close() {
                    this.visible = false;
                    this.$emit("closed");
                },
                Action() {
                    this.error = false;

                    try {
                        var data = JSON.parse(this.data)
                    } catch (e) {
                        this.error = String(e);
                    }
                    
                    this.$store.dispatch('ANALYZER_STORAGE_IMPORT', data).then(() => {
                        this.Close();
                    })
                }
            }
        },
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
