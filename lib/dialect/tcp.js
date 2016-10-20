var assert = require('assert');
var _ = require('underscore');
var async = require('async');
var tcp = require('../helpers/tcp');
var ApiGeek = require('apigeek-dialect'), helps = ApiGeek.helpers, http=helps.http;
var debug = require("debug")("apigeek:dialect-tcp");
var dns = require('dns');

/**
 * TCP Network Toolkit
 * Configures the Yadda parser with phrases that support operations on HTTP APIs
 *
 * @module Web API Dialect
 * @class TCP Toolkit
 *
 */

const DNS_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'SRV', 'PTR', 'NS', 'CNAME', 'SOA'];

var self = module.exports = function(learn, config) {

    // ***** WHEN *****

    learn.when(["port $port at $target is open", "I open port $port at $target"], function(port, address, done) {
        assert(this.targets, "Missing target");
        assert(port, "Missing target port: "+address);

        var target = this.targets[address] || { hostname: address};

        assert(target, "Missing target: "+address);
        assert(target.hostname, "Missing target hostname: "+address);

        tcp.isOpen(target.hostname, port, done);

    });

    learn.when(["port $port is open", "I open port $port"], function(port, done) {
        assert(port, "Missing target port");
        assert(this.target, "Missing target");
        assert(this.target.hostname, "Missing target hostname");

        var hostname = this.target.hostname;
        tcp.isOpen(hostname, port, done);

    });

    learn.when(["port $port at $address is closed"], function(port, address, done) {
        assert(port, "Missing target port");

        assert(this.targets, "Missing target");
        var target = this.targets[address] || { hostname: address};
        assert(target, "Missing target: "+address);
        assert(target.hostname, "Missing target hostname: "+address);
        assert(port, "Missing target port: "+address);

        tcp.isClosed(target.hostname, port, done);
    });

    learn.when(["port $port is closed"], function(port, done) {
        assert(port, "Missing target port");
        assert(this.target, "Missing target");
        assert(this.target.hostname, "Missing target hostname");
        var hostname = this.target.hostname;

        tcp.isClosed(hostname, port, done);

    });

    learn.when(["I get a server certificate", "I get an SNI server certificate", "I get a server certificate using SNI"], function(done) {
        assert(this.peer, "scope not initialised");
        assert(this.target, "Missing an HTTP target");
        var hostname = this.target.hostname;
        assert(hostname, "Missing an target hostname");

        var port = this.target.port || 443;
        var self = this;

        tcp.getServerCert(hostname, port, {}, function(err, peer) {
            assert(!err, "TCP: "+err);
            _.extend(self.peer,peer);
            done && done();
        })
    });

    learn.when(["I get a server certificate without SNI"], function(done) {
        assert(this.peer, "scope not initialised");
        assert(this.target, "Missing an HTTP target");
        var hostname = this.target.hostname;
        assert(hostname, "Missing an target hostname");

        var port = this.target.port || 443;
        var self = this;

        tcp.getServerCert(hostname, port, { legacy: true }, function(err, peer) {
            assert(!err, "TCP error: "+e);
            _.extend(self.peer,peer);
            done && done();
        })

    });

    learn.when(["I lookup DNS"], function(done) {
        assert(this.target, "Missing an HTTP target");
        var hostname = this.target.hostname;
        assert(hostname, "Missing an target hostname");
        assert(this.dns, "Missing DNS")
        var self = this;

        dns.lookup(hostname, { all: true }, function(err, addresses) {
            assert(!err, "Lookup failed: "+hostname);
            self.dns.addresses = addresses;
            debug("DNS Lookup: %s -> %j", hostname, self.dns);
            done && done();
        });

    });

    learn.when(["I lookup DNS $address", "I lookup DNS for $address", "I lookup $address"], function(hostname, done) {
        assert(hostname, "Missing an target hostname");
        assert(this.dns, "Missing DNS")

        var self = this;

        dns.lookup(hostname, { all: true }, function(err, addresses) {
            assert(!err, "Lookup failed: "+hostname);
            self.dns.addresses = addresses;
            debug("DNS Lookup: %s -> %j", hostname, self.dns);
            done && done();
        });

    });

    learn.when(["I resolve DNS $type for $address", "I resolve DNS $type record for $address", "I resolve $type for $address"], function(type, hostname, done) {
        assert(type, "Missing an DNS record type");
        assert(hostname, "Missing an target hostname");
        assert(this.dns, "Missing DNS")

        var self = this;
        self.dns = {};
        type = type.toUpperCase();

        dns.resolve(hostname, type, function(err, addresses) {
            assert(!err, "Resolve failed ("+err+"): "+hostname);
            self.dns.addresses = addresses;
            debug("DNS Resolved: %j", self.dns);
            done && done();
        });

    });

    learn.when(["I resolve DNS for $address", "I resolve for $address"], function(hostname, done) {
        assert(hostname, "Missing an target hostname");
        assert(this.dns, "Missing DNS")

        var self = this;

        async.eachSeries(DNS_TYPES, function(type, callback) {
            self.dns[type] = self.dns[type] || {};
            try {
                dns.resolve(hostname, type, function(err, addresses) {
                    if (err) callback(err);
                    else {
                        self.dns[type].addresses = addresses;
                        debug("DNS %s Resolved: %j", type, self.dns);
                        callback();
                    }
                });
            } catch (err) {
                self.dns[type].error = err;
            }
        }, function(err) {
            done && done();
        });

    });

    // ***** THEN *****

    learn.then(["server cert is authorized", "server certificate must be authorized"], function(done) {
        assert(this.peer, "scope not initialised");
        assert(this.peer.authorized, "Server cert not authorized");
        done && done();
    });

    learn.then(["server certificate $name must match $pattern", "$name  in server certificate must match $pattern"], function(name, pattern, done) {
        assert(this.peer, "Missing a server cert");
        assert(this.peer.authorized, "Server cert not authorized");
        var found = helps.vars.findNamed(this.peer, name);
        assert(found, "Variable not found for: "+name);
        var regexp = new RegExp(pattern);
        assert(regexp.matches(found), "Pattern /"+pattern+"/ not found");
        done && done();
    });

    // **********************************************************************
    // * Dialect Controller
    // **********************************************************************

    self.feature = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");
    };

    self.scenario = function(dialect, scope) {
        assert(dialect, "missing dialect");
        assert(scope, "missing scope");

        _.defaults(scope, {peer: { authorized: false} });
    };

    self.annotations = function(dialect, annotations, scope) {
        assert(dialect, "missing dialect");
        assert(annotations, "missing annotations");
        assert(scope, "missing scope");
    }

    debug("understands TCP/TLS");

    return self;
}
