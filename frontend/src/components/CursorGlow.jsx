import {useEffect, useRef} from 'react';

/*
 * WebGL Fluid Simulation — Faithful port of proception.ai's production code.
 * Source: https://www.proception.ai/_next/static/chunks/3ef921e8d4077ce7.js
 *
 * Page-level config overrides (from their data file):
 *   DENSITY_DISSIPATION: 2, VELOCITY_DISSIPATION: 1.8,
 *   PRESSURE: 0.8, SPLAT_RADIUS: 0.15
 */

// ─── Helper: DPR scaling (matches proception's `ei` function) ───────────────
function scaleByPixelRatio(value) {
  return Math.floor(value * (window.devicePixelRatio || 1));
}

// ─── Shader sources (verbatim from proception.ai) ───────────────────────────

const baseVertexShader = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;

  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const copyShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;

  void main () {
    gl_FragColor = texture2D(uTexture, vUv);
  }
`;

const clearShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;

  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

// Display shader with SHADING support — computes fake lighting from density gradients
const displayShaderSource = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uTexture;
  uniform vec2 texelSize;

  vec3 linearToGamma (vec3 color) {
    color = max(color, vec3(0));
    return max(1.055 * pow(color, vec3(0.416666667)) - 0.055, vec3(0));
  }

  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;

    #ifdef SHADING
      vec3 lc = texture2D(uTexture, vL).rgb;
      vec3 rc = texture2D(uTexture, vR).rgb;
      vec3 tc = texture2D(uTexture, vT).rgb;
      vec3 bc = texture2D(uTexture, vB).rgb;

      float dx = length(rc) - length(lc);
      float dy = length(tc) - length(bc);

      vec3 n = normalize(vec3(dx, dy, length(texelSize)));
      vec3 l = vec3(0.0, 0.0, 1.0);

      float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
      c *= diffuse;
    #endif

    float a = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c, a);
  }
`;

const splatShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;

  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

// Advection with optional manual bilinear filtering
const advectionShaderSource = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;

  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);

    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);

    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main () {
    #ifdef MANUAL_FILTERING
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
      vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      vec4 result = texture2D(uSource, coord);
    #endif
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`;

const curlShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const vorticityShader = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;

  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const divergenceShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;

    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) { L = -C.x; }
    if (vR.x > 1.0) { R = -C.x; }
    if (vT.y > 1.0) { T = -C.y; }
    if (vB.y < 0.0) { B = -C.y; }

    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const pressureShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float C = texture2D(uPressure, vUv).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const gradientSubtractShader = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;

  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

// ─── Config — proception.ai's PAGE-LEVEL overrides ──────────────────────────
// The function defaults are different; the PAGE passes these specific values:
const config = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 1440,
  DENSITY_DISSIPATION: 2,       // page override (default was 3.5)
  VELOCITY_DISSIPATION: 1.8,    // page override (default was 2.0)
  PRESSURE: 0.8,                // page override (default was 0.1)
  PRESSURE_ITERATIONS: 20,
  CURL: 3,
  SPLAT_RADIUS: 0.15,           // page override (default was 0.2)
  SPLAT_FORCE: 6000,
  SHADING: true,
  COLOR_UPDATE_SPEED: 12,
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function compileShader(gl, type, source, keywords) {
  // Add #define directives for keywords (e.g., SHADING, MANUAL_FILTERING)
  if (keywords && keywords.length > 0) {
    let defines = '';
    for (const k of keywords) defines += `#define ${k}\n`;
    source = defines + source;
  }
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    return null;
  }
  return shader;
}

function createProgram(gl, vs, fs) {
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

function getUniforms(gl, program) {
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return uniforms;
}

// Program wrapper (matches proception.ai's `h` class)
class Program {
  constructor(gl, vs, fs) {
    this.gl = gl;
    this.program = createProgram(gl, vs, fs);
    this.uniforms = this.program ? getUniforms(gl, this.program) : {};
  }
  bind() { if (this.program) this.gl.useProgram(this.program); }
}

function createFBO(gl, w, h, internalFormat, format, type, filter) {
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const texelSizeX = 1.0 / w;
  const texelSizeY = 1.0 / h;

  return {
    texture, fbo, width: w, height: h, texelSizeX, texelSizeY,
    attach(id) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    },
  };
}

