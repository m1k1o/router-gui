const store = new Vuex.Store({
    state: {
        running: false,

        interfaces: {
            table: {},

            services: {}
        },
        arp: {
            table: {},

            proxy: {
                enabled: false
            },
            timers: {
                cache_timeout: null,
                request_timeout: null,
                request_interval: null
            }
        },
        routing: {
            table: {},
        },
        rip: {
            table: {},

            interfaces: {},
            timers: {
                update: null,
                invalid: null,
                hold: null,
                flush: null,
            }
        },
        lldp: {
            table: {},

            settings: {},
        },
        sniffing: {
            data: [],

            interface: null
        },
        dhcp: {
            table: {},

            timers: {
                lease_timeout: null,
                offer_timeout: null,
                renewal_timeout: null,
                rebinding_timeout: null,
            },

            pools: {}
        }
    },
    mutations: {
        UPDATE_TABLES(state, tables) {
            for (const key in tables) {
                if (tables.hasOwnProperty(key)) {
                    state[key].table = tables[key];
                }
            }
        },
        INITIALIZE(state, data) {
            Object.assign(state, data);
            state.running = true;
        },
        STOP(state) {
            state.running = false;
        },

        INTERFACE_EDIT(state, interface) {
            for (const key in interface) {
                if (interface.hasOwnProperty(key) && state.interfaces.table[interface.id].hasOwnProperty(key) && state.interfaces.table[interface.id][key] != interface[key]) {
                    Vue.set(state.interfaces.table[interface.id], key, interface[key]);
                }
            }
        },
        SERVICE_TOGGLE(state, input) {
            Vue.set(state.interfaces.table[input.interface].services, input.service, input.status);
        },

        ARP_FLUSH(state) {
            Vue.set(state.arp, 'table', {});
        },
        ARP_TIMERS(state, timers) {
            for (const key in timers) {
                if (timers.hasOwnProperty(key) && state.arp.timers.hasOwnProperty(key) && state.arp.timers[key] != timers[key]) {
                    Vue.set(state.arp.timers, key, timers[key]);
                }
            }
        },
        ARP_PROXY(state, proxy) {
            for (const key in proxy) {
                if (proxy.hasOwnProperty(key) && state.arp.proxy.hasOwnProperty(key) && state.arp.proxy[key] != proxy[key]) {
                    Vue.set(state.arp.proxy, key, proxy[key]);
                }
            }
        },
        
        RIP_TIMERS(state, timers) {
            for (const key in timers) {
                if (timers.hasOwnProperty(key) && state.rip.timers.hasOwnProperty(key)) {
                    Vue.set(state.rip.timers, key, timers[key]);
                }
            }
        },

        ROUTING_ENTRY_ADD(state, entries) {
            for (const id in entries) {
                if (entries.hasOwnProperty(id)) {
                    Vue.set(state.routing.table, id, entries[id]);
                }
            }
        },
        ROUTING_ENTRY_REMOVE(state, id) {
            Vue.delete(state.routing.table, id);
        },
        
        LLDP_SETTINGS(state, settings) {
            for (const key in settings) {
                if (settings.hasOwnProperty(key) && state.lldp.settings.hasOwnProperty(key)) {
                    Vue.set(state.lldp.settings, key, settings[key]);
                }
            }
        },
        
        SNIFFING_PUSH(state, new_entries) {
            state.sniffing.data.push(...new_entries)
        },
        SNIFFING_CLEAR(state) {
            Vue.set(state.sniffing, 'data', []);
        },
        SNIFFING_INTERFACE(state, interface) {
            Vue.set(state.sniffing, 'interface', interface);
        },
        
        DHCP_TIMERS(state, timers) {
            for (const key in timers) {
                if (timers.hasOwnProperty(key) && state.dhcp.timers.hasOwnProperty(key)) {
                    Vue.set(state.dhcp.timers, key, timers[key]);
                }
            }
        },
        DHCP_ENTRY_ADD(state, entries) {
            for (const id in entries) {
                if (entries.hasOwnProperty(id)) {
                    Vue.set(state.dhcp.table, id, entries[id]);
                }
            }
        },
        DHCP_ENTRY_REMOVE(state, id) {
            Vue.delete(state.dhcp.table, id);
        },
        
        DHCP_POOL_ADD(state, entries) {
            for (const id in entries) {
                if (entries.hasOwnProperty(id)) {
                    Vue.set(state.dhcp.pools, id, entries[id]);
                }
            }
        },
        DHCP_POOL_TOGGLE(state, { interface, is_dynamic }) {
            state.dhcp.pools[interface].is_dynamic = is_dynamic;
        },
        DHCP_POOL_REMOVE(state, id) {
            Vue.delete(state.dhcp.pools, id);
        }
    },
    getters: {
        
    },
    actions: {
        UPDATE({commit}) {
            return ajax("Global", "UpdateTables")
            .then(({ sniffing, ...tables }) => {
                commit('SNIFFING_PUSH', sniffing)
                commit('UPDATE_TABLES', tables)
            });
        },
        INITIALIZE({commit}) {
            return ajax("Global", "Initialize")
            .then((data) => commit('INITIALIZE', data));
        },

        INTERFACE_EDIT({commit}, { id, ip, mask }) {
            return ajax("Interfaces", "Edit", { id, ip, mask }).then((response) => {
                commit('INTERFACE_EDIT', response);
            });
        },
        INTERFACE_TOGGLE({commit}, id) {
            return ajax("Interfaces", "Toggle", { id }).then((response) => {
                commit('INTERFACE_EDIT', response);
            });
        },
        SERVICE_TOGGLE({commit}, { interface, service }) {
            return ajax("Interfaces", "ToggleService", { interface, service }).then((response) => {
                commit('SERVICE_TOGGLE', response);
            });
        },
        
        ARP_FLUSH({commit}) {
            return ajax("ARP", "Table", { flush: true }).then((table) => {
                commit('ARP_FLUSH');
            });
        },
        ARP_TIMERS({commit}, { cache_timeout, request_timeout, request_interval }) {
            return ajax("ARP", "Timers", { cache_timeout, request_timeout, request_interval }).then((timers) => {
                commit('ARP_TIMERS', timers);
            });
        },
        ARP_PROXY({commit}, { enabled }) {
            return ajax("ARP", "Proxy", { enabled }).then((proxy) => {
                commit('ARP_PROXY', proxy);
            });
        },

        RIP_TIMERS({commit}, { update_timer, invalid_timer, hold_timer, flush_timer }) {
            return ajax("RIP", "Timers", { update_timer, invalid_timer, hold_timer, flush_timer }).then((timers) => {
                commit('RIP_TIMERS', timers);
            });
        },

        ROUTING_STATIC_ADD({commit}, { ip, mask, next_hop_ip, interface }) {
            return ajax("Routing", "AddStatic", { ip, mask, next_hop_ip, interface }).then((entry) => {
                commit('ROUTING_ENTRY_ADD', entry);
            });
        },
        ROUTING_STATIC_REMOVE({state, commit}, id) {
            return ajax("Routing", "RemoveStatic", {
                ip: state.routing.table[id].ip,
                mask: state.routing.table[id].mask
            }).then(() => {
                commit('ROUTING_ENTRY_REMOVE', id);
            });
        },

        LLDP_SETTINGS({commit}, { adv_interval, time_to_live, system_name, system_description }) {
            return ajax("LLDP", "Settings", { adv_interval, time_to_live, system_name, system_description }).then((response) => {
                commit('LLDP_SETTINGS', response);
            });
        },
        
        SNIFFING_INTERFACE({commit}, id) {
            return ajax("Sniffing", "Interface", { id }).then(({ id }) => {
                commit('SNIFFING_INTERFACE', id);
            });
        },
        
        DHCP_TIMERS({commit}, { lease_timeout, offer_timeout, renewal_timeout, rebinding_timeout }) {
            return ajax("DHCP", "Timers", { lease_timeout, offer_timeout, renewal_timeout, rebinding_timeout }).then((timers) => {
                commit('DHCP_TIMERS', timers);
            });
        },
        DHCP_STATIC_ADD({commit}, { mac, interface, ip }) {
            return ajax("DHCP", "AddStatic", { mac, interface, ip }).then((entry) => {
                commit('DHCP_ENTRY_ADD', entry);
            });
        },
        DHCP_STATIC_REMOVE({state, commit}, id) {
            return ajax("DHCP", "RemoveStatic", {
                mac: state.dhcp.table[id].mac,
                interface: state.dhcp.table[id].interface
            }).then(() => {
                commit('DHCP_ENTRY_REMOVE', id);
            });
        },

        DHCP_POOL_ADD({commit}, { interface, first_ip, last_ip, is_dynamic }) {
            return ajax("DHCP", "PoolAdd", { interface, first_ip, last_ip, is_dynamic }).then((entry) => {
                commit('DHCP_POOL_ADD', entry);
            });
        },
        DHCP_POOL_TOGGLE({commit}, interface) {
            return ajax("DHCP", "PoolToggle", { interface }).then(({ is_dynamic }) => {
                commit('DHCP_POOL_TOGGLE', { interface, is_dynamic });
            });
        },
        DHCP_POOL_REMOVE({commit}, interface) {
            return ajax("DHCP", "PoolRemove", { interface }).then(() => {
                commit('DHCP_POOL_REMOVE', interface);
            });
        }

    }
})
