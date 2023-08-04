class Zoomy {

	/**
	 *The HTML element we want to transform
	 * @type {HTMLElement}
	 */
	el;

	/**
	 *The optional HTML element surrounding el
	 * @type {HTMLElement}
	 */
	boundaryEl;

	/**
	 * Checks if the element is enabled or not
	 * @type {boolean}
	 */
	enabled = true;

	/**
	 * Checks if mouse is clicked
	 * @type {boolean}
	 */
	mouseIsDown = false;

	/**
	 * Checks if we are moving the image
	 * @type {boolean}
	 */
	isDragging = false;

	/**
	 * The X coordinate of the cursor after the previous transformation
	 * @type {number}
	 */
	oldMouseX = 0;

	/**
	 * The X coordinate of the cursor in real time
	 * @type {number}
	 */
	newMouseX = 0;

	/**
	 * The Y coordinate of the cursor after the previous transformation
	 * @type {number}
	 */
	oldMouseY = 0;

	/**
	 * The Y coordinate of the cursor in real time
	 * @type {number}
	 */
	newMouseY = 0;

	/**
	 * Counts the available scrolls, +1 for each zoom in, -1 for each zoom out
	 * @type {number}
	 */
	scrollCounter = 0;

	options = {
		boundaryElementId: null,
		zoomUpperConstraint: null
	};

	/**
	 *
	 * @param elementId
	 * @param {object} options
	 */
	constructor(elementId, options) {
		this.options = options;
		this.el = document.getElementById(elementId);
		var bElId = this.options.boundaryElementId;
		this.boundaryEl = document.getElementById(bElId);
		this.previousImagePos = {
			previousX: [],
			previousY: []
		};
		this.options.zoomUpperConstraint ||= 4;
		var fn = this.handleMouseEvents.bind(this);
		if (this.boundaryEl) {
			this.boundaryRect = this.boundaryEl.getBoundingClientRect();
			this.boundaryEl.addEventListener('wheel', fn, {passive: false});
		} else {
			this.el.addEventListener('wheel', fn, {passive: false});
		}

		this.el.addEventListener('mousedown', fn, {passive: false});

		['mousemove', 'mouseup', 'mouseout'].forEach(
			event => {
				document.addEventListener(event, fn, {passive: false});
			}
		);
	}

	/**
	 * 'Resize and move image' (output) on screen based on 'mouse action' (input)
	 * @param {Event} e
	 */
	transformByMouseEvent(e) {

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
		}
		if (this.isDragging) {
			moveXBy += this.newMouseX - this.oldMouseX;
			moveYBy += this.newMouseY - this.oldMouseY;
		}


		var r = this.el.getBoundingClientRect();
		var enlargeOrShrinkBy = 0;
		var zoomFactor = .1;

		if (e.deltaY) {
			var mouseX = e.x,
				mouseY = e.y,
				centerX = r.left + r.width / 2,
				centerY = r.top + r.height / 2,
				newCenterXDiff = mouseX - centerX,
				newCenterYDiff = mouseY - centerY,
				currentScaleX = Math.round((r.width / this.el.width) * 100) / 100,
				currentScaleY = Math.round((r.height / this.el.height) * 100) / 100;
			    enlargeOrShrinkBy = Math.round(((e.deltaY > 0 ? -zoomFactor : zoomFactor) * currentScaleX) * 100) / 100;

			// Adding upper constraint
			if (currentScaleX + enlargeOrShrinkBy >= this.options.zoomUpperConstraint
				|| currentScaleX + enlargeOrShrinkBy <= 1) {
				moveXBy = 0;
				moveYBy = 0;
				enlargeOrShrinkBy = 0;
			}

			if (this.boundaryEl) {
				if (!this.el.contains(e.target)) {
					if (e.deltaY > 0) {

						var endPositionOfImageFromLeft = this.boundaryEl.offsetWidth / 2 ;
						var endPositionOfImageFromTop = this.boundaryEl.offsetHeight / 2;

						var imageXCoordinate = (r.left - this.boundaryRect.left) + r.width / 2;
						var imageYCoordinate = (r.top - this.boundaryRect.top) + r.height / 2;
						console.log(imageXCoordinate)


						var currentXDistance = Math.round(((endPositionOfImageFromLeft - imageXCoordinate) * 100) / 100);
						var currentYDistance = Math.round(((endPositionOfImageFromTop - imageYCoordinate)  * 100) / 100 );

						if (this.scrollCounter < 2) {
							var matrix = this.getMatrix();
							moveXBy = -matrix.translateX;
							moveYBy = -matrix.translateY;
							enlargeOrShrinkBy = -(matrix.scaleX-1);

						} else {
							moveXBy = -(currentXDistance / (currentScaleX - 1) * enlargeOrShrinkBy);
							moveYBy = -(currentYDistance / (currentScaleY - 1) * enlargeOrShrinkBy);
						}

						this.scrollCounter--;

					} else {
						this.scrollCounter++;
					}

				} else {

					e.deltaY > 0 ? this.scrollCounter-- : this.scrollCounter++;
					moveXBy = -(newCenterXDiff / currentScaleX * enlargeOrShrinkBy);
					moveYBy = -(newCenterYDiff / currentScaleY * enlargeOrShrinkBy);
				}
			}

		}


		this.transform(this.el, moveXBy, moveYBy, enlargeOrShrinkBy);
		e.preventDefault();
	}

	/**
	 * This gets the transformation matrix data in real time
	 * @return {{scaleX: number, scaleY: number, translateY: number, translateX: number, skewX: number, skewY: number}}
	 */
	getMatrix() {
		var matrix = this.el.style.transform?.substring(7);
		if (matrix) {
			matrix = matrix.slice(0, matrix.length - 1).split(',').map(parseFloat);
		} else {
			matrix = [1, 0, 0, 1, 0, 0];
		}
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
	 * This method checks if the element is inside the boundary element
	 * @param {DOMRect} r
	 * @return {boolean}
	 */
	isInBoundary(r) {
		return (
			r.top >= this.boundaryRect.top &&
			r.left >= this.boundaryRect.left &&
			r.bottom <= this.boundaryRect.bottom &&
			r.right <= this.boundaryRect.right
		);
	}

	/**
	 * This method removes the event listeners from the instance element of the class.
	 */
	detach(){
		if (this.boundaryEl) {
			this.boundaryEl.removeEventListener('wheel', this.handleMouseEvents);
		} else {
			this.el.removeEventListener('wheel', this.handleMouseEvents);
		}
		this.el.removeEventListener('mousedown', this.handleMouseEvents);

		['mousemove', 'mouseup', 'mouseout'].forEach(
			event => document.removeEventListener(event, this.handleMouseEvents)
		);
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
			return false;
		}
		this.transformByMouseEvent(e);
	}

}
