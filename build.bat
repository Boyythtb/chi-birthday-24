@echo off
chcp 65001 >nul
echo ========================================================
echo   ĐÓNG GÓI ỨNG DỤNG: TIỆM BÁNH BÍ MẬT CỦA CHI (26/11/2002)
echo ========================================================
echo.
echo [1/3] Kiểm tra và cài đặt thư viện cần thiết...
pip install -r requirements.txt

echo.
echo [2/3] Tiến hành đóng gói file .EXE duy nhất bằng PyInstaller...
pyinstaller --noconfirm --clean --onefile --noconsole ^
    --name "TangSinhNhatChi_26_11" ^
    --add-data "index.html;." ^
    --add-data "styles.css;." ^
    --add-data "app.js;." ^
    --add-data "libs;libs" ^
    --add-data "assets;assets" ^
    main.py

echo.
echo [3/3] Hoàn tất! File thực thi nằm tại: dist\TangSinhNhatChi_26_11.exe
echo ========================================================
pause
