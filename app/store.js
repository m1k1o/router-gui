const store = new Vuex.Store({
    state: {
        running: false,
        connection: {
            hostname: "localhost",
            port: "7000"
        },
        websockets: {
            running: false,
            instance: null
        },

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
            data: []
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
        },

        test_cases: [],
        analyzer: {
            test_presets: {
                "DummyTest": {
                    name: "Dummy Test",
                    component: null
                },
                "ARPRequest": {
                    name: "ARP Request",
                    component: "ARPRequestTest"
                },
                "ARPResponse": {
                    name: "ARP Response",
                    component: "ARPResponseTest"
                },
                "ICMPEchoReply": {
                    name: "ICMP Echo Reply",
                    component: "ICMPEchoReplyTest"
                },
                "ICMPEchoRequest": {
                    name: "ICMP Echo Request",
                    component: "ICMPEchoRequestTest"
                }
            },
            test_status: {
                Idle: 0,
                Running: 1,
                Success: 2,
                Error: 3,
                Timeout: 4,
                Canceled: 5
            },
            test: {
                error: false,
                message: null,
                
                running: false,
                log: [],
    
                time_out: null,
                status: 0
            }
        },

        packets: {
            plain: {
                "Ethernet": {
                    name: "Layer 2 Ethernet",
                    payload: true,
                    group: 1
                },
                "ARP": {
                    name: "Address Resolution Protocol",
                    payload: false,
                    group: 2
                },
                "ICMP": {
                    name: "Internet Control Message Protocol",
                    payload: true,
                    group: 3,
                    next_group: 2
                },
                "IP": {
                    name: "Internet Protocol",
                    payload: true,
                    group: 2
                },
                "TCP": {
                    name: "Transmission Control Protocol",
                    payload: true,
                    group: 3
                },
                "UDP": {
                    name: "User Datagram Protocol",
                    payload: true,
                    group: 3,
                    next_group: "udp_app"
                },
                "RIP": {
                    name: "Routing Information Protocol",
                    payload: false,
                    group: "udp_app"
                },
                "DHCP": {
                    name: "Dynamic Host Configuration Protocol",
                    payload: false,
                    group: "udp_app"
                },
                "Payload": {
                    name: "Payload Data",
                    payload: false,
                    group: 0
                }
            },
            presets: {
                "ARP": (if_mac, if_ip) => {
                    return {
                        "type": "Ethernet",
                        "source_hw_address": if_mac,
                        "destination_hw_address": "FF:FF:FF:FF:FF:FF",
                        "ethernet_packet_type": 2054,
                        "payload_packet": {
                            "type": "ARP",
                            "operation": 1,
                            "sender_hardware_address": if_mac,
                            "sender_protocol_address": if_ip,
                            "target_hardware_address": "00:00:00:00:00:00"
                        }
                    }
                },
                "Gratuitous ARP": (if_mac, if_ip) => {
                    return {
                        "type": "Ethernet",
                        "source_hw_address": if_mac,
                        "destination_hw_address": "FF:FF:FF:FF:FF:FF",
                        "ethernet_packet_type": 2054,
                        "payload_packet": {
                            "type": "ARP",
                            "operation": 1,
                            "sender_hardware_address": if_mac,
                            "sender_protocol_address": if_ip,
                            "target_hardware_address": if_mac,
                            "target_protocol_address": if_ip
                        }
                    }
                },
                "RIP": (if_mac, if_ip) => {
                    return {
                        "type": "Ethernet",
                        "source_hw_address": if_mac,
                        "destination_hw_address": "01:00:5E:00:00:09",
                        "ethernet_packet_type": 2048,
                        "payload_packet": {
                            "type": "IP",
                            "source_address": if_ip,
                            "destination_address": "224.0.0.9",
                            "time_to_live": 1,
                            "ip_protocol_type": 17,
                            "payload_packet": {
                                "type": "UDP",
                                "source_port": 520,
                                "destination_port": 520,
                                "payload_packet": {
                                    "type": "RIP"
                                },
                            },
                        },
                    }
                },
                "DHCP Server": (if_mac, if_ip) => {
                    return {
                        "type": "Ethernet",
                        "source_hw_address": if_mac,
                        "ethernet_packet_type": 2048,
                        "payload_packet": {
                            "type": "IP",
                            "source_address": if_ip,
                            "destination_address": "255.255.255.255",
                            "time_to_live": 128,
                            "ip_protocol_type": 17,
                            "payload_packet": {
                                "type": "UDP",
                                "source_port": 67,
                                "destination_port": 68,
                                "payload_packet": {
                                    "type": "DHCP",
                                    "operation_code": 2,
                                    "transaction_id": 123456,
                                    "next_server_ip_address": if_ip,
                                    "options": [{
                                            "message_type": 2,
                                            "type": 53
                                        },
                                        {
                                            "ip_address": "255.255.255.0",
                                            "type": 1
                                        },
                                        {
                                            "ip_addresses": [if_ip],
                                            "type": 3
                                        },
                                        {
                                            "seconds": 3600,
                                            "type": 51
                                        },
                                        {
                                            "seconds": 1800,
                                            "type": 58
                                        },
                                        {
                                            "seconds": 3150,
                                            "type": 59
                                        },
                                        {
                                            "ip_address": if_ip,
                                            "type": 54
                                        },
                                        {
                                            "ip_addresses": [
                                                "1.1.1.1",
                                                "1.0.0.1"
                                            ],
                                            "type": 6
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                "DHCP Client": (if_mac, if_ip) => {
                    return {
                        "type": "Ethernet",
                        "source_hw_address": if_mac,
                        "destination_hw_address": "FF:FF:FF:FF:FF:FF",
                        "ethernet_packet_type": 2048,
                        "payload_packet": {
                            "type": "IP",
                            "source_address": if_ip,
                            "destination_address": "255.255.255.255",
                            "time_to_live": 128,
                            "ip_protocol_type": 17,
                            "payload_packet": {
                                "type": "UDP",
                                "source_port": 68,
                                "destination_port": 67,
                                "payload_packet": {
                                    "type": "DHCP",
                                    "operation_code": 1,
                                    "transaction_id": 123456,
                                    "options": [{
                                            "message_type": 1,
                                            "type": 53
                                        },
                                        {
                                            "type": 61
                                        },
                                        {
                                            "ip_address": "0.0.0.0",
                                            "type": 50
                                        },
                                        {
                                            "codes": [1,3,6],
                                            "type": 55
                                        }
                                    ]
                                }
                            }
                        }
                    }
                },
                "ICMP Echo/Reply": (if_mac, if_ip) => {
                    return {
                        "type": "Ethernet",
                        "source_hw_address": if_mac,
                        "ethernet_packet_type": 2048,
                        "payload_packet": {
                            "source_address": if_ip,
                            "time_to_live": 128,
                            "ip_protocol_type": 1,
                            "payload_packet": {
                                "type": "ICMP",
                                "type_code": 0,
                                "id": 1,
                                "sequence": 1,
                                "payload_packet": {
                                    "string": "ABCDEFGH",
                                    "type": "Payload"
                                },
                            },
                            "type": "IP"
                        }
                    }
                },
                "UDP": (if_mac, if_ip) => {
                    return {
                        "type": "Ethernet",
                        "source_hw_address": if_mac,
                        "ethernet_packet_type": 2048,
                        "payload_packet": {
                            "source_address": if_ip,
                            "time_to_live": 128,
                            "ip_protocol_type": 17,
                            "payload_packet": {
                                "type": "UDP"
                            },
                            "type": "IP"
                        }
                    }
                },
                "TCP": (if_mac, if_ip) => {
                    return {
                        "type": "Ethernet",
                        "source_hw_address": if_mac,
                        "ethernet_packet_type": 2048,
                        "payload_packet": {
                            "source_address": if_ip,
                            "time_to_live": 128,
                            "ip_protocol_type": 6,
                            "payload_packet": {
                                "type": "TCP"
                            },
                            "type": "IP"
                        }
                    }
                },
            },
            ethernet_packet_type: {
                0: "None",
                2048: "IpV4",
                2054: "Arp",
                32821: "Reverse Arp",
                35020: "LLDP"
            },
            arp_operation: {
                1: "Request",
                2: "Response",
                3: "Reverse Request",
                4: "Reverse Reply"
            },
            ip_protocol: {
                0: "IP",
                1: "ICMP",
                //2: "IGMP",
                4: "IPIP",
                6: "TCP",
                17: "UDP",
                255: "RAW"
            },
            icmp_type_code: {
                "Echo Reply": 0,
                "Echo": 2048,

                "Timestamp": 3328,
                "Timestamp Reply": 3584,

                "Destination Unreachable": {
                    768: "Net Unreachable",
                    769: "Host Unreachable",
                    770: "Protocol Unreachable",
                    771: "Port Unreachable",
                    772: "Fragmentation Needed and Don't Fragment was Set",
                    773: "Source Route Failed",
                    774: "Destination Network Unknown",
                    775: "Destination Host Unknown",
                    776: "Source Host Isolated",
                    777: "Communication with Destination Network is Administratively Prohibited",
                    778: "Communication with Destination Host is Administratively Prohibited",
                    779: "Destination Network Unreachable for Type of Service",
                    780: "Destination Host Unreachable for Type of Service",
                    781: "Communication Administratively Prohibited",
                    782: "Host Precedence Violation",
                    783: "Precedence cutoff in effect"
                },
                "Redirect": {
                    1280: "Redirect Datagram for the Network (or subnet)",
                    1281: "Redirect Datagram for the Host",
                    1282: "Redirect Datagram for the Type of Service and Network",
                    1283: "Redirect Datagram for the Type of Service and Host"
                },
                "Router Advertisement": {
                    2304: "Normal router advertisement",
                    //: "Does not route common traffic"
                },
                "Router Solicitation": {
                    2560: "Router Advertisement"
                },
                "Time Exceeded": {
                    2816: "Time to Live exceeded in Transit",
                    //: "Fragment Reassembly Time Exceeded"
                },
                "Parameter Problem": {
                    3072: "Pointer indicates the error",
                    3073: "Missing a Required Option",
                    3074: "Bad Length"
                },
                "Photuris": {
                    9728: "Bad SPI",
                    9729: "Authentication Failed",
                    9730: "Decompression Failed",
                    9731: "Decryption Failed",
                    9732: "Need Authentication",
                    9733: "Need Authorization"
                },
                /*
                "Extended Echo Request": {
                    //: "No Error"
                },
                "Extended Echo Reply": {
                    //: "No Error",
                    //: "Malformed Query",
                    //: "No Such Interface",
                    //: "No Such Table Entry",
                    //: "Multiple Interfaces Satisfy Query"
                }
                */
            },
            
            rip_command_types: {
                1: 'Request',
                2: 'Response'
            },
            rip_versions: {
                0: 'Must be Discarded',
                1: '1',
                2: '2'
            },
            rip_afis: {
                0: 'Unspecified',
                2: 'IP',
                65535: 'Authentication present'
            },

            
            dhcp_operation_codes: {
                1: 'BOOT REQUEST',
                2: 'BOOT REPLY'
            },
            dhcp_message_types: {
                1: 'Discover',
                2: 'Offer',
                3: 'Request',
                4: 'Decline',
                5: 'Ack',
                6: 'Nak',
                7: 'Release'
            },
            dhcp_options: {
                3: {
                    name: "Routers",
                    component: "DHCPIPAddressesOption"
                },
                6: {
                    name: "Domain Name Servers",
                    component: "DHCPIPAddressesOption"
                },

                1: {
                    name: "Subnet Mask",
                    component: "DHCPIPAddressOption"
                },
                50: {
                    name: "Requested IP Address",
                    component: "DHCPIPAddressOption"
                },
                54: {
                    name: "Server Identifier",
                    component: "DHCPIPAddressOption"
                },

                51: {
                    name: "IP Address Lease Time",
                    component: "DHCPUIntOption"
                },
                58: {
                    name: "Renewal Time",
                    component: "DHCPUIntOption"
                },
                59: {
                    name: "Rebinding Time",
                    component: "DHCPUIntOption"
                },

                53: {
                    name: "Message Type",
                    component: "DHCPMessageTypeOption"
                },

                55: {
                    name: "Parameter Request List",
                    component: "DHCPParameterRequestListOption"
                },

                61: {
                    name: "Client Identifier",
                    component: "DHCPClientIdentifierOption"
                }
                /*
                0: {
                    name: "Pad",
                    component: "dhcp_pad_option"
                },
                255: {
                    name: "End",
                    component: "dhcp_end_option"
                }
                */
            }
        }
    },
    mutations: {
        SET_CONNECTION(state, {hostname, port}) {
            Vue.set(state, 'connection', {hostname, port})
        },

        WEBSOCKETS_INSTANCE(state, instance) {
            Vue.set(state.websockets, 'instance', instance)
        },
        WEBSOCKETS_RUNNING(state, running) {
            Vue.set(state.websockets, 'running', running)
        },

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
        
        SNIFFING_PUSH(state, entry) {
            state.sniffing.data.push(entry)
        },
        SNIFFING_CLEAR(state) {
            Vue.set(state.sniffing, 'data', []);
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
        },

        ANALYZER_TEST_CASE_PUSH(state, data) {
            if(typeof data.log !== 'undefined') {
                state.analyzer.test.log.push(data.log)
                return;
            }
            
            for (const key in data) {
                if (data.hasOwnProperty(key) && state.analyzer.test.hasOwnProperty(key)) {
                    Vue.set(state.analyzer.test, key, data[key]);
                }
            }
        },
        ANALYZER_TEST_CASE_CLEAR(state) {
            Vue.set(state.analyzer, 'test', {
                error: false,
                message: null,

                running: false,
                log: [],

                time_out: null,
                status: null
            });
        },

        ANALYZER_STORAGE_PUT(state, entries) {
            for (const id in entries) {
                if (entries.hasOwnProperty(id)) {
                    Vue.set(state.test_cases, id, entries[id]);
                }
            }
        },
        ANALYZER_STORAGE_REMOVE(state, id) {
            Vue.delete(state.test_cases, id);
        }
    },
    getters: {
        
    },
    actions: {
        WEBSOCKETS_DISCONNECT({state, commit, dispatch}) {
            // Is Browser supporting WebSockets?
            if(!('WebSocket' in window)) {
                return false;
            }
            
			if(state.websockets.instance != null) {
				state.websockets.instance.close()
            }

			commit('WEBSOCKETS_INSTANCE', null);
        },
        WEBSOCKETS_CONNET({state, commit, dispatch}) {
            // Is Browser supporting WebSockets?
            if(!('WebSocket' in window)) {
                return false;
            }
            
			if(state.websockets.instance != null) {
				state.websockets.instance.close()
            }
            
            let { hostname, port } = state.connection;

            // Create instance
            var instance = new WebSocket("ws://" + hostname + ":" + port);
            instance.onopen = () => {
                commit('WEBSOCKETS_RUNNING', true);
                console.log("Websocket Connect.");
            }
            instance.onclose = () => {
                commit('WEBSOCKETS_RUNNING', false);
                console.log("Websocket Disconnect.");
            }
            instance.onmessage = (event) => dispatch('WEBSOCKETS_ONMESSAGE', event.data);
            instance.onerror = (e) => { //TODO: Show error
                commit('WEBSOCKETS_RUNNING', false);
                commit('WEBSOCKETS_INSTANCE', null);
                console.log("Websocket Error.");
            }
            
			commit('WEBSOCKETS_INSTANCE', instance);
        },
        WEBSOCKETS_ONMESSAGE({state, commit}, string) {
            let { key, data } = JSON.parse(string);

            switch (key) {
                case 'sniffing':
                    commit('SNIFFING_PUSH', data)
                case 'test_case':
                    commit('ANALYZER_TEST_CASE_PUSH', data)
                break;
            }
        },
        WEBSOCKETS_EMIT({state}, data) {
            state.websockets.instance.send(JSON.stringify(data));
        },

        UPDATE({commit}) {
            return ajax("Global", "UpdateTables")
            .then((tables) => commit('UPDATE_TABLES', tables));
        },
        INITIALIZE({commit, dispatch}) {
            dispatch('WEBSOCKETS_CONNET')

            return ajax("Global", "Initialize")
            .then((data) => commit('INITIALIZE', data));
        },

        INTERFACES_REFRESH({commit}) {
            return ajax("Interfaces", "Refresh").then((response) => {
                commit('UPDATE_TABLES', { interfaces: response });
            });
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
        
        SNIFFING_INTERFACE({dispatch}, id) {
            if(id === null) {
                dispatch('WEBSOCKETS_EMIT', {
                    key: 'sniffing',
                    action: 'stop'
                });
                return;
            }

            dispatch('WEBSOCKETS_EMIT', {
                key: 'sniffing',
                action: 'start',
                interface: id
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
        },

        ANALYZER_STORAGE_IMPORT({commit}, test_cases){
            return ajax("Analyzer", "ImportTestCase", { test_cases }).then(data => {
                commit('ANALYZER_STORAGE_PUT', data);
            });
        },
        ANALYZER_STORAGE_PUT({commit}, { index, test_case }){
            return ajax("Analyzer", "PutTestCase", { index, test_case }).then(({ index, test_case }) => {
                commit('ANALYZER_STORAGE_PUT', { [index]: test_case });
            });
        },
        ANALYZER_STORAGE_REMOVE({commit}, index){
            return ajax("Analyzer", "RemoveTestCase", { index }).then((entry) => {
                commit('ANALYZER_STORAGE_REMOVE', index);
            });
        }
    }
})
