/*
	Point & host objects

	Copyright (c) 2018 Epistemex
	www.epistemex.com
*/

function PointHost(ctx) {
  this.ctx = ctx;
  this.canvas = ctx.canvas;
  this.points = [];
  this.clear = false;
  this.type = 0;
}

PointHost.prototype = {

  render: function(pos) {
    var me = this;
    pos = pos || {x:-999999, y:-1};
    me.ctx.setTransform(1,0,0,1,0,0);
    if (this.clear) me.ctx.clearRect(0, 0, me.canvas.width, me.canvas.height);
    me.ctx.globalCompositeOperation = "lighter";
    me.points.forEach(function(point) {
      point.render(me.ctx, point.inPoint(pos))
    });
    me.ctx.globalCompositeOperation = "source-over";
  },

  scale: function(sx, sy) {
    this.points.forEach(function(point) {point.scale(sx, sy)})
  },

  translate: function(x, y) {
    this.points.forEach(function(point) {point.translate(x, y)})
  },

  getBounds: function() {
    var
      minX = Number.MAX_VALUE, minY = Number.MAX_VALUE,
      maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE;

    this.points.forEach(function(point) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    });

    return {
      left: minX,
      top: minY,
      width: maxX - minX,
      height: maxY - minY,
      right: maxX,
      bottom: maxY
    }
  }

};

function Point(x, y, r) {
  this.x = x;
  this.y = y;
  this.radius = r || 7;
  this.fill1 = "#069";
  this.fill2 = "#3af";
}

Point.prototype = {

  inPoint: function(pos) {
    return Math.hypot(this.x - pos.x, this.y - pos.y) <= this.radius
  },

  pos: function(pos) {
    if (!arguments.length) return {x: this.x, y: this.y};
    this.x = pos.x;
    this.y = pos.y;
  },

  scale: function(sx, sy) {
    this.x *= sx;
    this.y *= sy;
  },

  translate: function(x, y) {
    this.x += x;
    this.y += y;
  },

  clone: function() {
    var p = new Point(this.x, this.y, this.radius);
    p.fill1 = this.fill1;
    p.fill2 = this.fill2;
    return p
  },

  render: function(ctx, inPoint) {
    ctx.beginPath();
    ctx.moveTo(this.x + this.radius, this.y);
    ctx.arc(this.x, this.y, this.radius, 0, 6.28);
    ctx.fillStyle = inPoint ? this.fill2 : this.fill1;
    ctx.fill();
  }

};

