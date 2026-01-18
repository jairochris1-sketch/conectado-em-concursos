export default function HighlightedContent({ content, searchTerm }) {
  if (!searchTerm || !content) return <div dangerouslySetInnerHTML={{ __html: content }} />;

  const highlightText = (text) => {
    const term = searchTerm.trim();
    if (!term) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts
      .map((part, idx) =>
        regex.test(part)
          ? `<mark style="background-color: #fbbf24; padding: 0 2px;">${part}</mark>`
          : part
      )
      .join('');
  };

  const highlightedHtml = content.replace(
    /(<[^>]+>)|([^<>]+)/g,
    (match, tag, text) => {
      if (tag) return tag;
      return highlightText(text);
    }
  );

  return <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />;
}