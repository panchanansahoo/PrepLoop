import{s as _e,h as gs,w as xs,o as Y,V as _t,f as ys,d as bs,e as vs,g as js,p as Ns,u as Cs,r as Es,i as ws,k as Ss,l as ks,v as Ts,j as e,c as ke}from"./vendor-richtext-CSQPGedM.js";import{H as fe,g as Ls,z as Rs,r as c}from"./vendor-react-DI4irv9A.js";import{F as Ms}from"./vendor-editor-CxyAdGpY.js";import{L as X,a as Ps}from"./dsaTemplates-BJ0IL_qw.js";import{g as As,K as xt,B as Is,P as zs,E as yt,r as _s,s as $s}from"./editorThemes-CE2EkiMP.js";import{A as bt}from"./alert-triangle-CGw1hphE.js";import{c as Q,Q as pe,E as me,a as Te,S as Le,P as vt,X as jt,g as Os,o as qs,h as Ds,M as Fs,s as Hs}from"./index-CNIs3x7e.js";import{H as Re}from"./history-C4ERuG7w.js";import{I as Nt}from"./info-v_7XPVKW.js";import{A as Ct}from"./arrow-left-B08JJfsP.js";import{R as Et}from"./rotate-ccw-CfdfvdxX.js";import{C as Me}from"./check-mYQNvxxq.js";import{S as Ws}from"./share-2-Cj2tiZxq.js";import{C as wt,Z as Js,a as Us}from"./zoom-out-DcGLzHXz.js";import{M as Gs}from"./minimize-2-CkLdPapD.js";import{M as Bs}from"./maximize-2-BIcLbXhg.js";import{R as Vs}from"./refresh-cw-BTEYprwY.js";import"./vendor-reactflow-DuZ3O1to.js";/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ks=Q("ClipboardCheck",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"m9 14 2 2 4-4",key:"df797q"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xs=Q("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ys=Q("Eraser",[["path",{d:"m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21",key:"182aya"}],["path",{d:"M22 21H7",key:"t4ddhn"}],["path",{d:"m5 11 9 9",key:"1mo9qw"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zs=Q("FileCode2",[["path",{d:"M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",key:"1pf5j1"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m5 12-3 3 3 3",key:"oke12k"}],["path",{d:"m9 18 3-3-3-3",key:"112psh"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qs=Q("PanelRightOpen",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M15 3v18",key:"14nvp0"}],["path",{d:"m10 15-3-3 3-3",key:"1pgupc"}]]),en=/^[$_\p{ID_Start}][$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,tn=/^[$_\p{ID_Start}][-$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,sn={};function St(s,n){return(sn.jsx?tn:en).test(s)}var $e={},kt=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,nn=/\n/g,rn=/^\s*/,an=/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/,on=/^:\s*/,ln=/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/,cn=/^[;\s]*/,un=/^\s+|\s+$/g,dn=`
`,Tt="/",Lt="*",W="",pn="comment",mn="declaration";function hn(s,n){if(typeof s!="string")throw new TypeError("First argument must be a string");if(!s)return[];n=n||{};var i=1,r=1;function l(g){var f=g.match(nn);f&&(i+=f.length);var j=g.lastIndexOf(dn);r=~j?g.length-j:r+g.length}function a(){var g={line:i,column:r};return function(f){return f.position=new d(g),y(),f}}function d(g){this.start=g,this.end={line:i,column:r},this.source=n.source}d.prototype.content=s;function u(g){var f=new Error(n.source+":"+i+":"+r+": "+g);if(f.reason=g,f.filename=n.source,f.line=i,f.column=r,f.source=s,!n.silent)throw f}function m(g){var f=g.exec(s);if(f){var j=f[0];return l(j),s=s.slice(j.length),f}}function y(){m(rn)}function h(g){var f;for(g=g||[];f=v();)f!==!1&&g.push(f);return g}function v(){var g=a();if(!(Tt!=s.charAt(0)||Lt!=s.charAt(1))){for(var f=2;W!=s.charAt(f)&&(Lt!=s.charAt(f)||Tt!=s.charAt(f+1));)++f;if(f+=2,W===s.charAt(f-1))return u("End of comment missing");var j=s.slice(2,f-2);return r+=2,l(j),s=s.slice(f),r+=2,g({type:pn,comment:j})}}function w(){var g=a(),f=m(an);if(f){if(v(),!m(on))return u("property missing ':'");var j=m(ln),ee=g({type:mn,property:Rt(f[0].replace(kt,W)),value:j?Rt(j[0].replace(kt,W)):W});return m(cn),ee}}function N(){var g=[];h(g);for(var f;f=w();)f!==!1&&(g.push(f),h(g));return g}return y(),N()}function Rt(s){return s?s.replace(un,W):W}var fn=hn,gn=fe&&fe.__importDefault||function(s){return s&&s.__esModule?s:{default:s}};Object.defineProperty($e,"__esModule",{value:!0});$e.default=yn;const xn=gn(fn);function yn(s,n){let i=null;if(!s||typeof s!="string")return i;const r=(0,xn.default)(s),l=typeof n=="function";return r.forEach(a=>{if(a.type!=="declaration")return;const{property:d,value:u}=a;l?n(d,u,a):u&&(i=i||{},i[d]=u)}),i}var ge={};Object.defineProperty(ge,"__esModule",{value:!0});ge.camelCase=void 0;var bn=/^--[a-zA-Z0-9_-]+$/,vn=/-([a-z])/g,jn=/^[^-]+$/,Nn=/^-(webkit|moz|ms|o|khtml)-/,Cn=/^-(ms)-/,En=function(s){return!s||jn.test(s)||bn.test(s)},wn=function(s,n){return n.toUpperCase()},Mt=function(s,n){return"".concat(n,"-")},Sn=function(s,n){return n===void 0&&(n={}),En(s)?s:(s=s.toLowerCase(),n.reactCompat?s=s.replace(Cn,Mt):s=s.replace(Nn,Mt),s.replace(vn,wn))};ge.camelCase=Sn;var kn=fe&&fe.__importDefault||function(s){return s&&s.__esModule?s:{default:s}},Tn=kn($e),Ln=ge;function ze(s,n){var i={};return!s||typeof s!="string"||(0,Tn.default)(s,function(r,l){r&&l&&(i[(0,Ln.camelCase)(r,n)]=l)}),i}ze.default=ze;var Rn=ze;const Mn=Ls(Rn),Oe={}.hasOwnProperty,Pn=new Map,An=/[A-Z]/g,In=new Set(["table","tbody","thead","tfoot","tr"]),zn=new Set(["td","th"]),$t="https://github.com/syntax-tree/hast-util-to-jsx-runtime";function _n(s,n){if(!n||n.Fragment===void 0)throw new TypeError("Expected `Fragment` in options");const i=n.filePath||void 0;let r;if(n.development){if(typeof n.jsxDEV!="function")throw new TypeError("Expected `jsxDEV` in options when `development: true`");r=Jn(i,n.jsxDEV)}else{if(typeof n.jsx!="function")throw new TypeError("Expected `jsx` in production options");if(typeof n.jsxs!="function")throw new TypeError("Expected `jsxs` in production options");r=Wn(i,n.jsx,n.jsxs)}const l={Fragment:n.Fragment,ancestors:[],components:n.components||{},create:r,elementAttributeNameCase:n.elementAttributeNameCase||"react",evaluater:n.createEvaluater?n.createEvaluater():void 0,filePath:i,ignoreInvalidStyle:n.ignoreInvalidStyle||!1,passKeys:n.passKeys!==!1,passNode:n.passNode||!1,schema:n.space==="svg"?_e:gs,stylePropertyNameCase:n.stylePropertyNameCase||"dom",tableCellAlignToStyle:n.tableCellAlignToStyle!==!1},a=Ot(l,s,void 0);return a&&typeof a!="string"?a:l.create(s,l.Fragment,{children:a||void 0},void 0)}function Ot(s,n,i){if(n.type==="element")return $n(s,n,i);if(n.type==="mdxFlowExpression"||n.type==="mdxTextExpression")return On(s,n);if(n.type==="mdxJsxFlowElement"||n.type==="mdxJsxTextElement")return Dn(s,n,i);if(n.type==="mdxjsEsm")return qn(s,n);if(n.type==="root")return Fn(s,n,i);if(n.type==="text")return Hn(s,n)}function $n(s,n,i){const r=s.schema;let l=r;n.tagName.toLowerCase()==="svg"&&r.space==="html"&&(l=_e,s.schema=l),s.ancestors.push(n);const a=Dt(s,n.tagName,!1),d=Un(s,n);let u=De(s,n);return In.has(n.tagName)&&(u=u.filter(function(m){return typeof m=="string"?!xs(m):!0})),qt(s,d,a,n),qe(d,u),s.ancestors.pop(),s.schema=r,s.create(n,a,d,i)}function On(s,n){if(n.data&&n.data.estree&&s.evaluater){const r=n.data.estree.body[0];return Y(r.type==="ExpressionStatement"),s.evaluater.evaluateExpression(r.expression)}Z(s,n.position)}function qn(s,n){if(n.data&&n.data.estree&&s.evaluater)return s.evaluater.evaluateProgram(n.data.estree);Z(s,n.position)}function Dn(s,n,i){const r=s.schema;let l=r;n.name==="svg"&&r.space==="html"&&(l=_e,s.schema=l),s.ancestors.push(n);const a=n.name===null?s.Fragment:Dt(s,n.name,!0),d=Gn(s,n),u=De(s,n);return qt(s,d,a,n),qe(d,u),s.ancestors.pop(),s.schema=r,s.create(n,a,d,i)}function Fn(s,n,i){const r={};return qe(r,De(s,n)),s.create(n,s.Fragment,r,i)}function Hn(s,n){return n.value}function qt(s,n,i,r){typeof i!="string"&&i!==s.Fragment&&s.passNode&&(n.node=r)}function qe(s,n){if(n.length>0){const i=n.length>1?n:n[0];i&&(s.children=i)}}function Wn(s,n,i){return r;function r(l,a,d,u){const y=Array.isArray(d.children)?i:n;return u?y(a,d,u):y(a,d)}}function Jn(s,n){return i;function i(r,l,a,d){const u=Array.isArray(a.children),m=Ns(r);return n(l,a,d,u,{columnNumber:m?m.column-1:void 0,fileName:s,lineNumber:m?m.line:void 0},void 0)}}function Un(s,n){const i={};let r,l;for(l in n.properties)if(l!=="children"&&Oe.call(n.properties,l)){const a=Bn(s,l,n.properties[l]);if(a){const[d,u]=a;s.tableCellAlignToStyle&&d==="align"&&typeof u=="string"&&zn.has(n.tagName)?r=u:i[d]=u}}if(r){const a=i.style||(i.style={});a[s.stylePropertyNameCase==="css"?"text-align":"textAlign"]=r}return i}function Gn(s,n){const i={};for(const r of n.attributes)if(r.type==="mdxJsxExpressionAttribute")if(r.data&&r.data.estree&&s.evaluater){const a=r.data.estree.body[0];Y(a.type==="ExpressionStatement");const d=a.expression;Y(d.type==="ObjectExpression");const u=d.properties[0];Y(u.type==="SpreadElement"),Object.assign(i,s.evaluater.evaluateExpression(u.argument))}else Z(s,n.position);else{const l=r.name;let a;if(r.value&&typeof r.value=="object")if(r.value.data&&r.value.data.estree&&s.evaluater){const u=r.value.data.estree.body[0];Y(u.type==="ExpressionStatement"),a=s.evaluater.evaluateExpression(u.expression)}else Z(s,n.position);else a=r.value===null?!0:r.value;i[l]=a}return i}function De(s,n){const i=[];let r=-1;const l=s.passKeys?new Map:Pn;for(;++r<n.children.length;){const a=n.children[r];let d;if(s.passKeys){const m=a.type==="element"?a.tagName:a.type==="mdxJsxFlowElement"||a.type==="mdxJsxTextElement"?a.name:void 0;if(m){const y=l.get(m)||0;d=m+"-"+y,l.set(m,y+1)}}const u=Ot(s,a,d);u!==void 0&&i.push(u)}return i}function Bn(s,n,i){const r=ys(s.schema,n);if(!(i==null||typeof i=="number"&&Number.isNaN(i))){if(Array.isArray(i)&&(i=r.commaSeparated?bs(i):vs(i)),r.property==="style"){let l=typeof i=="object"?i:Vn(s,String(i));return s.stylePropertyNameCase==="css"&&(l=Kn(l)),["style",l]}return[s.elementAttributeNameCase==="react"&&r.space?js[r.property]||r.property:r.attribute,i]}}function Vn(s,n){try{return Mn(n,{reactCompat:!0})}catch(i){if(s.ignoreInvalidStyle)return{};const r=i,l=new _t("Cannot parse `style` attribute",{ancestors:s.ancestors,cause:r,ruleId:"style",source:"hast-util-to-jsx-runtime"});throw l.file=s.filePath||void 0,l.url=$t+"#cannot-parse-style-attribute",l}}function Dt(s,n,i){let r;if(!i)r={type:"Literal",value:n};else if(n.includes(".")){const l=n.split(".");let a=-1,d;for(;++a<l.length;){const u=St(l[a])?{type:"Identifier",name:l[a]}:{type:"Literal",value:l[a]};d=d?{type:"MemberExpression",object:d,property:u,computed:!!(a&&u.type==="Literal"),optional:!1}:u}r=d}else r=St(n)&&!/^[a-z]/.test(n)?{type:"Identifier",name:n}:{type:"Literal",value:n};if(r.type==="Literal"){const l=r.value;return Oe.call(s.components,l)?s.components[l]:l}if(s.evaluater)return s.evaluater.evaluateExpression(r);Z(s)}function Z(s,n){const i=new _t("Cannot handle MDX estrees without `createEvaluater`",{ancestors:s.ancestors,place:n,ruleId:"mdx-estree",source:"hast-util-to-jsx-runtime"});throw i.file=s.filePath||void 0,i.url=$t+"#cannot-handle-mdx-estrees-without-createevaluater",i}function Kn(s){const n={};let i;for(i in s)Oe.call(s,i)&&(n[Xn(i)]=s[i]);return n}function Xn(s){let n=s.replace(An,Yn);return n.slice(0,3)==="ms-"&&(n="-"+n),n}function Yn(s){return"-"+s.toLowerCase()}const Pe={action:["form"],cite:["blockquote","del","ins","q"],data:["object"],formAction:["button","input"],href:["a","area","base","link"],icon:["menuitem"],itemId:null,manifest:["html"],ping:["a","area"],poster:["video"],src:["audio","embed","iframe","img","input","script","source","track","video"]},Zn="https://github.com/remarkjs/react-markdown/blob/main/changelog.md",Pt=[],At={allowDangerousHtml:!0},Qn=/^(https?|ircs?|mailto|xmpp)$/i,er=[{from:"astPlugins",id:"remove-buggy-html-in-markdown-parser"},{from:"allowDangerousHtml",id:"remove-buggy-html-in-markdown-parser"},{from:"allowNode",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"allowElement"},{from:"allowedTypes",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"allowedElements"},{from:"className",id:"remove-classname"},{from:"disallowedTypes",id:"replace-allownode-allowedtypes-and-disallowedtypes",to:"disallowedElements"},{from:"escapeHtml",id:"remove-buggy-html-in-markdown-parser"},{from:"includeElementIndex",id:"#remove-includeelementindex"},{from:"includeNodeIndex",id:"change-includenodeindex-to-includeelementindex"},{from:"linkTarget",id:"remove-linktarget"},{from:"plugins",id:"change-plugins-to-remarkplugins",to:"remarkPlugins"},{from:"rawSourcePos",id:"#remove-rawsourcepos"},{from:"renderers",id:"change-renderers-to-components",to:"components"},{from:"source",id:"change-source-to-children",to:"children"},{from:"sourcePos",id:"#remove-sourcepos"},{from:"transformImageUri",id:"#add-urltransform",to:"urlTransform"},{from:"transformLinkUri",id:"#add-urltransform",to:"urlTransform"}];function tr(s){const n=sr(s),i=nr(s);return rr(n.runSync(n.parse(i),i),s)}function sr(s){const n=s.rehypePlugins||Pt,i=s.remarkPlugins||Pt,r=s.remarkRehypeOptions?{...s.remarkRehypeOptions,...At}:At;return Cs().use(Es).use(i).use(ws,r).use(n)}function nr(s){const n=s.children||"",i=new Ss;return typeof n=="string"&&(i.value=n),i}function rr(s,n){const i=n.allowedElements,r=n.allowElement,l=n.components,a=n.disallowedElements,d=n.skipHtml,u=n.unwrapDisallowed,m=n.urlTransform||ir;for(const h of er)Object.hasOwn(n,h.from)&&ks("Unexpected `"+h.from+"` prop, "+(h.to?"use `"+h.to+"` instead":"remove it")+" (see <"+Zn+"#"+h.id+"> for more info)");return Ts(s,y),_n(s,{Fragment:e.Fragment,components:l,ignoreInvalidStyle:!0,jsx:e.jsx,jsxs:e.jsxs,passKeys:!0,passNode:!0});function y(h,v,w){if(h.type==="raw"&&w&&typeof v=="number")return d?w.children.splice(v,1):w.children[v]={type:"text",value:h.value},v;if(h.type==="element"){let N;for(N in Pe)if(Object.hasOwn(Pe,N)&&Object.hasOwn(h.properties,N)){const g=h.properties[N],f=Pe[N];(f===null||f.includes(h.tagName))&&(h.properties[N]=m(String(g||""),N,h))}}if(h.type==="element"){let N=i?!i.includes(h.tagName):a?a.includes(h.tagName):!1;if(!N&&r&&typeof v=="number"&&(N=!r(h,v,w)),N&&w&&typeof v=="number")return u&&h.children?w.children.splice(v,1,...h.children):w.children.splice(v,1),v}}}function ir(s){const n=s.indexOf(":"),i=s.indexOf("?"),r=s.indexOf("#"),l=s.indexOf("/");return n===-1||l!==-1&&n>l||i!==-1&&n>i||r!==-1&&n>r||Qn.test(s.slice(0,n))?s:""}const Ae="http://localhost:5000",Ie=()=>{const s={"Content-Type":"application/json"},n=localStorage.getItem("token");return n&&(s.Authorization=`Bearer ${n}`),s},ar=(s="")=>{const n=String(s||"").trim(),i=n.match(/:?(\d+):\s*(\d+):?/),r=i?parseInt(i[1]):null,l=i?parseInt(i[2]):null;return{text:n,lineNum:r,colNum:l}},It=(s="",n=0)=>{const i=String(s||"").trim(),r=i.toLowerCase();return r.includes("code must be a string")||r.includes("code is required")?"Write some code before running.":r.includes("language is required")?"Select a language before running.":r.includes("is not supported")?"This language is not supported by the executor yet.":n>=500?"Server error while executing code. Please try again.":i||"Execution failed. Please try again."},or=(s="")=>{const n={"(":")","[":"]","{":"}"},i={")":"(","]":"[","}":"{"},r=[],l=[];return s.split(`
`).forEach((d,u)=>{for(let m=0;m<d.length;m++){const y=d[m];if(n[y])r.push({ch:y,line:u+1,col:m+1});else if(i[y]){const h=r[r.length-1];if(!h||h.ch!==i[y]){l.push({line:u+1,col:m+1,message:`Unexpected '${y}'`,severity:"error"});return}r.pop()}}}),r.forEach(d=>{l.push({line:d.line,col:d.col,message:`Unclosed '${d.ch}'`,severity:"error"})}),l},lr=(s="")=>{if(!s.trim())return[];try{return new Function(s),[]}catch(n){const r=String((n==null?void 0:n.stack)||(n==null?void 0:n.message)||"Syntax error").match(/<anonymous>:(\d+):(\d+)/),l=r?Math.max(1,Number(r[1])-1):1,a=r?Math.max(1,Number(r[2])):1;return[{line:l,col:a,message:String((n==null?void 0:n.message)||"Syntax error"),severity:"error"}]}},cr=(s="",n="")=>{var l,a;const i=String(n||"").toLowerCase(),r=or(s);if(i==="javascript"&&r.push(...lr(s)),i==="python"){const d=s.split(`
`);for(let u=0;u<d.length;u++){const m=d[u],y=m.trim();if(!(!y||y.startsWith("#"))&&(/^\s*\t+\s+|^\s+\t+/.test(m)&&r.push({line:u+1,col:1,message:"Mixed tabs and spaces indentation",severity:"warning"}),y.endsWith(":"))){let h=u+1;for(;h<d.length&&(!d[h].trim()||d[h].trim().startsWith("#"));)h++;if(h<d.length){const v=((l=m.match(/^\s*/))==null?void 0:l[0].length)||0;(((a=d[h].match(/^\s*/))==null?void 0:a[0].length)||0)<=v&&r.push({line:h+1,col:1,message:'Expected indented block after ":"',severity:"error"})}}}}return r},ur=(...s)=>{const n=new Set,i=[];for(const r of s)for(const l of r||[]){const a=`${l.line||1}:${l.col||1}:${l.message||"Error"}`;n.has(a)||(n.add(a),i.push({line:l.line||1,col:l.col||1,message:l.message||"Error",severity:l.severity||"error"}))}return i},zt={python:`# 🐍 Python Playground
# Write any Python code here and experiment freely!

def hello():
    print("Hello from PrepLoop Playground!")
    
    # Try out data structures
    nums = [3, 1, 4, 1, 5, 9, 2, 6]
    print(f"Original: {nums}")
    print(f"Sorted:   {sorted(nums)}")
    print(f"Sum:      {sum(nums)}")

hello()
`,javascript:`// ⚡ JavaScript Playground
// Write any JavaScript code here and experiment freely!

function hello() {
  console.log("Hello from PrepLoop Playground!");
  
  // Try out data structures
  const nums = [3, 1, 4, 1, 5, 9, 2, 6];
  console.log("Original:", nums);
  console.log("Sorted:  ", [...nums].sort((a, b) => a - b));
  console.log("Sum:     ", nums.reduce((a, b) => a + b, 0));
}

hello();
`,c:`// 🧩 C Playground
// Write any C code here and experiment freely!

#include <stdio.h>

int main(void) {
    printf("Hello from PrepLoop Playground!\\n");

    // Try out arrays
    int nums[] = {3, 1, 4, 1, 5, 9, 2, 6};
    int n = sizeof(nums) / sizeof(nums[0]);
    int sum = 0;

    printf("Original: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", nums[i]);
        sum += nums[i];
    }
    printf("\\nSum:      %d\\n", sum);

    return 0;
}
`,cpp:`// ⚙️ C++ Playground
// Write any C++ code here and experiment freely!

#include <iostream>
#include <vector>
#include <algorithm>
#include <numeric>
using namespace std;

int main() {
    cout << "Hello from PrepLoop Playground!" << endl;
    
    // Try out data structures
    vector<int> nums = {3, 1, 4, 1, 5, 9, 2, 6};
    
    cout << "Original: ";
    for (int n : nums) cout << n << " ";
    cout << endl;
    
    sort(nums.begin(), nums.end());
    cout << "Sorted:   ";
    for (int n : nums) cout << n << " ";
    cout << endl;
    
    cout << "Sum:      " << accumulate(nums.begin(), nums.end(), 0) << endl;
    
    return 0;
}
`,java:`// ☕ Java Playground
// Write any Java code here and experiment freely!

import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from PrepLoop Playground!");
        
        // Try out data structures
        int[] nums = {3, 1, 4, 1, 5, 9, 2, 6};
        
        System.out.println("Original: " + Arrays.toString(nums));
        
        int[] sorted = nums.clone();
        Arrays.sort(sorted);
        System.out.println("Sorted:   " + Arrays.toString(sorted));
        
        int sum = IntStream.of(nums).sum();
        System.out.println("Sum:      " + sum);
    }
}
`,go:`// 🔷 Go Playground
// Write any Go code here and experiment freely!

