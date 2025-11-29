export let pyodide = null;
let pyodideLoadingPromise = null;

export async function loadPyodideAndPackages() {
  if (pyodide) {
    return pyodide;
  }

  if (pyodideLoadingPromise) {
    return pyodideLoadingPromise;
  }


  pyodideLoadingPromise = (async () => {
    pyodide = await globalThis.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/'
    });

    await pyodide.loadPackage('micropip');

    await pyodide.runPythonAsync(`
      import micropip
      await micropip.install("automata-lib")
    `);

    return pyodide;
  })();

  return pyodideLoadingPromise;
}
