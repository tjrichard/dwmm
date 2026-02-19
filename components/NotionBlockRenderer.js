import React from 'react';
import ImageWithSkeleton from './ImageWithSkeleton';

const normalizeUrl = (href) => {
  if (!href) return null;
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return href;
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  return `https://${href}`;
};

const getDisplayDomain = (href) => {
  try {
    const normalized = normalizeUrl(href);
    const hostname = new URL(normalized).hostname;
    return hostname.replace(/^www\./, '');
  } catch (error) {
    return href;
  }
};

const getFaviconSources = (href) => {
  try {
    const normalized = normalizeUrl(href);
    if (!normalized || !normalized.startsWith('http')) return [];
    const url = new URL(normalized);
    const hostname = url.hostname.replace(/^www\./, '');
    const origin = url.origin;
    return [
      `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(origin)}&size=64`,
      `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`,
      `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostname)}`,
    ];
  } catch (error) {
    return [];
  }
};

const getPlainText = (textArray = []) => {
  return textArray.map((text) => text?.plain_text || '').join('');
};

const renderInlineLink = (href) => {
  const normalized = normalizeUrl(href);
  const domain = getDisplayDomain(normalized);
  const faviconSources = getFaviconSources(normalized);

  const handleError = (event) => {
    const img = event.currentTarget;
    const index = Number(img.dataset.fallbackIndex || 0) + 1;

    if (index < faviconSources.length) {
      img.dataset.fallbackIndex = String(index);
      img.src = faviconSources[index];
    } else {
      img.style.display = 'none';
    }
  };

  return (
    <a
      href={normalized}
      target="_blank"
      rel="noopener noreferrer"
      className="notion-inline-link"
    >
      {faviconSources.length > 0 && (
        <img
          src={faviconSources[0]}
          alt={`${domain} favicon`}
          data-fallback-index="0"
          onError={handleError}
        />
      )}
      <span>{domain}</span>
    </a>
  );
};

const renderText = (textArray) => {
  if (!textArray) return null;

  return textArray.map((text, i) => {
    const annotations = text.annotations || {};
    const plainText = text.plain_text || '';
    const href = text.href || text?.text?.link?.url;
    let element = plainText;

    if (annotations.code) element = <code>{element}</code>;
    if (annotations.bold) element = <strong>{element}</strong>;
    if (annotations.italic) element = <em>{element}</em>;
    if (annotations.strikethrough) element = <s>{element}</s>;
    if (annotations.underline) element = <u>{element}</u>;

    if (href) {
      const normalized = normalizeUrl(href);
      if (normalized && normalized.startsWith('http')) {
        element = renderInlineLink(normalized);
      } else {
        element = (
          <a href={normalized} target="_blank" rel="noopener noreferrer">
            {element}
          </a>
        );
      }
    }

    return <React.Fragment key={i}>{element}</React.Fragment>;
  });
};

const NotionBlockRenderer = ({ content }) => {
  if (!content) return null;

  const renderBlocks = (blocks = []) => blocks.map((block) => renderBlock(block));

  const renderBlock = (block) => {
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

      case 'bulleted_list':
        return (
          <ul key={block.id} className="notion-list">
            {block.items.map((item) => (
              <li key={item.id}>
                {renderText(item[item.type]?.rich_text)}
                {item.children && renderBlocks(item.children)}
              </li>
            ))}
          </ul>
        );

      case 'numbered_list':
        return (
          <ol key={block.id} className="notion-list">
            {block.items.map((item) => (
              <li key={item.id}>
                {renderText(item[item.type]?.rich_text)}
                {item.children && renderBlocks(item.children)}
              </li>
            ))}
          </ol>
        );

      case 'bulleted_list_item':
      case 'numbered_list_item':
        return <li key={block.id}>{renderText(value.rich_text)}</li>;

      case 'to_do':
        return (
          <div key={block.id} className="notion-todo">
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

      case 'image': {
        const src = value.type === 'external' ? value.external.url : value.file.url;
        const captionText = getPlainText(value.caption || []);
        const caption = value.caption?.length ? renderText(value.caption) : null;
        return (
          <figure key={block.id}>
            <ImageWithSkeleton src={src} alt={captionText || 'Notion image'} aspectRatio="auto" />
            {caption && <figcaption>{caption}</figcaption>}
          </figure>
        );
      }

      case 'image_row':
        return (
          <div key={block.id} className="notion-image-row">
            {block.items.map((imageBlock) => {
              const imageValue = imageBlock.image;
              const src = imageValue.type === 'external' ? imageValue.external.url : imageValue.file.url;
              const captionText = getPlainText(imageValue.caption || []);
              const caption = imageValue.caption?.length ? renderText(imageValue.caption) : null;
              return (
                <figure key={imageBlock.id}>
                  <ImageWithSkeleton src={src} alt={captionText || 'Notion image'} aspectRatio="auto" />
                  {caption && <figcaption>{caption}</figcaption>}
                </figure>
              );
            })}
          </div>
        );

      case 'table': {
        const rows = (block.children || []).filter((row) => row.type === 'table_row');
        const hasColumnHeader = value?.has_column_header;
        const hasRowHeader = value?.has_row_header;
        const headerRow = hasColumnHeader ? rows[0] : null;
        const bodyRows = hasColumnHeader ? rows.slice(1) : rows;

        const renderRow = (row, rowIndex, isHeaderRow) => (
          <tr key={`${row.id}-${rowIndex}`}>
            {row.table_row.cells.map((cell, cellIndex) => {
              const isHeaderCell = isHeaderRow || (hasRowHeader && cellIndex === 0);
              const CellTag = isHeaderCell ? 'th' : 'td';
              return <CellTag key={`${row.id}-${cellIndex}`}>{renderText(cell)}</CellTag>;
            })}
          </tr>
        );

        return (
          <div key={block.id} className="notion-table-wrap">
            <table className="notion-table">
              {headerRow && (
                <thead>
                  {renderRow(headerRow, 0, true)}
                </thead>
              )}
              <tbody>
                {bodyRows.map((row, rowIndex) => renderRow(row, rowIndex, false))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'column_list': {
        const columns = (block.children || []).filter((child) => child.type === 'column');
        const ratios = columns.map((column) => column.column?.width_ratio || 1);
        const total = ratios.reduce((sum, ratio) => sum + ratio, 0);
        const template = ratios.map((ratio) => `${(ratio / total) * 100}%`).join(' ');

        return (
          <div key={block.id} className="notion-columns" style={{ gridTemplateColumns: template }}>
            {columns.map((column) => (
              <div key={column.id} className="notion-column">
                {renderBlocks(column.children || [])}
              </div>
            ))}
          </div>
        );
      }

      case 'divider':
        return <hr key={block.id} />;

      case 'callout':
        return (
          <div key={block.id} className="notion-callout">
            <span className="callout-icon">{value.icon?.emoji}</span>
            <div className="callout-text">
              {renderText(value.rich_text)}
            </div>
          </div>
        );

      default:
        console.warn(`Unsupported block type: ${type}`);
        return <p key={block.id}>[Unsupported content: {type}]</p>;
    }
  };

  return <div className="notion-content">{renderBlocks(content)}</div>;
};

export default NotionBlockRenderer;
