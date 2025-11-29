import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import AdminPage from './pages/AdminPage';
import InventoryPage from './pages/InventoryPage';
import './App.css';
import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';

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

function App() {
  const basename = process.env.PUBLIC_URL || '/';
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [loadingSheet, setLoadingSheet] = useState(true);
  const [sheetError, setSheetError] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'vehicles'),
      (snapshot) => {
        const parsedVehicles = snapshot.docs.map((document) => {
          const data = document.data();
          return {
            id: document.id,
            brand: data.brand || '未命名品牌',
            model: data.model || '',
            year: Number(data.year) || 0,
            price: Number(data.price) || 0,
            mileage: Number(data.mileage) || 0,
            fuelType: data.fuelType || '',
            transmission: data.transmission || '',
            location: data.location || '',
            description: data.description || '',
            images: Array.isArray(data.images)
              ? data.images
              : typeof data.images === 'string'
                ? data.images.split(',').map((url) => url.trim()).filter(Boolean)
                : [],
            whatsapp: data.whatsapp || data.WhatsApp || ''
          };
        });

        if (!parsedVehicles.length) {
          setVehicles(initialVehicles);
          setSheetError('Firestore 当前无数据，已展示示例库存。');
        } else {
          setVehicles(parsedVehicles);
          setSheetError('');
        }
        setLoadingSheet(false);
      },
      (error) => {
        console.error(error);
        setSheetError(error.message || '读取 Firestore 失败，请稍后重试。');
        setLoadingSheet(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSaveVehicle = async (payload) => {
    try {
      const id = payload.id?.toString() || Date.now().toString();
      const normalizedVehicle = {
        ...payload,
        id,
        brand: payload.brand || '未命名品牌',
        model: payload.model || '',
        year: Number(payload.year) || 0,
        price: Number(payload.price) || 0,
        mileage: Number(payload.mileage) || 0,
        fuelType: payload.fuelType || '',
        transmission: payload.transmission || '',
        location: payload.location || '',
        description: payload.description || '',
        images: Array.isArray(payload.images)
          ? payload.images
          : typeof payload.images === 'string'
            ? payload.images.split(',').map((url) => url.trim()).filter(Boolean)
            : [],
        whatsapp: payload.whatsapp || ''
      };

      await setDoc(doc(db, 'vehicles', id), normalizedVehicle, { merge: true });
      setSheetError('');
    } catch (error) {
      console.error(error);
      setSheetError('保存车辆失败，请稍后重试。');
    }
  };

  const handleDeleteVehicle = async (id) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id.toString()));
      setSheetError('');
    } catch (error) {
      console.error(error);
      setSheetError('删除车辆失败，请稍后重试。');
    }
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
