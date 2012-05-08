/*
This file is part of the GhostDriver project from Neustar inc.

Copyright (c) 2012, Ivan De Marino <ivan.de.marino@gmail.com> - Neustar inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var ghostdriver = ghostdriver || {};

/**
 * This Class does first level routing: based on the REST Path, sends Request and Response to the right Request Handler.
 */
ghostdriver.RouterReqHand = function() {
    // private:
    var
    _protoParent = ghostdriver.RouterReqHand.prototype,
    _statusRH = new ghostdriver.StatusReqHand(),
    _sessionManRH = new ghostdriver.SessionManagerReqHand(),
    _const = {
        STATUS          : "status",
        SESSION         : "session",
        SESSIONS        : "sessions",
        SESSION_DIR     : "/session/"
    },
    _errors = require("./errors.js"),

    _handle = function(req, res) {
        var session,
            sessionRH;

        // Invoke parent implementation
        _protoParent.handle.call(this, req, res);

        // console.log("Request => " + JSON.stringify(req, null, '  '));

        try {
            if (req.urlParsed.file === _const.STATUS) {                             // GET '/status'
                _statusRH.handle(req, res);
            } else if (req.urlParsed.file === _const.SESSION ||                     // POST '/session'
                req.urlParsed.file === _const.SESSIONS ||                           // GET '/sessions'
                req.urlParsed.directory === _const.SESSION_DIR) {                   // GET or DELETE '/session/:id'
                _sessionManRH.handle(req, res);
            } else if (req.urlParsed.path.indexOf(_const.SESSION_DIR) === 0) {      // GET, POST or DELETE '/session/:id/...'
                // Retrieve session
                session = _sessionManRH.getSession(req.urlParsed.chunks[1]);

                if (session !== null) {
                    // Create a new Session Request Handler and re-route the request to it
                    sessionRH = _sessionManRH.getSessionReqHand(req.urlParsed.chunks[1]);
                    _protoParent.reroute.call(sessionRH, req, res, _const.SESSION_DIR + session.getId());
                } else {
                    throw _errors.createInvalidReqVariableResourceNotFoundEH(req);
                }
            } else {
                throw _errors.createInvalidReqUnknownCommandEH(req);
            }
        } catch (e) {
            // Don't know where to Route this!
            if (typeof(e.handle) === "function") {
                e.handle(res);
            } else {
                // This should never happen, if we handle all the possible error scenario
                res.statusCode = 404; //< "404 Not Found"
                res.setHeader("Content-Type", "text/plain");
                res.write(e.name + " - " + e.message);
                res.close();
            }

            console.error("Error => " + JSON.stringify(e, null, '  '));
        }
    };

    // public:
    return {
        handle : _handle
    };
};
// prototype inheritance:
ghostdriver.RouterReqHand.prototype = new ghostdriver.RequestHandler();