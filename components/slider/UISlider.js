/*
    Moby Tools UISlider
    (https://github.com/LeoDutra/Moby-Tools/tree/master/components/slider)
	
	MIT License:
	Copyright (c) 2012 Leonardo Dutra Constancio
	 
	Permission is hereby granted, free of charge, to any person
	obtaining a copy of this software and associated documentation
	files (the "Software"), to deal in the Software without
	restriction, including without limitation the rights to use,
	copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following
	conditions:
	 
	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.
	 
	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
	OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
	HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
	WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	OTHER DEALINGS IN THE SOFTWARE.
 */
/* CUSTOM SLIDER para Android/Desktop browsers
 * 
 * Como usar:
 * 
 *         // incluir o CSS slider.css
 * 
 *     	$(document).ready(function() {
 * 			new UISlider(document.getElementById('ID DO MEU SLIDER'), initialValue, max, min, modifier, snapping, function(valor) { }, vertical);
 *		});
 * 
 */

(function(window) {

    "use strict"; // Strict Mode compilant

    function UISlider(slider, initialValue, max, min, modifier, snapping, valueCallback, vertical) {
        if (this instanceof UISlider && slider && slider.nodeType === 1 /* MUST BE AN ELEMENT */ ) {
            this.slider = slider;
            
            // GLOBALS TO LOCAL
            var document = window.document;
            
            if (typeof modifier === 'number') this.modifier = modifier;
            if (typeof min === 'number') this.min = min;
            if (typeof max === 'number') this.max = max;
            if (typeof initialValue === 'number') this.value = initialValue;
            if (typeof valueCallback === 'function') this.valueCallback = valueCallback;
            if (typeof snapping==='boolean') this.snapping = snapping;
            if (typeof vertical==='boolean') this.vertical = vertical;

            // INNER AREA
            this.innerArea = this.slider.appendChild(document.createElement('div')); // needs append to get offsets
            this.innerArea.className = 'innerArea';

            // FILLER
            var filler = this.innerArea.appendChild(document.createElement('div'));
            filler.className = 'filler';
            this.fillerStyle = filler.style;

            // KNOT
            this.knot = this.innerArea.appendChild(document.createElement('div')); // needs append to get offsets
            this.knot.className = 'knot';
            this.knotStyle = this.knot.style;
           
            this.update();
            this.slider.addEventListener(this.eventStart, this, false);
        }
    }

    UISlider.prototype = {

        hasTouch: 'ontouchend' in window,

        // DEFAULT VALUES
        value: 0,
        max: 100,
        min: 0,
        modifier: 1,
        snapping: false,
        vertical: false,
        valueCallback: null,

        // VARS
        isBuilt: false,
        globalOffset: 0,
        steps: 0,
        snapGap: 0,
        knotSize: 0,
        knotHalfSize: 0,
        knotPosition: 0,
        variationAreaStart: 0,
        valuableArea: 0,
        innerArea: null,
        innerAreaSize: 0,
        slider: null,
        knot: null,
        knotStyle: null,
        fillerStyle: null,

        // DEFAULT EVENT TYPES
        eventStart: 'touchstart',
        eventMove: 'touchmove',
        eventEnd: 'touchend',
        eventCancel: 'touchcancel',
        eventLeave: 'touchleave',

        // REDRAW LOCK
        redrawLocked: false,
        
        update: function(skipRedraw) {
            
            this.innerAreaSize = this.vertical ? this.innerArea.offsetHeight : this.innerArea.offsetWidth;
            this.knotSize = this.vertical ? this.knot.offsetHeight : this.knot.offsetWidth;
            this.knotHalfSize = this.knotSize * 0.5;
            var valueVariation = this.max - this.min;
            this.steps = /* ceil to threat a possible remainder value */Math.ceil(valueVariation / this.modifier);

            this.valuableArea = this.limit(this.innerAreaSize - this.knotSize, this.knotSize);
            this.snapGap = this.valuableArea / this.steps;

            this.setValue(this.value, skipRedraw);
        },
        
        snapping: function(s, skipRedraw) {
            if (typeof s==='boolean') {
                this.snapping = s;
                this.update(skipRedraw);
            }
            return this.snapping;
        },
        
        max: function(max, skipRedraw) {
            if (typeof max==='number') {
                this.max = max;
                this.update(skipRedraw);
            }
            return this.max;
        },
        
        min: function(min, skipRedraw) {
            if (typeof min==='number') {
                this.min = min;
                this.update(skipRedraw);
            }
            return this.min;
        },
        
        
        vertical: function(vertical, skipRedraw) {
            if (typeof vertical==='boolean') {
                this.vertical = vertical;
                this.update(skipRedraw);
            }
            return this.vertical;
        },
        
        value: function(value, skipRedraw) {
            
            var variableValue = (Number(value) || this.value) - this.min;
            var stepsFromOrigin = Math.round(variableValue / this.modifier);
            
            this.value = this.limit(stepsFromOrigin * this.modifier + this.min, this.min, this.max);
            if (this.valueCallback) this.valueCallback(this.value);
            
            this.knotPosition = this.limit(stepsFromOrigin * this.snapGap, 0, this.valuableArea);
            this.redraw(skipRedraw);
            return this.value;
        },

        redraw: function(skip) {
            if (skip) return;
            var that = this;
            this._requestBrowserRedraw(function() {
                that.knotStyle.cssText = (that.vertical ? 'top:' : 'left: ') + (that.knotPosition >> 0) + 'px';
                that.fillerStyle.cssText = (that.vertical ? 'height:' : 'width: ') + (that.knotPosition + that.knotHalfSize >> 0) + 'px';
                that = null; // avoids scope counting leak
            });
        },

        // GENERAL EVENT HANDLER
        handleEvent: function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // smart and optimum force
            if (e.touches) {
                e = e.changedTouches[0];
            }

            switch (e.type) {
            case this.eventStart:
                return this.onStart(e);
            case this.eventMove:
                return this.onMove(e);
            case this.eventEnd:
            case this.eventCancel:
            case this.eventLeave:
                return this.onEnd(e);
            }

        },

        onStart: function(e) {
            var offset = this.getGlobalOffset(this.slider);
            this.globalOffset = this.vertical ? offset.y : offset.x;

            document.addEventListener(this.eventEnd, this, false);
            document.addEventListener(this.eventMove, this, false);
        },

        onMove: function(e) {
            var pointerRelativePosition = this.limit((e.pageX|| e.pageY) - this.globalOffset - this.knotHalfSize, 0, this.valuableArea);
            var stepsFromOrigin = Math.round(pointerRelativePosition / this.snapGap);
        
            this.value = this.limit(stepsFromOrigin * this.modifier + this.min, this.min, this.max);
            if (this.valueCallback) this.valueCallback(this.value);
            
            this.knotPosition = this.snapping ? this.limit(stepsFromOrigin * this.snapGap, 0, this.valuableArea) : pointerRelativePosition;
            this.redraw();
        },

        onEnd: function(e) {
            this._removeVolatileListeners();
        },
        
        _removeVolatileListeners: function() {
            document.removeEventListener(this.eventMove, this, false);
            document.removeEventListener(this.eventEnd, this, false);    
        },

        valueCallback: function(fn) {
            if (typeof fn === 'function') {
                this.valueCallback = fn;
                this.update();
            }
            return this.valueCallback;
        },

        destroy: function() {
            this._removeVolatileListeners();
            document.removeEventListener(this.eventStart, this, false);
            var slider = this.slider;
            var children = slider.childNodes;
            var i = children.length;
            while(i--) slider.removeChild(children[i]);
            this.slider = this.knot = this.knotStyle = this.fillerStyle = this.valueCallback = this.innerArea = slider = null;
        },

        getGlobalOffset: function(el) {
            var x = 0;
            var y = 0;
            while (el) {
                x += el.offsetLeft;
                y += el.offsetTop;
                el = el.offsetParent;
            }
            return {
                x: x,
                y: y
            };
        },

        limit: function(num, min, max) {
            // Tip: NaN < 0 === false and NaN > 0 === false
            // this order avoids NaN
            max = typeof max === 'number' ? max : Infinity;
            return num > max ? max : min < num ? num : min;
        },
    
        _requestBrowserRedraw: function(callback) {
            if (!this.redrawLocked) {
                this.redrawLocked = true;
                var that = this;
                this._requestAnimFrame(function(time) {
                    if (callback) callback(time);
                    that.redrawLocked = callback = false; // avoids memory leak
                });
            }
        },

        _requestAnimFrame:function(callback) {
            window.setTimeout(callback, 17);
        }

        
    };


    // compatibilize event types
    var proto = UISlider.prototype;
    if (!proto.hasTouch) {
        proto.eventStart = 'mousedown';
        proto.eventMove = 'mousemove';
        proto.eventEnd = 'mouseup';
        proto.eventLeave = 'mouseout';
        proto.eventCancel = 'mouseout';
    }

    window.UISlider = UISlider;

})(this);