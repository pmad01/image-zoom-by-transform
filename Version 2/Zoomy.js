class Zoomy{

	enabled = true;
	mouseIsDown = false;
	lastMousePos = false;
	isDragging = false;
	oldMouseX = 0;
	newMouseX = 0;
	oldMouseY = 0;
	newMouseY = 0;

	constructor(elementId) {
		this.el = document.getElementById(elementId);
		['mousemove', 'mouseup', 'mouseout'].forEach(event => document.addEventListener(event, this.handleMouseEvents.bind(this), {passive: false}));
		['mousedown', 'wheel'].forEach(event => this.el.addEventListener(event, this.handleMouseEvents.bind(this), {passive: false}));
	}

	/**
	 * 'Resize and move image' (output) on screen based on 'mouse action' (input)
	 * @param {HTMLElement} el
	 * @param {Event} e
	 */
	transformByMouseEvent(el, e) {

		this.oldMouseX = this.newMouseX || 0;
		this.oldMouseY = this.newMouseY || 0;
		this.newMouseX = e.x;
		this.newMouseY = e.y;

		var moveXBy = 0;
		var moveYBy = 0;

		this.isDragging = false;
		if (e.type === 'mousedown') {
			this.mouseIsDown = true;
		}
		if (e.type === 'mouseup') {
			this.mouseIsDown = false;
		}
		if (this.mouseIsDown && e.type === 'mousemove') {
			this.isDragging = true;
			this.lastMousePos = true;
		}
		if(this.isDragging && this.lastMousePos){
			moveXBy += this.newMouseX - this.oldMouseX;
			moveYBy += this.newMouseY - this.oldMouseY;
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
			if(currentScaleX + enlargeOrShrinkBy >= 5 || currentScaleX + enlargeOrShrinkBy <= 0.5){
				moveXBy = 0;
				moveYBy = 0;
				enlargeOrShrinkBy = 0;
			}
			if(!this.isInViewport() && !this.el.contains(e.target)){
				moveXBy = 0;
				moveYBy = 0;
			}
		}
		this.transform(el, moveXBy, moveYBy, enlargeOrShrinkBy);
		e.preventDefault();
	}

	/**
	 * This gets the transformation matrix data in real time
	 * @return {{scaleX: number, scaleY: number, translateY: number, translateX: number, skewX: number, skewY: number}}
	 */
	getMatrix() {
		var matrix = this.el.style.transform.substring(7);
		matrix = matrix.slice(0, matrix.length-1).split(',').map(parseFloat);
		if(isNaN(matrix[0])) matrix = [1, 0, 0, 1, 0, 0];
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
		var m = this.getMatrix();
		m.translateX += moveXBy;
		m.translateY += moveYBy;
		m.scaleX += enlargeOrShrinkBy;
		m.scaleY += enlargeOrShrinkBy;
		this.el.style.transform = 'matrix('+Object.values(m).join(', ')+')';
	}

	/**
	 * This method checks if the element is outside the viewport.
	 * @return {boolean}
	 */
	isInViewport() {
		const r = this.el.getBoundingClientRect();
		return (
			r.top >= 0 &&
			r.left >= 0 &&
			r.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
			r.right <= (window.innerWidth || document.documentElement.clientWidth)
		);
	}


	/**
	 * This method removes the event listeners from the instance element of the class.
	 */
	detach(){
		['mousemove', 'mouseup', 'mouseout', 'wheel'].forEach(event => document.removeEventListener(event, this.handleMouseEvents));
		this.el.removeEventListener("mousedown", this.handleMouseEvents);
	}

	/**
	 * This method enables the instance of the class
	 */
	enable(){
		this.enabled = true;
	}

	/**
	 * This method disables the instance of the class
	 */
	disable(){
		this.enabled  = false;
	}

	/**
	 * Handles all mouse events
	 * @param {MouseEvent} e
	 * @return {boolean}
	 */
	handleMouseEvents(e) {
		if(!this.enabled){
			return;
		}
		this.transformByMouseEvent(window.el, e);
	}

}
