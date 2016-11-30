var pkg = require("../../package");
var assert = require('assert');
var async = require('async');
var meta4qa = require('meta4qa'), helps = meta4qa.helpers, http=helps.http, _ = metaqa._;
var debug = require("debug")("meta4qa:dialect-tcp");
var dns = require('dns');
var tcp = helps.tcp = require('../helpers/tcp');
// var ping = require ("net-ping");

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


    // learn.when(["I ping"], function(done) {
    //     var hostname = this.target.hostname;
    //     assert(hostname, "Missing target hostname: "+$target);
    //
    //     session.pingHost (hostname, function (error, target) {
    //         assert(!error, "Ping failed: "+hostname);
    //         done && done();
    //     });
    //
    // });
    //
    // learn.when(["I ping $target"], function($target, done) {
    //     assert($target, "Missing target");
    //     var session = ping.createSession ();
    //     var target = this.targets[$target];
    //     assert($target, "Unknown target: "+$target);
    //     var hostname = target.hostname;
    //     assert(hostname, "Missing target hostname: "+$target);
    //
    //     session.pingHost (hostname, function (error, target) {
    //         assert(!error, "Ping failed: "+hostname);
    //         done && done();
    //     });
    // });
    //

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

    debug("understands TCP/TLS - v"+pkg.version);

    return self;
}
