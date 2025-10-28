const outputElement = document.getElementById('python-output');
const javaCodeInput = document.getElementById('java-code-input');
const SERVER_URL = 'http://localhost:4000/analizar';

async function handleAnalyzeAndSimulate() {
    const javaCode = javaCodeInput.value;
    outputElement.textContent = 'Analizando...';

    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: javaCode })
        });

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Mostrar la simulación directamente
        outputElement.textContent = data.simulacion;

        if (data.syntaxErrors && data.syntaxErrors.length > 0) {
            // !C Si hay errores sintácticos, la 'simulacion' contendrá el mensaje de error del backend
            console.error("Errores:", data.syntaxErrors);
        }

    } catch (error) {
        outputElement.textContent = `Error Horrible en la Comunicación: ${error.message}`;
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Selectores para los nuevos editores
    const javaEditor = document.getElementById('java-editor');
    const pythonEditor = document.getElementById('python-editor');
    const javaLineNumbers = document.getElementById('java-line-numbers');
    const pythonLineNumbers= document.getElementById('python-line-numbers');
    const consolaOutput = document.getElementById('consola-output');
    
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

    // !C Sincronizar scroll entre editor y números de línea omg it's work
    javaEditor.addEventListener('scroll', () => {
        javaLineNumbers.scrollTop = javaEditor.scrollTop;
    });
    
    pythonEditor.addEventListener('scroll', () => {
        pythonLineNumbers.scrollTop = pythonEditor.scrollTop;
    });

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
        downloadFile('Traducido.py', content, 'text/x-python');
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
            }); //!C Teóricamente con esto se puede usar httpie bien bien

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
            alert('No hay código Python válido para simular.');
            return;
        }
        const { simulacion } = lastAnalysisResult;
        if (!simulacion) {
            alert('No se recibió resultado de la simulación.');
            return;
        }
        consolaOutput.textContent = simulacion;
    });

    btnAcercaDe.addEventListener('click', (e) => {
        e.preventDefault();
        alert('JavaBridge v1.0\nDesarrollado por: Angel Raúl Herrera Chilel\nProyecto 2 - Lenguajes Formales y de Programación.\nhttps://github.com/Angelius6573/LFP_2S2025_202402587_PROYECTO2');
    });

    javaEditor.addEventListener('keydown', (e) => { //!C Hay que implementar el coso para mantener la tabulación incluso cuando la línea cambia
        if (e.key === 'Tab') {
            e.preventDefault();
            document.execCommand('insertText', false, '  ');
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
        element.click();
        document.body.removeChild(element);
        URL.revokeObjectURL(element.href); // Liberar memoria
    }
    
    updateLineNumbers(javaEditor, javaLineNumbers);
    updateLineNumbers(pythonEditor, pythonLineNumbers);
});
