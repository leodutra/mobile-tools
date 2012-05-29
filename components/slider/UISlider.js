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

    "use strict"; // Strict Mode compilant

    function UISlider(slider, initialValue, max, min, modifier, snapping, valueCallback, vertical) {
        if (this instanceof UISlider && slider && slider.nodeType === 1 /* MUST BE AN ELEMENT */ ) {

            // GLOBALS TO LOCAL
            var document = window.document;

            this.slider = slider;

            if (typeof modifier === 'number') this.modifier = modifier;
            if (typeof min === 'number') this.min = min;
            if (typeof max === 'number') this.max = max;
            if (typeof initialValue === 'number') this.value = initialValue;
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
            var variableValue = this.max - this.min;

            this.snaps = Math.ceil(variableValue / this.modifier) + (this.snapping ? 0 : 1); // +1 = last snap contact area
            this.snapSize = this.dragAreaSize / this.snaps;
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
        valueCallback: null,
        
        eventStart: 'touchstart',
        eventMove: 'touchmove',
        eventEnd: 'touchend',
        eventCancel: 'touchcancel',
        eventLeave: 'touchleave',
        
        redrawLocked: false,

        updateKnot: function(pointer) { 
            
            
            // TODO
            
            
            
            var knotPosition = this.limit(pointerX - sliderGlobalLeft - knotHalfWidth, 0, dragAreaWidth);

            var snapsToLeft = (knotPosition / snapWidth) >> 0; // n >> 0 === (parseInt(n, 10) || 0)
            valueCallback(limit(snapsToLeft * modifier + min, min, max));
            knotPosition = snapping ? limit(snapsToLeft * snapWidth, 0, dragAreaWidth) : knotPosition;

            requestRedraw(function(time) {
                knotStyle.cssText = 'left: ' + knotPosition + 'px';
                fillerStyle.cssText = 'width: ' + (knotPosition + knotHalfWidth) + 'px';
            });
        },

        handleEvent: function(e) {
            
            e.preventDefault();
            e.stopPropagation();
            
            // compatibilize touch events
            if (e.touches) {
                var touch = e.touches[0];
                e.pageX = touch.pageX;
                e.pageY = touch.pageY;
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
            
            // TODO
            
            
            
            var offset = this.getGlobalOffset(this.slider);
            this.globalOffset = this.vertical ? offset.x : offset.y;

            document.addEventListener('touchmove', this, false);
        },

        onMove: function(e) {
            // TODO
        },

        onEnd: function(e) {
            // TODO
            document.removeEventListener('touchmove', this, false);
        },

        setValueCallback: function(fn) {
            if (typeof fn === 'function') this.valueCallback = fn;
        },

        setValue: function(value) {
            value = this.limit(this.min, value, this.max);
            this.updateKnot(); // TODO update this call
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
            return num > max ? max : min < num ? num : min;
        },

        requestAnimFrame: (window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 17);
        }),

        requestRedraw: function(callback) {
            if (!this.redrawLocked) {
                this.redrawLocked = true;
                this.requestAnimFrame(function(time) {
                    if (callback) callback(time);
                    this.redrawLocked = callback = false; // avoids memory leak
                });
            }
        }
    };
    
    
    // compatibilize event types
    
    var proto = UISlider.prototype;
    if (!proto.hasTouch) {
        proto.eventStart = 'mousedown';
        proto.eventMove = 'mousemove';
        proto.eventEnd =  'mouseup';
        proto.eventLeave = 'mouseout';
        proto.eventCancel = 'mouseout';
    }

})(this);
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

    function fakeFunction() { /*used in place of expected functions for fast pace on Android and IE/
    }
    window.UISlider = UISlider;

})(this);*/