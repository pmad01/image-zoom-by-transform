export default class Zoomy {
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

	/**
	 * Options applicable to an instance of the class
	 * @type {Object}
	 */
	options = {
		boundaryElementId: null,
		zoomUpperConstraint: null
	};

	/**
	 * The original z-index of the image before any change
	 * @type {string}
	 */
	originalZIndex;

	/**
	 * @param elementId
	 * @param {object} options
	 */
	constructor(elementId, options) {
		this.el = document.getElementById(elementId);
		this.options = {...options };
		this.boxEl = this.options.boundaryElementId ? document.getElementById(this.options.boundaryElementId) : null;
		this.options.zoomUpperConstraint ||= 4;
		var fn = this.handleMouseEvents.bind(this);

		if (this.boxEl) {
			this.boxEl.addEventListener('wheel', fn, {passive: false});
		} else {
			this.originalZIndex = window.getComputedStyle(this.el).zIndex;

			this.el.addEventListener('wheel', (e) => {
				this.el.style.zIndex = '999999';
				fn(e);
			} , {passive: false});
		}

		this.el.addEventListener('mousedown', fn, {passive: false});

		this.el.addEventListener('mouseout',  () => {
			if (!this.isDragging) {
				this.el.style.transform = 'matrix(1, 0, 0, 1, 0, 0)';
				this.el.style.zIndex = this.originalZIndex;
			}
		});

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
		var currentMouseX = e.x,
			currentMouseY = e.y,
			moveXBy = 0,
			moveYBy = 0,
			img = this.el.getBoundingClientRect(),
			box;

		if (this.boxEl) {
			box = this.boxEl.getBoundingClientRect();
		} else {
			box = {
				width: window.innerWidth,
				height: window.innerHeight,
				left: window.screenLeft,
				top: window.screenTop,
				right: window.innerWidth,
				bottom: window.innerHeight
			}
		}

		var widthFits = img.width < box.width,
			heightFits = img.height < box.height,
			currentLeft = img.left,
			currentRight = img.right,
			currentTop = img.top,
			currentBottom = img.bottom;

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
			var newLeft = currentLeft + (currentMouseX - this.lastMouseX),
			newRight = currentRight + (currentMouseX - this.lastMouseX),
			newTop = currentTop + (currentMouseY - this.lastMouseY),
			newBottom = currentBottom + (currentMouseY - this.lastMouseY),
			heightInsideCanvas = (img.top >= box.top && img.bottom <= box.bottom),
		    widthInsideCanvas = (img.left >= box.left && img.right <= box.right);

			//flag to check if image can freely be moves on the x-axis(horizontally)
			var freeX = (
					img.width > box.width || // image overflows canvas
					!widthInsideCanvas // or simply positioned off canvas
				) &&
				!(
					(newLeft < box.left && //hard left wall
						(
							newLeft <= currentLeft && //if going left
							newRight <= box.right //or right edge is visible
						)
					) ||
					(newRight > box.right && //hard right wall
						(
							newRight >= currentRight && //if going right
							newLeft >= box.left //or left edge is visible
						)
					)
				);

			//flag to check if image can freely be moves on the y-axis(vertically)
			var freeY = (
				img.height > box.height || // image bigger than canvas
				!heightInsideCanvas // or image outside of canvas
			) &&
			!(
				(newTop < box.top && //hard ceiling
					(
						newTop <= currentTop && //if going up
						newBottom <= box.bottom //or bottom is visible
					)
				) ||
				(newBottom > box.bottom && //hard floor
					(
						newBottom >= currentBottom && //if going down
						newTop >= box.top //or top is visible
					)
				)
			);

			if (freeX) {
				moveXBy = currentMouseX - this.lastMouseX;
			}
			if (freeY) {
				moveYBy = currentMouseY - this.lastMouseY;
			}
		}

		if (e.deltaY) {
			var imgCenterX = img.left + (img.width / 2),
				imgCenterY = img.top + (img.height / 2),
				boxCenterX = box.left + (box.width / 2),
				boxCenterY = box.top + (box.height / 2),
				newImageCenterXDiff = currentMouseX - imgCenterX,
				newImageCenterYDiff = currentMouseY - imgCenterY,
				zoomInImage = this.el.contains(e.target),
				isShrinking = e.deltaY > 0,
				enlargeOrShrinkBy = 0,
				zoomFactor = .1,
				currentScale = img.width / this.el.offsetWidth,
				fitsEntirely = widthFits && heightFits,
				sideFits = widthFits || heightFits;

			enlargeOrShrinkBy = (e.deltaY > 0 ? -zoomFactor : zoomFactor) * currentScale;

			var newScale = currentScale + enlargeOrShrinkBy,
				newWidth = this.el.offsetWidth * newScale,
				newHeight = this.el.offsetHeight * newScale;

			if (newScale > this.options.zoomUpperConstraint) {
				enlargeOrShrinkBy = 0;
			}
			else if (newScale < 1) {
				enlargeOrShrinkBy = 1-currentScale; //lower limit
			}

			if (zoomInImage) {
				if (!fitsEntirely) {
					//ratio of distance to scaling
					var adjustedDiffX = newImageCenterXDiff / currentScale,
						adjustedDiffY = newImageCenterYDiff / currentScale;

						moveXBy = -adjustedDiffX * enlargeOrShrinkBy,
						moveYBy = -adjustedDiffY * enlargeOrShrinkBy;
				}
				if (isShrinking) {
					if (sideFits) {
						diffX = imgCenterX - boxCenterX,
						diffY = imgCenterY - boxCenterY,
						scaleDiff = 1 - currentScale;
						// console.log(imgCenterX, imgCenterY)

						//ratio of distance to scaling
						adjustedDiffX = diffX / scaleDiff,
						adjustedDiffY = diffY / scaleDiff,
						moveXBy = -adjustedDiffX * enlargeOrShrinkBy,
						moveYBy = -adjustedDiffY * enlargeOrShrinkBy;
					}
					var widthShrankBy = newWidth - img.width,
						oneSideWidthShrankBy = widthShrankBy / 2,
						heightShrankBy = newHeight - img.height,
						oneSideHeightShrankBy = heightShrankBy / 2,
						horizontalMove = moveXBy - oneSideWidthShrankBy,
						verticalMove = moveYBy - oneSideHeightShrankBy,
						visualMargin = 0;

						newLeft = currentLeft + horizontalMove;
						newRight = newLeft + newWidth;
						newTop = currentTop + verticalMove;
						newBottom = newTop + newHeight;

					if (!widthFits) {
						if (newLeft > currentLeft) {
							var newLeftDistance = box.left - newLeft,
								movesRightTooMuch = newLeftDistance < -visualMargin,
								leftSideIsVisible = currentLeft > (box.left + visualMargin + 1);

							if (movesRightTooMuch && !leftSideIsVisible) {
								moveXBy += newLeftDistance + visualMargin;
							}
							// console.log({
							// 	newLeftDistance,
							// 	currentLeft,
							// 	boxLeft: box.left,
							// 	visualMargin,
							// 	movesRightTooMuch,
							// 	leftSideIsVisible,
							// 	moveXBy
							// })
						}

						if (newRight < currentRight) {
							var newRightDistance = box.right - newRight,
								movesLeftTooMuch = newRightDistance > visualMargin,
								rightSideIsVisible = currentRight < (box.right - visualMargin - 6);
							if (movesLeftTooMuch && !rightSideIsVisible) {
								moveXBy += newRightDistance - visualMargin;
							}
						}
					}

					if (!heightFits) {
						if (newTop > currentTop) {
							var newTopDistance = box.top - newTop,
								movesDownTooMuch = newTopDistance < -visualMargin,
								topIsVisible = currentTop > (box.top + visualMargin + 1);
							if (movesDownTooMuch && !topIsVisible) {
								moveYBy += newTopDistance + visualMargin;
							}
						}

						if (newBottom < currentBottom) {
							var newBottomDistance = box.bottom - newBottom,
								movesUpTooMuch = newBottomDistance > visualMargin,
								bottomIsVisible = currentBottom < (box.bottom - visualMargin - 1);
							if (movesUpTooMuch && !bottomIsVisible) {
								moveYBy += newBottomDistance - visualMargin;
							}
						}
					}
				}
			} else {
				var diffX = imgCenterX - boxCenterX,
					diffY = imgCenterY - boxCenterY,
					scaleDiff = 1 - currentScale;

					//ratio of distance to scaling
					adjustedDiffX = diffX / scaleDiff,
					adjustedDiffY = diffY / scaleDiff,
					moveXBy = -adjustedDiffX * enlargeOrShrinkBy,
					moveYBy = -adjustedDiffY * enlargeOrShrinkBy;
			}

			// if (!this.boxEl) {
			// 	if (!isShrinking) {
			// 		imgCenterX = (this.el.offsetLeft + this.el.offsetWidth / 2) - window.scrollX;
			// 		imgCenterY = (this.el.offsetTop + this.el.offsetHeight / 2) - window.scrollY;
			//
			// 		var imageInLeftSide = imgCenterX < boxCenterX;
			// 		var imageInRightSide = imgCenterX > boxCenterX;
			// 		var imageInTopPart = imgCenterY < boxCenterY;
			// 		var imageInBottomPart = imgCenterY > boxCenterY;
			// 		var parentWidth = this.el.parentElement.offsetWidth;
			//
			// 		var fixedCornerToImageCenterX;
			// 		var fixedCornerToImageCenterY;
			//
			// 		if (fitsEntirely) {
			// 			if (imageInRightSide && imageInTopPart) {
			// 				fixedCornerToImageCenterX = img.width / 2,
			// 				fixedCornerToImageCenterY = -img.height / 2;
			// 			}
			//
			// 			if(imageInRightSide && imageInBottomPart) {
			// 				fixedCornerToImageCenterX = img.width / 2,
			// 				fixedCornerToImageCenterY = img.height / 2;
			// 			}
			//
			// 			if (imageInLeftSide && imageInTopPart) {
			// 				fixedCornerToImageCenterX = -img.width / 2,
			// 				fixedCornerToImageCenterY = -img.height / 2;
			// 			}
			//
			// 			if (imageInLeftSide && imageInBottomPart) {
			// 				fixedCornerToImageCenterX = -img.width / 2,
			// 				fixedCornerToImageCenterY = img.height / 2;
			// 			}
			//
			// 			adjustedDiffX = fixedCornerToImageCenterX / currentScale,
			// 			adjustedDiffY = fixedCornerToImageCenterY / currentScale;
			//
			// 			if (newWidth < parentWidth) {
			// 				moveXBy = -adjustedDiffX * enlargeOrShrinkBy,
			// 				moveYBy = -adjustedDiffY * enlargeOrShrinkBy;
			// 			}
			// 		}
			// 	} else {
			// 		if (sideFits) {
			// 			var originalImageX = this.el.offsetLeft + this.el.offsetWidth / 2;
			// 			var originalImageY = this.el.offsetTop + this.el.offsetHeight / 2;
			// 			diffX = imgCenterX - originalImageX + window.scrollX,
			// 			diffY = imgCenterY - originalImageY + window.scrollY,
			// 			scaleDiff = 1 - currentScale;
			//
			// 			//ratio of distance to scaling
			// 			adjustedDiffX = diffX / scaleDiff,
			// 			adjustedDiffY = diffY / scaleDiff,
			// 			moveXBy = -adjustedDiffX * enlargeOrShrinkBy,
			// 			moveYBy = -adjustedDiffY * enlargeOrShrinkBy;
			// 		}
			// 	}
			// }
		}
		this.transform(this.el, moveXBy, moveYBy, enlargeOrShrinkBy);
		e.preventDefault();

		this.lastMouseX = currentMouseX;
		this.lastMouseY = currentMouseY;
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
			this.el.removeEventListener('mouseout', this.handleMouseEvents);
		}
		this.el.removeEventListener('mousedown', this.handleMouseEvents);
		this.el.removeEventListener('mouseover', this.handleMouseEvents);

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