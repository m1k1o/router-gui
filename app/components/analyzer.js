Vue.component('analyzer', {
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title">Analyzer</h5>
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
                <div class="form-group row">
                    <label class="col-sm-4 col-form-label">Test Case</label>
                    <div class="col-sm-8">
                        <select class="form-control" v-model="test_case">
                            <option value="DummyTest">DummyTest</option>
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-sm-4 col-form-label"></label>
                    <div class="col-sm-8">
                        <button class="btn btn-success" @click="Toggle()" v-if="!test_running">START</button>
                        <button class="btn btn-danger" @click="Toggle()" v-else>STOP</button>
                    </div>
                </div>

                <div class="progress mb-3" v-if="test_running">
                    <div class="progress-bar progress-bar-striped progress-bar-animated" style="width:0;" :style="'animation: progress_animate '+analyzer.time_out+'s ease-in-out forwards;'"></div>
                </div>
                
                <div class="alert alert-danger" v-if="analyzer.error">
                    {{ analyzer.message }}
                </div>

                <template v-else-if="started">
                    <h5>Status: {{ analyzer.status }}</h5>
                    <pre>{{ analyzer.log }}</pre>
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
            generator_interface: null,
            analyzer_interface: null,
            test_case: "DummyTest"
        }
    },
    computed: {
        running() {
            return this.$store.state.running;
        },
        test_running() {
            return this.$store.state.analyzer.running;
        },
        analyzer() {
            return this.$store.state.analyzer;
        }
    },
    methods: {
        Toggle() {
            this.started = true;

            if(!this.test_running) {
                // start
                this.$store.commit('ANALYZER_CLEAR');
                this.$store.dispatch('WEBSOCKETS_EMIT', {
                    key: 'analyzer',
                    action: 'start',
                    test_case: {
                        generator_interface: this.generator_interface,
                        analyzer_interface: this.analyzer_interface,
                        type: this.test_case
                    }
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
        
    }
})
