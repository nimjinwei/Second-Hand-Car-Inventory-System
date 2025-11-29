import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import AdminPage from './pages/AdminPage';
import InventoryPage from './pages/InventoryPage';
import './App.css';

// CORS 代理处理函数 - 使用免费的 CORS 代理解决图片加载问题
const processImageUrl = (url) => {
  if (!url) return '';
  // 如果已经是代理 URL，直接返回
  if (url.includes('images.weserv.nl') || url.includes('cors-anywhere')) {
    return url;
  }
  // 使用 weserv.nl CORS 代理
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};

const initialVehicles = [
  {
    id: 1,
    brand: 'Toyota',
    model: 'RAV4 Adventure',
    year: 2020,
    price: 26800,
    mileage: 34000,
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    location: 'Shenzhen',
    description:
      'One-owner compact SUV with full service history and Toyota Safety Sense.',
    images: [
      'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
      'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg',
      'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg'
    ],
    whatsapp: '+8613912345678'
  },
  {
    id: 2,
    brand: 'BMW',
    model: '330i M Sport',
    year: 2019,
    price: 31800,
    mileage: 29000,
    fuelType: 'Gasoline',
    transmission: 'Automatic',
    location: 'Guangzhou',
    description:
      'Dealer certified sedan with Harman Kardon audio and full M Sport package.',
    images: [
      'https://images.pexels.com/photos/1402787/pexels-photo-1402787.jpeg',
      'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg'
    ],
    whatsapp: '+8613600001111'
  },
  {
    id: 3,
    brand: 'Tesla',
    model: 'Model 3 Long Range',
    year: 2021,
    price: 35200,
    mileage: 18000,
    fuelType: 'Electric',
    transmission: 'Automatic',
    location: 'Hong Kong',
    description:
      'Dual motor AWD with premium connectivity and Enhanced Autopilot.',
    images: [
      'https://images.pexels.com/photos/799443/pexels-photo-799443.jpeg',
      'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg',
      'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg'
    ],
    whatsapp: '+85251234567'
  },
  {
    id: 4,
    brand: 'Honda',
    model: 'Civic Hatchback',
    year: 2018,
    price: 16800,
    mileage: 52000,
    fuelType: 'Gasoline',
    transmission: 'Manual',
    location: 'Macau',
    description:
      'Reliable daily driver with sport exhaust, Apple CarPlay, and two sets of keys.',
    images: [
      'https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg',
      'https://images.pexels.com/photos/358070/pexels-photo-358070.jpeg'
    ],
    whatsapp: '+853612345'
  }
];

const SHEET_CSV_URL =
  process.env.REACT_APP_SHEET_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGcPm0Da6Wj8zpVMVOD79-2Wwoc2_03Ys1YkzgaVOBgrZVI89SyfDAcPbXonuhb63fJTK7r1U74oAA/pub?output=csv';

function App() {
  const basename = process.env.PUBLIC_URL || '/';
  
  // 对初始数据也应用代理处理
  const processedInitialVehicles = initialVehicles.map(vehicle => ({
    ...vehicle,
    images: vehicle.images.map(processImageUrl)
  }));
  
  const [vehicles, setVehicles] = useState(processedInitialVehicles);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState('');

  useEffect(() => {
    if (!SHEET_CSV_URL) return;
    setLoadingSheet(true);
    setSheetError('');

    fetch(SHEET_CSV_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error('无法读取 Google Sheet，请确认链接是否公开。');
        }
        return response.text();
      })
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: ({ data, errors }) => {
            if (errors.length) {
              setSheetError('解析表格时出现问题，请检查字段格式。');
              console.error(errors);
              setLoadingSheet(false);
              return;
            }
            const parsedVehicles = data
              .map((row, index) => {
                const images = row.Images
                  ? row.Images.split(',')
                      .map((url) => url.trim())
                      .filter(Boolean)
                      .map(processImageUrl)  // 使用代理处理每个图片 URL
                  : [];
                return {
                  id: row.Id || row.ID || `sheet-${index}`,
                  brand: row.Brand || '未命名品牌',
                  model: row.Model || '',
                  year: Number(row.Year) || 0,
                  price: Number(row.Price) || 0,
                  mileage: Number(row.Mileage) || 0,
                  fuelType: row.FuelType || '',
                  transmission: row.Transmission || '',
                  location: row.Location || '',
                  description: row.Description || '',
                  images,
                  whatsapp: row.WhatsApp || row.Whatsapp || ''
                };
              })
              .filter((vehicle) => vehicle.brand && vehicle.model);

            setVehicles(parsedVehicles);
            setLoadingSheet(false);
          }
        });
      })
      .catch((error) => {
        console.error(error);
        setSheetError(error.message || '读取 Google Sheet 失败。');
        setLoadingSheet(false);
      });
  }, []);

  const handleSaveVehicle = (payload) => {
    setVehicles((prev) => {
      const exists = prev.some((vehicle) => vehicle.id === payload.id);
      return exists
        ? prev.map((vehicle) => (vehicle.id === payload.id ? payload : vehicle))
        : [...prev, payload];
    });
  };

  const handleDeleteVehicle = (id) => {
    setVehicles((prev) => prev.filter((vehicle) => vehicle.id !== id));
  };

  return (
    <Router basename={basename}>
      <div className="app-shell">
        <nav className="top-nav">
          <div className="logo">UsedCar</div>
          <div className="nav-links">
            <Link to="/">库存展示</Link>
            <Link to="/admin">后台管理</Link>
          </div>
        </nav>
        <main>
          <Routes>
            <Route
              path="/"
              element={
                <InventoryPage
                  vehicles={vehicles}
                  loading={loadingSheet}
                  error={sheetError}
                />
              }
            />
            <Route
              path="/admin"
              element={
                <AdminPage
                  vehicles={vehicles}
                  onSaveVehicle={handleSaveVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
