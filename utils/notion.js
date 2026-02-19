export const getPlainText = (richText = []) =>
  richText.map((item) => item?.plain_text || '').join('');

export const findProperty = (properties, names = []) => {
  if (!properties) return null;
  const entries = Object.entries(properties);
  for (const name of names) {
    const lower = name.toLowerCase();
    const match = entries.find(([key]) => key.toLowerCase() === lower);
    if (match) return match[1];
  }
  return null;
};

export const getPropertyText = (property) => {
  if (!property) return '';

  switch (property.type) {
    case 'title':
      return getPlainText(property.title);
    case 'rich_text':
      return getPlainText(property.rich_text);
    case 'select':
      return property.select?.name || '';
    case 'multi_select':
      return (property.multi_select || []).map((item) => item.name).join(', ');
    case 'status':
      return property.status?.name || '';
    case 'date':
      return property.date?.start || '';
    case 'number':
      return property.number?.toString() || '';
    case 'created_time':
      return property.created_time || '';
    case 'formula':
      if (property.formula?.type === 'string') return property.formula.string || '';
      if (property.formula?.type === 'number') return property.formula.number?.toString() || '';
      if (property.formula?.type === 'date') return property.formula.date?.start || '';
      return '';
    case 'rollup':
      if (property.rollup?.type === 'date') return property.rollup.date?.start || '';
      if (property.rollup?.type === 'string') return property.rollup.string || '';
      if (property.rollup?.type === 'number') return property.rollup.number?.toString() || '';
      return '';
    case 'people':
      return (property.people || []).map((person) => person.name).join(', ');
    case 'url':
      return property.url || '';
    default:
      return '';
  }
};

export const getPropertyMultiSelect = (property) => {
  if (!property) return [];
  if (property.type === 'multi_select') {
    return (property.multi_select || []).map((item) => item.name).filter(Boolean);
  }
  if (property.type === 'select') {
    return property.select?.name ? [property.select.name] : [];
  }
  if (property.type === 'rich_text' || property.type === 'title') {
    return getPlainText(property[property.type] || [])
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const getPropertyDateRange = (property) => {
  if (!property) return { start: '', end: '' };
  if (property.type === 'date') {
    return { start: property.date?.start || '', end: property.date?.end || '' };
  }
  if (property.type === 'formula' && property.formula?.type === 'date') {
    return { start: property.formula.date?.start || '', end: property.formula.date?.end || '' };
  }
  if (property.type === 'rollup' && property.rollup?.type === 'date') {
    return { start: property.rollup.date?.start || '', end: property.rollup.date?.end || '' };
  }
  return { start: '', end: '' };
};

export const getNotionFileUrl = (file) => {
  if (!file) return null;
  if (file.type === 'external') return file.external?.url || null;
  if (file.type === 'file') return file.file?.url || null;
  if (file.url) return file.url;
  return null;
};

export const getNotionPropertyUrl = (property) => {
  if (!property) return null;
  if (property.type === 'url') return property.url || null;
  if (property.type === 'files') {
    const file = property.files?.[0];
    return getNotionFileUrl(file);
  }
  if (property.type === 'rich_text') {
    const text = getPlainText(property.rich_text);
    if (text.startsWith('http')) return text;
  }
  return property.url || null;
};

export const getNotionThumbnail = (post) => {
  if (!post) return null;
  const properties = post.properties || {};
  const thumbnailProperty =
    findProperty(properties, ['thumbnail', 'cover', 'image', '썸네일', '이미지', '대표 이미지']) ||
    properties.thumbnail;
  const fromProperty = getNotionPropertyUrl(thumbnailProperty);
  if (fromProperty) return fromProperty;
  const cover = post.cover;
  if (cover) return getNotionFileUrl(cover);
  return null;
};
