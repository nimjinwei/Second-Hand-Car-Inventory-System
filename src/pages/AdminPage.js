import { useState } from 'react';

const ADMIN_PIN = 'admin123';

function AdminPage({ vehicles, onSaveVehicle, onDeleteVehicle }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [formState, setFormState] = useState({
    id: null,
    brand: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    location: '',
    description: '',
    images: '',
    whatsapp: ''
  });

  const clearForm = () =>
    setFormState({
      id: null,
      brand: '',
      model: '',
      year: '',
      price: '',
      mileage: '',
      fuelType: '',
      transmission: '',
      location: '',
      description: '',
      images: '',
      whatsapp: ''
    });

  const openEdit = (vehicle) => {
    setFormState({
      ...vehicle,
      images: vehicle.images.join(', ')
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...formState,
      id: formState.id ?? Date.now(),
      year: Number(formState.year),
      price: Number(formState.price),
      mileage: Number(formState.mileage),
      images: formState.images
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean)
    };
    onSaveVehicle(payload);
    clearForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm('确认删除这条车辆记录？')) return;
    onDeleteVehicle(id);
    if (formState.id === id) {
      clearForm();
    }
  };

  const handleAdminLogin = (event) => {
    event.preventDefault();
    if (adminPassword === ADMIN_PIN) {
      setIsAdmin(true);
      setAdminPassword('');
    } else {
      alert('管理员密码错误。');
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    clearForm();
  };

  return (
    <div className="admin-page">
      <section className="admin-panel">
        <div>
          <h1>车辆后台管理</h1>
          <p>仅授权人员可进行新增、编辑与删除操作。</p>
        </div>

        {!isAdmin && (
          <form className="admin-login" onSubmit={handleAdminLogin}>
            <label>
              管理员密码
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="请输入管理员密码"
              />
            </label>
            <button type="submit" className="primary">
              进入后台
            </button>
          </form>
        )}

        {isAdmin && (
          <>
            <form className="vehicle-form" onSubmit={handleFormSubmit}>
              <div className="form-grid">
                <label>
                  品牌
                  <input
                    required
                    name="brand"
                    value={formState.brand}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  型号
                  <input
                    required
                    name="model"
                    value={formState.model}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  年份
                  <input
                    required
                    type="number"
                    name="year"
                    value={formState.year}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  价格（¥）
                  <input
                    required
                    type="number"
                    name="price"
                    value={formState.price}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  里程（km）
                  <input
                    required
                    type="number"
                    name="mileage"
                    value={formState.mileage}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  动力类型
                  <input
                    name="fuelType"
                    value={formState.fuelType}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  变速箱
                  <input
                    name="transmission"
                    value={formState.transmission}
                    onChange={handleFormChange}
                  />
                </label>
                <label>
                  城市
                  <input
                    name="location"
                    value={formState.location}
                    onChange={handleFormChange}
                  />
                </label>
                <label className="full-row">
                  描述
                  <textarea
                    rows="3"
                    name="description"
                    value={formState.description}
                    onChange={handleFormChange}
                  />
                </label>
                <label className="full-row">
                  图片 URL（逗号分隔）
                  <textarea
                    rows="2"
                    name="images"
                    value={formState.images}
                    onChange={handleFormChange}
                  />
                </label>
                <label className="full-row">
                  WhatsApp
                  <input
                    name="whatsapp"
                    value={formState.whatsapp}
                    onChange={handleFormChange}
                    placeholder="+8613012345678"
                  />
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary">
                  {formState.id ? '保存修改' : '新增车辆'}
                </button>
                <button type="button" className="ghost" onClick={clearForm}>
                  重置表单
                </button>
              </div>
            </form>

            <div className="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>品牌/型号</th>
                    <th>年份</th>
                    <th>价格</th>
                    <th>里程</th>
                    <th>城市</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td>
                        <strong>{vehicle.brand}</strong> {vehicle.model}
                      </td>
                      <td>{vehicle.year}</td>
                      <td>¥{vehicle.price.toLocaleString()}</td>
                      <td>{vehicle.mileage.toLocaleString()} km</td>
                      <td>{vehicle.location}</td>
                      <td className="actions">
                        <button onClick={() => openEdit(vehicle)}>编辑</button>
                        <button
                          className="danger"
                          onClick={() => handleDelete(vehicle.id)}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="ghost logout" onClick={handleAdminLogout}>
              退出管理员模式
            </button>
          </>
        )}
      </section>
    </div>
  );
}

export default AdminPage;

