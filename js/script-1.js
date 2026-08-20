(function(){
  "use strict";

  /* ---------- Responsive scaling of the fixed 1086x1448 stage ---------- */
  var stage = document.getElementById('stage');
  var STAGE_W = 1086, STAGE_H = 1448;
  var HALF_W = STAGE_W / 2; // 543

  /* Fallback only — used when the browser doesn't support length-division
     in calc() (see the @supports CSS rules above, which win via
     !important whenever they apply). Mirrors the same mobile-cover /
     tablet-contain split as the CSS. */
  function fitStage(){
    var vv = window.visualViewport;
    var vw = (vv && vv.width) ? vv.width : window.innerWidth;
    var vh = (vv && vv.height) ? vv.height : window.innerHeight;
    var isMobile = vw <= 600;
    var scale = isMobile
      ? Math.max(vw / STAGE_W, vh / STAGE_H)
      : Math.min(vw / STAGE_W, vh / STAGE_H);
    stage.style.transform = 'scale(' + scale + ')';
  }
  window.addEventListener('resize', fitStage);
  window.addEventListener('orientationchange', fitStage);
  if(window.visualViewport){
    window.visualViewport.addEventListener('resize', fitStage);
    window.visualViewport.addEventListener('scroll', fitStage);
  }
  fitStage();

  /* =====================================================================
     CEREMONIAL DOOR ARTWORK
     Each door half is a 543 x 1448 SVG illustration:
       - dimensional pink panel with radial "candlelit" glow toward the seam
       - outer stone-toned architrave frame
       - tall recessed arch panel containing two raised door panels
       - fanlight tracery radiating from the arch springline (seam side)
       - decorative pilaster + hairlines running along the seam edge
       - hairline flourishes echoing the reference video's corner curls
     The seam-side details sit near local x=543; the outer frame sits near
     local x=0. The right door reuses this exact markup mirrored via
     CSS scaleX(-1), so the seam ornament lands correctly against x=543
     on both halves.
  ===================================================================== */
  var NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs){
    var e = document.createElementNS(NS, tag);
    for(var k in attrs){ e.setAttribute(k, attrs[k]); }
    return e;
  }

  function buildDoorSVG(){
    var svg = el('svg', {viewBox:'0 0 543 1448', preserveAspectRatio:'none'});

    var defs = el('defs', {});
    svg.appendChild(defs);

    // Base dimensional gradient: warm light near the seam (where the medallion
    // sits), settling into a deeper dusty rose toward the outer edge.
    var gradBase = el('radialGradient', {
      id:'gradBase', cx:'92%', cy:'50%', r:'95%'
    });
    gradBase.appendChild(el('stop', {offset:'0%', 'stop-color':'#f6dfe2'}));
    gradBase.appendChild(el('stop', {offset:'30%', 'stop-color':'#eec7cd'}));
    gradBase.appendChild(el('stop', {offset:'62%', 'stop-color':'#dcaab3'}));
    gradBase.appendChild(el('stop', {offset:'100%', 'stop-color':'#c48d98'}));
    defs.appendChild(gradBase);

    // Recessed arch well
    var gradWell = el('linearGradient', {id:'gradWell', x1:'0%', y1:'0%', x2:'100%', y2:'0%'});
    gradWell.appendChild(el('stop', {offset:'0%', 'stop-color':'#c98d97'}));
    gradWell.appendChild(el('stop', {offset:'50%', 'stop-color':'#e2b7bd'}));
    gradWell.appendChild(el('stop', {offset:'100%', 'stop-color':'#f0d6da'}));
    defs.appendChild(gradWell);

    // Raised panel bevel gradient (light upper-left to shadow lower-right)
    var gradPanel = el('linearGradient', {id:'gradPanel', x1:'0%', y1:'0%', x2:'100%', y2:'100%'});
    gradPanel.appendChild(el('stop', {offset:'0%', 'stop-color':'#fbeef0'}));
    gradPanel.appendChild(el('stop', {offset:'45%', 'stop-color':'#eec7cd'}));
    gradPanel.appendChild(el('stop', {offset:'100%', 'stop-color':'#c98d97'}));
    defs.appendChild(gradPanel);

    var gradPanelShadow = el('linearGradient', {id:'gradPanelShadow', x1:'0%', y1:'0%', x2:'100%', y2:'100%'});
    gradPanelShadow.appendChild(el('stop', {offset:'0%', 'stop-color':'#b97883', 'stop-opacity':'0.9'}));
    gradPanelShadow.appendChild(el('stop', {offset:'100%', 'stop-color':'#f0d6da', 'stop-opacity':'0'}));
    defs.appendChild(gradPanelShadow);

    // soft blur for inset shadows
    var filter = el('filter', {id:'softBlur', x:'-30%', y:'-30%', width:'160%', height:'160%'});
    filter.appendChild(el('feGaussianBlur', {stdDeviation:'6'}));
    defs.appendChild(filter);

    /* ---- base slab ---- */
    svg.appendChild(el('rect', {x:0, y:0, width:543, height:1448, fill:'url(#gradBase)'}));

    /* ---- subtle vertical fluting across the whole slab for dimensionality ---- */
    var flute = el('g', {opacity:'0.35'});
    for(var fx = 34; fx < 520; fx += 34){
      flute.appendChild(el('line', {
        x1:fx, y1:24, x2:fx, y2:1424,
        stroke: (fx/34) % 2 === 0 ? '#ffffff' : '#8a4a54',
        'stroke-width':0.6,
        opacity: (fx/34) % 2 === 0 ? 0.18 : 0.10
      }));
    }
    svg.appendChild(flute);

    /* ---- outer architrave frame ---- */
    svg.appendChild(el('rect', {
      x:22, y:22, width:499, height:1404, rx:4,
      fill:'none', stroke:'#e6cd9c', 'stroke-width':2.4, opacity:0.85
    }));
    svg.appendChild(el('rect', {
      x:32, y:32, width:479, height:1384, rx:3,
      fill:'none', stroke:'#8a4a54', 'stroke-width':0.8, opacity:0.35
    }));

    /* ---- recessed arch well (tall arch shape housing the panels) ---- */
    var wellX = 62, wellW = 419;
    var wellTop = 150, wellBottom = 1330;
    var archPath =
      'M ' + wellX + ' ' + (wellTop+140) +
      ' L ' + wellX + ' ' + wellBottom +
      ' L ' + (wellX+wellW) + ' ' + wellBottom +
      ' L ' + (wellX+wellW) + ' ' + (wellTop+140) +
      ' C ' + (wellX+wellW) + ' ' + (wellTop+40) + ', ' + (wellX+wellW*0.72) + ' ' + wellTop + ', ' + (wellX+wellW/2) + ' ' + wellTop +
      ' C ' + (wellX+wellW*0.28) + ' ' + wellTop + ', ' + wellX + ' ' + (wellTop+40) + ', ' + wellX + ' ' + (wellTop+140) +
      ' Z';
    svg.appendChild(el('path', {d:archPath, fill:'url(#gradWell)'}));
    // inset shadow lip around the well
    var shadowLip = el('path', {d:archPath, fill:'none', stroke:'#8a4a54', 'stroke-width':10, opacity:'0.20', filter:'url(#softBlur)'});
    svg.appendChild(shadowLip);
    svg.appendChild(el('path', {d:archPath, fill:'none', stroke:'#e6cd9c', 'stroke-width':1.6, opacity:'0.8'}));

    /* ---- fanlight tracery at the arch crown, radiating from the springline ---- */
    var fan = el('g', {opacity:'0.55'});
    var cx = wellX + wellW/2, cy = wellTop + 118, rInner = 8, rOuter = 128;
    var rayCount = 11;
    for(var i=0;i<=rayCount;i++){
      var t = i/rayCount;
      var ang = Math.PI * (0.18 + t*0.64); // sweep across the arch crown
      var x1 = cx + Math.cos(ang)*rInner*-1 + rInner; // small inner offset
      var x1p = cx - Math.cos(ang)*rInner;
      var y1p = cy - Math.sin(ang)*rInner;
      var x2p = cx - Math.cos(ang)*rOuter;
      var y2p = cy - Math.sin(ang)*rOuter;
      fan.appendChild(el('line', {
        x1:x1p, y1:y1p, x2:x2p, y2:y2p,
        stroke:'#e6cd9c', 'stroke-width':0.7, opacity: 0.25 + 0.35*Math.sin(t*Math.PI)
      }));
    }
    svg.appendChild(fan);
    svg.appendChild(el('circle', {cx:cx, cy:cy, r:3, fill:'#e6cd9c', opacity:0.6}));

    /* ---- two raised door panels within the well ---- */
    function panel(px, py, pw, ph){
      var g = el('g', {});
      g.appendChild(el('rect', {x:px+6, y:py+8, width:pw, height:ph, rx:6, fill:'#8a4a54', opacity:0.18, filter:'url(#softBlur)'}));
      g.appendChild(el('rect', {x:px, y:py, width:pw, height:ph, rx:6, fill:'url(#gradPanel)'}));
      g.appendChild(el('rect', {x:px, y:py, width:pw, height:ph, rx:6, fill:'none', stroke:'#e6cd9c', 'stroke-width':1.1, opacity:0.7}));
      g.appendChild(el('rect', {x:px+14, y:py+14, width:pw-28, height:ph-28, rx:3, fill:'none', stroke:'#8a4a54', 'stroke-width':0.7, opacity:0.3}));
      return g;
    }
    var pW = wellW - 96, pX = wellX + 48;
    svg.appendChild(panel(pX, 330, pW, 380));
    svg.appendChild(panel(pX, 760, pW, 500));

    /* ---- seam-side pilaster (sits near local x = 543, the door meeting edge) ---- */
    var pilaster = el('g', {});
    pilaster.appendChild(el('rect', {x:517, y:26, width:16, height:1396, fill:'#dba9b0'}));
    pilaster.appendChild(el('rect', {x:517, y:26, width:16, height:1396, fill:'none', stroke:'#e6cd9c', 'stroke-width':1, opacity:0.7}));
    pilaster.appendChild(el('line', {x1:525, y1:26, x2:525, y2:1422, stroke:'#8a4a54', 'stroke-width':0.6, opacity:0.35}));
    // small diamond hardware accents
    [90, 724, 1358].forEach(function(dy){
      var d = el('rect', {x:520.5, y:dy-6, width:9, height:9, fill:'#e6cd9c', opacity:0.85, transform:'rotate(45 525 '+dy+')'});
      pilaster.appendChild(d);
    });
    svg.appendChild(pilaster);

    /* ---- hairline flourishes echoing the reference video's curling accents ---- */
    var flour = el('g', {opacity:'0.5', fill:'none', stroke:'#e6cd9c', 'stroke-width':1});
    flour.appendChild(el('path', {d:'M 60 1360 C 60 1392, 96 1408, 132 1410'}));
    flour.appendChild(el('path', {d:'M 500 96 C 468 96, 452 78, 452 50'}));
    svg.appendChild(flour);

    /* ---- gentle overall vignette to match the reference lighting ---- */
    var vGrad = el('radialGradient', {id:'vign', cx:'88%', cy:'50%', r:'85%'});
    vGrad.appendChild(el('stop', {offset:'55%', 'stop-color':'#000000', 'stop-opacity':'0'}));
    vGrad.appendChild(el('stop', {offset:'100%', 'stop-color':'#5b2c35', 'stop-opacity':'0.28'}));
    defs.appendChild(vGrad);
    svg.appendChild(el('rect', {x:0, y:0, width:543, height:1448, fill:'url(#vign)'}));

    return svg;
  }

  document.getElementById('face-left').appendChild(buildDoorSVG());
  document.getElementById('face-right').appendChild(buildDoorSVG());

  /* ---------- Typography: build per-character spans ---------- */
  function buildChars(el, text){
    el.innerHTML = "";
    for(var i=0;i<text.length;i++){
      var ch = text[i];
      var span = document.createElement('span');
      if(ch === ' '){
        span.className = 'space';
        span.innerHTML = '&nbsp;';
      } else {
        span.className = 'char';
        span.textContent = ch;
      }
      el.appendChild(span);
    }
  }
  var lineNames = document.getElementById('line-names');
  var lineGetting = document.getElementById('line-getting');
  var lineMarried = document.getElementById('line-married');

  buildChars(lineNames, "Marlyn & Tihomir");
  buildChars(lineGetting, "WE ARE GETTING");
  buildChars(lineMarried, "MARRIED");

  function typeLine(elx, delayBetween, cb){
    var chars = elx.querySelectorAll('.char');
    var i = 0;
    function step(){
      if(i >= chars.length){ if(cb) cb(); return; }
      chars[i].classList.add('visible');
      i++;
      setTimeout(step, delayBetween);
    }
    step();
  }

  /* ---------- Fireworks (champagne / gold burst) ---------- */
  var canvas = document.getElementById('fireworks');
  var ctx = canvas.getContext('2d');
  canvas.width = STAGE_W;
  canvas.height = STAGE_H;

  var particles = [];
  var goldPalette = ['#f3e6c9','#e6cd9c','#d9b877','#f7efe3','#eac9a0'];

  function spawnBurst(cx, cy, count, spread){
    for(var i=0;i<count;i++){
      var angle = Math.random() * Math.PI * 2;
      var speed = (0.6 + Math.random()*2.4) * spread;
      particles.push({
        x:cx, y:cy,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed - 0.4,
        life: 1,
        decay: 0.008 + Math.random()*0.012,
        size: 1 + Math.random()*2.2,
        color: goldPalette[Math.floor(Math.random()*goldPalette.length)]
      });
    }
  }

  var fireworksRunning = false;
  function animateFireworks(){
    ctx.clearRect(0,0,canvas.width, canvas.height);
    for(var i=particles.length-1;i>=0;i--){
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.012;
      p.vx *= 0.992;
      p.life -= p.decay;
      if(p.life <= 0){ particles.splice(i,1); continue; }
      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if(particles.length > 0 || fireworksRunning){
      requestAnimationFrame(animateFireworks);
    }
  }

  function runFireworksSequence(){
    fireworksRunning = true;
    var cx = STAGE_W/2, cy = STAGE_H*0.42;
    spawnBurst(cx, cy, 60, 3.2);
    setTimeout(function(){ spawnBurst(cx - 120, cy + 40, 34, 2.4); }, 160);
    setTimeout(function(){ spawnBurst(cx + 120, cy + 20, 34, 2.4); }, 260);
    setTimeout(function(){ spawnBurst(cx, cy - 60, 26, 1.8); }, 420);
    animateFireworks();
    setTimeout(function(){ fireworksRunning = false; }, 900);
  }

  /* =====================================================================
     NEW LAYER: SCRATCH-OFF WEDDING DATE CARD
     Appears only after the M A R R I E D typewriter line finishes (wired
     in near the bottom of startTypography()). Everything above this is
     untouched. The canvas coating is scratched away with real pointer
     input (mouse/touch/pen via Pointer Events); once ~62% of it has been
     cleared the remaining coating fades on its own and the date reveals.
  ===================================================================== */
  function setupScratchCard(){
    var wrap = document.getElementById('scratch-card-wrap');
    var revealEl = document.getElementById('scratch-reveal');
    var invitedEl = document.getElementById('invited-text');
    var canvas = document.getElementById('scratch-canvas');
    var ctx = canvas.getContext('2d');

    // Fixed internal supersample factor for crisp strokes. Independent of
    // devicePixelRatio: the canvas already scales visually together with
    // #stage via its CSS transform, and clientWidth/clientHeight (used
    // below) reflect pre-transform layout size, so this only needs to
    // run once — no resize listener required, and scratch progress is
    // never lost to a re-paint.
    var SS = 2;
    var cssW = 0, cssH = 0;
    var revealed = false;

    function paintCoating(){
      cssW = canvas.clientWidth;
      cssH = canvas.clientHeight;
      if(!cssW || !cssH) return;
      canvas.width = Math.round(cssW * SS);
      canvas.height = Math.round(cssH * SS);
      ctx.setTransform(SS, 0, 0, SS, 0, 0);

      var g = ctx.createLinearGradient(0, 0, cssW, cssH);
      g.addColorStop(0, '#a9c2d6');
      g.addColorStop(0.5, '#93b0c9');
      g.addColorStop(1, '#b7c9dc');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cssW, cssH);

      // very subtle grain / satin shimmer, kept understated
      ctx.globalAlpha = 0.05;
      for(var i = 0; i < 90; i++){
        ctx.fillStyle = (i % 2 === 0) ? '#ffffff' : '#41586c';
        ctx.fillRect(Math.random() * cssW, Math.random() * cssH, 1.1, 1.1);
      }
      ctx.globalAlpha = 1;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fbf6ee';
      ctx.font = "22.6px 'Tenor Sans', sans-serif";
      ctx.fillText('SCRATCH HERE', cssW / 2, cssH * 0.42);

      ctx.fillStyle = '#fbf6ee';
      ctx.font = "35.6px 'Beau Rivage', cursive";
      ctx.fillText('to reveal', cssW / 2, cssH * 0.74);

      // subsequent drawing erases the coating instead of adding to it
      ctx.globalCompositeOperation = 'destination-out';
    }

    function localPoint(clientX, clientY){
      var rect = canvas.getBoundingClientRect();
      var sx = canvas.width / rect.width;
      var sy = canvas.height / rect.height;
      return { x: (clientX - rect.left) * sx, y: (clientY - rect.top) * sy };
    }

    function scratchDot(x, y){
      ctx.beginPath();
      ctx.arc(x, y, 6.5 * SS, 0, Math.PI * 2);
      ctx.fill();
    }

    function scratchLine(a, b){
      var dist = Math.hypot(b.x - a.x, b.y - a.y);
      var steps = Math.max(1, Math.floor(dist / (2.5 * SS)));
      for(var i = 0; i <= steps; i++){
        var t = i / steps;
        scratchDot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
      }
    }

    var checkQueued = false;
    function queueProgressCheck(){
      if(checkQueued) return;
      checkQueued = true;
      requestAnimationFrame(checkProgress);
    }

    function checkProgress(){
      checkQueued = false;
      if(revealed) return;
      var w = canvas.width, h = canvas.height;
      if(!w || !h) return;
      var step = 6;
      var data;
      try{
        data = ctx.getImageData(0, 0, w, h).data;
      } catch(e){
        return;
      }
      var total = 0, cleared = 0;
      for(var y = 0; y < h; y += step){
        for(var x = 0; x < w; x += step){
          total++;
          if(data[(y * w + x) * 4 + 3] < 60) cleared++;
        }
      }
      if(total > 0 && (cleared / total) >= 0.67){
        completeReveal();
      }
    }

    function completeReveal(){
      if(revealed) return;
      revealed = true;
      canvas.classList.add('cleared');
      // The date becomes visible and the confetti pops in the SAME
      // callback — perceived as one continuous event, no empty pause
      // between "date appears" and "confetti pop".
      setTimeout(function(){
        revealEl.classList.add('shown');
        invitedEl.classList.add('shown');
        triggerConfetti();
        // "Begin Our Journey" is the natural final beat of the opening
        // scene: it only appears after the date reveal + confetti +
        // "You're Invited" are already on screen, following a short
        // elegant pause.
        setTimeout(function(){
          if(window.__showBeginJourney){ window.__showBeginJourney(); }
        }, 1900);
      }, 180);
    }

    var scratching = false;
    var lastPt = null;

    // Extra safety net beyond touch-action:none + setPointerCapture: some
    // mobile browsers still need an explicit non-passive preventDefault to
    // fully suppress scroll/bounce/drag while a touch is actively scratching.
    function blockTouchWhileScratching(e){
      if(scratching) e.preventDefault();
    }
    document.addEventListener('touchmove', blockTouchWhileScratching, { passive:false });
    document.addEventListener('touchstart', blockTouchWhileScratching, { passive:false });

    function onDown(e){
      if(revealed) return;
      scratching = true;
      if(canvas.setPointerCapture){
        try{ canvas.setPointerCapture(e.pointerId); } catch(err){}
      }
      lastPt = localPoint(e.clientX, e.clientY);
      scratchDot(lastPt.x, lastPt.y);
      queueProgressCheck();
      e.preventDefault();
    }
    function onMove(e){
      if(!scratching || revealed) return;
      var pt = localPoint(e.clientX, e.clientY);
      scratchLine(lastPt, pt);
      lastPt = pt;
      queueProgressCheck();
      e.preventDefault();
    }
    function onUp(){
      scratching = false;
      lastPt = null;
    }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onUp);

    // Exposed trigger, called once from startTypography() after the
    // M A R R I E D line has fully finished typing.
    window.__revealScratchCard = function(){
      if(wrap.classList.contains('visible')) return;
      paintCoating();
      wrap.classList.add('visible');
    };
  }
  setupScratchCard();

  /* ---------- Confetti (dusty-blue wedding palette) ----------
     Triggered ONLY on scratch-off completion — a large, abundant burst
     that explodes rapidly out of Mayon's crater like a celebratory
     wedding-confetti eruption, then expands outward and falls naturally,
     distinct from the door-opening fireworks (#fireworks /
     runFireworksSequence, both left completely untouched). Fires once
     per page load. */
  function triggerConfetti(){
    var canvas = document.getElementById('confetti-canvas');
    var ctx = canvas.getContext('2d');
    canvas.width = STAGE_W;
    canvas.height = STAGE_H;

    // Dusty blue dominant, with soft supporting wedding tones.
    var palette = [
      '#7f9cba', '#8fa8c2', '#a3b9d1', '#b7c9dc', // dusty / powder blue (weighted heavier below)
      '#c9d3dd', // soft blue-gray
      '#eef1e9', // light gray
      '#f0e6cf', // warm ivory
      '#e9ddc9', // champagne
      '#f0dbe0'  // subtle blush
    ];
    var blueWeighted = ['#7f9cba', '#8fa8c2', '#a3b9d1', '#b7c9dc', '#8fa8c2', '#a3b9d1'];

    function pickColor(){
      // ~60% chance of a dusty-blue shade, else a supporting tone.
      return (Math.random() < 0.6)
        ? blueWeighted[Math.floor(Math.random() * blueWeighted.length)]
        : palette[Math.floor(Math.random() * palette.length)];
    }

    function drawHeart(size, color){
      var s = size * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.6);
      ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.4, -s * 1.1, 0, -s * 0.3);
      ctx.bezierCurveTo(s * 0.4, -s * 1.1, s, -s * 0.4, 0, s * 0.6);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // A rapid, concentrated EXPLOSION out of Mayon's crater — not a gentle
    // plume. A tiny "core" of particles fires from almost the exact
    // crater point with minimal jitter (so the very first visible pieces
    // clearly touch the crater), then the bulk of the burst fires at
    // strong, varied velocity across a wide upward cone that rapidly
    // expands outward before gravity takes hold. Distinct from the
    // door-opening fireworks: no radial star bursts, no glow — physical
    // paper pieces. Origin: the crater/opening at the summit of Mayon,
    // X 543, Y 603 in master 1086×1448 stage coordinates — the single
    // visual source of the explosion (not the sky above the peak, not
    // the scratch card, not the top of the screen).
    var ORIGIN_X = 543;
    var ORIGIN_Y = 603;
    var CORE_COUNT = 26; // fires almost exactly at the crater point, near-zero jitter

    var pieces = [];
    var count = 420;
    for(var i = 0; i < count; i++){
      var t = Math.random();
      var shape = t < 0.40 ? 'rect'
                : t < 0.58 ? 'streamer'
                : t < 0.80 ? 'circle'
                : t < 0.93 ? 'square'
                : 'heart';
      var isCore = i < CORE_COUNT;
      // Core pieces spawn almost exactly at the crater so the explosion
      // reads as coming from one physical point; the rest get a small
      // jitter so the burst still looks anchored to the crater opening
      // rather than a single pinpoint.
      var originX = ORIGIN_X + (Math.random() - 0.5) * (isCore ? 3 : 16);
      var originY = ORIGIN_Y + (Math.random() - 0.5) * (isCore ? 2 : 10);
      // Wide angular distribution, biased upward: ~55% fire within a
      // broad upper cone (including some near-sideways outliers for a
      // real "explosion" feel rather than a straight fountain), ~22.5%
      // kick sharply upper-left, ~22.5% kick sharply upper-right —
      // asymmetric and randomized so it reads as organic, not radial.
      var dirRoll = Math.random();
      var theta; // angle offset from straight-up, in radians
      if(dirRoll < 0.55){
        theta = (Math.random() - 0.5) * (100 * Math.PI / 180);      // ±50° of vertical
      } else if(dirRoll < 0.775){
        theta = -(50 + Math.random() * 40) * Math.PI / 180;          // -50° to -90° (upper-left to sideways-left)
      } else {
        theta = (50 + Math.random() * 40) * Math.PI / 180;           // 50° to 90° (upper-right to sideways-right)
      }
      var speed = 7 + Math.random() * 8;                             // strong 7-15 px/frame launch
      var vx = speed * Math.sin(theta);
      var vy = -speed * Math.cos(theta);
      pieces.push({
        x: originX,
        y: originY,
        vx: vx,
        vy: vy,                                    // fast outward launch straight from the crater
        gravity: 0.08 + Math.random() * 0.05,      // brings the explosion back down naturally
        drift: (Math.random() - 0.5) * 1.1,        // sideways sway amplitude
        driftFreq: 0.015 + Math.random() * 0.02,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * (shape === 'streamer' ? 0.32 : 0.2), // streamers tumble more visibly
        size: shape === 'streamer' ? (13 + Math.random() * 15) : (5 + Math.random() * 6),
        shape: shape,
        color: pickColor(),
        maxAlpha: 0.6 + Math.random() * 0.35,      // kept translucent so Mayon stays visible
        life: 1,
        fadeDelay: 0.6 + Math.random() * 0.3,      // fraction of life before fade begins
        decay: 0.0032 + Math.random() * 0.0032
      });
    }

    var start = null;
    var DURATION = 5000; // brief pop, then ~3-5s of natural falling and fading
    function frame(now){
      if(start === null) start = now;
      var elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = false;
      for(var i = 0; i < pieces.length; i++){
        var p = pieces[i];
        if(p.life <= 0) continue;

        p.vy += p.gravity;
        p.x += p.vx + Math.sin(p.phase + now * p.driftFreq) * p.drift;
        p.y += p.vy;
        p.vx *= 0.985;
        p.rot += p.vr;

        if(p.life > (1 - p.fadeDelay)){
          // still fully in view — no fade yet
        } else {
          p.life -= p.decay;
        }

        if(p.y > STAGE_H + 40){ p.life = 0; continue; }
        if(p.life <= 0) continue;
        alive = true;

        var alpha = Math.max(Math.min(p.life, 1), 0) * p.maxAlpha;
        ctx.globalAlpha = alpha;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if(p.shape === 'rect'){
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size * 0.35, p.size, p.size * 0.7);
        } else if(p.shape === 'streamer'){
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -1.1, p.size, 2.2);
        } else if(p.shape === 'square'){
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size * 0.32, -p.size * 0.32, p.size * 0.64, p.size * 0.64);
        } else if(p.shape === 'circle'){
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.38, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else {
          drawHeart(p.size * 1.05, p.color);
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if(alive && elapsed < DURATION){
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- Main sequence ---------- */
  var medallionWrap = document.getElementById('medallion-wrap');
  var medallionHit = document.getElementById('medallion-hit');
  var doors = document.getElementById('doors');
  var revealGlow = document.getElementById('reveal-glow');

  /* Make sure the exact master webfonts are loaded before the typewriter
     animation starts, so mobile never briefly (or permanently) renders
     "Marlyn & Tihomir" in a fallback cursive font. Falls back gracefully
     (and never blocks forever) if the Font Loading API is unavailable
     or a font fails to load. */
  var fontsReadyPromise = (function(){
    if(!window.document.fonts || !document.fonts.load){
      return Promise.resolve();
    }
    return Promise.all([
      document.fonts.load("68.6px 'Great Vibes'"),
      document.fonts.load("500 35.6px 'Cormorant Garamond'"),
      document.fonts.load("700 54.6px 'Libre Baskerville'"),
      document.fonts.load("22.6px 'Tenor Sans'"),
      document.fonts.load("35.6px 'Beau Rivage'")
    ]).catch(function(){}).then(function(){
      return document.fonts.ready;
    }).catch(function(){});
  })();

  function startTypography(){
    typeLine(lineNames, 55, function(){
      setTimeout(function(){
        typeLine(lineGetting, 40, function(){
          setTimeout(function(){
            typeLine(lineMarried, 90, function(){
              // Brief elegant pause, then the scratch-off card softly
              // appears (fade + slight rise + subtle scale-in).
              setTimeout(function(){
                if(window.__revealScratchCard){ window.__revealScratchCard(); }
              }, 650);
            });
          }, 350);
        });
      }, 450);
    });
  }

  /* Single-trigger guard: one tap produces exactly one opening sequence,
     no matter how many pointer/click/touch events fire for it. */
  var experienceStarted = false;

  function beginExperience(){
    if(experienceStarted) return;
    experienceStarted = true;

    medallionWrap.classList.add('tapped');
    setTimeout(function(){
      medallionWrap.classList.add('hidden');
      medallionHit.classList.add('hidden');
    }, 380);

    doors.classList.add('open');

    setTimeout(runFireworksSequence, 550);

    setTimeout(function(){
      revealGlow.style.transition = 'opacity 1.4s ease';
      revealGlow.style.opacity = '1';
      setTimeout(function(){ revealGlow.style.opacity = '0'; }, 1500);
    }, 1500);

    setTimeout(function(){
      var typographyStarted = false;
      function go(){
        if(typographyStarted) return;
        typographyStarted = true;
        startTypography();
      }
      // Wait for the master webfonts, but never hang the sequence —
      // a short safety cap guarantees typing still starts on time
      // even if font loading stalls.
      fontsReadyPromise.then(go).catch(go);
      setTimeout(go, 400);
    }, 2700);
  }

  /* Robust pointer handling: Pointer Events cover mouse, touch, and pen
     in one listener across iPhone, Android, iPad, and desktop. Older
     browsers without PointerEvent fall back to click/touchend. The
     experienceStarted guard above means neither path can double-fire. */
  function attachTapHandlers(el){
    if(window.PointerEvent){
      el.addEventListener('pointerup', function(e){
        if(e.pointerType === 'mouse' && e.button !== 0) return;
        beginExperience();
      });
    } else {
      el.addEventListener('click', beginExperience);
      el.addEventListener('touchend', function(e){
        e.preventDefault();
        beginExperience();
      }, {passive:false});
    }
  }

  attachTapHandlers(medallionWrap);
  attachTapHandlers(medallionHit);

  /* ---------- Reveal the subtle scroll cue (Part 2) ---------- */
  window.__showBeginJourney = function(){
    var cue = document.getElementById('opener-scroll-cue');
    if(cue) cue.classList.add('shown');
    if(window.__armStoryScroll) window.__armStoryScroll();
  };

})();