package main

import (
    "fmt"
    "sort"
)

func main() {
    fmt.Println("Hello from PrepLoop Playground!")
    
    // Try out data structures
    nums := []int{3, 1, 4, 1, 5, 9, 2, 6}
    fmt.Println("Original:", nums)
    
    sorted := make([]int, len(nums))
    copy(sorted, nums)
    sort.Ints(sorted)
    fmt.Println("Sorted:  ", sorted)
    
    sum := 0
    for _, n := range nums {
        sum += n
    }
    fmt.Println("Sum:     ", sum)
}
`};let he=null;const dr=async()=>he||(he=Promise.all([ke(()=>import("./vendor-prettier-w1J6ik-Y.js").then(s=>s.s),[]),ke(()=>import("./vendor-prettier-w1J6ik-Y.js").then(s=>s.b),[]),ke(()=>import("./vendor-prettier-w1J6ik-Y.js").then(s=>s.e),[])]).then(([s,n,i])=>({prettier:s.default||s,plugins:[n.default||n,i.default||i]})),he),pr=async(s,n)=>{try{const i=String(n||"").toLowerCase(),r=s.split(`
`);if(i==="javascript"){const a=await dr();return a.prettier.format(s,{parser:"babel",plugins:a.plugins,semi:!0,singleQuote:!0,tabWidth:2,printWidth:100,trailingComma:"es5"})}if(i==="python"){const a=[];let d=0;for(const u of r){const m=u.trim();if(!m){a.push("");continue}/^(return|break|continue|pass|raise)\b/.test(m)&&d>0?a.push(`${"    ".repeat(d)}${m}`):a.push(`${"    ".repeat(Math.max(0,d))}${m}`),m.endsWith(":")&&!m.startsWith("#")&&(d+=1)}return a.join(`
`).replace(/[ \t]+$/gm,"")}if(["typescript","c","cpp","java"].includes(i)){let a=0;return r.map(d=>{const u=d.trim();if(!u)return"";/^[}\])]/.test(u)&&(a=Math.max(0,a-1));const m=`${"    ".repeat(a)}${u.replace(/\s+$/g,"")}`;return/[{[(]$/.test(u)&&!/^\s*\/\//.test(u)&&(a+=1),m}).join(`
`)}return s.replace(/[ \t]+$/gm,"")}catch{return s}},mr=[{label:"For Loop",icon:"🔁",code:{python:`for i in range(n):
    pass`,javascript:`for (let i = 0; i < n; i++) {
  
}`,c:`for (int i = 0; i < n; i++) {
    
}`,cpp:`for (int i = 0; i < n; i++) {
    
}`,java:`for (int i = 0; i < n; i++) {
    
}`,go:`for i := 0; i < n; i++ {
    
}`}},{label:"HashMap",icon:"🗺️",code:{python:`from collections import defaultdict
freq = defaultdict(int)
for item in arr:
    freq[item] += 1`,javascript:`const map = new Map();
