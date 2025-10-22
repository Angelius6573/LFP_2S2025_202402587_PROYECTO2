import express from 'express';
import cors from 'cors';
import { Lexer } from './Lexer/Lexer.js';
import { Parser } from './Parser/Parser.js';
import { generarReporteHtml } from './services/htmlReporter.js';
import { simularPython } from './services/pythonRunner.js';

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());

app.post('/analizar', (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'No se envió código' });

  try {
    const lexer = new Lexer(code);
    const tokens = lexer.analizar();
    const lexicalErrors = lexer.errors;

    const parser = new Parser(tokens);
    const parseResult = parser.analizar();
    const syntaxErrors = parseResult.errors;
    const pythonCode = parseResult.python;

    const reporteHtml = generarReporteHtml(tokens, lexicalErrors, syntaxErrors);
    const simulacion = simularPython(pythonCode);

    return res.json({
      tokens,
      lexicalErrors,
      syntaxErrors,
      pythonCode,
      reporteHtml,
      simulacion
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
