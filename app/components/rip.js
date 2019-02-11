Vue.component('rip', {
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <div class="float-right">
                    <button v-bind:class="{'disabled': !running}" class="btn btn-warning" v-on:click="running && (interfaces_modal = true)">Interfaces</button>
                    <button v-bind:class="{'disabled': !running}" class="btn btn-info" v-on:click="running && (timers_modal = true)">Timers</button>
                    <button v-bind:class="{'disabled': !running, 'btn-outline-success': !timelapse_enabled, 'btn-success': timelapse_enabled }" class="btn" v-on:click="running && timelapse_toggle()">Stats</button>
                </div>

                <h5 class="card-title mb-0 mt-2">RIP</h5>
            </div>
            
            <table class="table mb-0">
                <thead>
                    <tr>
                        <th scope="col" width="1%"></th>
                        <th scope="col">Network</th>
                        <!--<th scope="col">Mask</th>-->
                        <th scope="col">Next Hop</th>
                        <th scope="col" width="1%">Since Last Update</th>
                        <th scope="col" width="1%">Metric</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="(row, id) in entries">
                        <tr
                            @click="!timelapse_enabled || (timelapse_selected = (timelapse_selected == id ? false : id))"
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
                            <td>{{ row.since_last_update }}</td>
                            <td class="text-center">{{ row.metric }}</td>
                        </tr>
                        <tr v-if="timelapse_enabled && timelapse_selected == id">
                            <td colspan="6">
                                <table class="table text-center">
                                    <tr>
                                        <th>metric</th>
                                        <th>never_updated</th>
                                        <th>possibly_down</th>
                                        <th>in_hold</th>
                                        <th>sync_with_rt</th>
                                        <th>can_be_updated</th>
                                        <th>timers_enabled</th>
                                        <th>since_last_update</th>
                                    </tr>
                                    <tr v-for="stat in timelapse_order(id)">
                                        <td :class="stat[0] != 16 ? 'table-success' : 'table-danger'">{{ stat[0] }}</td> <!--metric-->
                            
                                        <td :class="stat[1] ? 'table-success' : 'table-danger'">{{ stat[1] }}</td> <!--never_updated-->
                                        <td :class="stat[2] ? 'table-success' : 'table-danger'">{{ stat[2] }}</td> <!--possibly_down-->
                                        <td :class="stat[3] ? 'table-success' : 'table-danger'">{{ stat[3] }}</td> <!--in_hold-->
                            
                                        <td :class="stat[4] ? 'table-success' : 'table-danger'">{{ stat[4] }}</td> <!--sync_with_rt-->
                                        <td :class="stat[5] ? 'table-success' : 'table-danger'">{{ stat[5] }}</td> <!--can_be_updated-->
                                        <td :class="stat[6] ? 'table-success' : 'table-danger'">{{ stat[6] }}</td> <!--timers_enabled-->
                                        <td :class="{
                                            'table-success': stat[7] == 0,
                                            //'table-info': stat[7] < timers.update_timer,
                                            //'table-info': stat[7] < timers.update_timer
                                        }">{{ stat[7] }}</td> <!--since_last_update-->
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
            
            <timers_modal
                :opened="timers_modal"
                @closed="timers_modal = false"
            ></timers_modal>

            <interfaces_modal
                :opened="interfaces_modal"
                @closed="interfaces_modal = false"
            ></interfaces_modal>
        </div>
    `,
    data: () => {
        return {
            timers_modal: false,
            interfaces_modal: false,
            
            timelapse: {},
            timelapse_iteration: 0,
            timelapse_limit: 10,
            timelapse_enabled: false,
            timelapse_selected: false
        }
    },
    watch: {
        entries(entries) {
            if(!this.timelapse_enabled) return;

            for (const id in entries) {
                if (entries.hasOwnProperty(id)) {
                    const entry = entries[id];
                    
                    if (!this.timelapse.hasOwnProperty(id)) {
                        this.$set(this.timelapse, id, {});
                    }
                    
                    this.$set(this.timelapse[id], this.timelapse_index, [
                        entry.metric,
            
                        entry.never_updated,
                        entry.possibly_down,
                        entry.in_hold,
            
                        entry.sync_with_rt,
                        entry.can_be_updated,
                        entry.timers_enabled,
                        entry.since_last_update,
                    ]);
                }
            }

            this.timelapse_iteration++;
            console.log(this.timelapse);
        },
    },
    methods: {
        timelapse_toggle(){
            this.timelapse_enabled = !this.timelapse_enabled

            if(!this.timelapse_enabled){
                this.timelapse = {};
                this.timelapse_selected = false;
            }
        },
        timelapse_order(id) {
            var results = [];
            for (let index = this.timelapse_index + this.timelapse_limit - 1; index >= this.timelapse_index; index--) {
                if(id in this.timelapse && index % this.timelapse_limit in this.timelapse[id]) {
                    results.push(this.timelapse[id][index % this.timelapse_limit]);
                }
            }
            return results;
        },
    },
    computed: {
        timelapse_index() {
            return this.timelapse_iteration % this.timelapse_limit;
        },
        entries() {
            return this.$store.state.rip.table;
        },
        timers() {
            return this.$store.state.rip.timers;
        },
        running() {
            return this.$store.state.running;
        }
    },
    components: {
        'timers_modal': {
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

                timers: {}
            }),
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-3"> RIP Timers </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Update Timer <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.update_timer">
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Invalid Timer <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.invalid_timer">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Hold Timer <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.hold_timer">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Flush Timer <small>(s)</small></label>
                            <div class="col-sm-8">
                                <input type="text" class="form-control" v-model="timers.flush_timer">
                            </div>
                        </div>
                    </div>
                    <div slot="footer">
                        <button v-on:click="Action()" class="btn btn-success"> Save Changes </button>
                        <button v-on:click="Close()" class="btn btn-secondary">Cancel</button>
                    </div>
                </modal>
            `,
            methods: {
                Open(){
                    this.timers = {
                        ...this.$store.state.rip.timers
                    }
                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.$store.dispatch('RIP_TIMERS', this.timers).then(() => {
                        this.Close();
                    })
                }
            }
        },
        'interfaces_modal': {
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
                visible: false
            }),
            computed: {
                interfaces() {
                    return this.$store.state.rip.interfaces;
                }
            },
            template: `
                <modal v-if="visible" v-on:close="Close()">
                    <div slot="header">
                        <h1 class="mb-3"> RIP Interfaces </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <table class="table">
                            <tr v-for="(iface, id) in interfaces">
                                <td width="1%"><interface-show :id="id"></interface-show></td>
                                <td class="text-center">
                                    <span v-if="iface.running" class="text-success">Running</span>
                                    <span v-else class="text-danger">Not Running</span>
                                </td>
                                <td class="text-center">
                                    <span v-if="iface.active" class="text-success">Active</span>
                                    <span v-else class="text-danger">Not Active</span>
                                </td>
                                <td width="1%">
                                    <button
                                        v-if="!iface.active"
                                        v-on:click="Toggle(id)"
                                        class="btn btn-info"
                                    > Add </button>
                                    <button
                                        v-else
                                        v-on:click="Toggle(id)"
                                        class="btn btn-danger"
                                    > Remove </button>
                                </td>
                            </tr>

                        </table>
                    </div>
                </modal>
            `,
            methods: {
                Open(){
                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Toggle(id){
                    this.$store.dispatch('RIP_INTERFACE_TOGGLE', id);
                }
            }
        }
    }
})
