Vue.component('interface-input', {
    props: ['value'],
    template: `
        <input
            class="form-control"
            v-bind:value="value"
            v-on:input="$emit('input', $event.target.value)"
        >
    `
})

Vue.component('interface-show', {
    props: ['id'],
    template: `
        <span class="eth">
            <img src="images/eth.png">
            <span class="id"> {{ id || '-' }} </span>
        </span>
    `
})
