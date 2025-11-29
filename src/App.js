import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import AdminPage from './pages/AdminPage';
import InventoryPage from './pages/InventoryPage';
import './App.css';

// CORS 代理处理函数 - 使用免费的 CORS 代理解决图片加载问题
const processImageUrl = (rawUrl) => {
  if (!rawUrl) return '';

  // 清理 URL：去掉外层的引号、尖括号、以及左右空白
  let url = String(rawUrl).trim().replace(/^"|"$/g, '').replace(/^<|>$/g, '').trim();
  if (!url) return '';

  // 已经是代理 URL，直接返回
  if (url.includes('images.weserv.nl') || url.includes('cors-anywhere')) {
    return url;
  }

  // 如果是常见的公开图床，直接返回原始 URL（不经代理）——有时代理会失败/被远端阻止
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const whitelist = ['images.pexels.com', 'images.unsplash.com', 'cdn.pixabay.com', 'i.imgur.com'];
    if (whitelist.includes(host)) {
      return url;
    }
  } catch (e) {
    // ignore invalid URL, fall through to proxy
  }

  // 如果是 Google Drive 的分享链接，尝试提取 fileId 并转换为可直接访问的 uc 链接
  try {
    const driveFileIdMatch = url.match(/(?:file\/d\/|id=)([a-zA-Z0-9_-]{10,})/);
    if (url.includes('drive.google.com') && driveFileIdMatch && driveFileIdMatch[1]) {
      const id = driveFileIdMatch[1];
      const direct = `https://drive.google.com/uc?export=view&id=${id}`;
      return `https://images.weserv.nl/?url=${encodeURIComponent(direct)}`;
    }
  } catch (e) {
    // ignore and fallback to proxying the original URL
  }

  // 其他情况使用 weserv.nl CORS 代理（代理原始 URL）
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
    // 保存原始 images，供运行时回退尝试
    _origImages: vehicle.images.map((u) => String(u).trim()),
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
            // 调试输出：打印前几行原始 CSV 数据，帮助确认 Images 列内容
            console.log('Parsed sheet rows sample:', data.slice(0, 5));
            const parsedVehicles = data
              .map((row, index) => {
                // 支持多种列名：Images / Image / image / images
                const imagesCell =
                  row.Images ?? row.Image ?? row.image ?? row.images ?? row.ImagesUrl ?? row['Image URL'] ?? '';
                const origImages = imagesCell
                  ? String(imagesCell)
                      .split(',')
                      .map((url) => String(url).trim())
                      .filter(Boolean)
                  : [];
                const images = origImages.map(processImageUrl);
                if (origImages.length === 0) {
                  console.warn(`Row ${index} has no images in CSV (checked Images/Image columns).`);
                }
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
                  _origImages: origImages,
                  whatsapp: row.WhatsApp || row.Whatsapp || ''
                };
              })
              .filter((vehicle) => vehicle.brand && vehicle.model);

            setVehicles(parsedVehicles);
            // 调试输出：打印解析后的 vehicles 示例（含 images 字段）
            console.log('Parsed vehicles sample:', parsedVehicles.slice(0, 5));
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
