/*
	MAIN APP ver 0.2.0 alpha
	Copyright (c) 2018, 2024 Epistemex
*/

let snapshots = [];

/*-----------------------------------------------------------------------------------------------------------------*\

    Editor scope

\*-----------------------------------------------------------------------------------------------------------------*/

const editor = (function(updater) {

  const c = document.getElementById('main');
  const ctx = c.getContext('2d');
  const ph = new PointHost(ctx);
  const cm = new CanvasMouse(ctx);
  let isDown = false, gPointI = -1, gPoint, ref;
  let isMoving = false, dpos;

  let editScale = 300;
  let editTransX = 0.75, editTransY = 0.75;

  c.width = c.height = 720;

  // upper line
  ph.points.push(new Point(0, 0));
  ph.points.push(new Point(0.5, 0));
  ph.points.push(new Point(1, 0));

  // right line
  ph.points.push(new Point(1, 0.25));
  ph.points.push(new Point(1, 0.5));

  // bottom line
  ph.points.push(new Point(0.5, 0.5));
  ph.points.push(new Point(0, 0.5));

  // left line
  ph.points.push(new Point(0, 0.25));

  // anchor
  ph.points.push(new Point(0.5, 0.25));

  // mark control points
  ph.points[ 1 ].type = ph.points[ 3 ].type = ph.points[ 5 ].type = ph.points[ 7 ].type = 1; // control points
  ph.points[ 8 ].type = 2; // anchor point

  //Set diff. colors
  ph.points[ 1 ].fill1 = ph.points[ 3 ].fill1 = ph.points[ 5 ].fill1 = ph.points[ 7 ].fill1 = '#f78331';
  ph.points[ 1 ].fill2 = ph.points[ 3 ].fill2 = ph.points[ 5 ].fill2 = ph.points[ 7 ].fill2 = '#f9a931';
  ph.points[ 8 ].fill1 = '#209024';
  ph.points[ 8 ].fill2 = '#2ae73d';

  ph.translate(editTransX, editTransY);
  ph.scale(editScale, editScale);

  renderAll();

  c.onmousedown = function(e) {
    e.preventDefault();
    let pos = cm.getPos(e), i = 0, point;
    while( point = ph.points[ i++ ] ) {
      if ( point.inPoint(pos) ) {
        gPoint = point;
        gPointI = i - 1;
        isDown = true;
        break;
      }
    }
    if ( !isDown ) {
      ctx.beginPath();
      getBoxPath(ctx, ph.points);
      if ( ctx.isPointInPath(pos.x, pos.y) ) {
        isMoving = true;
        dpos = pos;
      }
    }
    renderAll(pos);
  };

  window.addEventListener('mouseup', function() {
    if ( isDown ) updater();
    isDown = isMoving = false;
  });

  window.addEventListener('mousemove', function(e) {
    cancelAnimationFrame(ref);
    ref = requestAnimationFrame(function() {
      const pos = cm.getPos(e);
      if ( pos.x >= 0 && pos.x < c.width && pos.y >= 0 && pos.y < c.height ) {
        if ( isDown ) gPoint.pos(pos);
        else if ( isMoving ) {
          ph.translate(pos.x - dpos.x, pos.y - dpos.y);
          dpos = pos;
        }
        renderAll(pos);
        if ( isDown ) updater();
      }
    });
  });

  function renderAll(pos) {

    const cfg = db.getBound();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);

    // spiral?
    if ( cfg.spiral ) {
      getGoldenSpiral(ctx, cfg.gsOffsetX, cfg.gsOffsetY, cfg.gsTurns, cfg.gsScale, cfg.gsAngle / 180 * Math.PI, cfg.gsMirror);
      ctx.lineWidth = 1 / cfg.gsScale;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if ( isDown && gPoint.type === 1 ) {
      renderHelper(ph.points[ gPointI - 1 ], gPoint, ph.points[ gPointI === 7 ? 0 : gPointI + 1 ]);
    }

    renderBox();
    ph.render(pos);
  }

  function renderBox() {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.beginPath();
    getBoxPath(ctx, ph.points);
    ctx.stroke();
  }

  function renderHelper(p1, cp, p2) {
    ctx.beginPath();

    // curve points
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(cp.x, cp.y);
    ctx.lineTo(p2.x, p2.y);

    // main points
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);

    // tangent
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const a = Math.atan2(dy, dx) - Math.PI * 0.5;

    tangent(p1.x + dx * 0.5, p1.y + dy * 0.5, a, 900);
    tangent(p1.x + dx * 0.3333, p1.y + dy * 0.3333, a, 900);
    tangent(p1.x + dx * 0.6667, p1.y + dy * 0.6667, a, 900);

    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([ 5, 5 ]);
    ctx.stroke();
    ctx.setLineDash([]);

    function tangent(mx, my, a, len) {
      ctx.moveTo(mx - len * Math.cos(a), my - len * Math.sin(a));
      ctx.lineTo(mx + len * Math.cos(a), my + len * Math.sin(a));
    }
  }

  function setPoints(points) {
    ph.points = points;
  }

  return {
    points   : ph.points,
    scale    : { x: editScale, y: editScale },
    translate: { x: editTransX, y: editTransY },
    setPoints: setPoints,
    render   : renderAll
  };

})(update);

