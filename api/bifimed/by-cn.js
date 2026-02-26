import { cleanText, getByCnWithIndicaciones } from "../_lib/bifimed.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const cn = cleanText(req.query.cn);
    if (!cn) return res.status(400).json({ error: "Falta parámetro cn" });

    const { sourceUrl, resultado } = await getByCnWithIndicaciones(cn);
    return res.status(200).json({ sourceUrl, cn, resultado });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
}