for (const item of arr) {
  map.set(item, (map.get(item) || 0) + 1);
}`,c:`#include <stdio.h>

int freq[1001] = {0};
for (int i = 0; i < n; i++) {
    freq[arr[i]]++;
}`,cpp:`unordered_map<int, int> freq;
for (int x : arr) {
    freq[x]++;
}`,java:`Map<Integer, Integer> freq = new HashMap<>();
for (int x : arr) {
    freq.put(x, freq.getOrDefault(x, 0) + 1);
}`,go:`freq := make(map[int]int)
for _, x := range arr {
    freq[x]++
}`}},{label:"Stack",icon:"📚",code:{python:`stack = []
stack.append(item)  # push
top = stack.pop()   # pop
if stack:           # not empty`,javascript:`const stack = [];
stack.push(item);           // push
const top = stack.pop();    // pop
if (stack.length > 0) {}    // not empty`,c:`#include <stdio.h>

int stack[1000], top = -1;
stack[++top] = item;   // push
int v = stack[top--];  // pop
if (top >= 0) {}`,cpp:`stack<int> st;
st.push(item);     // push
int top = st.top(); st.pop(); // pop
if (!st.empty()) {} // not empty`,java:`Stack<Integer> stack = new Stack<>();
stack.push(item);      // push
int top = stack.pop(); // pop
if (!stack.isEmpty()) {} // not empty`,go:`stack := []int{}
stack = append(stack, item)       // push
top := stack[len(stack)-1]        // peek
stack = stack[:len(stack)-1]      // pop`}},{label:"Queue",icon:"📬",code:{python:`from collections import deque
queue = deque()
queue.append(item)   # enqueue
front = queue.popleft()  # dequeue`,javascript:`const queue = [];
queue.push(item);           // enqueue
const front = queue.shift(); // dequeue`,c:`#include <stdio.h>

