import {spawn} from 'node:child_process';

export async function simularPython(code) {
    return new Promise((resolve) => {
        const python = spawn('python', ['-c', code]);
        let output = '';
        let error = '';

        // Captura la salida estándar (lo que se imprime, como C++, o sea, no, pero si)
        python.stdout.on('data', (data) => {
            output += data.toString();
        });

        // Captura los errores de ejecución o sintaxis de Python
        python.stderr.on('data', (data) => {
            error += data.toString();
        });

        // Maneja el cierre del proceso
        python.on('close', (code) => {
            if (code === 0) {
                resolve(`---- Waos | Consola En funcionamiento ----\n\n${output.trim()}`);
            } else {
                resolve(`--- Error de Ejecución en Python ---\n\n${error.trim()}`);
            }
        });
        
        python.on('error', (err) => {
            resolve(`Error horrible: No se pudo ejecutar 'python'. Asegúrese de que Python esté instalado.\nDetalles del sistema: ${err.message}`);
        });
    });
}
