// register modal component
Vue.component('modal', {
    template: `
        <transition name="modal" @keydown.esc="$emit('close')">
            <div class="modal-mask">
                <div class="modal-wrapper" v-on:click.self="$emit('close')">
                    <div class="modal-container">
                        <button type="button" class="close" v-on:click="$emit('close')">
                            <span aria-hidden="true">&times;</span>
                        </button>

                        <div class="modal-header">
                            <slot name="header">
                                default header
                            </slot>
                        </div>

                        <div class="modal-body">
                            <slot name="body">
                                default body
                            </slot>
                        </div>

                        <div class="modal-footer">
                            <slot name="footer">
                                <button class="btn btn-secondary" @click="$emit('close')">Close</button>
                            </slot>
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    <!--
        <transition name="modal" @keydown.esc="$emit('close')">
            <div>
                <div class="modal fade show" style="display:block;" v-on:click.self="$emit('close')">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <slot name="header">
                                    <h5 class="modal-title">Modal title</h5>
                                </slot>
                                <button type="button" class="close" v-on:click.self="$emit('close')">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <slot name="body">
                                    default body
                                </slot>
                            </div>
                            <div class="modal-footer">
                                <slot name="footer">
                                    <button class="btn btn-secondary" @click="$emit('close')">Close</button>
                                </slot>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-backdrop fade show"></div>
            </div>
        </transition>
    -->
    `,
    mounted() {
        window.addEventListener('keydown', (event) => {
            // If  ESC key was pressed...
            if (event.keyCode === 27) {
                // try close your dialog
                this.$emit('close');
            }
        });
    }
})
