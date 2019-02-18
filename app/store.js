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
        DHCP_POOL_TOGGLE(state, { interface_id, is_dynamic }) {
            state.dhcp.pools[interface_id].is_dynamic = is_dynamic;
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
        
        ARP_FLUSH({commit}, input) {
            return ajax("ARP", "Flush").then(({ success }) => {
                commit('ARP_FLUSH');
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
                input.adv_interval,
                input.time_to_live,
                input.system_name,
                input.system_description,
            ]).then((response) => {
                commit('LLDP_SETTINGS', response);
            });
        },
        
        SNIFFING_INTERFACE({commit}, interface) {
            return ajax("Sniffing", "Interface", String(interface)).then(({ interface }) => {
                commit('SNIFFING_INTERFACE', interface);
            });
        },
        
        DHCP_TIMERS({commit}, input) {
            return ajax("DHCP", "Timers", [
                input.lease_timeout,
                input.offer_timeout,
                input.renewal_timeout,
                input.rebinding_timeout
            ]).then((timers) => {
                commit('DHCP_TIMERS', timers);
            });
        },
        DHCP_STATIC_ADD({commit}, input) {
            return ajax("DHCP", "AddStatic", [
                input.mac,
                input.interface,
                input.ip
            ]).then((entry) => {
                commit('DHCP_ENTRY_ADD', entry);
            });
        },
        DHCP_STATIC_REMOVE({state, commit}, id) {
            return ajax("DHCP", "RemoveStatic", [
                state.dhcp.table[id].mac,
                state.dhcp.table[id].interface
            ]).then(() => {
                commit('DHCP_ENTRY_REMOVE', id);
            });
        },

        DHCP_POOL_ADD({commit}, input) {
            return ajax("DHCP", "PoolAdd", [
                input.interface_id,
                input.first_ip,
                input.last_ip,
                input.is_dynamic
            ]).then((entry) => {
                commit('DHCP_POOL_ADD', entry);
            });
        },
        DHCP_POOL_TOGGLE({commit}, interface_id) {
            return ajax("DHCP", "PoolToggle", interface_id).then(({ is_dynamic }) => {
                commit('DHCP_POOL_TOGGLE', { interface_id, is_dynamic });
            });
        },
        DHCP_POOL_REMOVE({commit}, interface_id) {
            return ajax("DHCP", "PoolRemove", interface_id).then(() => {
                commit('DHCP_POOL_REMOVE', interface_id);
            });
        }

    }
})
