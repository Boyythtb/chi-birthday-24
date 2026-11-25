import os
import sys
import base64
import webview

class CakeStudioApi:
    def __init__(self):
        self._window = None

    def set_window(self, window):
        self._window = window

    def ping(self):
        return "pong"

    def save_cake_image(self, data_url, filename="Banh_Sinh_Nhat_Chi_24_Tuoi.png"):
        """Save base64 image data to local disk via Windows Save File Dialog"""
        try:
            if not self._window:
                return {"success": False, "error": "Cửa sổ chưa sẵn sàng"}

            res = self._window.create_file_dialog(
                webview.SAVE_DIALOG,
                directory="",
                save_filename=filename,
                file_types=("Tập tin hình ảnh PNG (*.png)", "Tất cả tập tin (*.*)")
            )

            if not res:
                return {"cancelled": True}

            save_path = res[0] if isinstance(res, (list, tuple)) else res
            if not save_path:
                return {"cancelled": True}

            if not save_path.lower().endswith(".png"):
                save_path += ".png"

            if "," in data_url:
                data_url = data_url.split(",", 1)[1]

            img_bytes = base64.b64decode(data_url)
            with open(save_path, "wb") as f:
                f.write(img_bytes)

            return {"success": True, "path": save_path}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def select_image_file(self):
        """Open native Windows file dialog to select an image for custom cake topper"""
        try:
            if not self._window:
                return None

            res = self._window.create_file_dialog(
                webview.OPEN_DIALOG,
                directory="",
                allow_multiple=False,
                file_types=("Tập tin hình ảnh (*.jpg;*.jpeg;*.png;*.webp;*.bmp)", "Tất cả tập tin (*.*)")
            )

            if not res:
                return None

            path = res[0] if isinstance(res, (list, tuple)) else res
            if not path or not os.path.exists(path):
                return None

            with open(path, "rb") as f:
                raw_bytes = f.read()

            ext = path.split(".")[-1].lower()
            mime = "image/png" if ext == "png" else ("image/webp" if ext == "webp" else "image/jpeg")
            b64_data = base64.b64encode(raw_bytes).decode("utf-8")
            return f"data:{mime};base64,{b64_data}"
        except Exception as e:
            print("Lỗi khi chọn ảnh:", e)
            return None


def get_base_dir():
    """Get absolute path to resource, works for dev and for PyInstaller"""
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))


def main():
    base_dir = get_base_dir()
    index_path = os.path.join(base_dir, "index.html")

    api = CakeStudioApi()
    window = webview.create_window(
        title="Tiệm Bánh Bí Mật Của Chi • 26/11/2002",
        url=index_path,
        js_api=api,
        width=1340,
        height=880,
        min_size=(1080, 720),
        background_color="#100D0F",
        text_select=False
    )
    api.set_window(window)

    # Start pywebview
    webview.start(debug=False)


if __name__ == "__main__":
    main()
