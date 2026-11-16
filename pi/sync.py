
import json
import os
import shutil
import tempfile
from pathlib import Path
from urllib.request import urlopen

BASE_DIR = Path(__file__).resolve().parent
OFFLINE_DIR = BASE_DIR / "offline"

MENU_FILE = OFFLINE_DIR / "menu.json"
BACKUP_FILE = OFFLINE_DIR / "menu.previous.json"

API_URL = "https://brass-moon.vercel.app/api/menu"


def download_json(url):
    with urlopen(url, timeout=15) as response:
        return json.load(response)


def get_local_version():
    try:
        with MENU_FILE.open("r", encoding="utf-8") as file:
            data = json.load(file)

        return int(data.get("version", 0))
    except (OSError, ValueError, TypeError):
        return 0


def validate_menu(data):
    if not isinstance(data, dict):
        raise ValueError("Invalid menu response")

    version = data.get("version")
    menu = data.get("menu")

    if type(version) is not int or version < 1:
        raise ValueError("Invalid published version")

    if not isinstance(menu, dict):
        raise ValueError("Missing menu content")

    for section_name in ("coffee", "espresso", "nonCoffee"):
        section = menu.get(section_name)

        if not isinstance(section, dict):
            raise ValueError(f"Missing section: {section_name}")

        if not isinstance(section.get("items"), list):
            raise ValueError(f"Invalid items: {section_name}")

        for item in section["items"]:
            if not isinstance(item, dict):
                raise ValueError("Invalid menu item")

            if not isinstance(item.get("name"), str):
                raise ValueError("Invalid item name")

            prices = item.get("prices")

            if not isinstance(prices, list) or len(prices) != 3:
                raise ValueError("Invalid item prices")

            for price in prices:
                if type(price) not in (int, float) or not 0 <= price <= 999999.99:
                    raise ValueError("Invalid price")

    if not isinstance(menu.get("syrups"), list):
        raise ValueError("Invalid syrups")

    addons = menu.get("addOns")

    if not isinstance(addons, dict):
        raise ValueError("Invalid add-ons")

    if not isinstance(addons.get("items"), list):
        raise ValueError("Invalid add-on items")

    if type(addons.get("price")) not in (int, float):
        raise ValueError("Invalid add-on price")

    if menu.get("version") != version:
        raise ValueError("Published version mismatch")


def save_menu(data):
    OFFLINE_DIR.mkdir(parents=True, exist_ok=True)

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=OFFLINE_DIR,
            suffix=".tmp",
            delete=False,
        ) as file:
            temp_path = Path(file.name)
            json.dump(data, file, indent=2)
            file.flush()
            os.fsync(file.fileno())

        # Keep a copy of the previous working menu.
        if MENU_FILE.exists():
            shutil.copy2(MENU_FILE, BACKUP_FILE)

        # Replace the active menu only after downloading and
        # validating the complete new version.
        os.replace(temp_path, MENU_FILE)

    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()


def sync_menu():
    print("Checking Brass Moon menu updates...")

    try:
        latest = download_json(API_URL + "?check=1")
        remote_version = latest["version"]
        local_version = get_local_version()

        print(f"Local version: {local_version}")
        print(f"Published version: {remote_version}")

        if remote_version <= local_version:
            print("Menu is already up to date.")
            return

        print("Downloading updated menu...")

        data = download_json(API_URL)
        validate_menu(data)

        if data["version"] < remote_version:
            raise ValueError("Downloaded an outdated menu version")

        save_menu(data)

        print(f"Menu updated to version {data['version']}.")

    except Exception as error:
        print(f"Sync failed: {error}")
        print("Keeping existing offline menu.")


if __name__ == "__main__":
    sync_menu()
