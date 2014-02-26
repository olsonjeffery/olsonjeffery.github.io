// pure client bridge
(function() {
    var clients = {};
    var create_msgr = function(client_id) {
        var msg_box = new MessageBox();
        clients[client_id] = msg_box;
        var msgr = {
            pub: function(target_id, addr, payload) {
                if(!(target_id in clients)) {
                    throw "attempting to publish msg to client "+target_id+", who doesn't exist";
                }
                var data = {
                    payload: payload,
                    meta: {
                        sender_id: client_id,
                    }
                };
                var json_data = JSON.stringify(data);
                clients[target_id].pub(addr, json_data);
            },
            sub: function(addr, client_handler) {
                var handler = function(json_data) {
                    var data = JSON.parse(json_data);
                    if(!("meta" in data)) {
                        throw "malformed data, no 'meta' property";
                    }
                    if(!("payload" in data)) {
                        throw "malformed data, no 'payload' property";
                    }
                    client_handler(data.payload, data.meta);
                };
                msg_box.sub(addr, handler);
            },
            pump: function() {
                msg_box.process();
            }
        };
        return msgr;
    };
    // this is called on the client..
    var local_init = function(done_cb, __start_server) {
        var start_server = typeof(__start_server) === 'undefined' ?
            true : __start_server;
        
        Math.seedrandom();
        var rand = Math.random;
        var server_id = (rand()*100).toString();
        
        // client calls this to fire-up/connect to server
        var local_connect = function(server_id, info, done_cb) {
            var client_id = (rand()*100).toString();
            var msgr = create_msgr(client_id);
            msgr.sub('ss0:client:connected',function(payload,meta) {
                done_cb(msgr, payload, meta);
            });
            // connect to server..
            msgr.pub(server_id, 'ss0:backend:connect', info);
            this.server_pump();
            msgr.pump();
        };
        var bridge = {
            connect: local_connect,
            server_pump: function() {
                clients[server_id].process();
            }
        };
        if (start_server) {
            var msgr = create_msgr(server_id);
            ss0.backend.start(server_id, msgr);
        }
        done_cb(server_id, bridge);
    };
    sugs.namespace.set(this,'ss0.bridge.pure_client',function(pure_client){
        pure_client.init = local_init;
        pure_client.create_msgr = create_msgr;
    });
}).call(this);