int queue[1000], head = 0, tail = 0;
queue[tail++] = item;      // enqueue
int front = queue[head++]; // dequeue`,cpp:`queue<int> q;
q.push(item);      // enqueue
int front = q.front(); q.pop(); // dequeue`,java:`Queue<Integer> queue = new LinkedList<>();
queue.offer(item);       // enqueue
int front = queue.poll(); // dequeue`,go:`queue := []int{}
queue = append(queue, item) // enqueue
front := queue[0]           // peek
queue = queue[1:]           // dequeue`}},{label:"LinkedList",icon:"🔗",code:{python:`class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next`,javascript:`class ListNode {
  constructor(val = 0, next = null) {
    this.val = val;
    this.next = next;
  }
}`,c:`typedef struct ListNode {
    int val;
    struct ListNode* next;
} ListNode;`,cpp:`struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};`,java:`class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}`,go:`type ListNode struct {
    Val  int
    Next *ListNode
}`}},{label:"TreeNode",icon:"🌳",code:{python:`class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right`,javascript:`class TreeNode {
  constructor(val = 0, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}`,c:`typedef struct TreeNode {
    int val;
    struct TreeNode* left;
    struct TreeNode* right;
} TreeNode;`,cpp:`struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};`,java:`class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}`,go:`type TreeNode struct {
    Val   int
    Left  *TreeNode
    Right *TreeNode
}`}}];function hr(s){const n=Math.floor(s/60),i=s%60;return`${n.toString().padStart(2,"0")}:${i.toString().padStart(2,"0")}`}function _r(){var ft;const s=Rs(),n=c.useRef(null),i=X.map(t=>t.id),[r,l]=c.useState(()=>{const t=localStorage.getItem("playground-lang")||"python";return i.includes(t)?t:"python"}),[a,d]=c.useState(""),[u,m]=c.useState(!1),[y,h]=c.useState([]),[v,w]=c.useState(!1),[N,g]=c.useState(!1),[f,j]=c.useState(!1),[ee,G]=c.useState(!1),[Fe,Ft]=c.useState(200),[He,We]=c.useState(0),[xe,Je]=c.useState(!1),[Ue,ye]=c.useState(!1),[te,Ht]=c.useState(()=>As("playground-editor-theme")),[Ge,be]=c.useState(!1),[ve,Wt]=c.useState(()=>parseInt(localStorage.getItem("pg-font-size"))||14),[se,Be]=c.useState(()=>{try{return JSON.parse(localStorage.getItem("pg-exec-history")||"[]")}catch{return[]}}),[fr,gr]=c.useState(!1),[xr,Jt]=c.useState(!1),[ne,Ut]=c.useState({line:1,col:1}),[Gt,Ve]=c.useState(!1),[Ke]=c.useState(!0),[Xe,Bt]=c.useState(!1),[re,Ye]=c.useState(!1),[J,Ze]=c.useState("errors"),[P,Qe]=c.useState([]),[Vt,je]=c.useState(!1),[et,$]=c.useState("idle"),[L,tt]=c.useState(null),[ie,Kt]=c.useState("all"),[O,B]=c.useState([]),[U,st]=c.useState(""),[A,nt]=c.useState(!1),[rt,it]=c.useState(null),[Ne,at]=c.useState(null),ot=c.useRef(null),Ce=c.useRef(null),q=c.useRef(null),lt=c.useRef(null),ct=c.useRef(null),Ee=c.useRef(null),ut=c.useRef(0),I=c.useRef([]),D=c.useRef(null),ae=c.useRef(0);c.useEffect(()=>{const t=localStorage.getItem(`playground-code-${r}`);d(t||zt[r]||"")},[r]),c.useEffect(()=>{if(!a)return;const t=setTimeout(()=>{localStorage.setItem(`playground-code-${r}`,a)},500);return()=>clearTimeout(t)},[a,r]),c.useEffect(()=>{if(!xe)return;const t=setInterval(()=>We(o=>o+1),1e3);return()=>clearInterval(t)},[xe]),c.useEffect(()=>{var t;(t=ct.current)==null||t.scrollIntoView({behavior:"smooth"})},[y]);const Xt=t=>{l(t),localStorage.setItem("playground-lang",t),g(!1)},V=c.useCallback(async()=>{var C;(C=D.current)==null||C.abort(),ae.current+=1;const t=ae.current,o=new AbortController;D.current=o,I.current.forEach(x=>clearTimeout(x)),I.current=[],$("queued"),m(!0);const p=new Date().toLocaleTimeString();h(x=>[...x,{type:"info",text:`[${p}] Running ${r}...`}]),tt(null),I.current.push(setTimeout(()=>$("sending"),80)),I.current.push(setTimeout(()=>$("compiling"),350)),I.current.push(setTimeout(()=>$("executing"),900));try{const x=await fetch(`${Ae}/api/practice/execute`,{method:"POST",headers:Ie(),body:JSON.stringify({code:a,language:r}),signal:o.signal});if(t!==ae.current)return;const b=await x.json().catch(()=>({}));if($("processing"),!x.ok){const S=It(b==null?void 0:b.error,x.status);h(H=>[...H,{type:"error",text:S}]);const M={id:Date.now(),timestamp:p,language:r,codeSnippet:a.slice(0,100),outputPreview:S.slice(0,80),success:!1};Be(H=>{const gt=[M,...H].slice(0,10);return localStorage.setItem("pg-exec-history",JSON.stringify(gt)),gt});return}const T=(b.output||"").trim(),z=(b.error||"").trim(),R=[],E=Number(b.compileTime||0),ue=Number(b.runTime||0),F=Number(b.executionTime||0),de=!!b.cacheHit;tt({success:!!b.success,compileMs:E,runMs:ue,totalMs:F,cacheHit:de,language:r,time:p}),b.success&&T?T.split(`
`).forEach(S=>{R.push({type:"output",text:S})}):!b.success&&z?z.split(`
`).forEach(S=>{const M=ar(S);let H=It(M.text,x.status);M.lineNum&&(H=`📍 Line ${M.lineNum}${M.colNum?`:${M.colNum}`:""} — ${H}`),R.push({type:"error",text:H})}):T?T.split(`
`).forEach(S=>{R.push({type:"output",text:S})}):R.push({type:"info",text:"(No output — use console.log() or print() to see results)"});const _=F?`${Math.round(F)}ms`:"N/A";R.push({type:"info",text:`
⏱ Runtime: ${_}`}),R.push({type:"info",text:`⚙ Compile: ${Math.round(E)}ms${de?" (cache)":""}  |  ▶ Run: ${Math.round(ue)}ms`}),h(S=>[...S,...R]);const fs={id:Date.now(),timestamp:p,language:r,codeSnippet:a.slice(0,100),outputPreview:T.slice(0,80)||z.slice(0,80)||"No output",success:b.success,runtimeMs:F||0};Be(S=>{const M=[fs,...S].slice(0,10);return localStorage.setItem("pg-exec-history",JSON.stringify(M)),M})}catch(x){(x==null?void 0:x.name)==="AbortError"?h(b=>[...b,{type:"info",text:"Execution cancelled by user."}]):h(b=>[...b,{type:"error",text:`Network error: ${x.message}`}])}finally{$("idle"),I.current.forEach(x=>clearTimeout(x)),I.current=[],D.current===o&&(D.current=null),m(!1)}},[a,r]),oe=c.useCallback(()=>{var t;u&&((t=D.current)==null||t.abort(),D.current=null,ae.current+=1,$("idle"),m(!1),h(o=>[...o,{type:"info",text:"Run stopped."}]))},[u]),le=t=>{Wt(o=>{const p=Math.max(10,Math.min(24,o+t));return localStorage.setItem("pg-font-size",p),p})},Yt=c.useCallback(async()=>{const t=await pr(a,r);d(t),h(o=>[...o,{type:"info",text:`✓ Code formatted (${r})`}])},[a,r]),dt=()=>{var t,o,p;document.fullscreenElement?((p=document.exitFullscreen)==null||p.call(document),ye(!1)):((o=(t=lt.current)==null?void 0:t.requestFullscreen)==null||o.call(t),ye(!0))};c.useEffect(()=>{const t=()=>ye(!!document.fullscreenElement);return document.addEventListener("fullscreenchange",t),()=>document.removeEventListener("fullscreenchange",t)},[]);const Zt=()=>{try{const t=btoa(encodeURIComponent(a)),o=`${window.location.origin}/playground?lang=${r}&code=${t}`;navigator.clipboard.writeText(o),Ve(!0),setTimeout(()=>Ve(!1),2500)}catch{}};c.useEffect(()=>{const t=new URLSearchParams(window.location.search),o=t.get("code"),p=t.get("lang");if(o)try{const C=decodeURIComponent(atob(o));d(C),p&&X.find(x=>x.id===p)&&(l(p),localStorage.setItem("playground-lang",p))}catch{}},[]);const Qt=()=>h([]),es=()=>{navigator.clipboard.writeText(a),w(!0),setTimeout(()=>w(!1),2e3)},ts=()=>{const o={python:{ext:"py",mime:"text/x-python"},javascript:{ext:"js",mime:"text/javascript"},c:{ext:"c",mime:"text/x-c"},cpp:{ext:"cpp",mime:"text/x-c++src"},java:{ext:"java",mime:"text/x-java-source"},go:{ext:"go",mime:"text/x-go"}}[r]||{ext:"txt",mime:"text/plain"},p=new Blob([a],{type:o.mime}),C=URL.createObjectURL(p),x=document.createElement("a");x.href=C,x.download=`playground.${o.ext}`,x.click(),URL.revokeObjectURL(C)},ss=()=>{d(zt[r]||""),localStorage.removeItem(`playground-code-${r}`)},K=c.useCallback(async(t,o="")=>{if(A)return;const C=t==="ask"?o||"Help me with this code":{explain:"✨ Explain this code",review:"🔍 Review this code",debug:"🐛 Debug this code",optimize:"⚡ Optimize this code",complexity:"📊 Analyze complexity",comment:"💬 Add comments"}[t]||o;B(x=>[...x,{role:"user",content:C,timestamp:new Date().toLocaleTimeString()}]),nt(!0),st(""),at({mode:t,customPrompt:o});try{const b=await(await fetch(`${Ae}/api/ai/playground-assist`,{method:"POST",headers:Ie(),body:JSON.stringify({code:a,language:r,mode:t,prompt:o,history:O.slice(-6)})})).json();B(T=>[...T,{role:"assistant",content:b.response||b.error||"No response received.",timestamp:new Date().toLocaleTimeString()}])}catch(x){B(b=>[...b,{role:"assistant",content:`⚠️ Error: ${x.message}`,timestamp:new Date().toLocaleTimeString(),isError:!0}])}finally{nt(!1)}},[a,r,A,O]),ns=(t,o)=>{navigator.clipboard.writeText(t),it(o),setTimeout(()=>it(null),2e3)},rs=t=>{const o=t.match(/```[\w]*\n([\s\S]*?)```/);o&&d(o[1].trim())},is=()=>{Ne&&(B(t=>t.slice(0,-2)),setTimeout(()=>K(Ne.mode,Ne.customPrompt),100))};c.useEffect(()=>{var t;(t=ot.current)==null||t.scrollIntoView({behavior:"smooth"})},[O,A]),c.useEffect(()=>{if(!n.current||!q.current)return;const t=n.current,o=q.current,p=t.getModel();if(!p)return;const C=setTimeout(()=>{var R;const x=cr(a,r);Qe(x);const b=x.map(E=>({startLineNumber:E.line,startColumn:E.col,endLineNumber:E.line,endColumn:E.col+1,message:E.message,severity:o.MarkerSeverity.Error}));if(o.editor.setModelMarkers(p,"playground-live",b),!new Set(["python","javascript","c","cpp","java"]).has(r)){je(!1);return}je(!0),(R=Ee.current)==null||R.abort();const z=new AbortController;Ee.current=z,fetch(`${Ae}/api/practice/lint`,{method:"POST",headers:Ie(),body:JSON.stringify({code:a,language:r}),signal:z.signal}).then(E=>E.json().catch(()=>({}))).then(E=>{if(z.signal.aborted)return;const ue=Array.isArray(E==null?void 0:E.errors)?E.errors:[],F=ur(x,ue);Qe(F);const de=F.map(_=>({startLineNumber:_.line,startColumn:_.col,endLineNumber:_.line,endColumn:_.col+1,message:_.message,severity:_.severity==="warning"?o.MarkerSeverity.Warning:o.MarkerSeverity.Error}));o.editor.setModelMarkers(p,"playground-live",de)}).catch(()=>{}).finally(()=>{z.signal.aborted||je(!1)})},220);return()=>{clearTimeout(C)}},[a,r]),c.useEffect(()=>{const t=ut.current;P.length>0&&t===0&&Ze("errors"),ut.current=P.length},[P.length]),c.useEffect(()=>()=>{var o,p;if(I.current.forEach(C=>clearTimeout(C)),(o=D.current)==null||o.abort(),(p=Ee.current)==null||p.abort(),!n.current||!q.current)return;const t=n.current.getModel();t&&q.current.editor.setModelMarkers(t,"playground-live",[])},[]);const pt=t=>{if(n.current){const o=n.current,p=o.getPosition();o.executeEdits("insert-snippet",[{range:{startLineNumber:p.lineNumber,startColumn:p.column,endLineNumber:p.lineNumber,endColumn:p.column},text:`
`+t+`
`}]),o.focus()}else d(o=>o+`

