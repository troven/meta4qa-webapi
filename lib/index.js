var assert = require('assert');
var request = require('request');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var http = require('./helpers/http');
var debug = require('debug')("dialect:webapi");

var self = module.exports = function(learn, config) {

    require("./dialect/webapi")(learn,config);
    require("./dialect/tcp")(learn,config);

    self.annotations = function(dialect, annotations, scope) {
        assert(dialect, "missing dialect");
        assert(annotations, "missing annotations");
        assert(scope, "missing scope");

        // initialize request/response + targets + agents

        _.extend(scope, { stopwatch: {},
            agents: { default: {} }, agent: { },
            targets: {default: {} }, target:{} ,
            certificates: {},
            request: {qs: {}, headers: {}}, response: {}
        })

        // merge default agents/targets with their @nnotations

        scope.target = _.extend({}, scope.targets.default, scope.target, scope.targets[annotations.target]);
        scope.agent = _.extend({}, scope.agents.default, scope.agent, scope.agents[annotations.agent]);

    }

    debug("understands Web APIs");
    return self;
};
