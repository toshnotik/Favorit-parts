import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { searchManufacturers, searchOffers } from "./store/search";
import { getOffers, isDemo } from "./api/parts";

const currency = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
});
export default function App() {
  const [input, setInput] = useState("");
  const [validation, setValidation] = useState("");
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const search = useSelector((state) => state.search);
  const offers = getOffers(search.goods);
  function submit(event) {
    event.preventDefault();
    if (!input.trim()) {
      setValidation("Введите артикул детали.");
      inputRef.current?.focus();
      return;
    }
    setValidation("");
    dispatch(searchManufacturers(input.trim()));
  }
  return (
    <>
      <header className="site-header">
        <div className="container d-flex align-items-center justify-content-between">
          <a className="wordmark" href="./">
            FAVORIT<span>PARTS</span>
            <i> / </i>
          </a>
          <span className="header-label">КАТАЛОГ АВТОЗАПЧАСТЕЙ</span>
        </div>
      </header>
      <main className="container main-content">
        <div className="intro">
          <span className="eyebrow">ТОЧНЫЙ ПОИСК · ПРОСТОЙ ВЫБОР</span>
          <h1>
            Нужная деталь.
            <br />
            <span>И её аналоги.</span>
          </h1>
          <p>
            Найдите запчасть по артикулу, выберите производителя
            <br className="d-none d-md-block" /> и сравните предложения по цене
            и наличию.
          </p>
        </div>
        {isDemo && (
          <div className="demo-note">
            <span className="demo-dot" />
            <div>
              <strong>Демонстрационный режим</strong>
              <span>
                Данные вымышлены. Подключение к реальному API не используется.
              </span>
            </div>
            <span className="demo-tag">DEMO</span>
          </div>
        )}
        <section className="search-panel" aria-labelledby="search-title">
          <div className="section-heading">
            <span className="step-number">01</span>
            <h2 id="search-title">Поиск по артикулу</h2>
          </div>
          <form onSubmit={submit} noValidate>
            <label className="form-label" htmlFor="part-number">
              Артикул детали
            </label>
            <div className="search-controls">
              <input
                ref={inputRef}
                id="part-number"
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                enterKeyHint="search"
                className={`form-control ${validation ? "is-invalid" : ""}`}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setValidation("");
                }}
                placeholder="Например, 7160500039S"
                aria-invalid={Boolean(validation)}
                aria-describedby="search-help validation"
              />
              <button className="btn btn-search" type="submit">
                Найти запчасть <span aria-hidden="true">↗</span>
              </button>
            </div>
            <div
              id="validation"
              className="text-danger validation-message"
              role={validation ? "alert" : undefined}
            >
              {validation}
            </div>
            <p id="search-help" className="search-help">
              Попробуйте{" "}
              <button
                type="button"
                onClick={() => {
                  setInput("7160500039S");
                  setValidation("");
                  dispatch(searchManufacturers("7160500039S"));
                }}
              >
                7160500039S
              </button>
              {isDemo && <span> — пример артикула в демокаталоге</span>}
            </p>
            {isDemo && (
              <details className="demo-scenarios">
                <summary>Сценарии для проверки</summary>
                <p>
                  <code>ERROR</code> — ошибка сервиса; <code>7260500039S</code>{" "}
                  — деталь не найдена.
                </p>
              </details>
            )}
          </form>
        </section>
        {search.manufacturers.length > 0 && (
          <section className="manufacturer-panel" aria-labelledby="brand-title">
            <div className="section-heading">
              <span className="step-number">02</span>
              <h2 id="brand-title">Выберите производителя</h2>
              <span className="count-label">
                {search.manufacturers.length} найдено
              </span>
            </div>
            <p className="muted">
              Производители по артикулу <strong>{search.number}</strong>
            </p>
            <div className="d-flex flex-wrap gap-2">
              {search.manufacturers.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  className={`brand-button ${search.brand === brand ? "selected" : ""}`}
                  aria-pressed={search.brand === brand}
                  onClick={() =>
                    dispatch(searchOffers({ number: search.number, brand }))
                  }
                >
                  {brand}
                  <span aria-hidden="true">
                    {search.brand === brand ? "✓" : "→"}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}
        <section className="results-panel" aria-labelledby="results-title">
          <div className="section-heading">
            <h2 id="results-title">Предложения и аналоги</h2>
            {offers.length > 0 && (
              <span className="count-label">{offers.length} предложений</span>
            )}
          </div>
          <div aria-live="polite" aria-atomic="true">
            {search.status === "loading" && (
              <div className="empty-state" role="status">
                <span className="spinner-border spinner-border-sm" />
                <h3>
                  {search.stage === "manufacturers"
                    ? "Ищем производителей…"
                    : "Загружаем предложения…"}
                </h3>
                <p>Это займёт несколько секунд</p>
              </div>
            )}
            {search.status === "failed" && (
              <div className="alert alert-danger m-4" role="alert">
                <strong>Не удалось выполнить поиск</strong>
                <div>{search.error}</div>
                <small>
                  Повторите поиск или выберите производителя ещё раз.
                </small>
              </div>
            )}
            {search.status === "idle" && (
              <Empty
                title="Начните с артикула"
                text="Введите номер детали — здесь появятся доступные предложения."
              />
            )}
            {search.status === "succeeded" &&
              search.stage === "manufacturers" && (
                <Empty
                  title={
                    search.manufacturers.length
                      ? "Осталось выбрать производителя"
                      : "Деталь не найдена"
                  }
                  text={
                    search.manufacturers.length
                      ? "Нажмите на производителя выше, чтобы увидеть цены и аналоги."
                      : "Проверьте артикул и попробуйте снова."
                  }
                />
              )}
            {search.status === "succeeded" &&
              search.stage === "offers" &&
              !offers.length && (
                <Empty
                  title="Предложений пока нет"
                  text="Выберите другого производителя или измените артикул."
                />
              )}
          </div>
          {search.status === "succeeded" && offers.length > 0 && (
            <>
              <div className="result-context">
                {search.brand} <span>/</span> {search.number}
                <span className="ms-auto">Цены по складам · ₽</span>
              </div>
              <div className="table-responsive">
                <table
                  className="table offers-table align-middle mb-0"
                  role="table"
                >
                  <caption className="visually-hidden">
                    Предложения по артикулу {search.number}, производитель{" "}
                    {search.brand}. Цена и остаток каждого склада.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Наименование / склад</th>
                      <th scope="col">Производитель</th>
                      <th scope="col">Артикул</th>
                      <th scope="col" className="text-end">
                        Цена
                      </th>
                      <th scope="col" className="text-end">
                        Остаток
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer, index) => (
                      <tr key={`${offer.goodsID}-${index}`} role="row">
                        <td className="name-cell" role="cell">
                          <strong>{offer.name}</strong>
                          <small>Склад: {offer.warehouse}</small>
                        </td>
                        <td
                          className="brand-cell"
                          data-label="Производитель"
                          role="cell"
                        >
                          {offer.brand}
                        </td>
                        <td
                          className="article-cell"
                          data-label="Артикул"
                          role="cell"
                        >
                          {offer.number}
                        </td>
                        <td
                          className="text-end price-cell"
                          data-label="Цена"
                          role="cell"
                        >
                          {offer.price === null
                            ? "—"
                            : currency.format(offer.price)}
                        </td>
                        <td
                          className="text-end stock-cell"
                          data-label="Остаток"
                          role="cell"
                        >
                          <span
                            className={`stock ${offer.stock > 0 ? "available" : ""}`}
                          >
                            {offer.stock > 0
                              ? `${offer.stock} шт.`
                              : "Нет в наличии"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-footnote">
                Каждая строка — отдельное предложение склада.{" "}
                {isDemo
                  ? "Цены и остатки демонстрационные."
                  : "Цены и остатки получены от сервиса Favorit."}
              </div>
            </>
          )}
        </section>
        <footer>
          <span>FAVORIT PARTS</span>
          <span>Поиск автозапчастей и аналогов</span>
          <span>
            {isDemo ? "Демонстрационный каталог" : "Каталог запчастей"}
          </span>
        </footer>
      </main>
    </>
  );
}
function Empty({ title, text }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">
        ⌕
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
