# Pose Camera App

## 📂 Cấu trúc dự án

Dự án được tổ chức theo kiến trúc monorepo với 2 thành phần chính nằm trong thư mục `apps/`:

- **`apps/mobile`**: Ứng dụng di động được xây dựng bằng **React Native** (framework **Expo**). 
  - **Tính năng nổi bật:** Tích hợp camera (`expo-camera`), xử lý hình ảnh (`expo-image-manipulator`, `react-native-view-shot`), điều hướng với `expo-router`.
- **`apps/backend`**: RESTful API Server được phát triển bằng **ASP.NET Core (.NET 10)**.
  - **Cấu trúc:** Được tổ chức rõ ràng với các lớp `Controllers`, `Models`, `DTOs`, và `Services` kết nối CSDL và xử lý logic nghiệp vụ.

## 🛠 Yêu cầu hệ thống (Prerequisites)

Để có thể chạy được dự án này trên máy tính, bạn cần cài đặt các công cụ sau:

- **[Node.js](https://nodejs.org/)** (Khuyến nghị phiên bản LTS mới nhất).
- **[.NET 10.0 SDK](https://dotnet.microsoft.com/)** (Dành cho việc chạy và build backend).
- Ứng dụng **Expo Go** trên điện thoại di động (hoặc máy ảo Android Studio / iOS Simulator) để chạy thử app mobile.

## 🚀 Hướng dẫn cài đặt và chạy ứng dụng

### 1. Cài đặt các gói thư viện (Dependencies)

Bạn cần cài đặt các thư viện cho ứng dụng di động trước khi chạy:
```bash
cd apps/mobile
npm install
```

*(Lưu ý: Backend sử dụng .NET, các package sẽ được tự động khôi phục (restore) khi bạn chạy lệnh build hoặc run).*

### 2. Khởi chạy dự án

Bạn cần mở 2 cửa sổ Terminal (hoặc Command Prompt) riêng biệt để chạy song song 2 ứng dụng.

**Chạy API Backend (.NET):**
```bash
cd apps/backend
dotnet run
```
Sau khi chạy thành công, backend sẽ mở các cổng localhost (ví dụ: `http://localhost:5000` hoặc port được định nghĩa trong `Properties/launchSettings.json`).

**Chạy Mobile App (Expo):**
```bash
cd apps/mobile
npx expo start
```
Sau đó sử dụng ứng dụng Expo Go trên điện thoại quét mã QR xuất hiện trên terminal để mở ứng dụng.

Đảm bảo điện thoại và máy tính cùng sử dụng chung một mạng và mạng đấy phải là private.

## 📝 Cấu hình môi trường

- **Backend:** Cấu hình môi trường và chuỗi kết nối cơ sở dữ liệu được đặt trong các file `appsettings.json` và `appsettings.Development.json` tại thư mục `apps/backend`.
- **Mobile:** Các thiết lập của app như Tên ứng dụng, version, v.v. được cấu hình trong `apps/mobile/app.json`.
