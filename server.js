import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BIFIMED_URL = "https://www.sanidad.gob.es/profesionales/medicamentos.do";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function cleanText(s = "") {
  return String(s).replace(/\s+/g, " ").trim();
}

function mapFinanciacion(raw = "") {
  const t = raw.toLowerCase();
  if (t.includes("determinadas indicaciones") || t.includes("condiciones")) {
    return { code: "SI_COND", label: "Sí para determinadas indicaciones/condiciones" };
  }
  if (t.includes("no incluido")) return { code: "NO_INCLUIDO", label: "No incluido" };
  if (t.includes("excluid")) return { code: "EXCLUIDO", label: "Excluido" };
  if (t.includes("no financiado")) return { code: "NO_FIN", label: "No financiado por resolución" };
  if (/(^|\s)s[ií](\s|$)/.test(t)) return { code: "SI", label: "Sí" };
  if (/(^|\s)no(\s|$)/.test(t)) return { code: "NO", label: "No" };
  return { code: "N/D", label: raw || "No disponible" };
}

function toAbsoluteBifimedUrl(rawHref = "") {
  if (!rawHref) return "";
  try {
    return new URL(rawHref, BIFIMED_URL).toString();
  } catch (_err) {
    return "";
  }
}

async function fetchBifimedHtml(params) {
  const url = new URL(BIFIMED_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": "BifimedConnector/1.0",
      Accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`BIFIMED respondió HTTP ${response.status}`);
  }
  return { html: await response.text(), url: url.toString() };
}

function parseBifimedTable(html) {
  const $ = cheerio.load(html);
  const table = $("table").first();
  if (!table.length) return [];

  const headers = table
    .find("thead th")
    .map((_, th) => cleanText($(th).text()).toLowerCase())
    .get();

  const getIdx = (re) => headers.findIndex((h) => re.test(h));
  const idxCn = getIdx(/c[oó]digo nacional/);
  const idxPrincipio = getIdx(/principio activo|asociaci[oó]n/);
  const idxNombre = getIdx(/nombre del medicamento/);
  const idxSituacion = getIdx(/situaci[oó]n de financiaci[oó]n/);
  const idxInfo = getIdx(/m[aá]s informaci[oó]n/);

  const rows = [];
  table.find("tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (!tds.length) return;

    const cols = tds.map((__, td) => cleanText($(td).text())).get();
    const rowText = cols.join(" | ");
    const cn = idxCn >= 0 ? cleanText(cols[idxCn] || "") : ((rowText.match(/\b\d{6,8}\b/g) || [])[0] || "");
    const principioActivo = idxPrincipio >= 0 ? cleanText(cols[idxPrincipio] || "") : "";
    const nombre = idxNombre >= 0 ? cleanText(cols[idxNombre] || "") : "";
    const financiacionTexto = idxSituacion >= 0 ? cleanText(cols[idxSituacion] || "") : "";

    let detalleUrl = "";
    if (idxInfo >= 0 && tds.eq(idxInfo).length) {
      const href = tds.eq(idxInfo).find("a[href]").attr("href") || "";
      detalleUrl = toAbsoluteBifimedUrl(href);
    }
    if (!detalleUrl) {
      const href = $(tr).find('a[href*="metodo=verDetalle"]').first().attr("href") || "";
      detalleUrl = toAbsoluteBifimedUrl(href);
    }

    rows.push({
      nombre,
      principioActivo,
      cn,
      financiacionTexto,
      financiacion: mapFinanciacion(financiacionTexto),
      detalleUrl,
      headers,
      cols
    });
  });

  return rows;
}

function parseBifimedIndicaciones(html) {
  const $ = cheerio.load(html);
  const tables = $("table").toArray();
  if (!tables.length) return [];

  const target = tables.find((tbl) => {
    let hs = $(tbl)
      .children("thead")
      .find("th")
      .map((_, th) => cleanText($(th).text()).toLowerCase())
      .get();
    if (hs.length !== 3) {
      hs = $(tbl)
        .find("tr")
        .first()
        .find("th")
        .map((_, th) => cleanText($(th).text()).toLowerCase())
        .get();
    }
    if (hs.length !== 3) return false;
    return /indicaci[oó]n autorizada/.test(hs[0]) &&
      /situaci[oó]n expediente indicaci[oó]n/.test(hs[1]) &&
      /resoluci[oó]n expediente de financiaci[oó]n indicaci[oó]n/.test(hs[2]);
  });
  if (!target) return [];

  const rows = [];
  let dataRows = $(target).find("tbody tr");
  if (!dataRows.length) {
    dataRows = $(target).find("tr").slice(1);
  }

  dataRows.each((_, tr) => {
    const cols = $(tr).find("td").map((__, td) => cleanText($(td).text())).get();
    if (cols.length < 2) return;

    // Defensa ante filas de ruido/encabezado mal parseado.
    if (/^indicaci[oó]n autorizada/i.test(cols[0])) return;

    rows.push({
      indicacion: cols[0] || "",
      situacionExpediente: cols[1] || "",
      resolucionFinanciacion: cols[2] || ""
    });
  });
  return rows;
}

app.get("/api/bifimed/search", async (req, res) => {
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
    res.json({ sourceUrl: url, total: resultados.length, resultados });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get("/api/bifimed/by-cn", async (req, res) => {
  try {
    const cn = cleanText(req.query.cn);
    if (!cn) return res.status(400).json({ error: "Falta parámetro cn" });

    const { html, url } = await fetchBifimedHtml({
      metodo: "buscarMedicamentos",
      buscar: "Buscar",
      nombre_cn: cn,
      sinImportacionesParalelas: "1"
    });

    const resultados = parseBifimedTable(html);
    const exact = resultados.find((r) => r.cn === cn) || resultados[0] || null;

    let indicaciones = [];
    let detalleUrl = exact?.detalleUrl || "";
    if (!detalleUrl) {
      detalleUrl = toAbsoluteBifimedUrl(`medicamentos.do?metodo=verDetalle&cn=${encodeURIComponent(cn)}`);
    }

    if (detalleUrl) {
      const detailRes = await fetch(detalleUrl, {
        headers: {
          "User-Agent": "BifimedConnector/1.0",
          Accept: "text/html,application/xhtml+xml"
        }
      });
      if (detailRes.ok) {
        const detailHtml = await detailRes.text();
        indicaciones = parseBifimedIndicaciones(detailHtml);
      }
    }

    const enriched = exact ? { ...exact, detalleUrl, indicaciones } : null;
    res.json({ sourceUrl: url, cn, resultado: enriched });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado: http://localhost:${PORT}`);
});

