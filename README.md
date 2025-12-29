# 🔊 DBA Noise Meter (Đo Độ Ồn)

Một ứng dụng web đo độ ồn thời gian thực với giao diện Visualizer đẹp mắt, hỗ trợ quay video có lớp phủ (overlay) thông số để chia sẻ.

🔗 **Demo:** [https://dba.hieu.website](https://dba.hieu.website)

![DBA Noise Meter Screenshot](https://via.placeholder.com/800x450?text=DBA+Noise+Meter+Screenshot)

## ✨ Tính Năng Chính

*   📊 **Đo độ ồn thời gian thực:** Hiển thị chỉ số dBA chính xác.
*   🌈 **Visualizer sống động:** Hiệu ứng sóng âm thanh phản hồi theo âm lượng.
*   🎥 **Quay video Overlay:** Quay lại video camera kèm theo thông số độ ồn, thời gian, và địa điểm trực tiếp trên video.
*   📸 **Chụp ảnh:** Chụp ảnh khoảnh khắc với thông số.
*   📍 **Thông tin bối cảnh:** Tự động hiển thị thời gian và địa điểm (GPS).
*   📱 **Responsive:** Tối ưu tốt cho cả Mobile và Desktop.

---

## 🚀 Hướng Dẫn Cài Đặt (Quick Start)

Dự án này sử dụng **ES Modules** thuần (không cần build tools như Webpack/Vite), nhưng để chạy được trên máy tính cá nhân và truy cập Camera, bạn cần chạy qua một **Local Web Server** (thay vì mở trực tiếp file html).

### Cách 1: Sử dụng Live Server (VS Code Extension) - Khuyên dùng
1.  Tải extension [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) trong VS Code.
2.  Mở thư mục dự án bằng VS Code.
3.  Click chuột phải vào file `index.html` chọn **"Open with Live Server"**.

### Cách 2: Sử dụng Python
Nếu đã cài Python, mở Terminal tại thư mục dự án và chạy:
```bash
python3 -m http.server 8000
```
Truy cập: `http://localhost:8000`

### Cách 3: Sử dụng Node.js (http-server)
```bash
npx http-server .
```

---

## 🛠 Hướng Dẫn Custom (Tùy Chỉnh)

Toàn bộ các thông số cấu hình quan trọng đều nằm trong file:  
📂 **`modules/constants.js`**

Bạn có thể chỉnh sửa file này để thay đổi màu sắc, ngưỡng độ ồn, thông báo, v.v.

### 1. Chỉnh Sửa Ngưỡng Độ Ồn & Màu Sắc (`DBA_LEVELS`)
Bạn muốn đổi mốc "Ồn" từ 85dB xuống 80dB? Hay đổi màu cảnh báo?
Tìm biến `DBA_LEVELS` trong `modules/constants.js`:

```javascript
export const DBA_LEVELS = [
    // ...
    { max: 70, text: 'Vừa phải', class: 'level-moderate', color: '#ffff00' }, 
    { max: 85, text: 'Ồn', class: 'level-loud', color: '#ff9900' }, // Sửa max: 80 tại đây
    // ...
];
```

### 2. Tùy Chỉnh Visualizer (`VISUALIZER_CONFIG`)
Muốn thay đổi màu sắc sóng âm thanh?
Tìm `VISUALIZER_CONFIG`:

```javascript
export const VISUALIZER_CONFIG = {
    barCount: 64, // Số lượng cột sóng
    // ...
    colors: {
        background: 'rgba(0, 0, 0, 0.3)',
        barGradient: [ // Dải màu gradient của sóng
            { stop: 0, color: 'rgba(0, 255, 136, 0.8)' },
            { stop: 0.5, color: 'rgba(255, 255, 0, 0.8)' },
            { stop: 1, color: 'rgba(255, 68, 68, 0.8)' }
        ]
    }
};
```

### 3. Thay Đổi Watermark & Overlay (`OVERLAY_CONFIG`)
Để thay đổi tên ứng dụng hiển thị trên video quay được:
Tìm `OVERLAY_CONFIG`:

```javascript
export const OVERLAY_CONFIG = {
    // ...
    watermark: {
        text: 'DBA Noise Meter', // <-- Đổi tên dự án của bạn tại đây
        color: 'rgba(255, 255, 255, 0.4)',
        // ...
    }
};
```

### 4. Dịch Ngôn Ngữ (`MESSAGES`)
Toàn bộ thông báo (Toast) và lỗi đều nằm trong biến `MESSAGES`. Bạn có thể dịch sang tiếng Anh hoặc đổi câu từ tùy thích.

---

## 🌐 Triển Khai (Deployment)

Dự án này là trang tĩnh (Static Site), bạn có thể deploy miễn phí lên **GitHub Pages**, **Vercel**, hoặc **Netlify**.

⚠️ **LƯU Ý QUAN TRỌNG:**
Trình duyệt yêu cầu kết nối an toàn (**HTTPS**) để cho phép truy cập Camera và Microphone.
*   Nếu chạy Localhost: Hoạt động bình thường.
*   Nếu Deploy lên Web: **Bắt buộc phải có HTTPS** (Vercel/Github Pages/Netlify đều mặc định hỗ trợ HTTPS).

---

## 📂 Cấu Trúc Thư Mục

```
.
├── index.html            # File giao diện chính
├── styles.css            # CSS giao diện
├── app.js                # Logic chính, khởi chạy ứng dụng
├── modules/              # Các module chức năng con
│   ├── constants.js      # ⚙️ CẤU HÌNH (Chỉnh sửa file này)
│   ├── AudioAnalyzer.js  # Xử lý âm thanh
│   ├── MediaCapture.js   # Xử lý Camera & Quay video
│   ├── Visualizer.js     # Vẽ sóng âm thanh
│   ├── UIController.js   # Điều khiển giao diện
│   └── ...
└── utils/                # Các hàm tiện ích
```


---

## ☕ Ủng Hộ Tác Giả (Donate)
Nếu bạn thấy dự án này hữu ích, hãy mời mình một ly cà phê nhé!  
👉 **Momo:** [https://me.momo.vn/1MIKuAfAtmCpIJu8swt3](https://me.momo.vn/1MIKuAfAtmCpIJu8swt3)

---

## 🤝 Đóng Góp
Mọi đóng góp đều được hoan nghênh. Hãy Fork dự án và gửi Pull Request!
