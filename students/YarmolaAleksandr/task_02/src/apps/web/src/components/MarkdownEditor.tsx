import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div>
      <div style={tabsStyle} role="tablist" aria-label="Режимы редактора">
        <button
          onClick={() => setShowPreview(false)}
          style={{
            ...tabStyle,
            ...(showPreview ? {} : activeTabStyle),
          }}
          role="tab"
          aria-selected={!showPreview}
          aria-controls="editor-panel"
          aria-label="Переключиться на редактор"
        >
          Редактор
        </button>
        <button
          onClick={() => setShowPreview(true)}
          style={{
            ...tabStyle,
            ...(showPreview ? activeTabStyle : {}),
          }}
          role="tab"
          aria-selected={showPreview}
          aria-controls="preview-panel"
          aria-label="Переключиться на предпросмотр"
        >
          Предпросмотр
        </button>
      </div>
      {showPreview ? (
        <div 
          style={previewStyle} 
          id="preview-panel"
          role="tabpanel"
          aria-label="Предпросмотр Markdown"
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        </div>
      ) : (
        <textarea
          id="editor-panel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={textareaStyle}
          placeholder="Введите текст в формате Markdown..."
          role="tabpanel"
          aria-label="Редактор Markdown"
        />
      )}
    </div>
  );
};

const tabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '0.5rem',
};

const tabStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  border: '1px solid #ddd',
  backgroundColor: 'white',
  cursor: 'pointer',
  borderRadius: '4px 4px 0 0',
};

const activeTabStyle: React.CSSProperties = {
  backgroundColor: '#007bff',
  color: 'white',
  borderColor: '#007bff',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '400px',
  padding: '1rem',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '1rem',
  fontFamily: 'monospace',
  resize: 'vertical',
};

const previewStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  borderRadius: '4px',
  padding: '1rem',
  minHeight: '400px',
  backgroundColor: 'white',
};

export default MarkdownEditor;
