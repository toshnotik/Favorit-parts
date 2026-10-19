// Значения демонстрационные; структура соответствует goods и warehouses из PDF.
const warehouse = (id, price, stock) => ({
  id,
  code: id,
  own: true,
  shipmentDate: "2026-10-20T15:30:00+03:00",
  price,
  stock,
});
const good = (goodsID, brand, number, name, warehouses) => ({
  goodsID,
  brand,
  number,
  name,
  count: warehouses.reduce((sum, item) => sum + item.stock, 0),
  price: 0,
  rate: 1,
  warehouses,
});
const parts = [
  good("demo-1", "MEYLE", "7160500039S", "Комплект рычагов задней подвески", [
    warehouse("МС2", 12533.62, 20),
    warehouse("ЦС", 12840, 7),
  ]),
  good("demo-2", "Mapco", "7160500039S", "Комплект рычагов задней подвески", [
    warehouse("ПП4", 8680.2, 10),
  ]),
];
const analogues = [
  good(
    "demo-3",
    "Mapco",
    "53612/1",
    "Комплект рычагов задней подвески, 6 шт. с болтами",
    [warehouse("ПП4", 8680.2, 10)],
  ),
  good(
    "demo-4",
    "MEYLE",
    "7160500039/SK",
    "Рычаги задней подвески, комплект на одну сторону",
    [],
  ),
  good("demo-5", "FEBI", "34555", "Комплект рычагов подвески", [
    warehouse("ЦС", 10450, 4),
  ]),
];
export function mockResponse({ number, brand, analogues: includeAnalogues }) {
  if (number.toUpperCase() === "ERROR")
    return { error: "Request quota exceeded!" };
  const found = parts.filter(
    (item) =>
      item.number === number.toUpperCase() && (!brand || item.brand === brand),
  );
  if (!found.length)
    return {
      goods: [
        {
          goodsID: "00000000-0000-0000-0000-000000000000",
          brand: "",
          number: "",
          name: "",
          count: 0,
          price: 0,
          rate: 0,
          warehouses: [],
        },
      ],
    };
  return {
    goods: found.map((item) => ({
      ...item,
      ...(brand && includeAnalogues === "on" ? { analogues } : {}),
    })),
  };
}
