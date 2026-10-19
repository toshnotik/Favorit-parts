import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import App from "./App";
import {
  createAppStore,
  searchManufacturers,
  searchOffers,
} from "./store/search";
import { getOffers } from "./api/parts";

afterEach(cleanup);
describe("Поиск запчастей", () => {
  it("проходит поиск, смену производителя, пустой ответ и ошибку", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>,
    );
    await user.click(screen.getByRole("button", { name: /Найти запчасть/ }));
    expect(screen.getByText("Введите артикул детали.")).toBeTruthy();
    expect(document.activeElement).toBe(
      screen.getByLabelText("Артикул детали"),
    );
    await user.click(screen.getByRole("button", { name: "7160500039S" }));
    expect(screen.getByRole("status")).toBeTruthy();
    await user.click(await screen.findByRole("button", { name: /MEYLE/ }));
    await screen.findByRole("table");
    expect(screen.getByText("Нет в наличии")).toBeTruthy();
    expect(screen.getAllByText(/12\s533,62/).length).toBe(1);
    await user.click(screen.getByRole("button", { name: /Mapco/ }));
    await screen.findByRole("table");
    expect(
      screen
        .getByRole("button", { name: /Mapco/ })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    const input = screen.getByLabelText("Артикул детали");
    await user.clear(input);
    await user.type(input, "7260500039S");
    await user.click(screen.getByRole("button", { name: /Найти запчасть/ }));
    expect(screen.queryByRole("table")).toBeNull();
    await screen.findByText("Деталь не найдена");
    await user.clear(input);
    await user.type(input, "ERROR");
    await user.click(screen.getByRole("button", { name: /Найти запчасть/ }));
    await screen.findByText("Request quota exceeded!");
  });
  it("восстанавливает поиск после ошибки и отправляет артикул клавишей Enter", async () => {
    const user = userEvent.setup();
    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>,
    );
    const input = screen.getByLabelText("Артикул детали");
    await user.type(input, "ERROR{Enter}");
    await screen.findByText("Request quota exceeded!");
    await user.clear(input);
    await user.type(input, " 7160500039s {Enter}");
    expect(screen.queryByRole("alert")).toBeNull();
    await user.click(await screen.findByRole("button", { name: /MEYLE/ }));
    const table = await screen.findByRole("table");
    expect(table.querySelector("caption").textContent).toContain("7160500039s");
    expect(table.querySelectorAll("tbody tr").length).toBe(5);
    expect(screen.queryByText("Request quota exceeded!")).toBeNull();
  });
  it("игнорирует запоздавшие ответы при новом поиске и смене производителя", async () => {
    const store = createAppStore();
    await store.dispatch(searchManufacturers("7160500039S"));
    const first = store.dispatch(
      searchOffers({ number: "7160500039S", brand: "MEYLE" }),
    );
    const second = store.dispatch(
      searchOffers({ number: "7160500039S", brand: "Mapco" }),
    );
    await Promise.all([first, second]);
    expect(store.getState().search.goods[0].brand).toBe("Mapco");
    const oldRequest = store.dispatch(
      searchOffers({ number: "7160500039S", brand: "MEYLE" }),
    );
    const freshRequest = store.dispatch(searchManufacturers("unknown"));
    await Promise.all([oldRequest, freshRequest]);
    expect(store.getState().search.goods).toEqual([]);
    expect(store.getState().search.manufacturers).toEqual([]);
    // Явно воспроизводим ответ старого запроса после завершения нового.
    store.dispatch(
      searchOffers.fulfilled([{ brand: "STALE" }], oldRequest.requestId, {
        number: "7160500039S",
        brand: "MEYLE",
      }),
    );
    expect(store.getState().search.goods).toEqual([]);
  });
  it("берёт цену и остаток из склада, сохраняя нулевой остаток без выдуманной цены", () => {
    expect(
      getOffers([
        {
          goodsID: "1",
          brand: "A",
          number: "B",
          name: "Part",
          price: 999,
          count: 999,
          warehouses: [{ id: "S", price: 25, stock: 2 }],
          analogues: [
            {
              goodsID: "2",
              brand: "C",
              number: "D",
              name: "Analogue",
              price: 555,
              warehouses: [],
            },
          ],
        },
      ]),
    ).toEqual([
      {
        goodsID: "1",
        brand: "A",
        number: "B",
        name: "Part",
        warehouse: "S",
        price: 25,
        stock: 2,
      },
      {
        goodsID: "2",
        brand: "C",
        number: "D",
        name: "Analogue",
        warehouse: "—",
        price: null,
        stock: 0,
      },
    ]);
  });
});
