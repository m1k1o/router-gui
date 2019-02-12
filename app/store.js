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
        }
    },
    getters: {
        
    },
    actions: {
        UPDATE({commit}) {
            return ajax("Global", "UpdateTables")
            .then((tables) => commit('UPDATE_TABLES', tables));
        },
        INITIALIZE({commit}) {
            return ajax("Global", "Initialize")
            .then((data) => commit('INITIALIZE', data));
        },

        INTERFACE_EDIT({commit}, input) {
            return ajax("Interfaces", "Edit", [
                input.id,
                input.ip,
                input.mask
            ]).then((interface) => {
                commit('INTERFACE_EDIT', { id: input.id, ...interface });
            });
        },
        INTERFACE_TOGGLE({commit}, id) {
            return ajax("Interfaces", "Toggle", id).then((interface) => {
                commit('INTERFACE_EDIT', { id, ...interface });
            });
        },
        SERVICE_TOGGLE({commit}, input) {
            return ajax("Interfaces", "ToggleService", [
                input.interface,
                input.service
            ]).then((response) => {
                commit('SERVICE_TOGGLE', response);
            });
        },
        
        ARP_TIMERS({commit}, input) {
            return ajax("ARP", "Timers", [
                input.cache_timeout,
                input.request_timeout,
                input.request_interval
            ]).then((timers) => {
                commit('ARP_TIMERS', timers);
            });
        },
        ARP_PROXY({commit}, input) {
            return ajax("ARP", "Proxy", [
                input.enabled.toString(),
            ]).then((proxy) => {
                commit('ARP_PROXY', proxy);
            });
        },

        RIP_TIMERS({commit}, input) {
            return ajax("RIP", "Timers", [
                input.update_timer,
                input.invalid_timer,
                input.hold_timer,
                input.flush_timer
            ]).then((timers) => {
                commit('RIP_TIMERS', timers);
            });
        },

        ROUTING_STATIC_ADD({commit}, input) {
            return ajax("Routing", "AddStatic", [
                input.ip,
                input.mask,
                input.next_hop_ip,
                input.interface
            ]).then((entry) => {
                commit('ROUTING_ENTRY_ADD', entry);
            });
        },
        ROUTING_STATIC_REMOVE({state, commit}, id) {
            return ajax("Routing", "RemoveStatic", [
                state.routing.table[id].ip,
                state.routing.table[id].mask
            ]).then(() => {
                commit('ROUTING_ENTRY_REMOVE', id);
            });
        },

        LLDP_SETTINGS({commit}, input) {
            return ajax("LLDP", "Settings", [
                input.time_to_live,
                input.system_name,
                input.system_description,
            ]).then((response) => {
                commit('LLDP_SETTINGS', response);
            });
        }
    }
})
