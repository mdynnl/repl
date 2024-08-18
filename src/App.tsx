import {
  createEffect,
  createRenderEffect,
  createSignal,
  on,
  onCleanup,
  type Component,
} from 'solid-js';

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import './userWorker';

const initialScript = /* javascript */ `\
let count = 0

const button = document.createElement('button')
const update = () => {
  button.textContent = count
}

button.onclick = () => {
  count++
  update()
}

update()

document.getElementById('root').appendChild(button)
`;

const createDoc = (script: string) => {
  const scriptUrl = URL.createObjectURL(
    new Blob([script], { type: 'application/javascript' }),
  );

  return /* html */ `
<!doctype html>
<html>
  <head>
    <title>result</title>
  </head>
  <body>
    <div id="root"></div>
    <script>
      console.clear();
    </script>
    <script src="${scriptUrl}" type="module"></script>
  </body>
</html>
`;
};

const App: Component = () => {
  const [container, setContainer] = createSignal<HTMLElement>();
  const [editor, setEditor] =
    createSignal<monaco.editor.IStandaloneCodeEditor>();

  const [value, _setValue] = createSignal(
    localStorage.getItem('value') || initialScript,
  );

  const saveValue = (next: ReturnType<typeof value>) => {
    localStorage.setItem('value', next);
    _setValue(next);
  };

  const setValue = (next: ReturnType<typeof value>) => {
    editor()?.setValue(next);
    return saveValue(next);
  };

  const reset = () => setValue(initialScript);

  createEffect(
    on(container, container => {
      if (!container) return;

      const editor = monaco.editor.create(container, {
        value: value(),
        language: 'javascript',
        glyphMargin: false,
        folding: false,
        lineNumbers: 'off',
        padding: { top: 5 },
        minimap: { enabled: false },
      });

      onCleanup(() => editor.dispose());

      setEditor(editor);

      editor.onDidChangeModelContent(() => saveValue(editor.getValue()));
    }),
  );

  const [doc, setDoc] = createSignal();
  const [track, trigger] = createSignal(void 0, { equals: false });
  createRenderEffect(() => {
    track();
    setDoc(createDoc(value()));
  });

  const refresh = () => trigger();

  return (
    <div
      style={{
        padding: '1rem',
        height: '100%',
        gap: '5px',
        display: 'grid',
        'grid-template-columns': '1fr 1fr',
      }}
    >
      <div style={{ display: 'grid', 'grid-template-rows': 'auto 1fr' }}>
        <div>
          <button onClick={reset}>reset</button>
        </div>
        <div ref={setContainer}></div>
      </div>
      <div style={{ display: 'grid', 'grid-template-rows': 'auto 1fr' }}>
        <div>
          <button onClick={refresh}>refresh</button>
        </div>
        <iframe
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          srcdoc={doc()}
        />
      </div>
    </div>
  );
};

export default App;
