import React, { useRef, useEffect, useCallback } from 'react';

const C = {
  bg:          '#03030f',
  grid:        'rgba(0,60,180,0.07)',
  node:        '#0088ee',
  nodeGlow:    '#0044ff',
  nodeStart:   '#00ccff',
  nodeVisited: '#005599',
  nodeCurrent: '#ffffff',
  nodeDone:    '#00ff88',
  edgeCurrent: 'rgba(0,120,255,0.55)',
  edgeCurrentGlow: '#0055ff',
  edgeBest:    '#00ff88',
  edgeBestGlow:'#00cc66',
  mst:         '#ff8822',
  mstGlow:     '#ff5500',
  match:       '#bb44ff',
  matchGlow:   '#8800ff',
  euler:       '#00ddff',
  eulerGlow:   '#0088cc',
  text:        '#7eadd4',
  textBright:  '#d8eaff',
};

function toCanvas(node, W, H, pad = 50) {
  return { x: pad + node.x * (W - 2 * pad), y: pad + node.y * (H - 2 * pad) };
}

function neonLine(ctx, x1, y1, x2, y2, color, width, glow, blur = 18) {
  ctx.save();
  ctx.shadowBlur = blur;
  ctx.shadowColor = glow || color;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function neonArrow(ctx, x1, y1, x2, y2, color, width, glow) {
  neonLine(ctx, x1, y1, x2, y2, color, width, glow);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLen = 10;
  const arrowAngle = 0.4;
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = glow || color;
  ctx.strokeStyle = color;
  ctx.lineWidth = width * 0.8;
  ctx.lineCap = 'round';
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  ctx.beginPath();
  ctx.moveTo(mx - Math.cos(angle - arrowAngle) * arrowLen, my - Math.sin(angle - arrowAngle) * arrowLen);
  ctx.lineTo(mx, my);
  ctx.lineTo(mx - Math.cos(angle + arrowAngle) * arrowLen, my - Math.sin(angle + arrowAngle) * arrowLen);
  ctx.stroke();
  ctx.restore();
}

function drawPath(ctx, pts, path, color, width, glow) {
  if (!path || path.length < 2) return;
  for (let i = 0; i < path.length - 1; i++) {
    const a = pts[path[i]], b = pts[path[i + 1]];
    if (!a || !b) continue;
    neonArrow(ctx, a.x, a.y, b.x, b.y, color, width, glow);
  }
}

function drawNode(ctx, x, y, r, color, glow, label, fontSize) {
  ctx.save();
  // outer glow ring
  ctx.shadowBlur = 28;
  ctx.shadowColor = glow || color;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // label — fully clear shadow so text is crisp
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px 'Share Tech Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y);
  ctx.restore();
}

function drawGrid(ctx, W, H) {
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 1;
  const step = 60;
  for (let x = 0; x <= W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y <= H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

function drawStatusOverlay(ctx, W, H, frame) {
  if (!frame) return;

  // Phase badge
  if (frame.phase) {
    const text = frame.phase.toUpperCase();
    const tw = ctx.measureText(text).width;
    ctx.save();
    ctx.font = `bold 11px 'Share Tech Mono', monospace`;
    const tw2 = ctx.measureText(text).width;
    const bw = tw2 + 20, bh = 26, bx = 12, by = 12;
    ctx.fillStyle = 'rgba(0,40,80,0.7)';
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,170,255,0.35)';
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.stroke();
    ctx.fillStyle = C.nodeStart;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + 10, by + bh / 2);
    ctx.restore();
  }

  // Status bar bottom
  if (frame.status) {
    const barH = 36;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,10,0.82)';
    ctx.fillRect(0, H - barH, W, barH);
    ctx.strokeStyle = 'rgba(0,100,200,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H - barH); ctx.lineTo(W, H - barH); ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.font = `12px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(frame.status, W / 2, H - barH / 2);
    ctx.restore();
  }

  // Progress bar
  if (frame.progress !== undefined && frame.progress > 0) {
    const ph = 3;
    ctx.save();
    ctx.fillStyle = 'rgba(0,170,255,0.12)';
    ctx.fillRect(0, H - ph, W, ph);
    ctx.shadowBlur = 8;
    ctx.shadowColor = C.nodeStart;
    ctx.fillStyle = C.nodeStart;
    ctx.fillRect(0, H - ph, W * Math.min(frame.progress, 1), ph);
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function Graph({ nodes, frame }) {
  const canvasRef  = useRef(null);
  const containerRef = useRef(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr  = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    if (W === 0 || H === 0) return;

    // Scale canvas buffer to physical pixels for crisp rendering
    const pw = Math.round(W * dpr);
    const ph = Math.round(H * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width  = pw;
      canvas.height = ph;
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // reset + apply DPR scale
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    drawGrid(ctx, W, H);

    if (!nodes || nodes.length === 0) {
      ctx.fillStyle = C.text;
      ctx.font = `14px 'Share Tech Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Set node count and press Run', W / 2, H / 2);
      return;
    }

    const pts = nodes.map(n => toCanvas(n, W, H));
    const r = Math.max(9, Math.min(16, 220 / nodes.length));
    const fs = Math.max(8, Math.min(13, 200 / nodes.length));

    // ── Phase-specific edges (MST, matching, euler) ──
    if (frame?.phaseEdges) {
      for (const e of frame.phaseEdges) {
        const a = pts[e.from], b = pts[e.to];
        if (!a || !b) continue;
        neonLine(ctx, a.x, a.y, b.x, b.y, e.color, e.width || 2, e.glow || e.color, 22);
      }
    }

    // ── Current evaluation path ──
    if (frame?.currentPath) {
      drawPath(ctx, pts, frame.currentPath, C.edgeCurrent, 1.5, C.edgeCurrentGlow);
    }

    // ── Best tour (on top) ──
    if (frame?.bestPath) {
      drawPath(ctx, pts, frame.bestPath, C.edgeBest, 2.5, C.edgeBestGlow);
    }

    // ── Highlight a single edge being probed ──
    if (frame?.highlightEdge) {
      const { from, to } = frame.highlightEdge;
      const a = pts[from], b = pts[to];
      if (a && b) neonLine(ctx, a.x, a.y, b.x, b.y, '#ffffff', 2.5, '#ccddff', 30);
    }

    // ── Nodes ──
    for (let i = 0; i < nodes.length; i++) {
      const p = pts[i];
      let col  = C.node;
      let glow = C.nodeGlow;

      if (frame?.done && frame.bestPath?.slice(0, -1).includes(i)) {
        col = C.nodeDone; glow = '#00cc66';
      } else if (frame?.currentNode === i) {
        col = C.nodeCurrent; glow = '#aaddff';
      } else if (frame?.visitedNodes?.includes(i)) {
        col = C.nodeVisited; glow = '#003388';
      } else if (frame?.oddNodes?.includes(i)) {
        col = '#ff3355'; glow = '#ff0022';
      } else if (i === 0) {
        col = C.nodeStart; glow = '#0099dd';
      }

      drawNode(ctx, p.x, p.y, r, col, glow, String(i), fs);
    }

    drawStatusOverlay(ctx, W, H, frame);
  }, [nodes, frame]);

  useEffect(() => { render(); }, [render]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => render());
    ro.observe(container);
    return () => ro.disconnect();
  }, [render]);

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', background: C.bg }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
      />
    </div>
  );
}
