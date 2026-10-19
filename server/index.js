import http from "node:http";

// Ключ читается только сервером. Не добавляйте префикс VITE_ к секретам.
const key = process.env.FAVORIT_API_KEY;
if (!key) throw new Error("Задайте FAVORIT_API_KEY в серверном .env");
const endpoint = "http://api.favorit-parts.ru/hs/hsprice/";
http
  .createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    const url = new URL(req.url, "http://localhost");
    if (req.method !== "GET" || url.pathname !== "/api/price") {
      res.writeHead(404).end(JSON.stringify({ error: "Маршрут не найден" }));
      return;
    }
    const number = url.searchParams.get("number")?.trim();
    if (!number) {
      res.writeHead(400).end(JSON.stringify({ error: "Не указан артикул" }));
      return;
    }
    const upstream = new URL(endpoint);
    upstream.searchParams.set("key", key);
    upstream.searchParams.set("number", number);
    const brand = url.searchParams.get("brand");
    if (brand) {
      upstream.searchParams.set("brand", brand);
      if (url.searchParams.get("analogues") === "on")
        upstream.searchParams.set("analogues", "on");
    }
    try {
      const response = await fetch(upstream, {
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      });
      if (!response.ok) throw new Error("Upstream unavailable");
      const data = await response.json();
      res.end(JSON.stringify(data));
    } catch {
      // Не выводим upstream URL и исключение: они могут содержать ключ.
      res
        .writeHead(502)
        .end(JSON.stringify({ error: "Сервис Favorit временно недоступен" }));
    }
  })
  .listen(3001, "127.0.0.1", () =>
    console.log("Прокси: http://127.0.0.1:3001"),
  );
