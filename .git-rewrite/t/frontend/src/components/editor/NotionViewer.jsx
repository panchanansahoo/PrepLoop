import React, { Fragment, useMemo } from 'react';

function flattenText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => {
      if (typeof part === 'string') return part;
      if (part && typeof part.text === 'string') return part.text;
      if (part && Array.isArray(part.content)) return flattenText(part.content);
      return '';
    })
    .join('');
}

function renderInline(content, keyPrefix) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return null;

  return content.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (typeof part === 'string') return <Fragment key={key}>{part}</Fragment>;

    const text = part?.text ?? '';
    if (!text) return null;

    let node = text;
    if (part.styles?.code) node = <code key={`${key}-code`}>{node}</code>;
    if (part.styles?.bold) node = <strong key={`${key}-bold`}>{node}</strong>;
    if (part.styles?.italic) node = <em key={`${key}-italic`}>{node}</em>;
    if (part.styles?.underline) node = <u key={`${key}-underline`}>{node}</u>;
    if (part.styles?.strike) node = <s key={`${key}-strike`}>{node}</s>;

    if (part.href) {
      return (
        <a key={key} href={part.href} target="_blank" rel="noreferrer noopener">
          {node}
        </a>
      );
    }

    return <Fragment key={key}>{node}</Fragment>;
  });
}

function renderBlock(block, index, depth = 0) {
  const key = `${block?.id || 'block'}-${index}`;
  const type = block?.type || 'paragraph';
  const props = block?.props || {};
  const children = Array.isArray(block?.children) ? block.children : [];
  const inlineContent = Array.isArray(block?.content) ? block.content : null;
  const textFallback = flattenText(block?.content);

  const style = {
    marginLeft: depth > 0 ? depth * 16 : 0,
    textAlign: props.textAlignment || 'left',
  };

  let body;

  if (type === 'heading') {
    const level = Number(props.level || 2);
    if (level === 1) body = <h1>{renderInline(inlineContent, key) || textFallback}</h1>;
    else if (level === 2) body = <h2>{renderInline(inlineContent, key) || textFallback}</h2>;
    else body = <h3>{renderInline(inlineContent, key) || textFallback}</h3>;
  } else if (type === 'paragraph') {
    body = <p>{renderInline(inlineContent, key) || textFallback}</p>;
  } else if (type === 'quote') {
    body = <blockquote>{renderInline(inlineContent, key) || textFallback}</blockquote>;
  } else if (type === 'codeBlock') {
    body = (
      <pre>
        <code>{textFallback}</code>
      </pre>
    );
  } else if (type === 'bulletListItem') {
    body = <p>{`• ${renderInline(inlineContent, key) || textFallback}`}</p>;
  } else if (type === 'numberedListItem') {
    body = <p>{`1. ${renderInline(inlineContent, key) || textFallback}`}</p>;
  } else if (type === 'checkListItem') {
    body = <p>{`${props.checked ? '[x]' : '[ ]'} ${renderInline(inlineContent, key) || textFallback}`}</p>;
  } else if (type === 'image' && props.url) {
    body = (
      <figure>
        <img src={props.url} alt={props.caption || 'blog'} style={{ maxWidth: '100%', borderRadius: 12 }} />
        {props.caption ? <figcaption>{props.caption}</figcaption> : null}
      </figure>
    );
  } else if (type === 'divider') {
    body = <hr />;
  } else {
    body = <p>{renderInline(inlineContent, key) || textFallback}</p>;
  }

  return (
    <div key={key} style={style}>
      {body}
      {children.map((child, childIndex) => renderBlock(child, childIndex, depth + 1))}
    </div>
  );
}

export default function NotionViewer({ content }) {
  const blocks = useMemo(() => {
    if (Array.isArray(content)) return content;
    if (typeof content !== 'string') return [];

    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [content]);

  if (!blocks.length) {
    return <p style={{ opacity: 0.75 }}>No content available.</p>;
  }

  return <div className="blog-content">{blocks.map((block, index) => renderBlock(block, index))}</div>;
}
