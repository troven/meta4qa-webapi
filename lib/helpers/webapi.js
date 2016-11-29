var tls = require('tls');
var assert = require('assert');
var _ = require('lodash');
var net = require("net");
var debug = require("debug")("meta4qa:helps:webapi");
var meta4qa = require('meta4qa'), helps = meta4qa.helpers, files = helps.files, http=helps.http;

var webapi = module.exports = {

    EXT_TO_MIME : {
        "json": "application/json",
        "xml": "text/xml",
        "txt": "plain/text"
    },

    uploadFormFile: function(self, path, file, done) {
        assert(self, "Missing self");
        assert(self.request, "Missing self request");
        assert(path, "Missing path");
        assert(file, "Missing file");
        assert(self.paths[path], "Missing {"+path+"} path");
        var file = helps.files.root(self, path, file);
        assert(helps.files.exists(file), "Missing "+path+" file: "+file);
        self.request.headers['Content-Type'] = "multipart/form-data";
        self.request.formData = self.request.formData || {};
        self.request.formData.file = files.stream(file);
        done && done();
    },

    attachFile:  function(self, path, file, done) {
        assert(self, "Missing self");
        assert(path, "Missing path");
        assert(file, "Missing file");
        var type = http.detectFileType(file);
        assert(type, "Invalid file type: "+file);

        webapi.attachFileByType(self, path, file, type, done);
    },

    attachFileByType:  function(self, path, file, type, done) {
        assert(self, "Missing self");
        assert(self.request, "Missing self request");
        assert(self.request.headers, "Missing request headers");
        assert(path, "Missing path");
        assert(file, "Missing file");
        assert(type, "Missing type");

        var file = helps.files.root(self, path, file);
        // var root = config.paths[path];
        // assert(root, "Path not found: "+path);
        // file = path.join(root, file);
        assert(helps.files.exists(file), "Unsupported file type: "+type);

        var mime = webapi.EXT_TO_MIME[type];
        assert(mime, "Unsupported file type: "+type);
        self.request.headers['Content-Type'] = mime;

        self.request.body = files.load(file);
        debug("HTTP upload: %s", file);
        done & done();
    }

}
