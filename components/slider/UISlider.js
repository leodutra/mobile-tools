/* CUSTOM SLIDER para Android/Desktop browsers (IE inclusive)
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
            this.rebuild(initialValue, max, min, modifier, snapping, valueCallback, vertical);
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
        globalOffset: 0,
        steps: 0,
        snapGap: 0,
        knotSize: 0,
        knotHalfSize: 0,
        knotPosition: 0,
        variationAreaStart: 0,
        valuableArea: 0,
        innerAreaSize: 0,
        slider: null,
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
        
        rebuild: function(value, max, min, modifier, snapping, valueCallback, vertical) {
            
            // GLOBALS TO LOCAL
            var document = window.document;
            
            //this.destroy();
            
            if (typeof modifier === 'number') this.modifier = modifier;
            if (typeof min === 'number') this.min = min;
            if (typeof max === 'number') this.max = max;
            if (typeof value === 'number') this.value = value;
            if (typeof valueCallback === 'function') this.valueCallback = valueCallback;
            this.snapping = !! snapping;
            this.vertical = !! vertical;
            console.log(snapping)

            // INNER AREA
            var innerArea = this.slider.appendChild(document.createElement('div')); // needs append to get offsets
            innerArea.className = 'innerArea';
            this.innerAreaSize = vertical ? innerArea.offsetHeight : innerArea.offsetWidth;

            // FILLER
            var filler = innerArea.appendChild(document.createElement('div'));
            filler.className = 'filler';
            this.fillerStyle = filler.style;

            // KNOT
            var knot = innerArea.appendChild(document.createElement('div')); // needs append to get offsets
            knot.className = 'knot';
            this.knotStyle = knot.style;
            this.knotSize = vertical ? knot.offsetHeight : knot.offsetWidth;
            this.knotHalfSize = this.knotSize * .5;

            var valueVariation = this.max - this.min;
            this.steps = /* ceil to threat a possible remainder value */Math.ceil(valueVariation / this.modifier);

            this.valuableArea = this.limit(this.innerAreaSize - this.knotSize, this.knotSize);
            this.snapGap = this.valuableArea / this.steps;

            this.setValue(this.value);
            this.slider.addEventListener(this.eventStart, this, false);
        },
        
        setValue: function(value, skipRedraw) {
            
            var variableValue = (Number(value) || this.value) - this.min;
            var stepsFromOrigin = Math.round(variableValue / this.modifier);
            
            this.value = this.limit(stepsFromOrigin * this.modifier + this.min, this.min, this.max);
            if (this.valueCallback) this.valueCallback(this.value);
            
            this.knotPosition = this.limit(stepsFromOrigin * this.snapGap, 0, this.valuableArea);
            this.redraw(skipRedraw);
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

        setValueCallback: function(fn) {
            if (typeof fn === 'function') this.valueCallback = fn;
        },

        destroy: function() {
            this._removeVolatileListeners();
            document.removeEventListener(this.eventStart, this, false);
            var slider = this.slider;
            var children = slider.childNodes;
            var i = children.length;
            while(i--) slider.removeChild(children[i]);
            this.slider = this.knotStyle = this.fillerStyle = this.valueCallback = slider = null;
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
new window.UISlider();
/*
    function UISlider(slider, initialValue, max, min, modifier, snapping, valueCallback) {

        // global to local optimization
        var Number = window.Number;
        var Math = window.Math;
        var parseFloat = window.parseFloat;
        var document = window.document;

        // prepare properties
        if (!slider || slider.nodeType !== 1) {
            return;
        }
        modifier = Number(modifier) || 1;
        min = Number(min) || 0;
        max = Number(max) || 100;
        initialValue = limit(initialValue, min, max);
        valueCallback = typeof valueCallback === 'function' ? valueCallback : fakeFunction;

        var innerArea = slider.appendChild(document.createElement('div'));
        innerArea.className = 'innerArea';
        var innerAreaWidth = innerArea.offsetWidth;

        var filler = innerArea.appendChild(document.createElement('div'));
        filler.className = 'filler';
        var fillerStyle = filler.style;

        var knot = innerArea.appendChild(document.createElement('div'));
        knot.className = 'knot';
        var knotStyle = knot.style;
        var knotWidth = knot.offsetWidth;
        var knotHalfWidth = knotWidth / 2;

        // relative properties for calcs
        var sliderGlobalLeft;
        var dragAreaWidth = limit(innerAreaWidth - knotWidth, knotWidth, Number.MAX_VALUE);
        var valueVariation = max - min;

        var steps = Math.ceil(valueVariation / modifier) + (snapping ? 0 : 1); // +1 = last snap contact area
        var snapWidth = dragAreaWidth / steps;

        valueCallback(min);
        var knotPosition = 0;
        knotStyle.cssText = 'left: ' + knotPosition + 'px';
        fillerStyle.cssText = 'width: ' + (knotPosition + knotHalfWidth) + 'px';

        function updateKnot(pointerX) {

            var knotPosition = limit(pointerX - sliderGlobalLeft - knotHalfWidth, 0, dragAreaWidth);

            var stepsToLeft = (knotPosition / snapWidth) >> 0; // n >> 0 === (parseInt(n, 10) || 0)
            valueCallback(limit(stepsToLeft * modifier + min, min, max));
            knotPosition = snapping ? limit(stepsToLeft * snapWidth, 0, dragAreaWidth) : knotPosition;

            requestRedraw(function(time) {
                knotStyle.cssText = 'left: ' + knotPosition + 'px';
                fillerStyle.cssText = 'width: ' + (knotPosition + knotHalfWidth) + 'px';
            });
        }

        function moveListener(e) {
            e.preventDefault();
            e.stopPropagation();

            updateKnot((e = e.changedTouches[0]).pageX);
        }

        function startMoveListener(e) {
            e.preventDefault();
            e.stopPropagation();
            sliderGlobalLeft = globalOffsetLeft(slider);

            if (isTouchSupported) {
                addEventListener.call(slider, 'touchmove', moveListener, false);
                addEventListener.call(knot, 'touchmove', moveListener, false);
            }
            else {
                addEventListener.call(slider, 'mousemove', compatibleMoveListener, false);
                addEventListener.call(knot, 'mousemove', compatibleMoveListener, false);
                addEventListener.call(document, 'mousemove', compatibleMoveListener, false);
            }
            updateKnot((e = e.changedTouches[0]).pageX);
        }

        function endMoveListener(e) {
            e.preventDefault();
            e.stopPropagation();

            if (isTouchSupported) {
                removeEventListener.call(slider, 'touchmove', moveListener, false);
                removeEventListener.call(knot, 'touchmove', moveListener, false);
            }
            else {
                removeEventListener.call(slider, 'mousemove', compatibleMoveListener, false);
                removeEventListener.call(knot, 'mousemove', compatibleMoveListener, false);
                removeEventListener.call(document, 'mousemove', compatibleMoveListener, false);
            }
        }

        function compatibleStartListener(e) {
            startMoveListener(buildCompatibleEvent(e));
        }

        function compatibleMoveListener(e) {
            moveListener(buildCompatibleEvent(e));
        }

        function compatibleEndListener(e) {
            endMoveListener(buildCompatibleEvent(e));
        }

        if (isTouchSupported) {
            addEventListener.call(slider, 'touchstart', startMoveListener, false);
            addEventListener.call(knot, 'touchstart', startMoveListener, false);
            addEventListener.call(slider, 'touchend', endMoveListener, false);
            addEventListener.call(slider, 'touchleave', endMoveListener, false);
            addEventListener.call(slider, 'touchcancel', endMoveListener, false);
        }
        else {
            addEventListener.call(slider, 'mousedown', compatibleStartListener, false);
            addEventListener.call(knot, 'mousedown', compatibleStartListener, false);
            addEventListener.call(slider, 'mouseup', compatibleEndListener, false);
            addEventListener.call(document, 'mouseup', compatibleEndListener, false);
        }
    }

    var isTouchSupported = 'ontouchstart' in window;
    var redrawRequested = false;

    // window.requestAnimFrame (http://paulirish.com/2011/requestanimationframe-for-smart-animating/)
    var requestAnimFrame = window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };

    function requestRedraw(callback) {
        if (redrawRequested) return;
        redrawRequested = true;
        requestAnimFrame(function(time) {
            callback(time);
            redrawRequested = false;
        });
    }

    function fakeFunction() { /*used in place of expected functions for fast pace on Android and IE/
    }
    window.UISlider = UISlider;

})(this);*/