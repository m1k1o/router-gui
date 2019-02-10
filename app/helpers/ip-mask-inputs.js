Vue.component('ip-address-input', {
    props: ['value'],
    template: `
        <input
            class="form-control"
            v-bind:value="value"
            v-on:input="$emit('input', $event.target.value)"
        >
    `
})

Vue.component('ip-mask-input', {
    props: ['value'],
    template: `
        <input
            class="form-control"
            v-bind:value="value"
            v-on:input="$emit('input', $event.target.value)"
            placeholder="255.255.255.255"
        >
    `
})
