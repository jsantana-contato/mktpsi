export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { especialidade, publico, humor, formatos } = req.body;

  if (!especialidade || !publico || !humor) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  const prompt = `Você é uma especialista em marketing para psicólogas.

Gere exatamente 5 ideias de post para Instagram para uma psicóloga com este perfil:
- Especialidade: ${especialidade}
- Público-alvo: ${publico}
- Humor/energia esta semana: ${humor}
- Formatos preferidos: ${formatos && formatos.length > 0 ? formatos.join(', ') : 'qualquer formato'}

Responda SOMENTE em JSON válido, sem texto antes ou depois, sem markdown, sem backticks. Use exatamente este formato:

{"ideias":[{"ideia":"texto da ideia de post em 1-2 frases, específica e acionável","formato":"Carrossel | Reels | Foto | Stories"}]}

Regras:
- Cada ideia deve ser concreta, não genérica
- Use linguagem acessível, não clínica
- As ideias devem refletir o perfil real descrito
- Varie os formatos entre as 5 ideias`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'Erro ao chamar a IA' });
    }

    const data = await response.json();
    const texto = data.content.map(i => i.text || '').join('');
    const clean = texto.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
}
