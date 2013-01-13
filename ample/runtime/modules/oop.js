var nClassNumber = 0,
	hEvents = {},
	hConstructors = {},
	aValidKeys = [
		"extends",
		"statics",
		"construct",
		"vars",
		"events",
		"methods"
	];

function cEventTypeException (sType, sAction) {
	Error.call(this);
	this.name = "EventTypeException";
	this.message = "Attempt to " + sAction + " for unsupported event type " + sType;
}

cEventTypeException.prototype = Error.prototype;

function fCheckPermission (oArguments, sName, sFullClassName, sClsKey, bProtected) {
	var sErr = "Cannot access " + (bProtected ? "protected" : "private")
			+ " method " + sFullClassName + "." + sName + "()",
		nLimit = 100,
		fCaller,
		oMatch,
		aComponents1,
		aComponents2,
		nIndex,
		nLength1,
		nLength2,
		bMatching;
	if (oArguments && oArguments.callee && typeof oArguments.callee.caller !== "undefined") {
		for (fCaller = oArguments.callee.caller; fCaller; fCaller = fCaller.caller) {
			//noinspection IfStatementWithTooManyBranchesJS
			if (fCaller.$granted || fCaller.$clsid && fCaller.$clsid === sClsKey) {
				return;
			}
			else if (bProtected
				&& fCaller.$clsid
				&& (oMatch = fCaller.$clsid.match(/^key:([a-z0-9]+)$/))
				) {
				aComponents1 = ("" + parseInt(oMatch[1], 36)).split("9");
				aComponents2 = ("" + parseInt(sClsKey.substr(4), 36)).split("9");
				nLength1 = aComponents1.length;
				nLength2 = aComponents2.length;
				bMatching = nLength1 > nLength2;
				for (nIndex = 0; nIndex < nLength2 && bMatching; nIndex++) {
					if (aComponents1[nIndex] !== aComponents2[nIndex]) {
						bMatching = false;
					}
				}
				if (bMatching) {
					return;
				}
			}
			else if (fCaller.$clsid) {
				throw new Error(sErr);
			}
			else if (!(nLimit--)) {
				throw new Error(sErr);
			}
		}
	}
	throw new Error(sErr);
}

