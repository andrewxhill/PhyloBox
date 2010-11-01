//
//
////
//

//SOF: WIDGETBOX.js

if (!window.WIDGETBOX) (function() {

    var initialized = false;

    var pageLoadCallback = function() {
        WIDGETBOX.setPageLoaded();
    };

    var pageUnloadCallback = function() {
        WIDGETBOX.setPageUnloaded();
    };

    WIDGETBOX = {

        libs : { },

        globals : {
            token : "",
            tokenTime : 0,
            widgets : [],
            widgetCount : 0,
            pageLoaded : false,
            pageUnloaded : false,
            pageLoadListeners : [],
            pageUnloadListeners : [],
            panels : [],
            panelCount : 0,
            showPanelMarks : true,
            suppressGetWidget : false, // GW button not rendered
            disableGetWidget: false, // GW button is rendered but does nothing
            suppressQuantcast: false, // Quantcast swf not rendered
            enableLogging : false,
            disableHitTracking : false,
            log : "",
            trustedPage: false,
            disableInstallerMenu : false,
            renderInstallerMenuInline: false,
            anchorEl: null
        },

        init : function() {
            if (!initialized) {
                initialized = true;

                if (window.WIDGETBOXLOADLISTENERS) {
                    for (var i = 0; i < WIDGETBOXLOADLISTENERS.length; i++) {
                        var listener = WIDGETBOXLOADLISTENERS[i];
                        self.addPageLoadListener(listener);
                    }
                }

                self.addEvent(window, "load", pageLoadCallback);
                self.addEvent(window, "unload", pageUnloadCallback);

                if (window.WIDGETBOXINITLISTENERS) {
                    for (var i = 0; i < WIDGETBOXINITLISTENERS.length; i++) {
                        var listener = WIDGETBOXINITLISTENERS[i];
                        try {
                            listener();
                        }
                        catch (e) {
                            WIDGETBOX.logMessage(e);
                        }
                    }
                }

            }
        },

        namespace : function(ns) {

            ns = ns.replace(".", "/");

            if (ns.indexOf("WIDGETBOX/") == 0) ns = ns.substr(10);
            if (ns.indexOf("POSTAPP/") == 0) ns = ns.substr(8);

            var nodes = ns.split("/");
            var last = WIDGETBOX;
            if (nodes) {
                for (var i = 0; i < nodes.length; i++) {
                    var node = nodes[i];
                    if (!last[node]) last[node] = new Object();
                    last = last[node];
                }
            }

            return ns;
        },

        logMessage : function(msg) {
            if (self.globals.enableLogging) {
                self.globals.log += (msg + "\n");
            }
        },

        newLibInfo : function(libPath) {
            libPath = libPath.replace(".", "/");

            var libName = libPath;
            var ns = "";
            var nameDelim = libPath.lastIndexOf("/");
            if (nameDelim >= 0) {
                ns = libPath.substr(0, nameDelim);
                libName = libPath.substr(nameDelim + 1);
            }
            ns = self.namespace(ns);
            libPath = ns + "/" + libName;

            var libID = libPath.replace("/", "_").toLowerCase();

            var result = {ns : ns, name : libName, path : libPath, id : libID, status : null, callback : null};

            return result;
        },

        load : function(libPath, onLoadListener, useCdn) {

            var libInfo = self.newLibInfo(libPath);

            if (!WIDGETBOX.libs[libInfo.id]) {
                WIDGETBOX.libs[libInfo.id] = libInfo;
                libInfo.status = "loading";

                if (onLoadListener) {
                    if (!libInfo.listeners) libInfo.listeners = new Array();
                    libInfo.listeners.push(onLoadListener);
                }

                var script = document.createElement("script");
                script.id = "widgetbox_lib_" + libInfo.id;
                script.type = "text/javascript";
                script.setAttribute('async', 'false');

                if (!useCdn) {
                    script.src = "http://widgetserver.com/syndication/" + libInfo.path + ".js?36817";
                } else {
                    script.src = "http://cdn.widgetserver.com/syndication/" + libInfo.path + ".js?36817";
                }
                var head = document.documentElement.firstChild;
                if (!head || (head.nodeName && head.nodeName.toLowerCase().indexOf("comment")>-1)) head = document.getElementsByTagName("head")[0];
                head.appendChild(script);
            }
            else {
                libInfo = WIDGETBOX.libs[libInfo.id];
                if (onLoadListener) {
                    if (libInfo.status == "ready") {
                        try {
                            onLoadListener(libInfo);
                        }
                        catch (e) {
                            WIDGETBOX.logMessage(e);
                        }
                    }
                    else {
                        if (!libInfo.listeners) libInfo.listeners = new Array();
                        libInfo.listeners.push(onLoadListener);
                    }
                }
            }
        },

        ready : function(libPath) {
            var libInfo = self.newLibInfo(libPath);
            if (!WIDGETBOX.libs[libInfo.id]) {
                WIDGETBOX.libs[libInfo.id] = libInfo;
            }
            libInfo = WIDGETBOX.libs[libInfo.id];

            return libInfo.status == "ready";
        },

        setReady : function(libPath) {
            var libInfo = self.newLibInfo(libPath);
            if (!WIDGETBOX.libs[libInfo.id]) {
                WIDGETBOX.libs[libInfo.id] = libInfo;
            }
            libInfo = WIDGETBOX.libs[libInfo.id];

            libInfo.status = "ready";

            if (libInfo.listeners) {
                for (var i = 0; i < libInfo.listeners.length; i++) {
                    var listener = libInfo.listeners[i];
                    try {
                        listener(libInfo);
                    }
                    catch (e) {
                        WIDGETBOX.logMessage(e);
                    }
                }
            }

        },

        addEvent : function(obj, evType, fn, useCapture) {
            if (obj.addEventListener) {
                obj.addEventListener(evType, fn, useCapture);
                return true;
            } else if (obj.attachEvent) {
                var r = obj.attachEvent("on" + evType, fn);
                return r;
            } else {
                alert("Handler could not be attached");
            }
        },

        removeEvent : function(obj, evType, fn, useCapture) {
            if (obj.removeEventListener) {
                obj.removeEventListener(evType, fn, useCapture);
                return true;
            } else if (obj.detachEvent) {
                var r = obj.detachEvent("on" + evType, fn);
                return r;
            } else {
                alert("Handler could not be removed");
            }
        },

        addPageLoadListener : function(onLoadListener) {
            if (onLoadListener) {
                if (!self.globals.pageLoaded) {
                    self.globals.pageLoadListeners.push(onLoadListener);
                }
                else {
                    try {
                        onLoadListener();
                    }
                    catch (e) {
                        WIDGETBOX.logMessage(e);
                    }
                }
            }
        },

        addPageUnloadListener : function(onUnloadListener) {
            if (onUnloadListener) {
                if (!self.globals.pageUnloaded) {
                    self.globals.pageUnloadListeners.push(onUnloadListener);
                }
                else {
                    try {
                        onUnloadListener();
                    }
                    catch (e) {
                        WIDGETBOX.logMessage(e);
                    }
                }
            }
        },

        setPageLoaded : function() {
            if (self.globals.pageLoaded) return;

            self.globals.pageLoaded = true;

            self.removeEvent(window, "load", pageLoadCallback);

            var listeners = self.globals.pageLoadListeners;
            for (var i = 0; i < listeners.length; i++) {
                var listener = listeners[i];
                try {
                    listener();
                }
                catch (e) {
                    WIDGETBOX.logMessage(e);
                }
            }

        },

        setPageUnloaded : function() {
            if (self.globals.pageUnloaded) return;

            self.globals.pageUnloaded = true;

            self.removeEvent(window, "unload", pageUnloadCallback);

            var listeners = self.globals.pageUnloadListeners;
            for (var i = 0; i < listeners.length; i++) {
                var listener = listeners[i];
                try {
                    listener();
                }
                catch (e) {
                    WIDGETBOX.logMessage(e);
                }
            }

        }

    };

    POSTAPP = WIDGETBOX;
    var self = WIDGETBOX;
    self.init();

})();

//EOF: WIDGETBOX.js


//SOF: subscriber/InsertWidget.js
//
    //support rendering a widget in an element by supplying and id to the element
    WIDGETBOX.renderWidgetInElement = function(appId, parentNodeId) {
        return WIDGETBOX.renderWidget(appId, false, parentNodeId);
    },
    WIDGETBOX.renderWidget = function(appId, mode, parentNodeId) {
        if (!parentNodeId) {
            parentNodeId = "widgetbox_widget_parent_" + WIDGETBOX.globals.widgetCount++;
            document.write("<div id=\"" + parentNodeId + "\" style=\"line-height:0\"></div>");
        }
        function libReadyCallback() {
            var parentNode = document.getElementById(parentNodeId);
            if (!parentNode) {
                document.write("<div id=\"" + parentNodeId + "\" style=\"line-height:0\"><span style=\"visibility:hidden\">-</span></div>");
                parentNode = document.getElementById(parentNodeId);
            }
            WIDGETBOX.subscriber.Main.insertWidget(appId, null, parentNode, mode, null, null);
        }
        WIDGETBOX.load("subscriber.Main", libReadyCallback, true);
    };
//
//EOF: subscriber/InsertWidget.js
