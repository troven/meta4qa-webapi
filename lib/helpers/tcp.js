var tls = require('tls');
var assert = require('assert');
var _ = require('underscore');
var net = require("net");
var debug = require("debug")("apigeek:helper-tcp");

module.exports = {

    isOpen: function(hostname, port, done) {
        var client = new net.Socket();
        client.connect(port, hostname, function() {
            debug("connected -> tcp://%s:%s", hostname,port);
            client.destroy();
            done && done();
        })
    },

    isClosed: function(hostname, port, done) {
        var client = new net.Socket();
        try {
            client.connect(port, hostname, function() {
                client.destroy();
                throw "Port "+port+" @ "+hostname+" is open";
            }).on("error", function() {
                debug("port not open-> tcp://%s:%s", hostname,port);
                done && done();
            });
        } catch(e) {
            debug("disconnected -> tcp://%s:%s", hostname,port);
            done && done();
        }
    },

    getServerCert: function(hostname, port, options, done) {
        assert(hostname, "Missing hostname");
        assert(port, "Missing port");
        assert(options, "Missing options");
        assert(done, "Missing callback");

        options = _.extend({ rejectUnauthorized: false }, options);

        if (!options.legacy) {
            options.servername = hostname;
        }

        var peer = { state: "unknown", authorized: false, cert: false };

        try {
            var socket = tls.connect(port, hostname, options, function() {

                peer.state = socket.authorized ? 'authorized' : 'unauthorized';
                peer.authorized = socket.authorized?true:false;
                peer.cert = this.getPeerCertificate(true);

                debug("%s peer certificate -> https://%s:%s -> %j", peer.state, hostname, port, options);
                socket.destroy();
                done(null, peer);
            });
        } catch (e) {
            done(e, peer);
        }
    }


}
