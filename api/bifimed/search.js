import { fetchBifimedHtml, parseBifimedTable } from "../_lib/bifimed.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { nombre = "", priact_uno = "", financiado = "", page = "1" } = req.query;
    const { html, url } = await fetchBifimedHtml({
      metodo: "buscarMedicamentos",
      buscar: "Buscar",
      nombre_cn: nombre,
      priact_uno,
      financiado,
      sinImportacionesParalelas: "1",
      "d-4015021-p": page,
      "d-4015021-o": "1",
      "d-4015021-s": "4"
    });

    const resultados = parseBifimedTable(html);
    return res.status(200).json({ sourceUrl: url, total: resultados.length, resultados });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
}

