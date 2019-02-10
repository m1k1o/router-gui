Vue.component('interfaces', {
    props: ['running', 'fetch_data', 'table', 'services'],
    template: `
        <div class="card mb-3">
            <div class="card-body">
                <h5 class="card-title mb-0">Available Interfaces</h5>
            </div>

            <table class="table mb-0">
                <thead>
                    <tr>
                        <th scope="col" style="width: 1%;">ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">IP</th>
                        <th scope="col" style="width: 1%;"></th>
                        <th scope="col" style="width: 1%;"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(i, id) in interfaces" v-bind:class="{'table-success': i.running}">
                        <td><interface-show :id="id"></interface-show></td>
                        <td><span v-bind:title="i.description">{{ i.friendly_name }}</span><br><small v-bind:title="i.name">{{ i.mac }}</small></td>
                        <td>{{ i.ip }}<br><small>{{ i.mask }}</small></td>
                        <td>
                            <button class="btn btn-success mt-1" v-on:click="ModalOpen(id)">Edit</button>
                        </td>
                        <td>
                            <button v-if="!i.running" v-on:click="Start(id)" class="btn" v-bind:class="i.ip && i.mask ? 'btn-info' : 'btn-secondary disabled'"> Start </button>
                            <button v-else v-on:click="Stop(id)" class="btn btn-danger"> Stop </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <modal v-if="modal" v-on:close="ModalClose()" v-cloak>
                <div slot="header">
                    <h1 class="mb-3"> Edit Interface </h1>
                    <div class="">
                        <div class="float-left eth mr-3"><img src="images/eth.png"><span class="id">{{ modal.id }}</span></div>
                        <span v-bind:title="modal.description">{{ modal.friendly_name }}</span><br><small v-bind:title="modal.name">{{ modal.mac }}</small>
                    </div>
                </div>
                <div slot="body" class="form-horizontal">
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">
                            Status:&nbsp;<span v-if="modal.running" class="text-success">Running</span> <span v-else class="text-danger">Stopped</span></label>
                        <div class="btn-group col-sm-8">
                            <button
                                v-if="!modal.running"
                                v-on:click="Start(modal.id)"
                                v-bind:class="{'disabled': !interfaces[modal.id].ip || !interfaces[modal.id].mask}"
                                class="btn btn-success"
                            > Start </button>
                            <button v-else v-on:click="Stop(modal.id)" class="btn btn-danger"> Stop </button>
                        </div>
                    </div>
                    <hr>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">IP Address</label>
                        <div class="col-sm-8">
                            <ip-address-input v-model="modal.ip" v-bind:placeholder="interfaces[modal.id].ip"></ip-address-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label">Mask</label>
                        <div class="col-sm-8">
                            <ip-mask-input v-model="modal.mask" v-bind:placeholder="interfaces[modal.id].mask"></ip-mask-input>
                        </div>
                    </div>
                    <div class="form-group row">
                        <label class="col-sm-4 col-form-label"></label>
                        <div class="btn-group col-sm-8">
                            <button v-if="interfaces[modal.id].ip == modal.ip  && interfaces[modal.id].mask == modal.mask" class="btn btn-success disabled"> All changes saved </button>
                            <button v-else v-on:click="ModalAction()" class="btn btn-success"> Save Changes </button>
                        </div>
                    </div>
                    
                    <hr v-if="Object.keys(services).length > 0">
                    <div v-for="service in services" class="form-group row">
                        <label class="col-sm-4 col-form-label">
                            {{ service.name }}
                        </label>
                        <div class="col-sm-8">
                            <button
                                v-if="!service.running[modal.id]"
                                v-on:click="((service.must_be_runnig && modal.running) || !service.must_be_runnig) && service.start(modal.id)"
                                v-bind:class="{'disabled': !((service.must_be_runnig && modal.running) || !service.must_be_runnig) }"
                                class="btn btn-info"
                            > Start </button>
                            <button
                                v-else
                                v-on:click="((service.must_be_runnig && modal.running) || !service.must_be_runnig)  && service.stop(modal.id)"
                                class="btn btn-danger"
                            > Stop </button>

                            <span v-if="modal.id in service.running && service.running[modal.id]" class="text-success">Running</span>
                            <span v-else class="text-danger">Not Running</span>
                        </div>
                    </div>
                </div>
            </modal>

        </div>
    `,
    data: () => {
        return {
            interfaces: {},

            modal: false,
            editing: false
        }
    },
    methods: {
        ModalOpen(id){
            this.modal = { id, ...this.interfaces[id]};
        },
        ModalClose(){
            this.modal = false
        },
        ModalAction(){
            ajax("Interfaces", "Edit", [this.modal.id, this.modal.ip, this.modal.mask].join('\n')).then((interface) => {
                this.$set(this.interfaces, this.modal.id, interface);
                this.modal = { id: this.modal.id, ...interface };
            }, () => {});
        },

        Start(id){
            if(!this.interfaces[id].ip || !this.interfaces[id].mask){
                return;
            }

            ajax("Interfaces", "Start", id).then(({ running }) => {
                this.interfaces[id].running = running;

                if(this.modal && this.modal.id == id) {
                    this.modal.running = running;
                }
            });
        },
        Stop(id){
            ajax("Interfaces", "Stop", id).then(({ running }) => {
                this.interfaces[id].running = running;

                if(this.modal && this.modal.id == id) {
                    this.modal.running = running;
                }
            });
        },
        
        Update(id){
            ajax("Interfaces", "Get", id).then((response) => {
                this.$set(this.interfaces, this.modal.id, interface);
            }, () => {})
        },
        Initialize(){
            ajax("Interfaces", "Show").then((response) => {
                this.interfaces = response;
            }, () => {})
        }
    },
    watch: { 
        table: function(newVal, oldVal) {
            this.interfaces = newVal;
        }
    },
    mounted() {
        if(this.fetch_data) {
            this.Initialize();
        }
    }
})
