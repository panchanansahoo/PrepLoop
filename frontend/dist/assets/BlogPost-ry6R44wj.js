import{j as e}from"./vendor-richtext-CSQPGedM.js";import{r as h,E as y,L as j}from"./vendor-react-DI4irv9A.js";import{m as b,U as v}from"./index-CNIs3x7e.js";import{A as $}from"./arrow-left-B08JJfsP.js";import{S as w}from"./share-2-Cj2tiZxq.js";import{B as z}from"./bookmark-Bwbo4MxQ.js";import"./vendor-reactflow-DuZ3O1to.js";function x(t){return typeof t=="string"?t:Array.isArray(t)?t.map(r=>typeof r=="string"?r:r&&typeof r.text=="string"?r.text:r&&Array.isArray(r.content)?x(r.content):"").join(""):""}function m(t,r){return typeof t=="string"?t:Array.isArray(t)?t.map((i,l)=>{var d,a,f,o,g;const s=`${r}-${l}`;if(typeof i=="string")return e.jsx(h.Fragment,{children:i},s);const c=(i==null?void 0:i.text)??"";if(!c)return null;let n=c;return(d=i.styles)!=null&&d.code&&(n=e.jsx("code",{children:n},`${s}-code`)),(a=i.styles)!=null&&a.bold&&(n=e.jsx("strong",{children:n},`${s}-bold`)),(f=i.styles)!=null&&f.italic&&(n=e.jsx("em",{children:n},`${s}-italic`)),(o=i.styles)!=null&&o.underline&&(n=e.jsx("u",{children:n},`${s}-underline`)),(g=i.styles)!=null&&g.strike&&(n=e.jsx("s",{children:n},`${s}-strike`)),i.href?e.jsx("a",{href:i.href,target:"_blank",rel:"noreferrer noopener",children:n},s):e.jsx(h.Fragment,{children:n},s)}):null}function p(t,r,i=0){const l=`${(t==null?void 0:t.id)||"block"}-${r}`,s=(t==null?void 0:t.type)||"paragraph",c=(t==null?void 0:t.props)||{},n=Array.isArray(t==null?void 0:t.children)?t.children:[],d=Array.isArray(t==null?void 0:t.content)?t.content:null,a=x(t==null?void 0:t.content),f={marginLeft:i>0?i*16:0,textAlign:c.textAlignment||"left"};let o;if(s==="heading"){const g=Number(c.level||2);g===1?o=e.jsx("h1",{children:m(d,l)||a}):g===2?o=e.jsx("h2",{children:m(d,l)||a}):o=e.jsx("h3",{children:m(d,l)||a})}else s==="paragraph"?o=e.jsx("p",{children:m(d,l)||a}):s==="quote"?o=e.jsx("blockquote",{children:m(d,l)||a}):s==="codeBlock"?o=e.jsx("pre",{children:e.jsx("code",{children:a})}):s==="bulletListItem"?o=e.jsx("p",{children:`• ${m(d,l)||a}`}):s==="numberedListItem"?o=e.jsx("p",{children:`1. ${m(d,l)||a}`}):s==="checkListItem"?o=e.jsx("p",{children:`${c.checked?"[x]":"[ ]"} ${m(d,l)||a}`}):s==="image"&&c.url?o=e.jsxs("figure",{children:[e.jsx("img",{src:c.url,alt:c.caption||"blog",style:{maxWidth:"100%",borderRadius:12}}),c.caption?e.jsx("figcaption",{children:c.caption}):null]}):s==="divider"?o=e.jsx("hr",{}):o=e.jsx("p",{children:m(d,l)||a});return e.jsxs("div",{style:f,children:[o,n.map((g,u)=>p(g,u,i+1))]},l)}function A({content:t}){const r=h.useMemo(()=>{if(Array.isArray(t))return t;if(typeof t!="string")return[];try{const i=JSON.parse(t);return Array.isArray(i)?i:[]}catch{return[]}},[t]);return r.length?e.jsx("div",{className:"blog-content",children:r.map((i,l)=>p(i,l))}):e.jsx("p",{style:{opacity:.75},children:"No content available."})}function H(){var a,f;const{slug:t}=y(),[r,i]=h.useState(null),[l,s]=h.useState(!0),{theme:c}=b(),n=c==="light";h.useEffect(()=>{d()},[t]);const d=async()=>{try{const o=await fetch(`http://localhost:5000/api/blog/${t}`);if(o.ok){const g=await o.json();i(g)}}catch(o){console.error("Error fetching blog:",o)}finally{s(!1)}};return l?e.jsx("div",{style:{minHeight:"100vh",background:n?"#f8f9fa":"#030303",color:n?"#1a1a2e":"white",display:"flex",alignItems:"center",justifyContent:"center"},children:"Loading..."}):r?e.jsxs("div",{style:{minHeight:"100vh",background:n?"#f8f9fa":"#030303",color:n?"#1a1a2e":"white",position:"relative"},children:[e.jsx("div",{style:{height:"80px"}}),e.jsxs("article",{className:"container",style:{maxWidth:"800px",padding:"60px 20px 100px",position:"relative",zIndex:10},children:[e.jsxs(j,{to:"/blog",style:{display:"inline-flex",alignItems:"center",gap:"8px",color:"var(--zinc-400)",marginBottom:"40px",textDecoration:"none"},children:[e.jsx($,{size:16})," Back to Blog"]}),e.jsx("div",{style:{marginBottom:"20px",color:"var(--accent)",fontWeight:600},children:r.category||"General"}),e.jsx("h1",{style:{fontSize:"clamp(32px, 4vw, 56px)",lineHeight:1.1,marginBottom:"32px",fontWeight:700},children:r.title}),e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid var(--zinc-800)",paddingBottom:"32px",marginBottom:"40px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"16px"},children:[(a=r.author)!=null&&a.avatar_url?e.jsx("img",{src:r.author.avatar_url,style:{width:40,height:40,borderRadius:"50%"}}):e.jsx("div",{style:{width:40,height:40,borderRadius:"50%",background:"var(--zinc-800)",display:"flex",alignItems:"center",justifyContent:"center"},children:e.jsx(v,{size:20})}),e.jsxs("div",{children:[e.jsx("div",{style:{fontWeight:500,color:n?"#1a1a2e":"white"},children:((f=r.author)==null?void 0:f.full_name)||"Anonymous"}),e.jsxs("div",{style:{fontSize:"13px",color:"var(--zinc-500)",display:"flex",gap:"12px"},children:[e.jsx("span",{children:new Date(r.created_at).toLocaleDateString()}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[r.read_time||5," min read"]})]})]})]}),e.jsxs("div",{style:{display:"flex",gap:"12px"},children:[e.jsx("button",{className:"icon-btn",title:"Share",children:e.jsx(w,{size:20})}),e.jsx("button",{className:"icon-btn",title:"Save",children:e.jsx(z,{size:20})})]})]}),r.cover_image&&e.jsx("img",{src:r.cover_image,alt:r.title,style:{width:"100%",borderRadius:"16px",marginBottom:"60px",border:"1px solid var(--zinc-800)"}}),r.content&&r.content.trim().startsWith("[")?e.jsx("div",{className:"notion-renderer",children:e.jsx(A,{content:r.content})}):e.jsx("div",{className:"blog-content",style:{fontSize:"18px",lineHeight:1.8,color:n?"#444":"var(--zinc-300)"},dangerouslySetInnerHTML:{__html:r.content}}),e.jsx("style",{children:`
                    .blog-content h1 { font-size: 2.25em; font-weight: 800; margin-top: 1.5em; margin-bottom: 0.5em; color: ${n?"#1a1a2e":"white"}; line-height: 1.2; }
                    .blog-content h2 { font-size: 1.75em; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; color: ${n?"#1a1a2e":"white"}; line-height: 1.3; }
                    .blog-content h3 { font-size: 1.5em; font-weight: 600; margin-top: 1.5em; margin-bottom: 0.5em; color: ${n?"#1a1a2e":"white"}; line-height: 1.4; }
                    
                    .blog-content p { margin-bottom: 1.5em; }
                    
                    .blog-content ul, .blog-content ol { padding-left: 1.5em; margin-bottom: 1.5em; }
                    .blog-content ul { list-style-type: disc; }
                    .blog-content ol { list-style-type: decimal; }
                    .blog-content li { margin-bottom: 0.5em; }
                    
                    .blog-content blockquote {
                        border-left: 4px solid #6366f1;
                        padding-left: 1rem;
                        font-style: italic;
                        color: ${n?"#666":"#a1a1aa"};
                        margin: 2em 0;
                        background: ${n?"rgba(99, 102, 241, 0.06)":"rgba(99, 102, 241, 0.1)"};
                        padding: 1rem;
                        border-radius: 0 8px 8px 0;
                    }
                    
                    .blog-content pre {
                        background: ${n?"#f0f0f5":"#18181b"};
                        padding: 1.5em;
                        border-radius: 8px;
                        overflow-x: auto;
                        color: ${n?"#333":"#e4e4e7"};
                        font-family: 'Fira Code', monospace;
                        margin: 2em 0;
                        border: 1px solid ${n?"#ddd":"#27272a"};
                    }
                    
                    .blog-content code {
                        background: ${n?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.1)"};
                        padding: 0.2em 0.4em;
                        border-radius: 4px;
                        font-size: 0.9em;
                        color: ${n?"#333":"#e4e4e7"};
                        font-family: monospace;
                    }

                    .blog-content pre code {
                        background: transparent;
                        padding: 0;
                        color: inherit;
                        font-size: 0.9em;
                    }
                    
                    .blog-content img {
                        max-width: 100%;
                        border-radius: 12px;
                        margin: 2em 0;
                        border: 1px solid ${n?"#ddd":"#27272a"};
                    }

                    .blog-content hr {
                        border: 0;
                        border-top: 1px solid ${n?"#ddd":"#3f3f46"};
                        margin: 3em 0;
                    }
                    
                    .blog-content a {
                        color: #818cf8;
                        text-decoration: underline;
                        text-underline-offset: 4px;
                    }
                `})]})]}):e.jsx("div",{style:{minHeight:"100vh",background:n?"#f8f9fa":"#030303",color:n?"#1a1a2e":"white",display:"flex",alignItems:"center",justifyContent:"center"},children:"Blog not found."})}export{H as default};
