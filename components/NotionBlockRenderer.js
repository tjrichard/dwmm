import React from 'react';
import ImageWithSkeleton from './ImageWithSkeleton';

// Notion의 텍스트 배열을 단일 문자열로 변환하고 스타일을 적용하는 헬퍼
const renderText = (textArray) => {
  if (!textArray) return null;
  return textArray.map((text, i) => {
    const { annotations, plain_text, href } = text;
    let element = plain_text;

    if (annotations.bold) element = <strong>{element}</strong>;
    if (annotations.italic) element = <em>{element}</em>;
    if (annotations.strikethrough) element = <s>{element}</s>;
    if (annotations.underline) element = <u>{element}</u>;
    if (annotations.code) element = <code>{element}</code>;

    if (href) element = <a href={href} target="_blank" rel="noopener noreferrer">{element}</a>;

    return <React.Fragment key={i}>{element}</React.Fragment>;
  });
};

const NotionBlockRenderer = ({ content }) => {
  if (!content) return null;

  return (
    <div className="notion-content">
      {content.map((block) => {
        const type = block.type;
        const value = block[type];

        switch (type) {
          case 'paragraph':
            return <p key={block.id}>{renderText(value.rich_text)}</p>;

          case 'heading_1':
            return <h1 key={block.id}>{renderText(value.rich_text)}</h1>;

          case 'heading_2':
            return <h2 key={block.id}>{renderText(value.rich_text)}</h2>;

          case 'heading_3':
            return <h3 key={block.id}>{renderText(value.rich_text)}</h3>;

          case 'bulleted_list_item':
          case 'numbered_list_item':
            return <li key={block.id}>{renderText(value.rich_text)}</li>;

          case 'to_do':
            return (
              <div key={block.id}>
                <label htmlFor={block.id}>
                  <input type="checkbox" id={block.id} defaultChecked={value.checked} disabled />
                  {renderText(value.rich_text)}
                </label>
              </div>
            );

          case 'quote':
            return <blockquote key={block.id}>{renderText(value.rich_text)}</blockquote>;

          case 'code':
            return (
              <pre key={block.id} className={`language-${value.language}`}>
                <code>{renderText(value.rich_text)}</code>
              </pre>
            );

          case 'image':
            const src = value.type === 'external' ? value.external.url : value.file.url;
            const caption = value.caption.length > 0 ? renderText(value.caption) : null;
            return (
              <figure key={block.id}>
                <ImageWithSkeleton src={src} alt={caption || 'Notion image'} />
                {caption && <figcaption>{caption}</figcaption>}
              </figure>
            );
          
          case 'divider':
            return <hr key={block.id} />;

          case 'callout':
            return (
              <div key={block.id} className="notion-callout">
                <span className="callout-icon">{value.icon?.emoji}</span>
                <div className="callout-text">{renderText(value.rich_text)}</div>
              </div>
            )

          default:
            console.warn(`Unsupported block type: ${type}`);
            return <p key={block.id}>[Unsupported content: {type}]</p>;
        }
      })}
    </div>
  );
};

export default NotionBlockRenderer;