function createDoubleFBO(gl, w, h, internalFormat, format, type, filter) {
  let fbo1 = createFBO(gl, w, h, internalFormat, format, type, filter);
  let fbo2 = createFBO(gl, w, h, internalFormat, format, type, filter);
  return {
    width: w, height: h,
    texelSizeX: fbo1.texelSizeX,
    texelSizeY: fbo1.texelSizeY,
    get read() { return fbo1; },
    get write() { return fbo2; },
    swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; },
  };
}

function resizeDoubleFBO(gl, target, w, h, internalFormat, format, type, filter, copyProg, blit) {
  if (target.width === w && target.height === h) return target;
  const newFBO = createFBO(gl, w, h, internalFormat, format, type, filter);
  copyProg.bind();
  if (copyProg.uniforms.uTexture) gl.uniform1i(copyProg.uniforms.uTexture, target.read.attach(0));
  blit(newFBO, false);
  target.read = newFBO;
  target.write = createFBO(gl, w, h, internalFormat, format, type, filter);
  target.width = w;
  target.height = h;
  target.texelSizeX = 1.0 / w;
  target.texelSizeY = 1.0 / h;
  return target;
}

function getResolution(gl, resolution) {
  const w = gl.drawingBufferWidth;
  const h = gl.drawingBufferHeight;
  const ratio = w / h;
  const min = Math.round(resolution);
  const max = Math.round(resolution * (ratio < 1 ? 1 / ratio : ratio));
  return w > h ? { width: max, height: min } : { width: min, height: max };
}

function supportRenderTextureFormat(gl, internalFormat, format, type) {
  const texture = gl.createTexture();
  if (!texture) return false;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
  const fbo = gl.createFramebuffer();
  if (!fbo) return false;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.deleteTexture(texture);
  gl.deleteFramebuffer(fbo);
  return status;
}

function getSupportedFormat(gl, internalFormat, format, type) {
  if (!supportRenderTextureFormat(gl, internalFormat, format, type)) {
    if ('drawBuffers' in gl) {
      if (internalFormat === gl.R16F) return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
      if (internalFormat === gl.RG16F) return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
    }
    return null;
  }
  return { internalFormat, format };
}

// ─── HSV to RGB (exact proception.ai implementation) ────────────────────────
function HSVtoRGB(h, _s,_vv) {
  const i = Math.floor(6 * h);
  const f = 6 * h - i;
  const p = 0;              // v * (1 - s) = 0 when s=1
  const q = +(1 - f);       // v * (1 - f * s)
  const t = +(1 - (1 - f) * 1); // = f
  let r, g, b;
  switch (i % 6) {
    case 0: r = 1; g = t; b = p; break;
    case 1: r = q; g = 1; b = p; break;
    case 2: r = p; g = 1; b = t; break;
    case 3: r = p; g = q; b = 1; break;
    case 4: r = t; g = p; b = 1; break;
    case 5: r = 1; g = p; b = q; break;
    default: r = 0; g = 0; b = 0;
  }
  return { r, g, b };
}

function generateColor() {
  // Constrain hue to purple/violet/magenta range (0.75-0.92) to avoid blue
  const hue = 0.75 + Math.random() * 0.17;
  const c = HSVtoRGB(hue, 1, 1);
  c.r *= 0.15;
  c.g *= 0.15;
  c.b *= 0.15;
  return c;
}

// ─── React Component ────────────────────────────────────────────────────────────

