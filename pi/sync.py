
import json
import math
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
                if (
                    type(price) not in (int, float)
                    or not math.isfinite(price)
                    or not 0 <= price <= 999999.99
                ):
                    raise ValueError("Invalid price")

    syrups = menu.get("syrups")
    if not isinstance(syrups, list) or not all(
        isinstance(item, str) for item in syrups
    ):
        raise ValueError("Invalid syrups")

    addons = menu.get("addOns")

    if not isinstance(addons, dict):
        raise ValueError("Invalid add-ons")

    addon_items = addons.get("items")
    if not isinstance(addon_items, list) or not all(
        isinstance(item, str) for item in addon_items
    ):
        raise ValueError("Invalid add-on items")

    addon_price = addons.get("price")
    if (
        type(addon_price) not in (int, float)
        or not math.isfinite(addon_price)
        or not 0 <= addon_price <= 999999.99
    ):
        raise ValueError("Invalid add-on price")

    if menu.get("version") != version:
        raise ValueError("Published version mismatch")


def read_valid_menu(path):
    with path.open("r", encoding="utf-8") as file:
        data = json.load(file)

    validate_menu(data)
    return data


def atomic_write_menu(data, destination):
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

        os.replace(temp_path, destination)

    finally:
        if temp_path and temp_path.exists():
            temp_path.unlink()


def recover_local_menu():
    try:
        data = read_valid_menu(MENU_FILE)
        return data["version"]

    except (OSError, ValueError, TypeError) as error:
        print(f"Current menu is missing or invalid: {error}")

    # Try restoring the previous known-good menu.
    try:
        backup_data = read_valid_menu(BACKUP_FILE)

        print("Valid backup found. Restoring previous menu...")
        atomic_write_menu(backup_data, MENU_FILE)

        print(
            f"Recovered menu version {backup_data['version']} "
            "from backup."
        )
        return backup_data["version"]

    except (OSError, ValueError, TypeError) as error:
        print(f"No valid backup available: {error}")
        return 0


def save_menu(data):
    # Always validate a newly downloaded menu.
    validate_menu(data)

    # Only back up the current menu if it is valid.
    # Never overwrite a good backup with corrupted data.
    if MENU_FILE.exists():
        try:
            current_data = read_valid_menu(MENU_FILE)
            atomic_write_menu(current_data, BACKUP_FILE)
        except (OSError, ValueError, TypeError):
            print("Current menu invalid; preserving existing backup.")

    # Atomically replace the current menu.
    atomic_write_menu(data, MENU_FILE)


def sync_menu():
    print("Checking Brass Moon menu updates...")

    # Recover local files BEFORE attempting an internet connection.
    local_version = recover_local_menu()
    print(f"Local version: {local_version}")

    try:
        latest = download_json(API_URL + "?check=1")
        remote_version = latest["version"]

        if type(remote_version) is not int or remote_version < 1:
            raise ValueError("Invalid remote version")

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
