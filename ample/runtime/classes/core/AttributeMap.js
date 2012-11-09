/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2012 AmicaNoctis
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */

var cAttributeMap	= function(oElement){
	this.$ownerElement = oElement;
};
cAttributeMap.prototype = new Object();
cAttributeMap.prototype.$length = 0;
cAttributeMap.prototype.$ownerElement = null;
cAttributeMap.prototype.getLength = function () {
	var sName;
	for (sName in this) {
		if (this.hasOwnProperty(sName)) {
			this.$length++;
		}
	}
	return this.$length;
};
cAttributeMap.prototype.getNamedItem = function (sName) {
	var sLocalName = sName,
		sPrefix = null,
		sNsUri = null;
	if (this.hasOwnProperty(sName)) {
		if (aMatches = sName.match(/^(.+):(.+)$/)) {
			sLocalName = aMatches[2];
			sPrefix = aMatches[1];
			sNsUri = this.$ownerElement.lookupNamespaceURI(sPrefix);
		}
		else {
			sNsUri = this.$ownerElement.namespaceURI;
		}
		oAttribute = new ample.classes.Attr();
		oAttribute.localName = sLocalName;
		oAttribute.name = sName;
		oAttribute.namespaceURI = sNsUri;
		oAttribute.nodeName = sName;
		oAttribute.nodeValue = this[sName];
		oAttribute.ownerDocument = ample;
		oAttribute.ownerElement = this.$ownerElement;
		oAttribute.prefix = sPrefix;
		oAttribute.specified = true;
		oAttribute.textContent = this[sName];
		oAttribute.value = this[sName];
		return oAttribute;
	}
	return null;
}
cAttributeMap.prototype.getNamedItemNS = function (sNamespaceURI, sLocalName) {
	var sPrefix = this.$ownerElement.namespaceURI === sNamespaceURI
		? null
		: this.$ownerElement.lookupPrefix(sNamespaceURI);
	return this.getNamedItem((sPrefix ? sPrefix + ":" : "") + sLocalName);
}
cAttributeMap.prototype.hasOwnProperty = function (sName) {
	switch (sName) {
		case "$length":
		case "$ownerElement":
		case "getLength":
		case "getNamedItem":
		case "getNamedItemNS":
		case "hasOwnProperty":
		case "item": return false;
		default: return Object.prototype.hasOwnProperty.apply(this, arguments);
	}
};
cAttributeMap.prototype.item = function (nIndex) {
	var sName;
	for (sName in this) {
		if (this.hasOwnProperty(sName)) {
			if (nIndex === 0) return this[sName];
			nIndex--;
		}
	}
	return null;
}
