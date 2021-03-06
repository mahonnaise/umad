/*jslint strict:false, plusplus:false*/
/*global UMAD: true, jQuery:false, document:false, window:false*/

var UMAD = (function ($) {
	var Io = function (moduleName) {
		this.whoAmI = function () {
			return moduleName;
		};
	};

	(function () {
		var events = {},
			console = window.console || {},
			consoleFunctions = ['log', 'warn', 'error'],
			i,
			makeFunc = function (type) {
				return function () {
					var args;
					if (console[type]) {
						args = Array.prototype.slice.call(arguments);
						args.unshift('[' + this.whoAmI() + ']');
						console[type].apply(console, args);
					}
				};
			};
		Io.prototype.notify = function (type, data) {
			var list, i;
			list = events[type] || [];
			for (i = list.length; i--;) {
				list[i].handler.call(list[i].context, type, data);
			}
		};
		Io.prototype.listen = function (listenTo, handler, context) {
			var i, e;
			console.log(this);
			for (i = listenTo.length; i--;) {
				e = listenTo[i];
				events[e] = events[e] || [];
				events[e].push({
					handler: handler,
					context: context,
					from: this.whoAmI()
				});
			}
		};
		// UIX
		Io.prototype.bind = (function () {
			var registry = {},
				whitespace = /\s+/g,
				smash = function (s) {
					return s.replace(whitespace, ' ').split(' ');
				},
				findWidget = function (target, cssClass) {
					var t = $(target);
					if (t.hasClass(cssClass)) {
						return t;
					}
					return t.closest('.' + cssClass);
				},
				filter = function (triggerClass, func) {
					return function (el, evt) {
						if ($(evt.target).hasClass(triggerClass)) {
							func(el, evt);
						}
					};
				};
			return function (allTypes, cssClass, func) {
				var reg = registry, types, classes, i, type;
				types = smash(allTypes);
				classes = smash(cssClass);
				for (i = types.length; i--;) {
					type = types[i];

					// add a handler if there isn't one for this type
					if (!registry[type]) {
						$(document).bind(type, function (evt) {
							var actions, el, cssClass;
							actions = registry[evt.type];
							for (cssClass in actions) {
								if (actions.hasOwnProperty(cssClass)) {
									el = findWidget(evt.target, cssClass);
									if (el.length) {
										actions[cssClass](el, evt);
									}
								}
							}
						});
					}

					reg[type] = reg[type] || {};
					if (classes.length > 1) {
						reg[type][classes[0]] = filter(classes[1], func);
					} else {
						reg[type][cssClass] = func;
					}
				}
			};
		}());
		for (i = consoleFunctions.length; i--;) {
			Io.prototype[consoleFunctions[i]] = makeFunc(consoleFunctions[i]);
		}
	}());

	return (function () {
		var moduleData = {},
			moduleOptions = {},
			start = function (moduleId) {
				var mod = moduleData[moduleId],
					options = moduleOptions[moduleId],
					i,
					moduleIo = new Io(moduleId);
				try {
					mod.instance = mod.maker($, moduleIo) || {};
					if (mod.instance.init) {
						mod.instance.init(options);
					}
					if (options && mod.instance.initEach) {
						for (i = options.length; i--;) {
							mod.instance.initEach(options[i]);
						}
					}
				} catch (e) {
					moduleIo.error(e);
				}
			},
			stop = function (moduleId) {
				var mod = moduleData[moduleId];
				if (mod.instance) {
					if (mod.instance.destroy) {
						mod.instance.destroy();
					}
					mod.instance = null;
				}
			};
		// start all
		$(document).ready(function () {
			for (var moduleId in moduleData) {
				if (moduleData.hasOwnProperty(moduleId)) {
					start(moduleId);
				}
			}
		});
		// stop all
		$(window).unload(function () {
			for (var moduleId in moduleData) {
				if (moduleData.hasOwnProperty(moduleId)) {
					stop(moduleId);
				}
			}
		});
		return {
			register: function (moduleId, maker) {
				moduleData[moduleId] = {
					maker: maker,
					instance: null
				};
			},
			addOption: function (moduleId, options) {
				var o = moduleOptions;
				o[moduleId] = o[moduleId] || [];
				o[moduleId].push(options);
			}
		};
	}());
}(jQuery));