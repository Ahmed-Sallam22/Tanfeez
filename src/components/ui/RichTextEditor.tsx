import React, { useRef, useCallback, useEffect, useState } from 'react';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  height?: number;
  className?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter your text here...',
  height = 200,
  className = '',
  disabled = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const [selectionState, setSelectionState] = useState({ 
    bold: false, 
    italic: false, 
    underline: false,
    strikethrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (!isComposingRef.current && editorRef.current && onChange) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  }, [onChange]);

  // Update selection state for toolbar buttons
  const updateSelectionState = useCallback(() => {
    setSelectionState({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight')
    });
  }, []);

  // Formatting functions
  const handleBold = useCallback(() => {
    document.execCommand('bold', false);
    editorRef.current?.focus();
    updateSelectionState();
    handleInput();
  }, [handleInput, updateSelectionState]);

  const handleItalic = useCallback(() => {
    document.execCommand('italic', false);
    editorRef.current?.focus();
    updateSelectionState();
    handleInput();
  }, [handleInput, updateSelectionState]);

  const handleUnderline = useCallback(() => {
    document.execCommand('underline', false);
    editorRef.current?.focus();
    updateSelectionState();
    handleInput();
  }, [handleInput, updateSelectionState]);

  const handleStrikethrough = useCallback(() => {
    document.execCommand('strikeThrough', false);
    editorRef.current?.focus();
    updateSelectionState();
    handleInput();
  }, [handleInput, updateSelectionState]);



  const handleAlignment = useCallback((alignment: 'left' | 'center' | 'right' | 'justify') => {
    const commands = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull'
    };
    document.execCommand(commands[alignment], false);
    editorRef.current?.focus();
    updateSelectionState();
    handleInput();
  }, [handleInput, updateSelectionState]);




  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Handle Shift + Enter for new line
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br>');
      return;
    }

    // Handle regular Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
      return;
    }

    // Handle bold (Ctrl/Cmd + B)
    if (e.key === 'b' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleBold();
      return;
    }

    // Handle italic (Ctrl/Cmd + I)
    if (e.key === 'i' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleItalic();
      return;
    }

    // Handle underline (Ctrl/Cmd + U)
    if (e.key === 'u' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleUnderline();
      return;
    }
  }, [handleBold, handleItalic, handleUnderline]);

  // Handle composition events (for IME input)
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    handleInput();
  }, [handleInput]);

  // Handle selection change
  const handleSelectionChange = useCallback(() => {
    if (document.activeElement === editorRef.current) {
      updateSelectionState();
    }
  }, [updateSelectionState]);

  // Focus the editor
  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  // Add event listener for selection change
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  return (
    <div className={`rich-text-editor border border-gray-200 rounded-md ${className}`}>
      {/* Inline styles for formatting */}
      <style>{`
        .rich-text-editor-content {
          line-height: 1.5;
        }
        
        .rich-text-editor-content:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          font-style: italic;
        }
        
        .rich-text-editor-content:focus::before {
          content: none;
        }

        .rich-text-editor-content strong,
        .rich-text-editor-content b {
          font-weight: bold;
        }

        .rich-text-editor-content em,
        .rich-text-editor-content i {
          font-style: italic;
        }

        .rich-text-editor-content u {
          text-decoration: underline;
        }

        .rich-text-editor-content strike,
        .rich-text-editor-content s {
          text-decoration: line-through;
        }

        .rich-text-editor-content ul {
          list-style-type: disc;
          margin-left: 20px;
        }

        .rich-text-editor-content ol {
          list-style-type: decimal;
          margin-left: 20px;
        }

        .rich-text-editor-content li {
          margin: 5px 0;
        }

        .rich-text-editor-content a {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>

      {/* Enhanced Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* Text Formatting Group */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={handleBold}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              selectionState.bold ? 'bg-blue-100 text-[#4E8476]' : 'text-gray-600'
            }`}
            title="Bold (Ctrl+B)"
            disabled={disabled}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 2.5C4 2.22386 4.22386 2 4.5 2H8.5C10.1569 2 11.5 3.34315 11.5 5C11.5 6.22386 10.7239 7.28613 9.64 7.71936C10.9761 8.15259 12 9.27614 12 10.5C12 12.1569 10.6569 13.5 9 13.5H4.5C4.22386 13.5 4 13.2761 4 13V2.5ZM6 7.5H8.5C9.05228 7.5 9.5 7.05228 9.5 6.5V5.5C9.5 4.94772 9.05228 4.5 8.5 4.5H6V7.5ZM6 9.5V11.5H9C9.55228 11.5 10 11.0523 10 10.5C10 9.94772 9.55228 9.5 9 9.5H6Z" fill="currentColor"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={handleItalic}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              selectionState.italic ? 'bg-blue-100 text-[#4E8476]' : 'text-gray-600'
            }`}
            title="Italic (Ctrl+I)"
            disabled={disabled}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5 2C6.22386 2 6 2.22386 6 2.5C6 2.77614 6.22386 3 6.5 3H7.35L5.85 12H5C4.72386 12 4.5 12.2239 4.5 12.5C4.5 12.7761 4.72386 13 5 13H9.5C9.77614 13 10 12.7761 10 12.5C10 12.2239 9.77614 12 9.5 12H8.65L10.15 3H11C11.2761 3 11.5 2.77614 11.5 2.5C11.5 2.22386 11.2761 2 11 2H6.5Z" fill="currentColor"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={handleUnderline}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              selectionState.underline ? 'bg-blue-100 text-[#4E8476]' : 'text-gray-600'
            }`}
            title="Underline (Ctrl+U)"
            disabled={disabled}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 2.5C4 2.22386 4.22386 2 4.5 2C4.77614 2 5 2.22386 5 2.5V7C5 8.65685 6.34315 10 8 10C9.65685 10 11 8.65685 11 7V2.5C11 2.22386 11.2239 2 11.5 2C11.7761 2 12 2.22386 12 2.5V7C12 9.20914 10.2091 11 8 11C5.79086 11 4 9.20914 4 7V2.5ZM3 13.5C3 13.2239 3.22386 13 3.5 13H12.5C12.7761 13 13 13.2239 13 13.5C13 13.7761 12.7761 14 12.5 14H3.5C3.22386 14 3 13.7761 3 13.5Z" fill="currentColor"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={handleStrikethrough}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              selectionState.strikethrough ? 'bg-blue-100 text-[#4E8476]' : 'text-gray-600'
            }`}
            title="Strikethrough"
            disabled={disabled}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 8.5C2 8.22386 2.22386 8 2.5 8H13.5C13.7761 8 14 8.22386 14 8.5C14 8.77614 13.7761 9 13.5 9H2.5C2.22386 9 2 8.77614 2 8.5Z" fill="currentColor"/>
              <path d="M6 3.5C6 2.67157 6.67157 2 7.5 2H8.5C9.32843 2 10 2.67157 10 3.5V6H11V3.5C11 2.11929 9.88071 1 8.5 1H7.5C6.11929 1 5 2.11929 5 3.5V6H6V3.5Z" fill="currentColor"/>
              <path d="M5 10V12.5C5 13.3284 5.67157 14 6.5 14H9.5C10.3284 14 11 13.3284 11 12.5V10H10V12.5C10 12.7761 9.77614 13 9.5 13H6.5C6.22386 13 6 12.7761 6 12.5V10H5Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

      

        {/* Text Alignment Group */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => handleAlignment('left')}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              selectionState.justifyLeft ? 'bg-blue-100 text-[#4E8476]' : 'text-gray-600'
            }`}
            title="Align Left"
            disabled={disabled}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3.5C2 3.22386 2.22386 3 2.5 3H9.5C9.77614 3 10 3.22386 10 3.5C10 3.77614 9.77614 4 9.5 4H2.5C2.22386 4 2 3.77614 2 3.5Z" fill="currentColor"/>
              <path d="M2 7.5C2 7.22386 2.22386 7 2.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H2.5C2.22386 8 2 7.77614 2 7.5Z" fill="currentColor"/>
              <path d="M2.5 11C2.22386 11 2 11.2239 2 11.5C2 11.7761 2.22386 12 2.5 12H11.5C11.7761 12 12 11.7761 12 11.5C12 11.2239 11.7761 11 11.5 11H2.5Z" fill="currentColor"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleAlignment('center')}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              selectionState.justifyCenter ? 'bg-blue-100 text-[#4E8476]' : 'text-gray-600'
            }`}
            title="Align Center"
            disabled={disabled}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 3C4.22386 3 4 3.22386 4 3.5C4 3.77614 4.22386 4 4.5 4H11.5C11.7761 4 12 3.77614 12 3.5C12 3.22386 11.7761 3 11.5 3H4.5Z" fill="currentColor"/>
              <path d="M2 7.5C2 7.22386 2.22386 7 2.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H2.5C2.22386 8 2 7.77614 2 7.5Z" fill="currentColor"/>
              <path d="M3.5 11C3.22386 11 3 11.2239 3 11.5C3 11.7761 3.22386 12 3.5 12H12.5C12.7761 12 13 11.7761 13 11.5C13 11.2239 12.7761 11 12.5 11H3.5Z" fill="currentColor"/>
            </svg>
          </button>

          <button
            type="button"
            onClick={() => handleAlignment('right')}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              selectionState.justifyRight ? 'bg-blue-100 text-[#4E8476]' : 'text-gray-600'
            }`}
            title="Align Right"
            disabled={disabled}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5 3C6.22386 3 6 3.22386 6 3.5C6 3.77614 6.22386 4 6.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H6.5Z" fill="currentColor"/>
              <path d="M2 7.5C2 7.22386 2.22386 7 2.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H2.5C2.22386 8 2 7.77614 2 7.5Z" fill="currentColor"/>
              <path d="M4.5 11C4.22386 11 4 11.2239 4 11.5C4 11.7761 4.22386 12 4.5 12H13.5C13.7761 12 14 11.7761 14 11.5C14 11.2239 13.7761 11 13.5 11H4.5Z" fill="currentColor"/>
            </svg>
          </button>
        </div>

    

      

   
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onClick={focusEditor}
        onMouseUp={updateSelectionState}
        onKeyUp={updateSelectionState}
        className="rich-text-editor-content  p-3 outline-none min-h-[100px] focus:ring-2 focus:ring-[#4E8476] focus:ring-opacity-50"
        style={{ 
          height: height - 60, // Subtract toolbar height (larger toolbar)
          overflowY: 'auto'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;
