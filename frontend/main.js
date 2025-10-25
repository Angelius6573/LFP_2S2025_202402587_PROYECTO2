document.addEventListener('DOMContentLoaded', () => {
    // Selectores para los nuevos editores
    const javaEditor = document.getElementById('java-editor');
    const pythonEditor = document.getElementById('python-editor');
    const javaLineNumbers = document.getElementById('java-line-numbers');
    const pythonLineNumbers = document.getElementById('python-line-numbers');
    const consolaOutput = document.getElementById('consola-output');
    
    // Botones de menú
    const btnNuevo = document.getElementById('btn-nuevo');
    const btnAbrir = document.getElementById('btn-abrir');
    const fileInput = document.getElementById('file-input');
    const btnGuardarJava = document.getElementById('btn-guardar-java');
    const btnGuardarPython = document.getElementById('btn-guardar-python');
    const btnTraducir = document.getElementById('btn-traducir');
    const btnReportes = document.getElementById('btn-reportes');
    const btnSimular = document.getElementById('btn-simular');
    const btnAcercaDe = document.getElementById('btn-acerca-de');

    let lastAnalysisResult = null;
    const API_URL = 'http://localhost:4000/analizar';

    // Sincronizar scroll entre editores y números de línea
    javaEditor.addEventListener('scroll', () => {
        javaLineNumbers.scrollTop = javaEditor.scrollTop;
    });
    
    pythonEditor.addEventListener('scroll', () => {
        pythonLineNumbers.scrollTop = pythonEditor.scrollTop;
    });

    // Funciones de Archivo
    btnNuevo.addEventListener('click', (e) => {
        e.preventDefault();
        javaEditor.textContent = '';
        pythonEditor.textContent = '';
        consolaOutput.textContent = '';
        lastAnalysisResult = null;
        updateLineNumbers(javaEditor, javaLineNumbers);
        updateLineNumbers(pythonEditor, pythonLineNumbers);
    });

    btnAbrir.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            javaEditor.textContent = event.target.result;
            updateLineNumbers(javaEditor, javaLineNumbers);
        };
        reader.onerror = () => alert('Error al leer el archivo');
        reader.readAsText(file);
        e.target.value = null; 
    });

    btnGuardarJava.addEventListener('click', (e) => {
        e.preventDefault();
        const content = javaEditor.textContent;
        if (!content.trim()) {
            alert('No hay código Java para guardar.');
            return;
        }
        downloadFile('codigo.java', content, 'text/plain');
    });

    btnGuardarPython.addEventListener('click', (e) => {
        e.preventDefault();
        const content = pythonEditor.textContent;
        if (!content.trim()) {
            alert('No hay código Python para guardar.');
            return;
        }
        downloadFile('traducido.py', content, 'text/x-python');
    });

    // Funciones de Traducción
    btnTraducir.addEventListener('click', async (e) => {
        e.preventDefault();
        const code = javaEditor.textContent;
        if (!code.trim()) {
            alert('El editor de Java está vacío.');
            return;
        }

        pythonEditor.textContent = '';
        consolaOutput.textContent = 'Analizando...';
        lastAnalysisResult = null;
        updateLineNumbers(pythonEditor, pythonLineNumbers);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Error del servidor');
            }

            const result = await response.json();
            lastAnalysisResult = result;

            if (result.syntaxErrors.length > 0 || result.lexicalErrors.length > 0) {
                let errorMsg = 'Traducción fallida. Errores encontrados:\n';
                result.lexicalErrors.forEach(err => {
                    errorMsg += `[Léxico] L:${err.line}, C:${err.column} -> ${err.message}\n`;
                });
                result.syntaxErrors.forEach(err => {
                    errorMsg += `[Sintáctico] L:${err.line}, C:${err.column} -> ${err.message}\n`;
                });
                consolaOutput.textContent = errorMsg;
                alert('La traducción falló. Revisa la consola y el reporte de errores.');
            } else {
                pythonEditor.textContent = result.pythonCode;
                updateLineNumbers(pythonEditor, pythonLineNumbers);
                consolaOutput.textContent = 'Traducción generada exitosamente.';
            }

        } catch (error) {
            consolaOutput.textContent = `Error de conexión: ${error.message}`;
            alert(`No se pudo conectar al backend. Asegúrate de que esté corriendo en ${API_URL}`);
        }
    });

    btnReportes.addEventListener('click', (e) => {
        e.preventDefault();
        if (!lastAnalysisResult) {
            alert('Debes generar una traducción primero.');
            return;
        }
        const { reporteHtml } = lastAnalysisResult;
        if (reporteHtml) {
            const reportWindow = window.open('', '_blank');
            reportWindow.document.write(reporteHtml);
            reportWindow.document.close();
        } else {
            alert('No se generó ningún reporte.');
        }
    });

    btnSimular.addEventListener('click', (e) => {
        e.preventDefault();
        if (!lastAnalysisResult || !lastAnalysisResult.pythonCode) {
            alert('No hay código Python válido para simular. Genera una traducción exitosa primero.');
            return;
        }
        const { simulacion } = lastAnalysisResult;
        if (!simulacion) {
            alert('No se recibió resultado de la simulación.');
            return;
        }
        let output = '--- Iniciando Simulación ---\n';
        if (simulacion.output) output += `${simulacion.output}\n`;
        if (simulacion.error) output += `--- Errores de Simulación ---\n${simulacion.error}\n`;
        output += '--- Simulación Finalizada ---';
        consolaOutput.textContent = output;
    });

    btnAcercaDe.addEventListener('click', (e) => {
        e.preventDefault();
        alert('JavaBridge v1.0\nDesarrollado por: Angel Raúl Herrera Chilel\nProyecto 2 - Lenguajes Formales y de Programación.');
    });

    javaEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '  '); // Insertar 2 espacios
        }
    });

    javaEditor.addEventListener('input', () => {
        updateLineNumbers(javaEditor, javaLineNumbers);
    });

    function updateLineNumbers(editor, numberDiv) {
        const text = editor.textContent || '';
        const lineCount = text.split('\n').length;
        numberDiv.innerHTML = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
    }

    // Función auxiliar para descargar archivos
    function downloadFile(filename, content, mimeType) {
        const element = document.createElement('a');
        const file = new Blob([content], { type: mimeType });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click(); // CORRECCIÓN: Agregado "element." antes de click()
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href); // Liberar memoria
    }
    
    updateLineNumbers(javaEditor, javaLineNumbers);
    updateLineNumbers(pythonEditor, pythonLineNumbers);
});
