Vue.component('routing', {
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title mb-0">Routing Table</h5>
            </div>
            
            <table class="table mb-0">
                <thead>
                    <tr>
                        <th scope="col">Type</th>
                        <th scope="col">Network</th>
                        <!--<th scope="col">Mask</th>-->
                        <th scope="col">Next Hop</th>
                        <th scope="col">Interface</th>
                        <th scope="col" style="width: 1%;">
                            <button class="btn btn-outline-success btn-sm btn-block" type="button" v-on:click="running && (add_static = true)" v-bind:class="{'disabled': !running}">+ Add Static</button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(row, id) in entries">
                        <td>{{ row.type }}</td>
                        <td>{{ row.network }}</td>
                        <!--<td>{{ row.ip }}</td>
                        <td>{{ row.mask }}</td>-->
                        <td>{{ row.next_hop }}</td>
                        <td><interface-show :id="row.interface"></interface-show></td>
                        <td>
                            <button v-if="row.type =='Static'" class="btn btn-danger btn-sm btn-block" type="button" v-on:click="RemoveRoute(id)">Remove</button>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <add_static_modal
                :opened="add_static"
                @closed="add_static = false"
            ></add_static_modal>

        </div>
    `,
    data: () => {
        return {
            add_static: false
        }
    },
    computed: {
        entries() {
            return this.$store.state.routing.table;
        },
        running() {
            return this.$store.state.running;
        }
    },
    methods: {
        RemoveRoute(id){
            this.$store.dispatch('ROUTING_STATIC_REMOVE', id);
        }
    },
    components: {
        'add_static_modal': {
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

                data: {
                    ip: null,
                    mask: null,
                    next_hop_ip: null,
                    interface: null
                }
            }),
            template: `
                <modal v-if="visible" v-on:close="Close()" v-cloak>
                    <div slot="header">
                        <h1 class="mb-3"> Add Static Route </h1>
                    </div>
                    <div slot="body" class="form-horizontal">
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">IP Address</label>
                            <div class="col-sm-8">
                                <ip-address-input v-model="data.ip"></ip-address-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Mask</label>
                            <div class="col-sm-8">
                                <ip-mask-input v-model="data.mask"></ip-mask-input>
                            </div>
                        </div>
                        <hr>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Next Hop IP</label>
                            <div class="col-sm-8">
                                <ip-address-input v-model="data.next_hop_ip"></ip-address-input>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-sm-4 col-form-label">Interface</label>
                            <div class="col-sm-8">
                                <interface-input v-model="data.interface"></interface-input>
                            </div>
                        </div>
                    </div>
                    <div slot="footer">
                        <button v-on:click="Action()" class="btn btn-success">Add route</button>
                        <button v-on:click="Close()" class="btn btn-secondary">Cancel</button>
                    </div>
                </modal>
            `,
            methods: {
                Open(){
                    this.data.ip =  null;
                    this.data.mask =  null;
                    this.data.next_hop_ip =  null;
                    this.data.interface =  null;

                    this.visible = true;
                },
                Close(){
                    this.visible = false;
                    this.$emit("closed");
                },
                Action(){
                    this.$store.dispatch('ROUTING_STATIC_ADD', this.data).then(() => {
                        this.Close();
                    })
                }
            }
        }
    }
})
