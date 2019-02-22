/**
	* @author David Rahn <https://github.com/lasernyc>
*/

var MagicCursor = (function() {

	var canvas, cursorSettings, ctx, LOOP, xDirection, yDirection;

	var oldx              = 0;
	var oldy              = 0;
	var buffer            = 0;
	var pointSet          = [];
	var trailSet          = [];
	var initialized       = false;
	var canvasBuilt       = false;

	function setupCursor(settings) {

		cursorSettings = {
			enableTrail:         true,
			trailDensity:        6,
			trailGravity:        -0.5,
			trailColor:          '211, 5, 252',
			singlePointChar:     '+',
			pointSize:           16,
			pointAmount:         70,
			pointGravity:        1,
			pointDissolveRate:   80,
			pointColors:         ['4, 210, 218', '27, 55, 224', '211, 5, 252']
		}

		// Override with user settings if provided
		Object.keys(settings || {}).forEach(function(key){
			cursorSettings[key] = settings[key];
		});

		cursorSettings.pointAmount        = Math.floor(100 - cursorSettings.pointAmount);
		cursorSettings.pointDissolveRate  = cursorSettings.pointDissolveRate / 1000;
	}

	 /**
	 * A single cursor point
	 * @constructor
	 */
	function SinglePoint(e) {
		this.x = e.pageX;
		this.y = e.pageY - window.pageYOffset;
		this.color = cursorSettings.pointColors[getRandomInt(0, cursorSettings.pointColors.length)];
		this.opacity = 1;
		this.xDirection = xDirection;
		this.yDirection = yDirection;
		this.fontSize = cursorSettings.pointSize;
		this.xModifier = getRandomFloat(0.1, 0.5);
		this.gravity = cursorSettings.pointGravity;
	}

	 /**
	 * A single trail item
	 * @constructor
	 */
	function Trail(e) {
		this.x = e.pageX;
		this.y = e.pageY - window.pageYOffset;
		this.size = cursorSettings.trailDensity;
		this.opacity = 1;
	}

	function getRandomFloat(min, max) {
		return Math.random() * (max - min) + min;
	}

	function getRandomInt(min, max) {
		return Math.floor(Math.random() * (max - min) + min);
	}

	function setCanvasSize() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	}

	function setDirection(e) {
		xDirection = e.pageX < oldx ? 'left' : 'right';
		yDirection = e.pageY < oldy ? 'up' : 'down';
		oldx = e.pageX;
		oldy = e.pageY;
	}

	function drawTrails() {
		for (var j = 0; j < trailSet.length; j++){
			var _this = trailSet[j];
			_this.opacity = _this.opacity - 0.06;
			_this.size = _this.size - 0.5;
			_this.y = (_this.y - 1) + cursorSettings.trailGravity;
			ctx.fillStyle = 'rgba(' + cursorSettings.trailColor + ',' + _this.opacity + ')';
			ctx.fillRect(_this.x, _this.y - 5, _this.size, _this.size);
		}

		// strip this trail item from existence once it's no longer visible
		if (trailSet.length > 80){
			trailSet.splice(0,1);
		}
	}

	function drawPoints() {
		for (var i = 0; i < pointSet.length; i++) {
			var _this = pointSet[i];
			_this.opacity = _this.opacity - 0.01;
			_this.fontSize = _this.fontSize - (cursorSettings.pointDissolveRate);
			_this.y = _this.y + _this.gravity;
			_this.x = _this.xDirection === 'left' ? (_this.x - _this.xModifier) : (_this.x + _this.xModifier);
			ctx.font = '100 '+ _this.fontSize + 'px Courier';
			ctx.fillStyle = 'rgba(' + _this.color + ',' + _this.opacity + ')';
			ctx.fillText(cursorSettings.singlePointChar, _this.x, _this.y);
		
			// strip this star from existence once it's no longer visible
			if (_this.opacity <= 0.3){
				pointSet.splice(0, i + 1);
			}
		}
	}


	function drawEverything() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		drawPoints();

		// if currently looping, stop for tablet size and smaller
		if (window.innerWidth < 767){
			destroyCursor();
			return;
		}

		LOOP = requestAnimationFrame(drawEverything);

		if (cursorSettings.trailDensity > 0 && cursorSettings.enableTrail){
			drawTrails();
		}
	}

	function mouseMoveEvent(e) {
		trailSet.push(new Trail(e));
		// throttle stars
		buffer++;
		if (buffer >= cursorSettings.pointAmount/10){
			buffer = 0;
			setDirection(e);
			pointSet.push(new SinglePoint(e));
		}
	}

	function destroyCursor() {
		LOOP = cancelAnimationFrame(drawEverything);
		initialized = false;
		window.removeEventListener('resize', setCanvasSize); //TODO, throttle this
		document.removeEventListener('mousemove', mouseMoveEvent);
	}

	return {
		init: function(settings){
			if (window.innerWidth > 1025 && !initialized) {
				// if there's no canvas, build it
				if (!canvasBuilt){
					canvas = document.createElement('canvas');
					var canvasStyles = "background-color: transparent; position: fixed; top: 0; left: 0; z-index: 12000; pointer-events: none;";
					canvas.id = 'mouse-trail';
					canvas.setAttribute('style', canvasStyles);
					document.body.insertBefore(canvas, document.body.firstChild);
					canvasBuilt = true;
					setupCursor(settings);
				}

				// setup canvas and kick off loop
				ctx = canvas.getContext("2d");
				setCanvasSize();
				LOOP = requestAnimationFrame(drawEverything);
				initialized = true;

				// attach events
				window.addEventListener('resize', setCanvasSize);
				document.addEventListener('mousemove', mouseMoveEvent);
			}
		}
	}

})();
