Vue.component('rip', {
    props: ['rip', 'fetch_data', 'table'],
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <div class="float-right">
                <button class="btn btn-warning" v-on:click="interfaces = true;">Interfaces</button>
                    <button class="btn btn-success" v-on:click="timers = true;">Timers</button>
                </div>

                <h5 class="card-title mb-0 mt-2">RIP</h5>
            </div>
            
            <table class="table mb-0">
                <thead>
                    <tr>
                        <th scope="col">Interface</th>
                        <th scope="col">Network</th>
                        <!--<th scope="col">Mask</th>-->
                        <th scope="col">Next Hop</th>
                        <th scope="col">Metric</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="(row, id) in entries"
                        v-bind:class="{
                            'table-secondary': !row.timers_enabled,
                            'table-warning': row.in_hold,
                            'table-danger': !row.in_hold && row.possibly_down
                        }"
                        v-bind:title="!row.timers_enabled ? 'Timers Disabled' : (
                            row.in_hold ? 'In Holddown' : (
                                row.possibly_down ? 'Possibly Down' : 'Active'
                            )
                        )">
                        <td><interface-show :id="row.interface"></interface-show></td>
                        <td>{{ row.network }}</td>
                        <!--<td>{{ row.ip }}</td>
                        <td>{{ row.mask }}</td>-->
                        <td>{{ row.next_hop }}</td>
                        <td>{{ row.metric }}</td>
                    </tr>
                </tbody>
            </table>
            
            <timers_modal
                :opened="timers"
                @closed="timers = false"
            ></timers_modal>

            <interfaces_modal
                :opened="interfaces"
                @closed="interfaces = false"
            ></interfaces_modal>
        </div>
    `,
    data: () => {
        return {
            entries: {},

            timers: false,
            interfaces: false
        }
    },
    methods: {
        /*
        UnsolicitedUpdates(active){
            ajax("RIP", "Updates", active ? "start" : "stop").then(({ active }) => {
                
            }, () => {})
        },
        */
        Update(){
            ajax("RIP", "Table").then((response) => {
                this.entries = response;
            }, () => {})
        },
        Initialize(){
            this.Update();
        }
    },
    watch: { 
        table: function(newVal, oldVal) {
            this.entries = newVal;
        }
    },
    mounted() {
        if(this.fetch_data) {
            this.Initialize();
            setInterval(() => this.Update(), 1000)
        }
    },
    components: {
        'timers_modal': {
            props: ['opened'],
            data: () => ({
                data: false
            }),
            template: `
                <modal v-if="data" v-on:close="Close()" v-cloak>
                    <div slot="header">
                        <h1 class="mb-3"> RIP Timers </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Update Timer <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="data.update_timer">
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Invalid Timer <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="data.invalid_timer">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Hold Timer <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="data.hold_timer">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Flush Timer <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="data.flush_timer">
                            </div>
                        </div>
                    </div>
                    <div slot="footer">
                        <button v-on:click="Action()" class="btn btn-success"> Save Changes </button>
                        <button v-on:click="Close()" class="btn btn-secondary">Cancel</button>
                    </div>
                </modal>
            `,
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
            methods: {
                Open(){
                    ajax("RIP", "Timers").then((response) => {
                        this.$set(this, 'data', response);
                    }, () => {
                        this.Close();
                    })
                },
                Close(){
                    this.data = false;
                    this.$emit("closed");
                },
                Action(){
                    ajax("RIP", "Timers", Object.values(this.data).join('\n')).then((response) => {
                        this.data = response;
                        this.Close();
                    }, () => {});
                }
            }
        },
        'interfaces_modal': {
            props: ['opened'],
            data: () => ({
                data: false
            }),
            template: `
                <modal v-if="data" v-on:close="Close()" v-cloak>
                    <div slot="header">
                        <h1 class="mb-3"> RIP Interfaces </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <table class="table">
                            <tr v-for="(iface, id) in data">
                                <td width="1%"><interface-show :id="id"></interface-show></td>
                                <td>
                                    <span v-if="iface.running" class="text-success">Running</span>
                                    <span v-else class="text-danger">Not Running</span>
                                </td>
                                <td>
                                    <span v-if="iface.active" class="text-success">Active</span>
                                    <span v-else class="text-danger">Not Active</span>
                                </td>
                                <td width="1%">
                                    <button
                                        v-if="!iface.active"
                                        v-on:click="Add(id)"
                                        class="btn btn-info"
                                    > Add </button>
                                    <button
                                        v-else
                                        v-on:click="Remove(id)"
                                        class="btn btn-danger"
                                    > Remove </button>
                                </td>
                            </tr>

                        </table>
                    </div>
                </modal>
            `,
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
            methods: {
                Open(){
                    ajax("RIP", "Interfaces").then((response) => {
                        this.$set(this, 'data', response);
                    }, () => {
                        this.Close();
                    })
                },
                Close(){
                    this.data = false;
                    this.$emit("closed");
                },

                Add(id){
                    ajax("RIP", "AddInterface", id).then((iface) => {
                        this.data[id] = iface;
                    });
                },
                Remove(id){
                    ajax("RIP", "RemoveInterface", id).then((iface) => {
                        this.data[id] = iface;
                    });
                }
            }
        }
    }
})
