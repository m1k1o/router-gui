Vue.component('scenarios', {
    template: `
        <div class="card mb-3">
            <div class="card-header">
                <div class="float-right">
                    <button class="btn btn-primary" @click="import_modal = true">Import</button>
                    <button class="btn btn-primary" @click="Export()">Export All</button>
                </div>

                <h5 class="card-title my-2">Scenarios</h5>
            </div>
            
            <div class="card-body">
                <ul class="list-group mb-3" v-if="Object.keys(scenarios).length > 0">
                    <li class="list-group-item" v-for="(scenario, index) in scenarios">
                        <div class="float-right">
                            <button class="btn btn-primary btn-sm" @click="Edit(index)">Edit</button>
                            <button class="btn btn-danger btn-sm" @click="Remove(index)">Remove</button>
                        </div>
                        <div>
                            <strong>{{ scenario.name }}</strong><br><small>{{ scenario.description }}</small>
                        </div>
                    </li>
                </ul>

                <div class="text-center">
                    <button class="btn btn-outline-info m-2" @click="Edit(true)">+ New Scenario</button>
                </div>
            </div>

            <scenario_import_modal
                :opened="import_modal"
                @closed="import_modal = false"
            />

        </div>
    `,
    data: () => {
        return {
            import_modal: false,
            scenario_edit: false
        }
    },
    computed: {
        scenarios() {
            /* TODO */
            return this.$store.state.test_cases;
        }
    },
    methods: {
        Export() {
            /* TODO */
            return ajax("Analyzer", "ExportScenarios").then(data => {
                this.DownloadObjectAsJson(data, "scenarios")
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
            //this.scenario_edit = index;
        },
        Remove(index) {
            /* TODO */
            this.$store.dispatch('ANALYZER_STORAGE_REMOVE', index)
        }
    },
    components: {
        'scenario_import_modal': {
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
                error: false,
                data: {}
            }),
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-0"> Import Scenario </h1>
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

                        <div class="alert alert-danger" v-if="error">{{error}}</div>
                    </div>
                    <div slot="footer">
                        <button v-on:click="Action()" class="btn btn-success">Import</button>
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
