class Zoomy{
	constructor(elementId) {
		this.el = document.getElementById(elementId);
		const {el} = this;
		Object.assign(el, {
			mouseIsDown : false,
			lastMousePos : false,
			isDragging : false,
			oldMouseX : 0,
			newMouseX : 0,
			oldMouseY : 0,
			newMouseY : 0
		});
		['mousemove', 'mouseup', 'mouseout', 'wheel'].forEach(event => document.addEventListener(event, this.handleMouseEvents.bind(this), {passive: false}));
		el.addEventListener("mousedown", this.handleMouseEvents.bind(this), {passive: false});
	}

	/**
	 * 'Resize and move image' (output) on screen based on 'mouse action' (input)
	 * @param {HTMLElement} el
	 * @param {Event} e
	 */
	transformByMouseEvent(el, e) {

		this.el.oldMouseX = this.el.newMouseX || 0;
		this.el.oldMouseY = this.el.newMouseY || 0;
		this.el.newMouseX = e.x;
		this.el.newMouseY = e.y;

		var moveXBy = 0;
		var moveYBy = 0;

		this.el.isDragging = false;
		if (e.type === 'mousedown') {
			this.el.mouseIsDown = true;
		}
		if (e.type === 'mouseup') {
			this.el.mouseIsDown = false;
		}
		if (this.el.mouseIsDown && e.type === 'mousemove') {
			this.el.isDragging = true;
			this.el.lastMousePos = true;
		}
		if(this.el.isDragging && this.el.lastMousePos){
			moveXBy += this.el.newMouseX - this.el.oldMouseX;
			moveYBy += this.el.newMouseY - this.el.oldMouseY;
		}


		var r = this.el.getBoundingClientRect();
		var enlargeOrShrinkBy = 0;
		var zoomFactor = .1;

		if (e.deltaY) {
			enlargeOrShrinkBy = e.deltaY > 0 ? -zoomFactor : zoomFactor;
			var mouseX = e.x,
				mouseY = e.y,
				centerX = r.left + r.width / 2,
				centerY = r.top + r.height / 2,
				newCenterXDiff = mouseX - centerX,
				newCenterYDiff = mouseY - centerY,
				currentScaleX = r.width / this.el.width,
				currentScaleY = r.height / this.el.height;
			moveXBy = -(newCenterXDiff / currentScaleX * enlargeOrShrinkBy);
			moveYBy = -(newCenterYDiff / currentScaleY * enlargeOrShrinkBy);
			//Adding constraints
			if(currentScaleX+enlargeOrShrinkBy >= 4 || currentScaleX+enlargeOrShrinkBy <= 0.5){
				moveXBy = 0;
				moveYBy = 0;
				enlargeOrShrinkBy = 0;
			}
		}
		this.transform(el, moveXBy, moveYBy, enlargeOrShrinkBy);
		e.preventDefault();

	}

	/**
	 * This gets the transformation matrix data in real time
	 * @param {HTMLElement} el
	 * @return {{scaleX: number, scaleY: number, translateY: number, translateX: number, skewX: number, skewY: number}}
	 */
	getMatrix(el) {
		var matrix = this.el.style.transform.substring(7);
		matrix = matrix.slice(0, matrix.length-1).split(',').map(parseFloat);
		return {
			scaleX: matrix[0],
			skewY: matrix[1],
			skewX: matrix[2],
			scaleY: matrix[3],
			translateX: matrix[4],
			translateY: matrix[5]
		};
	}

	/**
	 * Side effect: transform an element's geometrical visual appearance
	 * @param {HTMLElement} el
	 * @param {int} moveXBy How much to move left-right, from where it already is. 0 leaves it as it is.
	 * @param {int} moveYBy How much to move up-down, from where it already is. 0 leaves it as it is.
	 * @param {number} enlargeOrShrinkBy How big-small it should get, compared to however it already is. In percentage compared to baseline. 1 being 100%. 0 leaves it as it is.
	 * @return void
	 */
	transform(el, moveXBy = 0, moveYBy = 0, enlargeOrShrinkBy = 0) {
		var m = this.getMatrix(el);
		m.translateX += moveXBy;
		m.translateY += moveYBy;
		m.scaleX += enlargeOrShrinkBy;
		m.scaleY += enlargeOrShrinkBy;
		this.el.style.transform = 'matrix('+Object.values(m).join(', ')+')';
	}

	/**
	 * Handles all mouse events
	 * @param {MouseEvent} e
	 * @return {boolean}
	 */
	handleMouseEvents(e) {
		this.transformByMouseEvent(window.el, e);
	}

}
