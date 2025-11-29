import { useMemo, useState } from 'react';

const priceRanges = [
  { label: '全部价位', value: 'all' },
  { label: '≤ RM15,000', value: '0-15000' },
  { label: 'RM15,000 - RM25,000', value: '15000-25000' },
  { label: '≥ RM25,000', value: '25000-1000000' }
];

function InventoryPage({ vehicles, loading = false, error = '' }) {
  const [filters, setFilters] = useState({
    brand: 'all',
    year: 'all',
    model: '',
    price: 'all',
    search: ''
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const uniqueBrands = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.brand))),
    [vehicles]
  );
  const uniqueYears = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.year))).sort(
      (a, b) => b - a
    ),
    [vehicles]
  );

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesBrand =
        filters.brand === 'all' || vehicle.brand === filters.brand;
      const matchesYear =
        filters.year === 'all' || vehicle.year === Number(filters.year);
      const matchesModel =
        !filters.model ||
        vehicle.model.toLowerCase().includes(filters.model.toLowerCase());
      const matchesSearch =
        !filters.search ||
        [vehicle.brand, vehicle.model, vehicle.location]
          .join(' ')
          .toLowerCase()
          .includes(filters.search.toLowerCase());
      const matchesPrice = (() => {
        if (filters.price === 'all') return true;
        const [min, max] = filters.price.split('-').map(Number);
        return vehicle.price >= min && vehicle.price <= max;
      })();
      return (
        matchesBrand && matchesYear && matchesModel && matchesSearch && matchesPrice
      );
    });
  }, [vehicles, filters]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () =>
    setFilters({
      brand: 'all',
      year: 'all',
      model: '',
      price: 'all',
      search: ''
    });

  const openDetails = (vehicle) => setSelectedVehicle(vehicle);
  const closeDetails = () => setSelectedVehicle(null);

  return (
    <div className="inventory-app">
      <header className="hero">
        <div>
          <p className="eyebrow">Used Car Inventory</p>
          <h1>二手车库存展示系统</h1>
          <p className="subheading">
            一站式浏览精选库存、筛选心仪车型，并直接联系车商。
          </p>
          <button
            className="primary"
            onClick={() =>
              window.scrollTo({ top: 500, behavior: 'smooth' })
            }
          >
            开始浏览
          </button>
        </div>
        <div className="hero-stats">
          <div>
            <strong>{vehicles.length}</strong>
            <span>在售车辆</span>
          </div>
          <div>
            <strong>24h</strong>
            <span>极速响应</span>
          </div>
          <div>
            <strong>7</strong>
            <span>城市覆盖</span>
          </div>
        </div>
      </header>

      <section className="filters">
        <div className="filter-field">
          <label>品牌</label>
          <select name="brand" value={filters.brand} onChange={handleFilterChange}>
            <option value="all">全部品牌</option>
            {uniqueBrands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>年份</label>
          <select name="year" value={filters.year} onChange={handleFilterChange}>
            <option value="all">全部年份</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>价格</label>
          <select name="price" value={filters.price} onChange={handleFilterChange}>
            {priceRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>型号</label>
          <input
            name="model"
            placeholder="输入车型"
            value={filters.model}
            onChange={handleFilterChange}
          />
        </div>
        <div className="filter-field search">
          <label>关键词搜索</label>
          <input
            name="search"
            placeholder="品牌 / 车型 / 城市"
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
        <button className="ghost" onClick={resetFilters}>
          清空筛选
        </button>
      </section>

      <section className="inventory-grid">
        {loading && (
          <p className="status-message">正在从 Google Sheet 同步库存，请稍候…</p>
        )}
        {error && <p className="status-message error">{error}</p>}
        {!loading && filteredVehicles.length === 0 && (
          <p className="empty-state">暂无满足条件的车辆，请更换筛选条件。</p>
        )}
        {filteredVehicles.map((vehicle) => (
          <article key={vehicle.id} className="car-card">
            <img
              src={vehicle.images && vehicle.images[0]}
              alt={vehicle.model}
              onError={(e) => {
                try {
                  // 如果代理图失败，尝试回退到原始 URL（不经过代理）
                  const idx = 0;
                  const orig = vehicle._origImages && vehicle._origImages[idx];
                  if (orig && e.target.src !== orig) {
                    e.target.src = orig;
                    return;
                  }
                  // 最后兜底：清除 src，显示空背景（浏览器会显示 broken image）
                  e.target.removeAttribute('src');
                } catch (err) {
                  // ignore
                }
              }}
            />
            <div className="card-body">
              <div className="card-head">
                <h3>
                  {vehicle.brand} {vehicle.model}
                </h3>
                <span className="badge">RM{vehicle.price.toLocaleString()}</span>
              </div>
              <p className="card-meta">
                {vehicle.year} · {vehicle.mileage.toLocaleString()} km · {vehicle.location}
              </p>
              <ul className="specs">
                <li>{vehicle.fuelType}</li>
                <li>{vehicle.transmission}</li>
                <li>{vehicle.location}</li>
              </ul>
              <div className="card-actions">
                <button className="ghost" onClick={() => openDetails(vehicle)}>
                  查看详情
                </button>
                <a
                  className="primary"
                  href={`https://wa.me/${vehicle.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `你好，我对 ${vehicle.brand} ${vehicle.model} 感兴趣。`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </article>
        ))}
      </section>

      {selectedVehicle && (
        <div className="modal">
          <div className="modal-content">
            <button className="close" onClick={closeDetails}>
              ×
            </button>
            <div className="modal-body">
              <div className="gallery">
                {selectedVehicle.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${selectedVehicle.model}-${idx}`}
                    onError={(e) => {
                      try {
                        const orig = selectedVehicle._origImages && selectedVehicle._origImages[idx];
                        if (orig && e.target.src !== orig) {
                          e.target.src = orig;
                          return;
                        }
                        e.target.removeAttribute('src');
                      } catch (err) {}
                    }}
                  />
                ))}
              </div>
              <div className="details">
                <h3>
                  {selectedVehicle.brand} {selectedVehicle.model}
                </h3>
                <p className="card-meta">
                  {selectedVehicle.year} · {selectedVehicle.mileage.toLocaleString()} km ·{' '}
                  {selectedVehicle.location}
                </p>
                <p>{selectedVehicle.description}</p>
                <ul className="specs">
                  <li>{selectedVehicle.fuelType}</li>
                  <li>{selectedVehicle.transmission}</li>
                  <li>RM{selectedVehicle.price.toLocaleString()}</li>
                </ul>
                <a
                  className="primary"
                  href={`https://wa.me/${selectedVehicle.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `你好，我想预约看车：${selectedVehicle.brand} ${selectedVehicle.model}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp 联系
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer>
        <p>© {new Date().getFullYear()} Used Car Inventory · Powered by React</p>
      </footer>
    </div>
  );
}

export default InventoryPage;

