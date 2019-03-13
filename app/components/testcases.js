Vue.component('testcases', {
    template: `
        <div class="card mb-3">
            <div class="card-header">
                <div class="float-right">
                    <button class="btn btn-primary" @click="import_modal = true">Import</button>
                    <button class="btn btn-primary" @click="Export()">Export</button>
                </div>

                <h5 class="card-title my-2">Test Cases</h5>
            </div>
            
            <div class="card-body">
                <div class="card mb-3">
                    <div class="card-header">
                        <h5 class="card-title my-2"> Testing </h5>
                    </div>

                    <div class="card-body form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Generator Interface</label>
                            <div class="col-sm-8">
                                <interface-input v-model="generator_interface" :running_only="true"></interface-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Analyzer Interface</label>
                            <div class="col-sm-8">
                                <interface-input v-model="analyzer_interface" :running_only="true"></interface-input>
                            </div>
                        </div>
                    </div>
                </div>

                <ul class="list-group mb-3" v-if="Object.keys(test_cases).length > 0">
                    <li class="list-group-item" v-for="(test_case, index) in test_cases">
                        <div class="float-right">
                            <button
                                class="btn btn-success btn-sm"
                                v-if="!test.running"
                                :disabled="!can_start"
                                @click="can_start && Start(index)"
                                :title="can_start ? '' : 'Select interfaces...'"
                            >RUN</button>
                            <button class="btn btn-primary btn-sm" @click="Edit(index)">Edit</button>
                            <button class="btn btn-danger btn-sm" @click="Remove(index)">Remove</button>
                        </div>
                        <div>
                            <strong>{{ test_case.name }}</strong><br><small>{{ test_case.description }}</small>
                        </div>
                    </li>
                </ul>

                <div class="text-center">
                    <button class="btn btn-outline-info m-2" @click="Edit(true)">+ Create Test Case</button>
                </div>
            </div>
            
            <modal v-if="results" @close="Close()">
                <ul class="list-group mb-0 w-100" slot="header">
                    <li class="list-group-item">
                        <div class="float-right">
                            <button
                                class="btn btn-success"
                                v-if="!test.running"
                                :disabled="!can_start"
                                @click="can_start && Start(test_case_id)"
                                :title="can_start ? '' : 'Select interfaces...'"
                            >Repeat</button>
                            <button class="btn btn-danger" v-else @click="Stop()">Stop</button>
                        </div>
                        <div>
                            <strong>{{ test_cases[test_case_id].name }}</strong><br><small>{{ test_cases[test_case_id].description }}</small>
                        </div>
                    </li>
                </ul>
                
                <div slot="body" class="alert alert-danger" v-if="test.error">
                    {{ test.message }}
                </div>
                <div v-else slot="body" class="form-horizontal">
                    <h5> Status: <span
                        :class="{
                            'text-light': test.status == status.Idle,
                            'text-info': test.status == status.Running,
                            'text-success': test.status == status.Success,
                            'text-danger': test.status == status.Error,
                            'text-warning': test.status == status.Timeout,
                            'text-light': test.status == status.Canceled
                        }"
                    > {{test_status}} </span></h5>

                    <div class="progress mb-3">
                        <div class="progress-bar progress-bar-striped" style="width:0;" :style="'animation: progress_animate '+test.time_out+'s ease-in-out forwards;'"></div>
                    </div>
                    
                    <pre v-auto-scroll style="width:100%;height:50vh;overflow:auto;" ref="logs"><span v-for="log in test.log">{{ log }}\n</span></pre>
                </div>
            </modal>

            <import_modal
                :opened="import_modal"
                @closed="import_modal = false"
            />

            <testcases_modal
                :opened="edit_modal"
                @closed="edit_modal = false"
            />
        </div>
    `,
    computed: {
        can_start() {
            return this.generator_interface && this.analyzer_interface;
        },
        test() {
            return this.$store.state.analyzer.test;
        },
        test_status() {
            if (this.test.status == this.status.Idle)
                return 'Idle'
            if (this.test.status == this.status.Running)
                return 'Running'
            if (this.test.status == this.status.Success)
                return 'Success'
            if (this.test.status == this.status.Error)
                return 'Error'
            if (this.test.status == this.status.Timeout)
                return 'Timeout'
            if (this.test.status == this.status.Cancel)
                return 'Cancel'
        },
        test_cases() {
            return this.$store.state.test_cases;
        },
        status() {
            return this.$store.state.analyzer.test_status;
        }
    },
    data: () => {
        return {
            results: false,
            generator_interface: null,
            analyzer_interface: null,
            test_case_id: null,

            import_modal: false,
            edit_modal: false,
        }
    },
    methods: {
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
            this.edit_modal = index;
        },
        Remove(index) {
            this.$store.dispatch('ANALYZER_STORAGE_REMOVE', index)
        },
        Close() {
            this.results = false;
            this.Stop();
            this.$store.commit('ANALYZER_TEST_CASE_CLEAR');
        },
        Start(index) {
            this.results = true;

            // start
            this.$store.commit('ANALYZER_TEST_CASE_CLEAR');
            this.$store.dispatch('WEBSOCKETS_EMIT', {
                key: 'test_case',
                action: 'start',
                analyzer_interface: this.analyzer_interface,
                generator_interface: this.generator_interface,
                test_case_id: (this.test_case_id = index)
            });
        },
        Stop() {
            // stop
            this.$store.dispatch('WEBSOCKETS_EMIT', {
                key: 'test_case',
                action: 'stop'
            });
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
                    error: false,
                    data: {}
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
                                <input type="file" class="form-control" ref="file" @change="HandleFile()" />
                            </div>
                        </div>

                        <div class="alert alert-danger" v-if="error">{{ error }}</div>
                    </div>
                    <div slot="footer">
                        <button v-on:click="Action()" class="btn btn-success">Import data</button>
                        <button v-on:click="Close()" class="btn btn-secondary">Cancel</button>
                    </div>
                </modal>
            `,
            methods: {
                HandleFile() {
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
                    this.visible = true;
                    this.error = false;
                    this.data = "";
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
        }
    }
})
