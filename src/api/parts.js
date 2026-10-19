import { mockResponse } from "./mock";

export const isDemo = import.meta.env.VITE_API_MODE !== "real";

export async function fetchParts(params, signal) {
  let data;
  if (isDemo) {
    await new Promise((resolve, reject) => {
      if (signal?.aborted)
        return reject(new DOMException("Aborted", "AbortError"));
      const onAbort = () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, 550);
      signal?.addEventListener("abort", onAbort, { once: true });
    });
    data = mockResponse(params);
  } else {
    // Собственный серверный маршрут, не endpoint сервиса Favorit.
    const response = await fetch(`/api/price?${new URLSearchParams(params)}`, {
      signal,
    });
    if (!response.ok)
      throw new Error("Сервис временно недоступен. Повторите поиск.");
    data = await response.json();
  }
  if (data.error) throw new Error(String(data.error));
  if (!Array.isArray(data.goods))
    throw new Error("Сервис вернул некорректный ответ.");
  return data.goods.filter((item) => item.brand && item.number);
}

export function getOffers(goods) {
  return goods
    .flatMap((part) => [part, ...(part.analogues || [])])
    .flatMap((part) => {
      const base = {
        goodsID: part.goodsID,
        brand: part.brand,
        number: part.number,
        name: part.name,
      };
      if (!part.warehouses.length)
        return [{ ...base, warehouse: "—", price: null, stock: 0 }];
      return part.warehouses.map((item) => ({
        ...base,
        warehouse: item.code || item.id,
        price: item.price,
        stock: item.stock,
      }));
    });
}
