// register modal component
Vue.component('modal', {
    template: `
        <transition name="modal">
            <div class="modal-mask" v-cloak>
                <div class="modal-wrapper" @mousedown.self="Mousedown()" @mouseup.self="Mouseup()">
                    <div class="modal-container">
                        <button type="button" class="close" @click="$emit('close')">
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
    `,
    data: () => ({
        closing: false
    }),
    methods: {
        Mousedown() {
            this.closing = true;
        },
        Mouseup() {
            if(this.closing) {
                this.$emit('close')
                this.closing = false
            }
        },
        Keydown(event) {
            // If  ESC key was pressed...
            if (event.keyCode === 27) this.Mousedown()
        },
        Keyup(event) {
            // If  ESC key was pressed...
            if (event.keyCode === 27) this.Mouseup()
        }
    },
    mounted() {
        document.body.style.overflow = "hidden";

        window.addEventListener('keydown', this.Keydown);
        window.addEventListener('keyup', this.Keyup);
    },
    beforeDestroy() {
        document.body.style.overflow = "auto";

        window.removeEventListener('keydown', this.Keydown);
        window.removeEventListener('keyup', this.Keyup);
    }
})

/*
    <transition name="modal" @keydown.esc="$emit('close')">
        <div>
            <div class="modal fade show" style="display:block;" @click.self="$emit('close')">
                <div class="modal-dialog" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <slot name="header">
                                <h5 class="modal-title">Modal title</h5>
                            </slot>
                            <button type="button" class="close" @click="$emit('close')">
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
*/