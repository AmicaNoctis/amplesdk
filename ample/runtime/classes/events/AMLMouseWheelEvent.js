/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2009 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */

var cAMLMouseWheelEvent	= function(){};
cAMLMouseWheelEvent.prototype	= new cAMLMouseEvent;

// nsIAMLMouseWheelEvent
cAMLMouseWheelEvent.prototype.wheelDelta	= null;

cAMLMouseWheelEvent.prototype.initMouseWheelEvent	= function(sType, bCanBubble, bCancelable, oView, nDetail, nScreenX, nScreenY, nClientX, nClientY, nButton, oRelatedTarget, sModifiersList, nWheelDelta)
{
/*
	// Validate arguments
	fAML_validate(arguments, [
		["type",		cString],
		["canBubble",	cBoolean],
		["cancelable",	cBoolean]
	], "initMouseWheelEvent");
*/
	this.initMouseEvent(sType, bCanBubble, bCancelable, oView, nDetail, nScreenX, nScreenY, nClientX, nClientY, sModifiersList.indexOf("Control") >-1, sModifiersList.indexOf("Alt") >-1, sModifiersList.indexOf("Shift") >-1, sModifiersList.indexOf("Meta") >-1, nButton, oRelatedTarget);

	this.wheelDelta	= nWheelDelta;
};
