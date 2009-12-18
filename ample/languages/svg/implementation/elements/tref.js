/*
 * Ample SDK - JavaScript GUI Framework
 *
 * Copyright (c) 2009 Sergey Ilinsky
 * Dual licensed under the MIT and GPL licenses.
 * See: http://www.amplesdk.com/about/licensing/
 *
 */

var cSVGElement_tref	= function(){};
cSVGElement_tref.prototype	= new cSVGElement;

if (!!document.namespaces) {

	cSVGElement_tref.handlers	= {
		'DOMAttrModified':	function(oEvent) {
			if (oEvent.target == this) {
				var oElement	= this.$getContainer();
				switch (oEvent.attrName) {
					case "xlink:href":
						var oTextPath = this.ownerDocument.getElementById(oEvent.newValue.substr(1));
						if (oTextPath)
							oElement.path	= cSVGElement_path.convert(oTextPath.getAttribute("d"));
						break;
				}
			}
		},
		'DOMNodeInsertedIntoDocument':	function(oEvent) {
			var sHref	= this.getAttribute("xlink:href"),
				that	= this;
			if (sHref) {
				setTimeout(function() {
					var oRef	= that.ownerDocument.getElementById(sHref.substr(1));
					if (oRef instanceof cSVGElement_text && oRef.firstChild instanceof AMLCharacterData)
						that.$getContainer("label").string	= oRef.firstChild.data.replace(/^\s+/, '').replace(/\s+$/, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
				});
			}
			// Apply CSS
			cSVGElement.applyCSS(this);
		}
	};

	// presentation
	cSVGElement_tref.prototype.$getTagOpen	= function() {
		var sFontFamily	= cSVGElement.getStyle(this, "font-family") || "Times New Roman",
			sFontWeight	= cSVGElement.getStyle(this, "font-weight"),
			sFontSize	= cSVGElement.getStyle(this, "font-size"),
			sTextAnchor	= cSVGElement.getStyle(this, "text-anchor"),
			// Font size calculations
			aFontSize	= sFontSize.match(/(^[\d.]*)(.*)$/),
			sFontSizeUnit	= aFontSize[2] || "px",
			nFontSizeValue	= aFontSize[1] || 128,
			nFontSize	= Math.round(nFontSizeValue * this.getAspectValue()),
			nMarginTop	= -(sFontSizeUnit == "pt" ? Math.round(nFontSizeValue * 0.35) : nFontSizeValue * 0.35);

		return '<svg2vml:shape class="svg-tspan' + (this.hasAttribute("class") ? ' ' + this.getAttribute("class") : '')+ '"\
					style="position:absolute;margin-top:' + nMarginTop + 'px;left:' + (this.getAttribute("x") || (this.parentNode ? this.parentNode.getAttribute("x") : "0")) + 'px;top:' + (this.getAttribute("y") || (this.parentNode ? this.parentNode.getAttribute("y") : "0")) + 'px;width:100%;height:100%;"\
					path="m 0,0 l 100,0 x" allowoverlap="true"\
				>' + cSVGElement.getTagStyle(this) + '\
					<svg2vml:path textpathok="true" />\
					<svg2vml:textpath on="true" xscale="true" class="svg-tspan--label"\
						style="v-text-align:' + cSVGElement.textAnchorToVTextAlign(sTextAnchor) + ';font-size:' + nFontSize + sFontSizeUnit + ';' + (sFontFamily ? 'font-family:\'' + sFontFamily + '\';' : '') + (sFontWeight ? 'font-weight:' + sFontWeight + ';' : '') + '" />';
	};

	cSVGElement_tref.prototype.$getTagClose	= function() {
		return '</svg2vml:shape>';
	};
};

//Register Element with language
oSVGNamespace.setElement("tref", cSVGElement_tref);