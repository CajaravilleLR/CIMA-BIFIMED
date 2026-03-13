function cleanText(s = "") {
  return String(s).replace(/\s+/g, " ").trim();
}

function formatCimaDate(ms) {
  if (!ms && ms !== 0) return null;
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const cn = cleanText(req.query.cn);
    if (!cn) return res.status(400).json({ error: "Falta parámetro cn" });

    const cimaMed = await fetch(`https://cima.aemps.es/cima/rest/medicamento?cn=${encodeURIComponent(cn)}`, {
      headers: { Accept: "application/json" }
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

    if (!cimaMed || !cimaMed.psum) {
      return res.status(200).json({ tieneProblema: false, cn });
    }

    const psum = await fetch(`https://cima.aemps.es/cima/rest/psuministro/${encodeURIComponent(cn)}`, {
      headers: { Accept: "application/json" }
    }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

    const fila = psum?.resultados?.[0] || null;
    return res.status(200).json({
      tieneProblema: true,
      cn,
      fechaInicio: formatCimaDate(fila?.fini),
      fechaFin: formatCimaDate(fila?.ffin),
      informacion: cleanText(fila?.observ || "") || null,
      tipoProblemaSuministro: fila?.tipoProblemaSuministro ?? null
    });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
}
