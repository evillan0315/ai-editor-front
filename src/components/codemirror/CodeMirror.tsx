import React from 'react';
import CodeMirror from '@uiw/react-codemirror';

interface CodeMirrorProps {
  value: string;
  onChange: (value: string) => void;
}

const CodeMirrorComponent: React.FC<CodeMirrorProps> = ({ value, onChange }) => {
  return (
    <CodeMirror
      value={value}
      onChange={(editor, data, value) => {
        onChange(value);
      }}
    />
  );
};

export default CodeMirrorComponent;