`+t);j(!1)},as=t=>{const o=t.templates[r]||t.templates.python||"";pt(o),G(!1)},os=t=>{t.preventDefault(),Ce.current={startY:t.clientY,startHeight:Fe},document.addEventListener("mousemove",we),document.addEventListener("mouseup",mt)},we=c.useCallback(t=>{const o=Ce.current;if(!o)return;const p=o.startY-t.clientY;Ft(Math.max(80,Math.min(500,o.startHeight+p)))},[]),mt=c.useCallback(()=>{Ce.current=null,document.removeEventListener("mousemove",we),document.removeEventListener("mouseup",mt)},[we]);c.useEffect(()=>{const t=o=>{o.ctrlKey&&o.key==="Enter"?(o.preventDefault(),V()):o.ctrlKey&&o.key==="="?(o.preventDefault(),le(1)):o.ctrlKey&&o.key==="-"?(o.preventDefault(),le(-1)):o.key==="F11"?(o.preventDefault(),dt()):o.ctrlKey&&o.key==="/"?(o.preventDefault(),Jt(p=>!p)):o.key==="Escape"&&u&&(o.preventDefault(),oe())};return window.addEventListener("keydown",t),()=>window.removeEventListener("keydown",t)},[oe,V,u]);const ls=t=>{_s(t)},cs=(t,o)=>{n.current=t,q.current=o,t.addAction({id:"run-code",label:"Run Code",keybindings:[o.KeyMod.CtrlCmd|o.KeyCode.Enter],run:()=>V()}),t.onDidChangeCursorPosition(p=>{Ut({line:p.position.lineNumber,col:p.position.column})})},us=t=>{Ht(t),$s(t,"playground-editor-theme"),q.current&&q.current.editor.setTheme(t),be(!1)},ds=t=>{!n.current||!(t!=null&&t.line)||(n.current.revealLineInCenter(t.line),n.current.setPosition({lineNumber:t.line,column:t.col||1}),n.current.focus())},ps=c.useMemo(()=>[{id:"errors",icon:e.jsx(bt,{size:16}),label:`Errors${P.length?` (${P.length})`:""}`},{id:"ai",icon:e.jsx(pe,{size:16}),label:"AI"},{id:"history",icon:e.jsx(Re,{size:16}),label:"History"},{id:"shortcuts",icon:e.jsx(xt,{size:16}),label:"Keys"},{id:"info",icon:e.jsx(Nt,{size:16}),label:"Info"}],[P.length]),ms=c.useMemo(()=>mr.map(t=>({icon:t.icon,label:t.label,code:t.code[r]||t.code.python})),[r]),hs=c.useMemo(()=>Object.entries(Ps).map(([t,o])=>{var p;return{key:t,icon:o.icon,name:o.name,complexity:((p=o.complexity)==null?void 0:p.time)||"N/A",template:o}}),[]),Se=c.useMemo(()=>u?{queued:"Queued",sending:"Sending",compiling:"Compiling",executing:"Executing",processing:"Processing"}[et]||"Running":"Idle",[et,u]),ht=c.useMemo(()=>ie==="all"?y:y.filter(t=>t.type===ie),[ie,y]),ce=c.useMemo(()=>({all:y.length,output:y.filter(t=>t.type==="output").length,error:y.filter(t=>t.type==="error").length,info:y.filter(t=>t.type==="info").length}),[y]),k=X.find(t=>t.id===r)||X[0];return e.jsxs("div",{className:"pg-root",ref:lt,children:[re&&e.jsx("div",{className:"pg-mobile-overlay",onClick:()=>Ye(!1)}),e.jsxs("div",{className:"pg-topbar",children:[e.jsxs("div",{className:"pg-topbar-left",children:[e.jsxs("button",{onClick:()=>s("/dashboard"),className:"pg-back-btn",children:[e.jsx(Ct,{size:14}),e.jsx("span",{children:"Dashboard"})]}),e.jsxs("div",{className:"pg-title-group",children:[e.jsx("div",{className:"pg-title-icon",children:e.jsx(me,{size:16})}),e.jsx("h1",{className:"pg-title",children:"Coding Playground"})]})]}),e.jsxs("div",{className:"pg-topbar-center",children:[e.jsxs("div",{className:"pg-lang-wrap",children:[e.jsxs("button",{className:"pg-lang-btn",onClick:()=>g(t=>!t),children:[e.jsx("span",{children:k.icon}),e.jsx("span",{children:k.label}),e.jsx(Te,{size:12})]}),N&&e.jsx("div",{className:"pg-dropdown pg-lang-dropdown",children:X.map(t=>e.jsxs("button",{className:`pg-dropdown-item ${r===t.id?"active":""}`,onClick:()=>Xt(t.id),children:[e.jsx("span",{children:t.icon}),e.jsx("span",{children:t.label})]},t.id))})]}),e.jsxs("div",{className:"pg-snippet-wrap",children:[e.jsxs("button",{className:"pg-toolbar-btn",onClick:()=>{j(t=>!t),G(!1)},children:[e.jsx(Is,{size:14}),e.jsx("span",{children:"Snippets"})]}),f&&e.jsxs("div",{className:"pg-dropdown pg-snippets-dropdown",children:[e.jsx("div",{className:"pg-dropdown-header",children:"Quick Snippets"}),ms.map((t,o)=>e.jsxs("button",{className:"pg-dropdown-item",onClick:()=>pt(t.code),children:[e.jsx("span",{children:t.icon}),e.jsx("span",{children:t.label})]},o))]})]}),e.jsxs("div",{className:"pg-template-wrap",children:[e.jsxs("button",{className:"pg-toolbar-btn",onClick:()=>{G(t=>!t),j(!1)},children:[e.jsx(Le,{size:14}),e.jsx("span",{children:"Templates"})]}),ee&&e.jsxs("div",{className:"pg-dropdown pg-templates-dropdown",children:[e.jsx("div",{className:"pg-dropdown-header",children:"Algorithm Templates"}),hs.map(t=>e.jsxs("button",{className:"pg-dropdown-item",onClick:()=>as(t.template),children:[e.jsx("span",{children:t.icon}),e.jsx("span",{children:t.name}),e.jsx("span",{className:"pg-complexity",children:t.complexity})]},t.key))]})]}),e.jsxs("div",{className:"pg-theme-wrap",style:{position:"relative"},children:[e.jsxs("button",{className:"pg-toolbar-btn",onClick:()=>{be(t=>!t),j(!1),G(!1)},children:[e.jsx(zs,{size:14}),e.jsx("span",{children:((ft=yt.find(t=>t.id===te))==null?void 0:ft.label)||"Theme"}),e.jsx(Te,{size:12})]}),Ge&&e.jsxs("div",{className:"pg-dropdown pg-theme-dropdown",children:[e.jsx("div",{className:"pg-dropdown-header",children:"Editor Theme"}),yt.map(t=>e.jsxs("button",{className:`pg-dropdown-item ${te===t.id?"active":""}`,onClick:()=>us(t.id),children:[e.jsx("span",{children:t.icon}),e.jsx("span",{style:{flex:1},children:t.label}),e.jsx("span",{style:{width:14,height:14,borderRadius:4,background:t.colors["editor.background"],border:"1px solid rgba(255,255,255,0.15)",flexShrink:0,display:"inline-block"}})]},t.id))]})]})]}),e.jsxs("div",{className:"pg-topbar-center",children:[e.jsxs("button",{className:"pg-run-btn",onClick:V,disabled:u,style:{padding:"8px 24px",fontSize:"13px",borderRadius:"10px"},children:[e.jsx(vt,{size:16,style:{fill:"currentColor"}}),e.jsx("span",{children:u?`Running (${Se})...`:"Run Code"}),e.jsx("kbd",{style:{marginLeft:"8px"},children:"Ctrl+↵"})]}),u&&e.jsxs("button",{className:"pg-run-btn",onClick:oe,style:{marginLeft:"8px",padding:"8px 14px",fontSize:"12px",borderRadius:"10px",background:"rgba(255,90,90,0.18)",border:"1px solid rgba(255,110,110,0.45)"},children:[e.jsx(jt,{size:14}),e.jsx("span",{children:"Stop"})]})]}),e.jsxs("div",{className:"pg-topbar-right",children:[e.jsxs("button",{className:`pg-toolbar-btn ${xe?"pg-timer-active":""}`,onClick:()=>Je(t=>!t),children:[e.jsx(Os,{size:14}),e.jsx("span",{children:hr(He)})]}),He>0&&e.jsx("button",{className:"pg-toolbar-btn-icon",onClick:()=>{We(0),Je(!1)},title:"Reset timer",children:e.jsx(Et,{size:13})}),e.jsx("div",{className:"pg-toolbar-divider"})]})]}),e.jsxs("div",{className:"pg-main-split",children:[e.jsxs("div",{className:"pg-editor-area",children:[e.jsxs("div",{className:"pg-editor-wrapper",style:{flex:1},children:[e.jsx(Ms,{height:"100%",language:k.monacoId,value:a,onChange:t=>d(t||""),beforeMount:ls,onMount:cs,theme:te,options:{fontSize:ve,fontFamily:"'JetBrains Mono', 'Fira Code', monospace",fontLigatures:!0,minimap:{enabled:!1},scrollBeyondLastLine:!1,smoothScrolling:!0,cursorBlinking:"smooth",cursorSmoothCaretAnimation:"on",padding:{top:16,bottom:16},lineNumbers:"on",renderLineHighlight:"all",bracketPairColorization:{enabled:!0},guides:{bracketPairs:!0,indentation:!0},autoClosingBrackets:"always",autoClosingQuotes:"always",folding:!0,wordWrap:"on",suggestOnTriggerCharacters:!0,tabSize:4,detectIndentation:!0}}),e.jsxs("div",{className:"pg-lang-badge",children:[e.jsx("span",{children:k.icon})," ",k.label]})]}),e.jsxs("div",{className:`pg-console ${Xe?"pg-console-mobile-open":""}`,style:{height:Fe},children:[e.jsx("div",{className:"pg-console-resize",onMouseDown:os,children:e.jsx("div",{className:"pg-console-resize-bar"})}),e.jsxs("div",{className:"pg-console-header",children:[e.jsxs("div",{className:"pg-console-title",children:[e.jsx(me,{size:13}),e.jsx("span",{children:"Console"}),e.jsxs("span",{className:"pg-console-count",children:[y.length," lines"]})]}),e.jsx("div",{style:{display:"flex",gap:"6px",alignItems:"center"},children:[["all",`All ${ce.all}`],["output",`Out ${ce.output}`],["error",`Err ${ce.error}`],["info",`Info ${ce.info}`]].map(([t,o])=>e.jsx("button",{className:`pg-console-clear ${ie===t?"pg-active":""}`,onClick:()=>Kt(t),style:{padding:"2px 8px",borderRadius:"8px"},children:e.jsx("span",{children:o})},t))}),e.jsxs("button",{className:"pg-console-clear",onClick:Qt,children:[e.jsx(qs,{size:12}),e.jsx("span",{children:"Clear"})]})]}),e.jsxs("div",{className:"pg-console-body",children:[ht.length===0?e.jsxs("div",{className:"pg-console-empty",children:[e.jsx(me,{size:24,strokeWidth:1}),e.jsx("p",{children:"Run your code to see output here"}),e.jsx("kbd",{children:"Ctrl + Enter"})]}):ht.map((t,o)=>e.jsxs("div",{className:`pg-console-line pg-console-${t.type}`,children:[t.type==="info"&&e.jsx("span",{className:"pg-console-prefix",children:"›"}),t.type==="output"&&e.jsx("span",{className:"pg-console-prefix",children:"»"}),t.type==="error"&&e.jsx("span",{className:"pg-console-prefix",children:"✕"}),e.jsx("span",{children:t.text})]},o)),e.jsx("div",{ref:ct})]})]})]}),e.jsxs("div",{className:`pg-sidebar ${!Ke&&!re?"pg-sidebar-collapsed":""} ${Ke||re?"pg-sidebar-mobile-open":""}`,children:[e.jsxs("div",{className:"pg-sidebar-tabs",style:{display:"flex",flexDirection:"column",justifyContent:"space-between",paddingBottom:"16px"},children:[e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:"2px",alignItems:"center",width:"100%"},children:ps.map(t=>e.jsx("button",{className:`pg-sidebar-tab ${J===t.id?"pg-sidebar-tab-active":""}`,onClick:()=>Ze(t.id),title:t.label,children:t.icon},t.id))}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"2px",alignItems:"center",width:"100%"},children:[e.jsx("div",{style:{width:"20px",height:"1px",background:"rgba(255,255,255,0.1)",margin:"8px 0"}}),e.jsx("button",{className:"pg-sidebar-tab",onClick:Zt,title:"Share Code",children:Gt?e.jsx(Me,{size:16}):e.jsx(Ws,{size:16})}),e.jsx("button",{className:"pg-sidebar-tab",onClick:es,title:"Copy Code",children:v?e.jsx(Me,{size:16}):e.jsx(wt,{size:16})}),e.jsx("button",{className:"pg-sidebar-tab",onClick:ts,title:"Download",children:e.jsx(Xs,{size:16})}),e.jsx("button",{className:"pg-sidebar-tab",onClick:ss,title:"Reset Code",children:e.jsx(Et,{size:16})}),e.jsx("button",{className:"pg-sidebar-tab",onClick:Yt,title:"Format Code",children:e.jsx(Ds,{size:16})}),e.jsx("div",{style:{width:"20px",height:"1px",background:"rgba(255,255,255,0.1)",margin:"8px 0"}}),e.jsx("button",{className:"pg-sidebar-tab",onClick:()=>le(1),title:"Zoom In (Ctrl+)",children:e.jsx(Js,{size:16})}),e.jsx("button",{className:"pg-sidebar-tab",onClick:()=>le(-1),title:"Zoom Out (Ctrl-)",children:e.jsx(Us,{size:16})}),e.jsx("button",{className:"pg-sidebar-tab",onClick:dt,title:`Fullscreen (F11) - ${Ue?"Exit":"Enter"}`,children:Ue?e.jsx(Gs,{size:16}):e.jsx(Bs,{size:16})})]})]}),e.jsxs("div",{className:"pg-sidebar-content",children:[J==="errors"&&e.jsxs("div",{className:"pg-sidebar-section",children:[e.jsxs("div",{className:"pg-sidebar-section-header",children:[e.jsx(bt,{size:14}),e.jsx("span",{children:"Live Errors"}),e.jsx("span",{className:"pg-sidebar-badge",children:P.length})]}),Vt&&e.jsx("div",{style:{fontSize:"11px",opacity:.75,marginBottom:"8px"},children:"Checking syntax..."}),e.jsx("div",{className:"pg-sidebar-scroll",children:P.length===0?e.jsxs("div",{className:"pg-sidebar-empty",children:[e.jsx(Me,{size:28,strokeWidth:1}),e.jsx("p",{children:"No syntax issues detected"}),e.jsx("span",{children:"Diagnostics update while you type"})]}):P.map((t,o)=>e.jsxs("button",{className:"pg-history-entry pg-history-error",onClick:()=>ds(t),style:{textAlign:"left",width:"100%",cursor:"pointer"},children:[e.jsxs("div",{className:"pg-history-meta",children:[e.jsxs("span",{children:["Line ",t.line,":",t.col||1]}),e.jsx("span",{className:"pg-history-lang",children:"syntax"})]}),e.jsx("div",{className:"pg-history-preview",children:t.message})]},`${t.line}-${t.col}-${o}`))})]}),J==="ai"&&e.jsxs("div",{className:"pg-sidebar-section pg-ai-section",children:[e.jsxs("div",{className:"pg-sidebar-section-header",children:[e.jsx(pe,{size:14}),e.jsx("span",{children:"AI Assistant"}),O.length>0&&e.jsx("button",{className:"pg-ai-clear-btn",onClick:()=>{B([]),at(null)},title:"Clear chat",children:e.jsx(Ys,{size:12})})]}),e.jsx("div",{className:"pg-ai-chips",children:[{mode:"explain",icon:"✨",label:"Explain"},{mode:"review",icon:"🔍",label:"Review"},{mode:"debug",icon:"🐛",label:"Debug"},{mode:"optimize",icon:"⚡",label:"Optimize"},{mode:"complexity",icon:"📊",label:"Complexity"},{mode:"comment",icon:"💬",label:"Comment"}].map(t=>e.jsxs("button",{className:"pg-ai-chip",onClick:()=>K(t.mode),disabled:A||!a.trim(),title:a.trim()?`${t.label} your code`:"Write some code first",children:[e.jsx("span",{children:t.icon}),e.jsx("span",{children:t.label})]},t.mode))}),e.jsxs("div",{className:"pg-ai-messages",children:[O.length===0&&!A&&e.jsxs("div",{className:"pg-ai-empty",children:[e.jsx("div",{className:"pg-ai-empty-icon",children:e.jsx(Le,{size:24,strokeWidth:1.5})}),e.jsx("p",{children:"AI Code Assistant"}),e.jsx("span",{children:"Analyze, debug, optimize, and understand your code with AI"}),e.jsx("div",{className:"pg-ai-suggestions",children:[{icon:"✨",text:"Explain this code logic",mode:"explain"},{icon:"🐛",text:"Find bugs in my code",mode:"debug"},{icon:"⚡",text:"Optimize for performance",mode:"optimize"}].map(t=>e.jsxs("button",{className:"pg-ai-suggestion-btn",onClick:()=>K(t.mode),disabled:A||!a.trim(),children:[e.jsx("span",{className:"pg-ai-suggestion-icon",children:t.icon}),t.text]},t.mode))})]}),O.map((t,o)=>e.jsxs("div",{className:`pg-ai-msg pg-ai-msg-${t.role}`,children:[e.jsxs("div",{className:"pg-ai-msg-header",children:[t.role==="user"?e.jsx(Fs,{size:11}):e.jsx(pe,{size:11}),e.jsx("span",{children:t.role==="user"?"You":"AI"}),e.jsx("span",{className:"pg-ai-msg-time",children:t.timestamp})]}),e.jsx("div",{className:"pg-ai-msg-body",children:t.role==="assistant"?e.jsx(tr,{components:{code({node:p,inline:C,className:x,children:b,...T}){return C?e.jsx("code",{className:"pg-ai-inline-code",...T,children:b}):e.jsx("pre",{className:"pg-ai-code-block",children:e.jsx("code",{className:x,...T,children:String(b).replace(/\n$/,"")})})}},children:t.content}):t.content}),t.role==="assistant"&&!t.isError&&e.jsxs("div",{className:"pg-ai-msg-actions",children:[e.jsxs("button",{className:"pg-ai-action-btn",onClick:()=>ns(t.content,o),title:"Copy response",children:[rt===o?e.jsx(Ks,{size:11}):e.jsx(wt,{size:11}),e.jsx("span",{children:rt===o?"Copied":"Copy"})]}),t.content.includes("```")&&e.jsxs("button",{className:"pg-ai-action-btn",onClick:()=>rs(t.content),title:"Apply code to editor",children:[e.jsx(Zs,{size:11}),e.jsx("span",{children:"Apply"})]}),o===O.length-1&&e.jsxs("button",{className:"pg-ai-action-btn",onClick:is,title:"Retry this request",children:[e.jsx(Vs,{size:11}),e.jsx("span",{children:"Retry"})]})]})]},o)),A&&e.jsxs("div",{className:"pg-ai-msg pg-ai-msg-assistant",children:[e.jsxs("div",{className:"pg-ai-msg-header",children:[e.jsx(pe,{size:11}),e.jsx("span",{children:"AI"})]}),e.jsxs("div",{className:"pg-ai-typing",children:[e.jsx("span",{}),e.jsx("span",{}),e.jsx("span",{})]})]}),e.jsx("div",{ref:ot})]}),e.jsxs("div",{className:"pg-ai-input-area",children:[e.jsx("input",{className:"pg-ai-input",value:U,onChange:t=>st(t.target.value),onKeyDown:t=>{t.key==="Enter"&&!t.shiftKey&&U.trim()&&(t.preventDefault(),K("ask",U.trim()))},placeholder:"Ask about your code...",disabled:A}),e.jsx("button",{className:"pg-ai-send-btn",onClick:()=>U.trim()&&K("ask",U.trim()),disabled:A||!U.trim(),children:e.jsx(Hs,{size:14})})]}),e.jsxs("div",{className:"pg-ai-model-badge",children:[e.jsx(Le,{size:9})," Powered by Groq AI"]})]}),J==="history"&&e.jsxs("div",{className:"pg-sidebar-section",children:[e.jsxs("div",{className:"pg-sidebar-section-header",children:[e.jsx(Re,{size:14}),e.jsx("span",{children:"History"}),e.jsx("span",{className:"pg-sidebar-badge",children:se.length})]}),e.jsx("div",{className:"pg-sidebar-scroll",children:se.length===0?e.jsxs("div",{className:"pg-sidebar-empty",children:[e.jsx(Re,{size:28,strokeWidth:1}),e.jsx("p",{children:"No runs yet"}),e.jsx("span",{children:"Click Run to start!"})]}):se.map(t=>e.jsxs("div",{className:`pg-history-entry ${t.success?"":"pg-history-error"}`,children:[e.jsxs("div",{className:"pg-history-meta",children:[e.jsx("span",{children:t.timestamp}),e.jsx("span",{className:"pg-history-lang",children:t.language}),typeof t.runtimeMs=="number"?e.jsxs("span",{children:[Math.round(t.runtimeMs),"ms"]}):null,t.success?e.jsx("span",{style:{color:"#4ade80"},children:"✓"}):e.jsx("span",{style:{color:"#f87171"},children:"✗"})]}),e.jsx("div",{className:"pg-history-preview",children:t.outputPreview})]},t.id))})]}),J==="shortcuts"&&e.jsxs("div",{className:"pg-sidebar-section",children:[e.jsxs("div",{className:"pg-sidebar-section-header",children:[e.jsx(xt,{size:14}),e.jsx("span",{children:"Shortcuts"})]}),e.jsx("div",{className:"pg-sidebar-scroll",children:[["Ctrl+Enter","Run code"],["Ctrl + =","Zoom in"],["Ctrl + -","Zoom out"],["Ctrl + /","Shortcuts"],["Esc","Stop running code"],["F11","Fullscreen"],["Ctrl + D","Duplicate line"],["Ctrl+Shift+K","Delete line"],["Alt + ↑/↓","Move line"],["Ctrl + [/]","Indent"]].map(([t,o],p)=>e.jsxs("div",{className:"pg-shortcut-row",children:[e.jsx("kbd",{children:t}),e.jsx("span",{children:o})]},p))})]}),J==="info"&&e.jsxs("div",{className:"pg-sidebar-section",children:[e.jsxs("div",{className:"pg-sidebar-section-header",children:[e.jsx(Nt,{size:14}),e.jsx("span",{children:"Code Info"})]}),e.jsx("div",{className:"pg-sidebar-scroll",children:e.jsx("div",{className:"pg-info-grid",children:[["Language",`${k.icon} ${k.label}`],["Cursor",`Ln ${ne.line}, Col ${ne.col}`],["Lines",a.split(`
`).length],["Characters",a.length],["Font Size",`${ve}px`],["Encoding","UTF-8"],["Theme",te],["Total Runs",se.length],["Run Stage",Se],["Last Total",L?`${Math.round(L.totalMs)}ms`:"N/A"],["Last Compile",L?`${Math.round(L.compileMs)}ms`:"N/A"],["Last Run",L?`${Math.round(L.runMs)}ms`:"N/A"],["Compile Cache",L?L.cacheHit?"Hit":"Miss":"N/A"]].map(([t,o],p)=>e.jsxs("div",{className:"pg-info-item",children:[e.jsx("span",{className:"pg-info-label",children:t}),e.jsx("span",{className:"pg-info-value",children:o})]},p))})})]})]})]})]}),e.jsxs("div",{className:"pg-mobile-bar",children:[e.jsxs("button",{className:"pg-mobile-bar-btn",onClick:()=>s("/dashboard"),children:[e.jsx(Ct,{size:18}),e.jsx("span",{children:"Back"})]}),e.jsxs("button",{className:"pg-mobile-bar-btn pg-mobile-bar-lang",onClick:()=>g(t=>!t),children:[e.jsx("span",{children:k.icon}),e.jsx("span",{children:k.label}),e.jsx(Te,{size:12})]}),e.jsx("button",{className:`pg-mobile-run-fab ${u?"pg-mobile-run-fab--running":""}`,onClick:u?oe:V,title:u?"Stop":"Run Code",children:u?e.jsx(jt,{size:20}):e.jsx(vt,{size:20,style:{fill:"currentColor"}})}),e.jsxs("button",{className:`pg-mobile-bar-btn ${Xe?"pg-mobile-bar-active":""}`,onClick:()=>Bt(t=>!t),children:[e.jsx(me,{size:18}),e.jsx("span",{children:"Console"})]}),e.jsxs("button",{className:`pg-mobile-bar-btn ${re?"pg-mobile-bar-active":""}`,onClick:()=>Ye(t=>!t),children:[e.jsx(Qs,{size:18}),e.jsx("span",{children:"Panel"})]})]}),e.jsxs("div",{className:"pg-status-bar",children:[e.jsxs("div",{className:"pg-status-left",children:[e.jsxs("span",{className:"pg-status-item",children:["Ln ",ne.line,", Col ",ne.col]}),e.jsxs("span",{className:"pg-status-item",children:[a.split(`
`).length," lines"]}),e.jsxs("span",{className:"pg-status-item",children:[a.length," chars"]})]}),e.jsxs("div",{className:"pg-status-right",children:[e.jsxs("span",{className:"pg-status-item",children:[k.icon," ",k.label]}),e.jsxs("span",{className:"pg-status-item",children:["Stage: ",Se]}),e.jsxs("span",{className:"pg-status-item",children:["Last: ",L?`${Math.round(L.totalMs)}ms`:"N/A"]}),e.jsxs("span",{className:"pg-status-item",children:["Font: ",ve,"px"]}),e.jsx("span",{className:"pg-status-item",children:"UTF-8"})]})]}),(N||f||ee||Ge)&&e.jsx("div",{className:"pg-overlay",onClick:()=>{g(!1),j(!1),G(!1),be(!1)}})]})}export{_r as default};
