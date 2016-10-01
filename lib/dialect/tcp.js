var assert = require('assert');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var net = require('net');

/**
 * TCP Network Toolkit
 * Configures the Yadda parser with phrases that support operations on HTTP APIs
 *
 * @module Web API Dialect
 * @class TCP Toolkit
 *
 */

module.exports = function(learn, config) {

    // ***** WHEN *****

    learn.when(["port $port at $address is open", "I open port $port at $address"], function(port, address, done) {
        var client = new net.Socket();
        client.connect(port, address, function() {
            client.destroy();
            done && done();
        })
    });

    learn.when(["port $port is open", "I open port $port"], function(port, done) {
        var client = new net.Socket();
        client.connect(port, this.target.hostname, function() {
            client.destroy();
            done && done();
        })
    });

    learn.when(["port $port at $address is closed"], function(port, address, done) {
        try {
            client.connect(port, address, function() {
                throw "Port "+port+" @ "+address+" is open";
            })
        } catch(e) {
            done && done();
        }
    });

    learn.when(["port $port is closed"], function(port, done) {
        try {
            client.connect(port, this.target.hostname, function() {
                throw "Port "+port+" @ "+this.target.hostname+" is open";
            })
        } catch(e) {
            done && done();
        }
    });

}


