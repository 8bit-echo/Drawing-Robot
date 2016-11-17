function svg2wkt() {
    var SVGNS = 'http://www.w3.org/2000/svg';
    var SVGtoWKT = {};
    SVGtoWKT.PRECISION = 3;
    SVGtoWKT.DENSITY = 1;
    SVGtoWKT.convert = function(svg) {
        if (_.isUndefined(svg) || _.isEmpty(svg.trim())) {
            throw new Error('Empty XML.');
        }
        var els = [];
        var xml;
        svg = svg.replace(/\r\n|\r|\n|\t/g, '');
        try {
            xml = $($.parseXML(svg));
        } catch (e) {
            throw new Error('Invalid XML.');
        }
        xml.find('polygon').each(function(i, polygon) {
            els.push(SVGtoWKT.polygon($(polygon).attr('points')));
        });
        xml.find('polyline').each(function(i, polyline) {
            els.push(SVGtoWKT.polyline($(polyline).attr('points')));
        });
        xml.find('line').each(function(i, line) {
            els.push(SVGtoWKT.line(parseFloat($(line).attr('x1')), parseFloat($(line).attr('y1')), parseFloat($(line).attr('x2')), parseFloat($(line).attr('y2'))));
        });
        xml.find('rect').each(function(i, rect) {
            els.push(SVGtoWKT.rect(parseFloat($(rect).attr('x')), parseFloat($(rect).attr('y')), parseFloat($(rect).attr('width')), parseFloat($(rect).attr('height'))));
        });
        xml.find('circle').each(function(i, circle) {
            els.push(SVGtoWKT.circle(parseFloat($(circle).attr('cx')), parseFloat($(circle).attr('cy')), parseFloat($(circle).attr('r'))));
        });
        xml.find('ellipse').each(function(i, circle) {
            els.push(SVGtoWKT.ellipse(parseFloat($(circle).attr('cx')), parseFloat($(circle).attr('cy')), parseFloat($(circle).attr('rx')), parseFloat($(circle).attr('ry'))));
        });
        xml.find('path').each(function(i, path) {
            els.push(SVGtoWKT.path($(path).attr('d')));
        });
        return 'GEOMETRYCOLLECTION(' + els.join(',') + ')';
    };
    SVGtoWKT.line = function(x1, y1, x2, y2) {
        return 'LINESTRING(' + x1 + ' ' + -y1 + ',' + x2 + ' ' + -y2 + ')';
    };
    SVGtoWKT.polyline = function(points) {
        var pts = _.map(points.trim().split(' '), function(pt) {
            pt = pt.split(',');
            pt[1] = -pt[1];
            return pt.join(' ');
        });
        return 'LINESTRING(' + pts.join() + ')';
    };
    SVGtoWKT.polygon = function(points) {
        var pts = _.map(points.trim().split(' '), function(pt) {
            pt = pt.split(',');
            pt[1] = -pt[1];
            return pt.join(' ');
        });
        pts.push(pts[0]);
        return 'POLYGON((' + pts.join() + '))';
    };
    SVGtoWKT.rect = function(x, y, width, height) {
        var pts = [];
        if (!_.isNumber(x)) x = 0;
        if (!_.isNumber(y)) y = 0;
        pts.push(String(x) + ' ' + String(-y));
        pts.push(String(x + width) + ' ' + String(-y));
        pts.push(String(x + width) + ' ' + String(-y - height));
        pts.push(String(x) + ' ' + String(-y - height));
        pts.push(String(x) + ' ' + String(-y));
        return 'POLYGON((' + pts.join() + '))';
    };
    SVGtoWKT.circle = function(cx, cy, r) {
        var wkt = 'POLYGON((';
        var pts = [];
        var circumference = Math.PI * 2 * r;
        var point_count = Math.round(circumference * SVGtoWKT.DENSITY);
        var interval_angle = 360 / point_count;
        _(point_count).times(function(i) {
            var angle = (interval_angle * i) * (Math.PI / 180);
            var x = __round(cx + r * Math.cos(angle));
            var y = __round(cy + r * Math.sin(angle));
            pts.push(String(x) + ' ' + String(-y));
        });
        pts.push(pts[0]);
        return wkt + pts.join() + '))';
    };
    SVGtoWKT.ellipse = function(cx, cy, rx, ry) {
        var wkt = 'POLYGON((';
        var pts = [];
        var circumference = 2 * Math.PI * Math.sqrt((Math.pow(rx, 2) + Math.pow(ry, 2)) / 2);
        var point_count = Math.round(circumference * SVGtoWKT.DENSITY);
        var interval_angle = 360 / point_count;
        _(point_count).times(function(i) {
            var angle = (interval_angle * i) * (Math.PI / 180);
            var x = __round(cx + rx * Math.cos(angle));
            var y = __round(cy + ry * Math.sin(angle));
            pts.push(String(x) + ' ' + String(-y));
        });
        pts.push(pts[0]);
        return wkt + pts.join() + '))';
    };
    SVGtoWKT.path = function(d) {
        var polys = _.map(d.trim().match(/[^z|Z]+[z|Z]/g), function(p) {
            return __pathElement(p.trim() + 'z');
        });
        if (!_.isEmpty(polys)) {
            var parts = [];
            _.each(polys, function(poly) {
                parts.push('(' + __pathPoints(poly).join() + ')');
            });
            return 'POLYGON(' + parts.join() + ')';
        } else {
            var line = __pathElement(d);
            return 'LINESTRING(' + __pathPoints(line).join() + ')';
        }
    };
    var __pathElement = function(d) {
        var path = document.createElementNS(SVGNS, 'path');
        path.setAttributeNS(null, 'd', d);
        return path;
    };
    var __pathPoints = function(path, closed) {
        closed = closed || false;
        var pts = [];
        var length = path.getTotalLength();
        var count = Math.round(length * SVGtoWKT.DENSITY);
        _(count + 1).times(function(i) {
            var point = path.getPointAtLength((length * i) / count);
            pts.push(String(__round(point.x)) + ' ' + String(__round(-point.y)));
        });
        if (closed) pts.push(pts[0]);
        return pts;
    };
    var __round = function(val) {
        var root = Math.pow(10, SVGtoWKT.PRECISION);
        return Math.round(val * root) / root;
    };
    this.SVGtoWKT = SVGtoWKT;
}
