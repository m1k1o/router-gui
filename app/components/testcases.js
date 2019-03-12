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
                <ul class="list-group mb-3" v-if="Object.keys(test_cases).length > 0">
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
                    <button class="btn btn-outline-info m-2" @click="Edit(true)">+ Create Test Case</button>
                </div>
            </div>

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
    data: () => {
        return {
            import_modal: false,
            edit_modal: false,

            test_case: null
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
        }
    },
    computed: {
        test_cases() {
            return this.$store.state.test_cases;
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
        }
    }
})