/*-----------------------------------------------------------------------------------------------------------------*\

    Visualizer scope

\*-----------------------------------------------------------------------------------------------------------------*/

const viz = (function() {
  const c = document.getElementById('logo');
  const ctx = c.getContext('2d');

  c.width = c.height = 720;

  function render() {
    const points = [];
    const cfg = db.getBound();
    const offset = cfg.offset / 180 * Math.PI;
    const rot = cfg.rotation / 180 * Math.PI;
    const angle = (Math.PI * 2) / cfg.segments;

    // clone and adjust points
    editor.points.forEach(function(oldPoint) {
      const point = oldPoint.clone();
      point.scale(1 / editor.scale.x, 1 / editor.scale.y);
      point.translate(-editor.translate.x, -editor.translate.y);
      points.push(point);
    });

    // translate accord. to anchor point
    points.forEach(function(point) {point.translate(-points[ 8 ].x, -points[ 8 ].y);});

    // render shape based on config
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);

    // center-cross
    ctx.fillStyle = '#19191a';
    ctx.fillRect(c.width >> 1, 0, 1, c.height);
    ctx.fillRect(0, c.height >> 1, c.width, 1);

    ctx.beginPath();

    for(let i = 0; i < cfg.segments; i++) {
      ctx.setTransform(cfg.mirror ? -cfg.glScale : cfg.glScale, 0, 0, cfg.glScale, c.width >> 1, c.height >> 1);
      ctx.rotate(offset + i * angle);
      ctx.translate(cfg.radius, 0);
      ctx.translate(-points[ 8 ].x, -points[ 8 ].y);
      ctx.rotate(rot);
      ctx.translate(points[ 8 ].x, points[ 8 ].y);
      ctx.translate(cfg.offsetX, cfg.offsetY);
      ctx.scale(cfg.scale, cfg.scale);
      getBoxPath(ctx, points);
    }

    if ( cfg.outline ) {
      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = 1 / cfg.scale;
      ctx.stroke();
    }
    else {
      ctx.fillStyle = cfg.color;
      ctx.fill();
    }
  }

  return { render: render };
})();

// comm
function update() {
  editor.render();
  viz.render(editor.points);
}

function getBoxPath(ctx, points) {
  //ctx.beginPath();
  ctx.moveTo(points[ 0 ].x, points[ 0 ].y);
  ctx.quadraticCurveTo(points[ 1 ].x, points[ 1 ].y, points[ 2 ].x, points[ 2 ].y);
  ctx.quadraticCurveTo(points[ 3 ].x, points[ 3 ].y, points[ 4 ].x, points[ 4 ].y);
  ctx.quadraticCurveTo(points[ 5 ].x, points[ 5 ].y, points[ 6 ].x, points[ 6 ].y);
  ctx.quadraticCurveTo(points[ 7 ].x, points[ 7 ].y, points[ 0 ].x, points[ 0 ].y);
  ctx.closePath();
}

function getGoldenSpiral(ctx, cx, cy, turns, scale, startAngle, mirror) {

  const c = 1.3584562741829884;    // <= Math.pow(1 + Math.sqrt(5)) / 2, 2 / Math.PI), phi^2/PI
  const step = Math.PI * 0.025;
  let dx, dy, rad;

  turns = Math.max(+turns, 2) * 2 * Math.PI;

  ctx.beginPath();
  ctx.setTransform(mirror ? -scale : scale, 0, 0, scale, cx, cy);
  ctx.rotate(startAngle || 0);
  ctx.moveTo(1, 0);

  for(let i = step; i <= turns; i += step) {
    dx = Math.cos(i);
    dy = Math.sin(i);
    rad = Math.pow(c, i);
    ctx.lineTo(dx * rad, dy * rad);
  }
}

function load() {
  const data = localStorage.getItem('snapshots');
  if ( data ) {
    snapshots = JSON.parse(data);
  }
}

function save() {
  localStorage.setItem('snapshots', JSON.stringify(snapshots));
}

function makeSnapshot() {
  console.log('MAKE');
}

function createSnapshot() {
  return {
    id : getId(),
    pts: editor.points,
    cfg: db.getBound()
  };
}

function setSnapshot(id) {
  let snapshot, i = 0;
  while( snapshot = snapshots[ i++ ] ) {
    if ( snapshot.id === id ) break;
  }

  if ( snapshot ) {
    editor.setPoints = snapshot.points.concat();
    db.bindTo(snapshot.cfg);
    update();
  }
}

function getId() {
  let id = localStorage.getItem('_id') | 0;
  localStorage.setItem('_id', ++id);
  return id;
}

// Init viz canvas
load();
update();