export default function CursorGlow() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pointer state (matches proception.ai's `w` array with single pointer)
    const pointer = {
      id: -1,
      texcoordX: 0, texcoordY: 0,
      prevTexcoordX: 0, prevTexcoordY: 0,
      deltaX: 0, deltaY: 0,
      down: false, moved: false,
      color: { r: 0, g: 0, b: 0 },
    };

    // Config copy (mutable)
    const S = { ...config };

    // ── WebGL context ──
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    let gl = canvas.getContext('webgl2', params);
    const isWebGL2 = !!gl;
    if (!gl) gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
    if (!gl) { console.warn('WebGL not available'); return; }

    let supportLinearFiltering = false;
    let halfFloatTexType, formatRGBA, formatRG, formatR;

    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = !!gl.getExtension('OES_texture_float_linear');
      halfFloatTexType = gl.HALF_FLOAT;
      formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType) || { internalFormat: gl.RGBA, format: gl.RGBA };
      formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType) || { internalFormat: gl.RGBA, format: gl.RGBA };
      formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType) || { internalFormat: gl.RGBA, format: gl.RGBA };
    } else {
      const halfFloat = gl.getExtension('OES_texture_half_float');
      halfFloatTexType = halfFloat ? halfFloat.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
      supportLinearFiltering = !!gl.getExtension('OES_texture_half_float_linear');
      formatRGBA = { internalFormat: gl.RGBA, format: gl.RGBA };
      formatRG = { internalFormat: gl.RGBA, format: gl.RGBA };
      formatR = { internalFormat: gl.RGBA, format: gl.RGBA };
    }

    if (!supportLinearFiltering) {
      S.DYE_RESOLUTION = 256;
      S.SHADING = false;
    }

    gl.clearColor(0, 0, 0, 1);

    // ── Compile programs ──
    const baseVS = compileShader(gl, gl.VERTEX_SHADER, baseVertexShader);

    const copyProg = new Program(gl, baseVS, compileShader(gl, gl.FRAGMENT_SHADER, copyShader));
    const clearProg = new Program(gl, baseVS, compileShader(gl, gl.FRAGMENT_SHADER, clearShader));
    const splatProg = new Program(gl, baseVS, compileShader(gl, gl.FRAGMENT_SHADER, splatShader));
    const curlProg = new Program(gl, baseVS, compileShader(gl, gl.FRAGMENT_SHADER, curlShader));
    const vorticityProg = new Program(gl, baseVS, compileShader(gl, gl.FRAGMENT_SHADER, vorticityShader));
    const divergenceProg = new Program(gl, baseVS, compileShader(gl, gl.FRAGMENT_SHADER, divergenceShader));
    const pressureProg = new Program(gl, baseVS, compileShader(gl, gl.FRAGMENT_SHADER, pressureShader));
    const gradientSubtractProg = new Program(gl, baseVS, compileShader(gl, gl.FRAGMENT_SHADER, gradientSubtractShader));

    // Advection with optional MANUAL_FILTERING for devices that don't support linear filtering
    const advectionKeywords = supportLinearFiltering ? null : ['MANUAL_FILTERING'];
    const advectionProg = new Program(gl, baseVS, compileShader(gl, gl.FRAGMENT_SHADER, advectionShaderSource, advectionKeywords));

    // Display shader with SHADING keyword
    const displayKeywords = S.SHADING ? ['SHADING'] : [];
    const displayProg = new Program(gl, baseVS, compileShader(gl, gl.FRAGMENT_SHADER, displayShaderSource, displayKeywords));

    // ── Full-screen quad ──
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    function blit(target, clear = false) {
      if (target) {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      } else {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      if (clear) {
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    // ── Init framebuffers ──
    let dye, velocity, curlFBO, divergenceFBO, pressure;

    function initFramebuffers() {
      const simRes = getResolution(gl, S.SIM_RESOLUTION);
      const dyeRes = getResolution(gl, S.DYE_RESOLUTION);
      const texType = halfFloatTexType;
      const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

      gl.disable(gl.BLEND);

      if (dye) {
        dye = resizeDoubleFBO(gl, dye, dyeRes.width, dyeRes.height, formatRGBA.internalFormat, formatRGBA.format, texType, filtering, copyProg, blit);
      } else {
        dye = createDoubleFBO(gl, dyeRes.width, dyeRes.height, formatRGBA.internalFormat, formatRGBA.format, texType, filtering);
      }

      if (velocity) {
        velocity = resizeDoubleFBO(gl, velocity, simRes.width, simRes.height, formatRG.internalFormat, formatRG.format, texType, filtering, copyProg, blit);
      } else {
        velocity = createDoubleFBO(gl, simRes.width, simRes.height, formatRG.internalFormat, formatRG.format, texType, filtering);
      }

      curlFBO = createFBO(gl, simRes.width, simRes.height, formatR.internalFormat, formatR.format, texType, gl.NEAREST);
      divergenceFBO = createFBO(gl, simRes.width, simRes.height, formatR.internalFormat, formatR.format, texType, gl.NEAREST);
      pressure = createDoubleFBO(gl, simRes.width, simRes.height, formatR.internalFormat, formatR.format, texType, gl.NEAREST);
    }

    initFramebuffers();

    // ── Splat ──
    function splat(x, y, dx, dy, color) {
      splatProg.bind();
      if (splatProg.uniforms.uTarget) gl.uniform1i(splatProg.uniforms.uTarget, velocity.read.attach(0));
      if (splatProg.uniforms.aspectRatio) gl.uniform1f(splatProg.uniforms.aspectRatio, canvas.width / canvas.height);
      if (splatProg.uniforms.point) gl.uniform2f(splatProg.uniforms.point, x, y);
      if (splatProg.uniforms.color) gl.uniform3f(splatProg.uniforms.color, dx, dy, 0.0);
      let radius = S.SPLAT_RADIUS / 100.0;
      const ar = canvas.width / canvas.height;
      if (ar > 1) radius *= ar;
      if (splatProg.uniforms.radius) gl.uniform1f(splatProg.uniforms.radius, radius);
      blit(velocity.write);
      velocity.swap();

      if (splatProg.uniforms.uTarget) gl.uniform1i(splatProg.uniforms.uTarget, dye.read.attach(0));
      if (splatProg.uniforms.color) gl.uniform3f(splatProg.uniforms.color, color.r, color.g, color.b);
      blit(dye.write);
      dye.swap();
    }

    // ── Sim step ──
    function step(dt) {
      gl.disable(gl.BLEND);

      // Curl
      curlProg.bind();
      if (curlProg.uniforms.texelSize) gl.uniform2f(curlProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (curlProg.uniforms.uVelocity) gl.uniform1i(curlProg.uniforms.uVelocity, velocity.read.attach(0));
      blit(curlFBO);

      // Vorticity
      vorticityProg.bind();
      if (vorticityProg.uniforms.texelSize) gl.uniform2f(vorticityProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (vorticityProg.uniforms.uVelocity) gl.uniform1i(vorticityProg.uniforms.uVelocity, velocity.read.attach(0));
      if (vorticityProg.uniforms.uCurl) gl.uniform1i(vorticityProg.uniforms.uCurl, curlFBO.attach(1));
      if (vorticityProg.uniforms.curl) gl.uniform1f(vorticityProg.uniforms.curl, S.CURL);
      if (vorticityProg.uniforms.dt) gl.uniform1f(vorticityProg.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      // Divergence
      divergenceProg.bind();
      if (divergenceProg.uniforms.texelSize) gl.uniform2f(divergenceProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (divergenceProg.uniforms.uVelocity) gl.uniform1i(divergenceProg.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergenceFBO);

      // Clear pressure
      clearProg.bind();
      if (clearProg.uniforms.uTexture) gl.uniform1i(clearProg.uniforms.uTexture, pressure.read.attach(0));
      if (clearProg.uniforms.value) gl.uniform1f(clearProg.uniforms.value, S.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      // Pressure solve
      pressureProg.bind();
      if (pressureProg.uniforms.texelSize) gl.uniform2f(pressureProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (pressureProg.uniforms.uDivergence) gl.uniform1i(pressureProg.uniforms.uDivergence, divergenceFBO.attach(0));
      for (let i = 0; i < S.PRESSURE_ITERATIONS; i++) {
        if (pressureProg.uniforms.uPressure) gl.uniform1i(pressureProg.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      // Gradient subtract
      gradientSubtractProg.bind();
      if (gradientSubtractProg.uniforms.texelSize) gl.uniform2f(gradientSubtractProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (gradientSubtractProg.uniforms.uPressure) gl.uniform1i(gradientSubtractProg.uniforms.uPressure, pressure.read.attach(0));
      if (gradientSubtractProg.uniforms.uVelocity) gl.uniform1i(gradientSubtractProg.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      // Advect velocity
      advectionProg.bind();
      if (advectionProg.uniforms.texelSize) gl.uniform2f(advectionProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      if (!supportLinearFiltering && advectionProg.uniforms.dyeTexelSize)
        gl.uniform2f(advectionProg.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
      const velTex = velocity.read.attach(0);
      if (advectionProg.uniforms.uVelocity) gl.uniform1i(advectionProg.uniforms.uVelocity, velTex);
      if (advectionProg.uniforms.uSource) gl.uniform1i(advectionProg.uniforms.uSource, velTex);
      if (advectionProg.uniforms.dt) gl.uniform1f(advectionProg.uniforms.dt, dt);
      if (advectionProg.uniforms.dissipation) gl.uniform1f(advectionProg.uniforms.dissipation, S.VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      // Advect dye
      if (!supportLinearFiltering && advectionProg.uniforms.dyeTexelSize)
        gl.uniform2f(advectionProg.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
      if (advectionProg.uniforms.uVelocity) gl.uniform1i(advectionProg.uniforms.uVelocity, velocity.read.attach(0));
      if (advectionProg.uniforms.uSource) gl.uniform1i(advectionProg.uniforms.uSource, dye.read.attach(1));
      if (advectionProg.uniforms.dissipation) gl.uniform1f(advectionProg.uniforms.dissipation, S.DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }

    // ── Render ──
    function render() {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);

      displayProg.bind();
      if (S.SHADING && displayProg.uniforms.texelSize)
        gl.uniform2f(displayProg.uniforms.texelSize, 1.0 / gl.drawingBufferWidth, 1.0 / gl.drawingBufferHeight);
      if (displayProg.uniforms.uTexture)
        gl.uniform1i(displayProg.uniforms.uTexture, dye.read.attach(0));
      blit(null, false);
    }

    // ── Pointer handling (exact proception.ai logic) ──
    function updatePointerDown(x, y) {
      pointer.down = true;
      pointer.moved = false;
      pointer.texcoordX = x / canvas.width;
      pointer.texcoordY = 1.0 - y / canvas.height;
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.deltaX = 0;
      pointer.deltaY = 0;
      pointer.color = generateColor();
    }

    function updatePointerMove(x, y, color) {
      pointer.prevTexcoordX = pointer.texcoordX;
      pointer.prevTexcoordY = pointer.texcoordY;
      pointer.texcoordX = x / canvas.width;
      pointer.texcoordY = 1.0 - y / canvas.height;

      let deltaX = pointer.texcoordX - pointer.prevTexcoordX;
      let deltaY = pointer.texcoordY - pointer.prevTexcoordY;
      const ar = canvas.width / canvas.height;
      if (ar < 1) deltaX *= ar;
      if (ar > 1) deltaY /= ar;
      pointer.deltaX = deltaX;
      pointer.deltaY = deltaY;

      pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
      pointer.color = color;
    }

    function splatPointer() {
      const dx = pointer.deltaX * S.SPLAT_FORCE;
      const dy = pointer.deltaY * S.SPLAT_FORCE;
      splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
    }

    // ── Events (matching proception.ai exactly — DPR scaled coordinates) ──
    let firstMove = true;

    function handleMouseDown(e) {
      const x = scaleByPixelRatio(e.clientX);
      const y = scaleByPixelRatio(e.clientY);
      updatePointerDown(x, y);
      // Mousedown boost: 10x color, random directional splat
      const c = generateColor();
      c.r *= 10; c.g *= 10; c.b *= 10;
      const dx = 10 * (Math.random() - 0.5);
      const dy = 30 * (Math.random() - 0.5);
      splat(pointer.texcoordX, pointer.texcoordY, dx, dy, c);
    }

    function handleMouseMove(e) {
      const x = scaleByPixelRatio(e.clientX);
      const y = scaleByPixelRatio(e.clientY);

      // First move triggers an immediate update (matching proception's body listener)
      if (firstMove) {
        firstMove = false;
        updatePointerMove(x, y, generateColor());
        return;
      }

      updatePointerMove(x, y, pointer.color);
    }

    function handleTouchStart(e) {
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        updatePointerDown(scaleByPixelRatio(touches[i].clientX), scaleByPixelRatio(touches[i].clientY));
      }
    }

    function handleTouchMove(e) {
      const touches = e.targetTouches;
      for (let i = 0; i < touches.length; i++) {
        updatePointerMove(scaleByPixelRatio(touches[i].clientX), scaleByPixelRatio(touches[i].clientY), pointer.color);
      }
    }

    function handleTouchEnd() {
      pointer.down = false;
    }

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart, false);
    window.addEventListener('touchmove', handleTouchMove, false);
    window.addEventListener('touchend', handleTouchEnd);

    // ── Animation loop ──
    let lastTime = Date.now();
    let colorUpdateTimer = 0;

    function update() {
      const now = Date.now();
      let dt = (now - lastTime) / 1000;
      dt = Math.min(dt, 0.016666);
      lastTime = now;

      // Resize canvas (DPR-aware, matching proception.ai)
      const targetW = scaleByPixelRatio(canvas.clientWidth);
      const targetH = scaleByPixelRatio(canvas.clientHeight);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        initFramebuffers();
      }

      // Color cycling (matches proception.ai's COLOR_UPDATE_SPEED logic)
      colorUpdateTimer += dt * S.COLOR_UPDATE_SPEED;
      if (colorUpdateTimer >= 1) {
        colorUpdateTimer = colorUpdateTimer % 1;
        pointer.color = generateColor();
      }

      // Input
      if (pointer.moved) {
        pointer.moved = false;
        splatPointer();
      }

      step(dt);
      render();
      requestAnimationFrame(update);
    }

    requestAnimationFrame(update);

    // ── Cleanup ──
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 20,
      pointerEvents: 'none',
      width: '100%',
      height: '100%',
    }}>
      <canvas
        ref={canvasRef}
        id="fluid"
        style={{
          width: '100vw',
          height: '100vh',
          display: 'block',
        }}
      />
    </div>
  );
}