function fCreateConstructor (fConstruct, sExtends, oVariables, aEvents, sFullClassName, sClsKey) {
	var cClass = function () {
		var oThat = this,
			cParent = fResolve(sExtends),
			oPrivateVariables = {},
			oListeners = {},
			aSuspended = [],
			sErr,
			sSourceName,
			sDestinationName,
			nIndex,
			nLength,
			sType,
			bPrivate,
			bProtected;
		this.$parent = cParent.prototype;
		for (sSourceName in oVariables) {
			if (oVariables.hasOwnProperty(sSourceName)) {
				sDestinationName = sSourceName.replace(/^[+#\-]/, "");
				bPrivate = sSourceName[0] === "-";
				bProtected = sSourceName[0] === "#";
				if (bPrivate || bProtected) {
					if (typeof oVariables[sSourceName] === "object" && oVariables[sSourceName] !== null
						|| oVariables[sSourceName] instanceof Function
						) {
						sErr = (bProtected ? "Protected" : "Private")
							+ " variable " + sDestinationName + " must be an atomic value";
						throw new Error(sErr);
					}
					oPrivateVariables[sDestinationName] = oVariables[sSourceName];
					(function (sName, bProtected) {
						oThat[sName] = function (vValue) {
							var cOldParent = this.$parent,
								vResult;
							fCheckPermission(arguments, sName, sFullClassName, sClsKey, bProtected);
							this.$parent = cParent.prototype;
							if (typeof vValue === "undefined") {
								vResult = oPrivateVariables[sName];
							}
							else {
								oPrivateVariables[sName] = vValue;
							}
							this.$parent = cOldParent;
							return vResult;
						};
						fHideMethodBody(oThat[sName], sName, ["vValue"], false, bProtected, true);
						oThat[sName].$clsid = sClsKey;
					}
					)(sDestinationName, bProtected);
				}
			}
		}
		if (!(aEvents instanceof Array)) {
			sErr = "The events property must be an array of strings";
			throw new Error(sErr);
		}
		for (nIndex = 0, nLength = aEvents.length; nIndex < nLength; nIndex++) {
			sType = typeof aEvents[nIndex];
			if (sType !== "string") {
				sErr = String(nIndex + 1);
				switch (nIndex % 10) {
					case 0:
						sErr += "st";
						break;
					case 1:
						sErr += "nd";
						break;
					case 2:
						sErr += "rd";
						break;
					default:
						sErr += "th";
				}
				sErr += " event type must be a string, " + sType + " given";
				throw new Error(sErr);
			}
			oListeners[aEvents[nIndex]] = [];
		}
		if (hEvents[sExtends]) {
			for (nIndex = 0, nLength = hEvents[sExtends].length; nIndex < nLength; nIndex++) {
				aEvents.push(hEvents[sExtends][nIndex]);
				oListeners[hEvents[sExtends][nIndex]] = [];
			}
		}
		if (aEvents.length) {
			fDeclareEventMethods(this, oListeners, aSuspended);
		}
		this.toString = function () {
			return "[object " + sFullClassName + "]";
		};
		this.toString.toString = null;
		hConstructors[sFullClassName](this, arguments);
	};
	hEvents[sFullClassName] = aEvents;
	hConstructors[sFullClassName] = function (oThis, aArguments) {
		oThis.$base = function () {
			hConstructors[sExtends]
				? hConstructors[sExtends](oThis, arguments)
				: fResolve(sExtends).apply(oThis, arguments);
		};
		oThis.$base.$clsid = sClsKey;
		fConstruct.apply(oThis, aArguments);
	};
	hConstructors[sFullClassName].$clsid = sClsKey;
	cClass.$clsid = sClsKey;
	return cClass;
}

function fDeclareEventMethods (oPrototype, oListeners, aSuspended) {
	oPrototype.hasEventType = function (sEventType) {
		return oListeners[sEventType] !== undefined;
	};
	oPrototype.addEventListener = function (sEventType, fCallback) {
		var sErr = "Event handler for event type " + sEventType + " must be a function, "
			+ (typeof fCallback) + " given";
		if (!oPrototype.hasEventType(sEventType)) {
			throw new cEventTypeException(sEventType, "register listener");
		}
		if (!(fCallback instanceof Function)) {
			throw new Error(sErr);
		}
		oListeners[sEventType].push(fCallback);
		return fCallback;
	};
	oPrototype.removeEventListener = function (sEventType, fCallback) {
		var nIndex,
			nLength,
			aListeners;
		if (!oPrototype.hasEventType(sEventType)) {
			throw new cEventTypeException(sEventType, "unregister listener");
		}
		aListeners = oListeners[sEventType];
		for (nIndex = 0, nLength = aListeners.length; nIndex < nLength; nIndex++) {
			if (aListeners[nIndex] === fCallback) {
				aListeners[nIndex] = null;
				return fCallback;
			}
		}
		return null;
	};
	oPrototype.fireEvent = function (sEventType, vData) {
		var nIndex,
			nLength,
			aListeners,
			oEvent,
			bSuspended;
		if (!oPrototype.hasEventType(sEventType)) {
			throw new cEventTypeException(sEventType, "fire event");
		}
		for (nIndex = 0, nLength = aSuspended.length; nIndex < nLength; nIndex++) {
			if (aSuspended[nIndex] === sEventType) {
				bSuspended = true;
				break;
			}
		}
		if (!bSuspended) {
			aListeners = oListeners[sEventType];
			oEvent = {type: sEventType, target: oPrototype, data: vData || null};
			for (nIndex = 0, nLength = aListeners.length; nIndex < nLength; nIndex++) {
				if (aListeners[nIndex] === null) {
					aListeners.splice(nIndex, 1);
					nIndex--;
					nLength--;
				}
				else {
					aListeners[nIndex].call(oPrototype, oEvent);
				}
			}
		}
	};
	oPrototype.resumeEvents = function () {
		var nIndex1,
			nIndex2,
			nLength1,
			nLength2,
			sType;
		for (nIndex1 = 0, nLength1 = arguments.length; nIndex1 < nLength1; nIndex1++) {
			sType = arguments[nIndex1];
			if (!oPrototype.hasEventType(sType)) {
				throw new cEventTypeException(sType, "resume listeners");
			}
			for (nIndex2 = 0, nLength2 = aSuspended.length; nIndex2 < nLength2; nIndex2++) {
				if (aSuspended[nIndex2] === sType) {
					aSuspended.splice(nIndex2, 1);
					nIndex2--;
					nLength2--;
				}
			}
		}
	};
	oPrototype.suspendEvents = function () {
		var nIndex,
			nLength,
			sType;
		for (nIndex = 0, nLength = arguments.length; nIndex < nLength; nIndex++) {
			sType = arguments[nIndex];
			if (!oPrototype.hasEventType(sType)) {
				throw cEventTypeException(sType, "suspend listeners");
			}
			aSuspended.push(sType);
		}
	};
	fHideMethodBody(oPrototype.hasEventType, "hasEventType", ["sEventType"], true);
	fHideMethodBody(
		oPrototype.addEventListener,
		"addEventListener",
		["sEventType", "fCallback"],
		true
	);
	fHideMethodBody(
		oPrototype.removeEventListener,
		"removeEventListener",
		["sEventType", "fCallback"],
		true
	);
	fHideMethodBody(oPrototype.fireEvent, "fireEvent", ["sEventType", "vData"], true);
	fHideMethodBody(oPrototype.resumeEvents, "resumeEvents", [], true);
	fHideMethodBody(oPrototype.suspendEvents, "suspendEvents", [], true);
}

function fDeclareMethods (oPrototype, oMethods, sFullClassName, sClsKey, sExtends) {
	var cParent = fResolve(sExtends),
		sSourceName,
		sMethod,
		sDestinationName,
		oMatch,
		aParams,
		bPrivate,
		bProtected,
		bPublic,
		sErr;
	oMethods["#$grant"] = function (fFunction) {
		var fWrapper = function () {
			return fFunction.apply(this, arguments);
		};
		fWrapper.$granted = true;
		fWrapper.toString = function () {
			return "public privileged function () { ... }";
		};
		fWrapper.toString.toString = null;
		return fWrapper;
	};
	for (sSourceName in oMethods) {
		if (oMethods.hasOwnProperty(sSourceName)) {
			sMethod = oMethods[sSourceName] && oMethods[sSourceName].toString
				? oMethods[sSourceName].toString()
				: "";
			oMatch = sMethod.match(/^function\s*\(([^)]*)\)\s*\{/);
			aParams = oMatch ? oMatch[1].split(/\s*,\s*/) : [];
			sDestinationName = sSourceName.replace(/^[+#\-]/, "");
			bPrivate = sSourceName[0] === "-";
			bProtected = sSourceName[0] === "#";
			if (!(oMethods[sSourceName] instanceof Function)) {
				sErr = "Method " + sFullClassName + "." + sDestinationName + " must be a function";
				throw new Error(sErr);
			}
			(function (sSourceName, sDestinationName, bPrivate, bProtected) {
				oPrototype[sDestinationName] = function () {
					var cOldParent = this.$parent,
						vResult;
					if (bPrivate || bProtected) {
						fCheckPermission(
							arguments,
							sDestinationName,
							sFullClassName,
							sClsKey,
							bProtected
						);
					}
					this.$parent = cParent.prototype;
					vResult = oMethods[sSourceName].apply(this, arguments);
					this.$parent = cOldParent;
					return vResult;
				};
				oPrototype[sDestinationName].$clsid = sClsKey;
				fHideMethodBody(
					oPrototype[sDestinationName],
					sDestinationName,
					aParams,
					!(bPrivate || bProtected),
					bProtected
				);
			}
			)(sSourceName, sDestinationName, bPrivate, bProtected);
		}
	}
}

function fDeclarePublicVariables (oPrototype, oVariables) {
	var sSourceName,
		sDestinationName,
		sErr,
		bPrivate,
		bProtected,
		bPublic;
	for (sSourceName in oVariables) {
		if (oVariables.hasOwnProperty(sSourceName)) {
			sDestinationName = sSourceName.replace(/^[+#\-]/, "");
			bPrivate = sSourceName[0] === "-";
			bProtected = sSourceName[0] === "#";
			bPublic = !bPrivate && !bProtected;
			if (bPublic) {
				if (typeof oVariables[sSourceName] === "object" && oVariables[sSourceName] !== null
					|| oVariables[sSourceName] instanceof Function
					) {
					sErr = "Public variable " + sDestinationName + " must be an atomic value";
					throw new Error(sErr);
				}
				oPrototype[sDestinationName] = oVariables[sSourceName];
			}
		}
	}
}

function fDeclareStaticMembers (cClass, oMembers) {
	var sName, sMethod, oMatch, aParams;
	for (sName in oMembers) {
		if (oMembers.hasOwnProperty(sName)) {
			cClass[sName] = oMembers[sName];
			if (oMembers instanceof Function) {
				sMethod = oMethods[sSourceName] && oMethods[sSourceName].toString
					? oMethods[sSourceName].toString()
					: "";
				oMatch = sMethod.match(/^function\s*\(([^)]*)\)\s*\{/);
				aParams = oMatch ? oMatch[1].split(/\s*,\s*/) : [];
				fHideMethodBody(cClass[sName], sName, aParams, true);
			}
		}
	}
}

function fGenerateUniqueId (sClassName, cParentClass) {
	var nId = nClassNumber++,
		aComponents,
		nKey,
		oMatch;
	if (cParentClass.$clsid && (oMatch = cParentClass.$clsid.match(/^key:([a-z0-9]+)$/))) {
		aComponents = ("" + parseInt(oMatch[1], 36)).split("9");
	}
	else {
		aComponents = [Math.floor(Math.random() * 1000000).toString(9)];
	}
	aComponents.push(nId.toString(9));
	return "key:" + (aComponents.join("9") - 0).toString(36);
}

function fHideMethodBody (fMethod, sName, aParams, bPublic, bProteccted, bGetSet) {
	fMethod.toString = function () {
		return (bPublic ? "public" : (bProteccted ? "protected" : "private")) + " "
			+ (bGetSet ? "accessor" : "function") + " " + sName
			+ " (" + aParams.join(", ") + ") { ... }";
	};
	fMethod.toString.toString = null;
}

function fResolve (sFullName, bCreate) {
	var aNames = sFullName.split("."),
		oCurrent = window,
		nLength = aNames.length - (bCreate ? 1 : 0),
		sErr = sFullName + " is not defined",
		nIndex;
	for (nIndex = 0; nIndex < nLength; nIndex++) {
		if (!oCurrent[aNames[nIndex]]) {
			if (bCreate) {
				oCurrent[aNames[nIndex]] = {};
			}
			else {
				throw new Error(sErr);
			}
		}
		oCurrent = oCurrent[aNames[nIndex]];
	}
	return bCreate ? [oCurrent, aNames[nLength]] : oCurrent;
}

/**
 * @param {String} sFullName Full name of the class, e. g. "com.example.MyClass"
 * @param {Object} oConfiguration Class definition, see below.
 * @param {String} [oConfiguration.extends] Full name of parent class, default "Object".
 * @param {Object} [oConfiguration.statics] Static members (variables and functions).
 * @param {Function} [oConfiguration.construct] Constructor function, parent constructor is available as this.$base(arg1, ...).
 * @param {Object} [oConfiguration.vars] Member variables, names of private variables are prefixed with a dash and accessed by calling the autogenerated private function _anyName() / _anyName(newValue).
 * @param {String[]} [oConfiguration.events] An array of event type names available. If non-empty, the methods hasEventType(type:string):boolean, addEventListener(type:string,callback:function):function, removeEventListener(type:string,callback:function):function|null, fireEvent(type:string,data:mixed), suspendEvents(types...:string), resumeEvents(types...:string).
 * @param {Object} [oConfiguration.methods] Methods of the class, private methods are prefixed with a dash, but invoked without any prefix.
 */
oAmple.defineClass = function (sFullName, oConfiguration) {
	var sClsKey,
		aNamespace,
		sKey,
		sErr,
		vValue,
		fConstruct,
		sExtends,
		cClass,
		oVariables,
		aEvents,
		cParent;
	ample.guard(arguments, [
		["fullName", String],
		["configuration", Object]
	]);
	aNamespace = fResolve(sFullName, true);
	sExtends = typeof oConfiguration["extends"] === "string"
		? oConfiguration["extends"]
		: "Object";
	fConstruct = oConfiguration.construct instanceof Function
		? oConfiguration.construct
		: function () {
		this.$base.apply(this, arguments);
	};
	oVariables = typeof oConfiguration.vars === "object"
		? oConfiguration.vars
		: {};
	aEvents = oConfiguration.events instanceof Array
		? oConfiguration.events
		: [];
	sClsKey = fGenerateUniqueId(sFullName, fResolve(sExtends));
	cClass = fCreateConstructor(
		fConstruct,
		sExtends,
		oVariables,
		aEvents,
		sFullName,
		sClsKey
	);
	for (sKey in oConfiguration) {
		if (oConfiguration.hasOwnProperty(sKey)) {
			vValue = oConfiguration[sKey];
			switch (sKey) {
				case "construct":
					if (!(vValue instanceof Function)) {
						sErr = "Constructor must be a function, " + (typeof vValue) + " given";
						throw new Error(sErr);
					}
					break;
				case "events":
					if (!(vValue instanceof Array)) {
						sErr = "Event types must be an array, " + (typeof vValue) + " given";
						throw new Error(sErr);
					}
					break;
				case "extends":
					if (typeof vValue !== "string") {
						sErr = "Parent class must be specified as string, "
							+ (typeof vValue) + " given";
						throw new Error(sErr);
					}
					cParent = fResolve(vValue);
					cClass.prototype = new cParent();
					break;
				case "statics":
					if (typeof vValue !== "object") {
						sErr = "Static members must be specified as object literal, "
							+ (typeof vValue) + " given";
						throw new Error(sErr);
					}
					fDeclareStaticMembers(cClass, vValue);
					break;
				case "vars":
					if (typeof vValue !== "object") {
						sErr = "Member variables must be specified as object literal, "
							+ (typeof vValue) + " given";
						throw new Error(sErr);
					}
					fDeclarePublicVariables(cClass.prototype, vValue);
					break;
				case "methods":
					if (typeof vValue !== "object") {
						sErr = "Methods must be specified as object literal, "
							+ (typeof vValue) + " given";
						throw new Error(sErr);
					}
					fDeclareMethods(cClass.prototype, vValue, sFullName, sClsKey, sExtends);
					break;
				default:
					sErr = "Key " + sKey + " is not supported. " + "Valid keys are "
						+ aValidKeys.join(", ");
					throw new Error(sErr);
			}
		}
	}
	aNamespace[0][aNamespace[1]] = cClass;
};
