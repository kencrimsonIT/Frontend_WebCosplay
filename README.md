# Cho Thuê Đồ Cosplay - Frontend

Ứng dụng React để quản lý và thuê đồ cosplay.

## Cấu Trúc Thư Mục

```
frontend/
├── src/
│   ├── pages/           # Các trang của ứng dụng
│   │   ├── Home.jsx
│   │   ├── Home.css
│   │   ├── Products.jsx
│   │   └── Products.css
│   ├── components/      # Các component tái sử dụng
│   │   ├── Header.jsx
│   │   ├── Header.css
│   │   ├── Footer.jsx
│   │   ├── Footer.css
│   │   ├── ProductCard.jsx
│   │   └── ProductCard.css
│   ├── styles/          # Global styles
│   │   └── index.css
│   ├── data/            # Dữ liệu ứng dụng
│   │   └── products.js
│   ├── App.jsx          # Main app component
│   ├── App.css
│   └── main.jsx         # Entry point
├── public/              # Static files
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Cài Đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Chạy máy chủ phát triển:
```bash
npm run dev
```

3. Build cho production:
```bash
npm run build
```

## Công Nghệ Sử Dụng

- React 18
- React Router DOM
- Vite
- CSS Module (optional)

## Cách Sử Dụng

### Thêm Page Mới

1. Tạo file JSX trong `src/pages/`
2. Tạo file CSS cùng tên
3. Import vào `App.jsx` và thêm route

### Thêm Component

1. Tạo file JSX trong `src/components/`
2. Tạo file CSS cùng tên
3. Import và sử dụng trong pages

### Thêm Dữ Liệu

Thêm file dữ liệu trong `src/data/` và export hàm để lấy dữ liệu.

## Liên Hệ

Email: info@cosplay.vn
