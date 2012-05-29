/* CUSTOM SLIDER para Android/Desktop browsers (IE inclusive)
 * 
 * Como usar:
 * 
 *     	// incluir o CSS slider.css
 * 
 * 		$(document).ready(function() {
 * 			new UISlider(document.getElementById('ID DO MEU SLIDER'), initialValue, max, min, modifier, snapping, function(valor) { }, vertical);
 *		});
 * 
 */

(function(window) {

    "use strict";

    function UISlider(slider, initialValue, max, min, modifier, snapping, valueCallback, vertical) {
        if (this instanceof UISlider && slider && slider.nodeType === 1 /* MUST BE AN ELEMENT */ ) {

            // GLOBALS TO LOCAL
            var document = window.document;

            this.slider = slider;

            if (typeof modifier === 'number') this.modifier = modifier;
            if (typeof min === 'number') this.min = min;
            if (typeof max === 'number') this.max = max;
            if (typeof initialValue === 'number') this.initialValue = initialValue;
            if (typeof valueCallback === 'function') this.valueCallback = valueCallback;
            this.snapping = !! snapping;
            this.vertical = !! vertical;

            var innerArea = slider.appendChild(document.createElement('div')); // needs append to get offsets
            innerArea.className = 'innerArea';
            this.innerAreaSize = vertical ? innerArea.offsetHeight : innerArea.offsetWidth;

            var filler = innerArea.appendChild(document.createElement('div'));
            filler.className = 'filler';
            this.fillerStyle = filler.style;

            var knot = innerArea.appendChild(document.createElement('div')); // needs append to get offsets
            knot.className = 'knot';
            this.knotStyle = knot.style;
            this.knotSize = vertical ? knot.offsetHeight : knot.offsetWidth;
            this.knotHalfSize = this.knotSize / 2;

            // relative properties for calcs
            this.dragAreaSize = this.limit(this.innerAreaSize - this.knotSize, this.knotSize, Infinity);
            var relativeValue = this.max - this.min;

            this.snaps = Math.ceil(relativeValue / this.modifier) + (this.snapping ? 0 : 1); // +1 = last snap contact area
            this.snapSize = this.dragAreaSize / this.snaps;
        }
    }

    UISlider.prototype = {

        hasTouch: 'ontouchend' in window,

        // DEFAULT VALUES
        initialValue: 0,
        max: 100,
        min: 0,
        modifier: 1,
        snapping: false,
        innerAreaSize: 0,
        vertical: false,

        // VARS
        globalOffset: 0,
        snaps: 0,
        snapSize: 0,
        knotSize: 0,
        knotHalfSize: 0,
        dragAreaSize: 0,
        slider: null,
        knotStyle: null,        
        fillerStyle: null,
        valueCallback: function empty() {},

        updateKnot: function() {
            valueCallback(min);
            var knotPosition = 0;
            knotStyle.cssText = 'left: ' + knotPosition + 'px';
            fillerStyle.cssText = 'width: ' + (knotPosition + knotHalfWidth) + 'px';



            var knotPosition = limit(pointerX - sliderGlobalLeft - knotHalfWidth, 0, dragAreaWidth);

            var snapsToLeft = (knotPosition / snapWidth) >> 0; // n >> 0 === (parseInt(n, 10) || 0)
            valueCallback(limit(snapsToLeft * modifier + min, min, max));
            knotPosition = snapping ? limit(snapsToLeft * snapWidth, 0, dragAreaWidth) : knotPosition;

            requestRedraw(function(time) {
                knotStyle.cssText = 'left: ' + knotPosition + 'px';
                fillerStyle.cssText = 'width: ' + (knotPosition + knotHalfWidth) + 'px';
            });
        },

        handleEvent: function(e) {
            switch (e.type) {
            case 'touchstart':
                return this.onStart(e);
            case 'touchmove':
                return this.onMove(e);
            case 'touchend':
            case 'touchcancel':
            case 'touchleave':
                return this.onEnd(e);
            }
        },

        onStart: function(e) {
            var offset = this.getGlobalOffset();
            this.sliderGlobalOffset = this.vertical ? offset.x : offset.y;

            document.addEventListener('touchmove', this, false);
        },

        onMove: function(e) {

        },

        onEnd: function(e) {
            e.preventDefault();
            e.stopPropagation();

            document.removeEventListener('touchmove', this, false);
        },

        setValueCallback: function(fn) {
            if (typeof fn === 'function') this.valueCallback = fn;
        },

        setValue: function(value) {
            value = this.limit(this.min, value, this.max);

        },

        destroy: function() {
            this.handleEvent = function() {};
            this.slider = this.knotStyle = this.fillerStyle = this.valueCallback = null;
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

        limit: function(min, num, max) {
            // Tip: NaN < 0 === false and NaN > 0 === false
            // this order avoids NaN
            return value > max ? max : min < value ? value : min;
        }
    };



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

        var snaps = Math.ceil(valueVariation / modifier) + (snapping ? 0 : 1); // +1 = last snap contact area
        var snapWidth = dragAreaWidth / snaps;

        valueCallback(min);
        var knotPosition = 0;
        knotStyle.cssText = 'left: ' + knotPosition + 'px';
        fillerStyle.cssText = 'width: ' + (knotPosition + knotHalfWidth) + 'px';

        function updateKnot(pointerX) {

            var knotPosition = limit(pointerX - sliderGlobalLeft - knotHalfWidth, 0, dragAreaWidth);

            var snapsToLeft = (knotPosition / snapWidth) >> 0; // n >> 0 === (parseInt(n, 10) || 0)
            valueCallback(limit(snapsToLeft * modifier + min, min, max));
            knotPosition = snapping ? limit(snapsToLeft * snapWidth, 0, dragAreaWidth) : knotPosition;

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

    function fakeFunction() { /*used in place of expected functions for fast pace on Android and IE*/
    }
    window.UISlider = UISlider;

})(this);