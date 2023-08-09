class Zoomy {
	/**
	 *The HTML element we want to transform
	 * @type {HTMLElement}
	 */
	el;

	/**
	 *The box element that contains the image
	 * @type {HTMLElement}
	 */
	boxEl;

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
	lastMouseX = 0;

	/**
	 * The Y coordinate of the cursor after the previous transformation
	 * @type {number}
	 */
	lastMouseY = 0;

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
		this.el = document.getElementById(elementId);
		this.options = { ...options };
		this.boxEl = this.options.boundaryElementId ? document.getElementById(this.options.boundaryElementId) : document.body;
		this.options.zoomUpperConstraint ||= 4;
		var fn = this.handleMouseEvents.bind(this);
		if (this.boxEl) {
			this.boxEl.addEventListener('wheel', fn, {passive: false});
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

		const currentMouseX = e.x;
		const currentMouseY = e.y;

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
			moveXBy += currentMouseX - this.lastMouseX;
			moveYBy += currentMouseY - this.lastMouseY;
		}
		this.lastMouseX = currentMouseX;
		this.lastMouseY = currentMouseY;


		var img = this.el.getBoundingClientRect();
		var box = this.boxEl.getBoundingClientRect();

		var enlargeOrShrinkBy = 0;
		var zoomFactor = .1;

		if (e.deltaY) {
			var mouseX = e.x,
				mouseY = e.y,
				imgCenterX = img.left + img.width / 2,
				imgCenterY = img.top + img.height / 2,
				boxCenterX = box.left + box.width / 2,
				boxCenterY = box.top + box.height / 2,
				newImageCenterXDiff = mouseX - imgCenterX,
				newImageCenterYDiff = mouseY - imgCenterY,
				currentScale = Math.round((img.width / this.el.width) * 10) / 10;

			enlargeOrShrinkBy = (e.deltaY > 0 ? -zoomFactor : zoomFactor) * currentScale;
			enlargeOrShrinkBy = Math.round(enlargeOrShrinkBy * 10) / 10;

			// Adding upper constraint
			var newScale = currentScale + enlargeOrShrinkBy;
			if (newScale> this.options.zoomUpperConstraint || newScale < 1) {
				enlargeOrShrinkBy = 0;
			}

			var ElContainsTarget = this.el.contains(e.target);
			var hasBoxEl = this.boxEl;
			var isShrinking = e.deltaY > 0;
			if (!ElContainsTarget) {
				if (hasBoxEl && isShrinking) {
						//find out how far image is from the box center
						var diffX = imgCenterX - boxCenterX;
						var diffY = imgCenterY - boxCenterY;

						//I am doing this to calculate how many times the image has enlarged compared to the original size
						var scaleDiff = currentScale - 1;

						//I am doing this to adjust the movement that is applied to the image based on the scale difference
						var adjustedDiffX = diffX / scaleDiff;
						var adjustedDiffY = diffY / scaleDiff;

						//I am doing this multiplication to adjust dhe difference based on how much we are shrinking,
						//so that every shrinkage the transition back to the box center is done smoothly, as it shrinks,
						//it also goes back synchronously
						moveXBy = adjustedDiffX * enlargeOrShrinkBy;
						moveYBy = adjustedDiffY * enlargeOrShrinkBy;

						console.log({
							imgCenterX,
							imgCenterY,
							boxCenterX,
							boxCenterY,
							diffX,
							diffY,
							scaleDiff,
							adjustedDiffX,
							adjustedDiffY,
							enlargeOrShrinkBy,
							moveXBy,
							moveYBy
						});
				}
			} else {
				//I am doing this to adjust the movement that is applied to the image based on the current scale
				var scaledDiffX = newImageCenterXDiff / currentScale;
				var scaledDiffY = newImageCenterYDiff / currentScale;
				moveXBy = -(scaledDiffX * enlargeOrShrinkBy);
				moveYBy = -(scaledDiffY * enlargeOrShrinkBy);
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
	 * This method removes the event listeners from the instance element of the class.
	 */
	detach(){
		if (this.boxEl) {
			this.boxEl.removeEventListener('wheel', this.handleMouseEvents);
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
