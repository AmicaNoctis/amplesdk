/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2012 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */

var cComment	= function(){};

cComment.prototype	= new cCharacterData;
cComment.prototype.nodeType	= 8;	// cNode.COMMENT_NODE
cComment.prototype.nodeName	= "#comment";

// nsIDOMComment
//->Source
/*
cComment.prototype.$getTag	= function() {
	return "<!--" + this.nodeValue + "-->";
};
*/
//<-Source
