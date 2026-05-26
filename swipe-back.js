/**
 * ═══════════════════════════════════════════════════════════════
 * SwipeBack — Global iOS-style Swipe-Back Navigation
 * Premium edge-swipe gesture system for AquaSense
 * Supports both touch events (mobile) and mouse drag (desktop testing).
 * ═══════════════════════════════════════════════════════════════
 */
const SwipeBack = (function () {
  'use strict';

  // ─── CONFIGURATION ───────────────────────────────────
  const CONFIG = {
    edgeWidth:             45,    // px — touch/click must start within this from left edge
    minSwipeDistance:       80,    // px — minimum drag to auto-complete
    maxVerticalDrift:       60,   // px — cancel if vertical movement exceeds this
    completionThreshold:   0.30,  // 0–1 — fraction of screen width to auto-complete
    velocityThreshold:     0.40,  // px/ms — fast swipe auto-completes regardless
    animDuration:          300,   // ms — transition animation length
    overlayMaxOpacity:     0.35,  // 0–1 — shadow overlay max darkness
    prevPageOffset:       -100,   // px — previous page starts this far left
    prevPageScale:         0.92,  // 0–1 — previous page start scale
    rubberBandFactor:      0.55,  // 0–1 — resistance when dragging past 100%
  };

  // ─── INTERNAL STATE ──────────────────────────────────
  let navHistory  = [];
  let initialized = false;
  let isSwiping   = false;
  let isPointerDown = false;
  let startX = 0, startY = 0, currentX = 0;
  let startTime   = 0;
  let locked       = false;   // prevent re-entrance during animation
  let currentEl   = null;
  let previousEl  = null;
  let overlay     = null;
  let indicator   = null;

  // ─── PUBLIC API ──────────────────────────────────────

  /** Initialize the swipe-back system */
  function init() {
    if (initialized) return;
    _createDOM();
    _bindEvents();
    initialized = true;
  }

  /** Push a screen onto the navigation history stack */
  function push(screenId) {
    // Prevent duplicate entries
    if (navHistory.length > 0 && navHistory[navHistory.length - 1] === screenId) {
      return;
    }
    navHistory.push(screenId);
  }

  /** Pop the most recent screen from history */
  function pop() {
    if (navHistory.length > 0) navHistory.pop();
  }

  /** Clear history and set a new root screen */
  function reset(rootScreenId) {
    navHistory = [rootScreenId];
  }

  /** Check if we can go back */
  function canGoBack() {
    return navHistory.length >= 2;
  }

  /** Get current history */
  function getHistory() {
    return navHistory.slice();
  }

  // ─── DOM SETUP ───────────────────────────────────────

  function _createDOM() {
    // Shadow overlay
    overlay = document.getElementById('swipeback-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'swipeback-overlay';
      document.body.appendChild(overlay);
    }

    // Left-edge indicator
    indicator = document.getElementById('swipeback-edge');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'swipeback-edge';
      document.body.appendChild(indicator);
    }
  }

  // ─── EVENT BINDING ───────────────────────────────────

  function _bindEvents() {
    // Touch Events
    document.addEventListener('touchstart',  _onTouchStart,  { passive: true });
    document.addEventListener('touchmove',   _onTouchMove,   { passive: false });
    document.addEventListener('touchend',    _onTouchEnd,    { passive: true });
    document.addEventListener('touchcancel', _onTouchCancel, { passive: true });

    // Mouse Events for desktop testing
    document.addEventListener('mousedown',   _onMouseDown);
    document.addEventListener('mousemove',   _onMouseMove);
    document.addEventListener('mouseup',     _onMouseUp);
  }

  // ─── EVENT HANDLERS ──────────────────────────────────

  function _onTouchStart(e) {
    if (e.touches.length > 1) return;
    _startGesture(e.touches[0].clientX, e.touches[0].clientY);
  }

  function _onTouchMove(e) {
    if (e.touches.length === 0) return;
    var touch = e.touches[0];
    var isHandling = _moveGesture(touch.clientX, touch.clientY);
    if (isHandling) {
      e.preventDefault();
    }
  }

  function _onTouchEnd() {
    _endGesture();
  }

  function _onTouchCancel() {
    _cancelGesture();
  }

  function _onMouseDown(e) {
    if (e.button !== 0) return; // Only left click
    isPointerDown = true;
    _startGesture(e.clientX, e.clientY);
  }

  function _onMouseMove(e) {
    if (!isPointerDown) return;
    _moveGesture(e.clientX, e.clientY);
  }

  function _onMouseUp(e) {
    if (!isPointerDown) return;
    isPointerDown = false;
    _endGesture();
  }

  // ─── GESTURE CORE LOGIC ──────────────────────────────

  function _startGesture(clientX, clientY) {
    if (locked || !canGoBack()) return;
    if (clientX > CONFIG.edgeWidth) return; // not from left edge

    startX    = clientX;
    startY    = clientY;
    currentX  = startX;
    startTime = Date.now();

    // Resolve current & previous screen
    var activeScreen = document.querySelector('.screen.active');
    var prevId       = navHistory[navHistory.length - 2];
    var prevScreen   = prevId ? document.getElementById(prevId) : null;

    if (!activeScreen || !prevScreen || activeScreen.id === prevId) return;

    currentEl  = activeScreen;
    previousEl = prevScreen;

    // Show edge indicator
    if (indicator) indicator.classList.add('active');
  }

  function _moveGesture(clientX, clientY) {
    if (!currentEl || !previousEl || locked) return false;

    currentX  = clientX;
    var dx    = currentX - startX;
    var dy    = Math.abs(clientY - startY);

    // Cancel if vertical drift is too high (user scrolling)
    if (dy > CONFIG.maxVerticalDrift && !isSwiping) {
      _cancelGesture();
      return false;
    }

    // Only handle rightward swipe
    if (dx <= 0) return false;

    // Activate swiping after small threshold
    if (!isSwiping && dx > 10) {
      isSwiping = true;
      _prepareSwipe();
    }

    if (isSwiping) {
      _updateSwipe(dx);
      return true;
    }
    return false;
  }

  function _endGesture() {
    isPointerDown = false;
    if (!isSwiping) { _resetState(); return; }

    var dx       = currentX - startX;
    var vw       = window.innerWidth;
    var elapsed  = Math.max(Date.now() - startTime, 1);
    var velocity = dx / elapsed;
    var progress = dx / vw;

    if (progress > CONFIG.completionThreshold || velocity > CONFIG.velocityThreshold) {
      _completeSwipe();
    } else {
      _cancelSwipe();
    }
  }

  function _cancelGesture() {
    isPointerDown = false;
    if (isSwiping) _cancelSwipe();
    else _resetState();
  }

  // ─── SWIPE ACTIONS ───────────────────────────────────

  function _prepareSwipe() {
    // Previous screen: visible behind
    previousEl.style.display      = 'flex';
    previousEl.style.position     = 'fixed';
    previousEl.style.top          = '0';
    previousEl.style.left         = '0';
    previousEl.style.width        = '100%';
    previousEl.style.height       = '100%';
    previousEl.style.zIndex       = '9990';
    previousEl.style.transform    = 'translateX(' + CONFIG.prevPageOffset + 'px) scale(' + CONFIG.prevPageScale + ')';
    previousEl.style.opacity      = '0.3';
    previousEl.style.transition   = 'none';
    previousEl.style.pointerEvents = 'none';

    // Current screen: on top, follows finger
    currentEl.style.position      = 'fixed';
    currentEl.style.top           = '0';
    currentEl.style.left          = '0';
    currentEl.style.width         = '100%';
    currentEl.style.height        = '100%';
    currentEl.style.zIndex       = '9992';
    currentEl.style.transition   = 'none';
    currentEl.style.willChange   = 'transform';
    currentEl.style.boxShadow    = '-12px 0 40px rgba(0,0,0,0.2)';

    // Overlay between them
    if (overlay) {
      overlay.style.display    = 'block';
      overlay.style.zIndex     = '9991';
      overlay.style.opacity    = String(CONFIG.overlayMaxOpacity);
      overlay.style.transition = 'none';
    }

    if (indicator) indicator.classList.remove('active');
  }

  function _updateSwipe(dx) {
    var vw = window.innerWidth;
    var progress = Math.min(dx / vw, 1);

    // Rubber-band past 100%
    if (dx > vw) {
      progress = 1 + ((dx / vw) - 1) * CONFIG.rubberBandFactor;
      progress = Math.min(progress, 1.12);
    }

    var px = progress * vw;

    // Current screen follows finger
    currentEl.style.transform = 'translateX(' + px + 'px)';

    // Previous screen transition
    var prevT = CONFIG.prevPageOffset * (1 - progress);
    var prevS = CONFIG.prevPageScale + (1 - CONFIG.prevPageScale) * progress;
    var prevO = Math.min(0.3 + 0.7 * progress, 1);
    previousEl.style.transform = 'translateX(' + prevT + 'px) scale(' + prevS + ')';
    previousEl.style.opacity   = String(prevO);

    // Overlay fades out
    if (overlay) {
      overlay.style.opacity = String(CONFIG.overlayMaxOpacity * (1 - progress));
    }
  }

  function _completeSwipe() {
    locked = true;
    var dur  = CONFIG.animDuration + 'ms';
    var ease = 'cubic-bezier(0.22, 0.95, 0.35, 1)';

    currentEl.style.transition = 'transform ' + dur + ' ' + ease + ', opacity ' + dur + ' ' + ease;
    currentEl.style.transform  = 'translateX(100%)';
    currentEl.style.opacity    = '0.7';

    previousEl.style.transition = 'transform ' + dur + ' ' + ease + ', opacity ' + dur + ' ' + ease;
    previousEl.style.transform  = 'translateX(0) scale(1)';
    previousEl.style.opacity    = '1';

    if (overlay) {
      overlay.style.transition = 'opacity ' + dur + ' ' + ease;
      overlay.style.opacity    = '0';
    }

    var fromId = currentEl.id;
    var toId   = previousEl.id;

    setTimeout(function () {
      currentEl.classList.remove('active');
      _cleanEl(currentEl);

      previousEl.classList.add('active');
      _cleanEl(previousEl);
      previousEl.style.display = '';

      if (overlay) {
        overlay.style.display = 'none';
        overlay.style.transition = '';
      }

      navHistory.pop();

      // Dispatch event
      document.dispatchEvent(new CustomEvent('swipeback', {
        detail: { from: fromId, to: toId }
      }));

      _resetState();
      locked = false;
    }, CONFIG.animDuration + 30);
  }

  function _cancelSwipe() {
    locked = true;
    var dur  = CONFIG.animDuration + 'ms';
    var ease = 'cubic-bezier(0.22, 0.95, 0.35, 1)';

    currentEl.style.transition = 'transform ' + dur + ' ' + ease + ', box-shadow ' + dur + ' ' + ease;
    currentEl.style.transform  = 'translateX(0)';
    currentEl.style.boxShadow  = 'none';

    previousEl.style.transition = 'transform ' + dur + ' ' + ease + ', opacity ' + dur + ' ' + ease;
    previousEl.style.transform  = 'translateX(' + CONFIG.prevPageOffset + 'px) scale(' + CONFIG.prevPageScale + ')';
    previousEl.style.opacity    = '0';

    if (overlay) {
      overlay.style.transition = 'opacity ' + dur + ' ' + ease;
      overlay.style.opacity    = '0';
    }

    setTimeout(function () {
      _cleanEl(currentEl);
      _cleanEl(previousEl);
      previousEl.style.display = '';
      if (overlay) {
        overlay.style.display    = 'none';
        overlay.style.transition = '';
      }
      _resetState();
      locked = false;
    }, CONFIG.animDuration + 30);
  }

  // ─── HELPERS ─────────────────────────────────────────

  function _cleanEl(el) {
    if (!el) return;
    el.style.transform      = '';
    el.style.transition     = '';
    el.style.opacity        = '';
    el.style.zIndex         = '';
    el.style.willChange     = '';
    el.style.boxShadow      = '';
    el.style.pointerEvents  = '';
    el.style.position       = '';
    el.style.top            = '';
    el.style.left           = '';
    el.style.width          = '';
    el.style.height         = '';
  }

  function _resetState() {
    isSwiping  = false;
    isPointerDown = false;
    currentEl  = null;
    previousEl = null;
    if (indicator) indicator.classList.remove('active');
  }

  return {
    init:       init,
    push:       push,
    pop:        pop,
    reset:      reset,
    canGoBack:  canGoBack,
    getHistory: getHistory,
    CONFIG:     CONFIG,
  };
})();
