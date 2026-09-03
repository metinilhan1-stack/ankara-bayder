import argparse
import json
import logging
import mimetypes
import os
import re
import sys
from datetime import date
from pathlib import Path

import requests
from dotenv import load_dotenv

import ai as ai_mod
import content as content_pool

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}


def setup_logging(log_file: Path):
    log_file.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )


def resolve_page_id(version: str, token: str) -> str:
    env_id = os.getenv("FB_PAGE_ID", "").strip()
    if env_id:
        return env_id
    url = f"https://graph.facebook.com/{version}/me/accounts"
    resp = requests.get(url, params={"access_token": token}, timeout=30)
    resp.raise_for_status()
    pages = resp.json().get("data", [])
    if not pages:
        logging.error("Token bir kullanıcıya ait değil veya yönetilen sayfa bulunamadı.")
        sys.exit(1)
    if len(pages) == 1:
        page = pages[0]
        logging.info("Sayfa otomatik bulundu: %s (id: %s)", page.get("name"), page.get("id"))
        return page["id"]
    logging.error("Birden fazla sayfa bulundu. FB_PAGE_ID değerini .env dosyasında ayarlayın:")
    for p in pages:
        logging.error("  - %s  (id: %s)", p.get("name"), p.get("id"))
    sys.exit(1)


def list_images(pool_dir: Path):
    return sorted(p for p in pool_dir.iterdir() if p.suffix.lower() in IMAGE_EXTS)


def load_state(state_file: Path) -> dict:
    if state_file.exists():
        try:
            return json.loads(state_file.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            logging.warning("state.json bozuk, sıfırlanıyor.")
    return {"last_used": {}, "caption_index": {}, "last_post": None}


def save_state(state_file: Path, state: dict):
    state_file.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def resolve_theme(image: Path):
    name = image.name.lower()
    tokens = [t for t in re.split(r"[^0-9a-zçğıöşü]", name) if t]
    for key, theme in content_pool.THEMES.items():
        if any(t in theme["keywords"] for t in tokens):
            return key
    return None


def pick_image(images, state) -> Path:
    last_used = state.get("last_used", {})
    return min(images, key=lambda p: last_used.get(p.name, ""))


def static_caption(image, state) -> tuple:
    theme_key = resolve_theme(image)
    if theme_key:
        captions = content_pool.THEMES[theme_key]["captions"]
    else:
        theme_key = "generic"
        captions = content_pool.GENERIC
    index = int(state.get("caption_index", {}).get(theme_key, 0))
    caption = captions[index % len(captions)]
    return theme_key, caption


def build_message(image, state, use_ai, text_only, dry_run) -> tuple:
    theme_key = resolve_theme(image) if image else None

    if use_ai:
        if theme_key:
            topic = content_pool.THEME_LABELS[theme_key]
        else:
            topic = None
        text = ai_mod.generate_post(topic)
        return theme_key or "ai", text

    if image:
        theme_key, caption = static_caption(image, state)
        return theme_key, f"{caption}\n\n{content_pool.HASHTAGS}"

    index = int(state.get("caption_index", {}).get("generic", 0))
    caption = content_pool.GENERIC[index % len(content_pool.GENERIC)]
    return "generic", f"{caption}\n\n{content_pool.HASHTAGS}"


def post_to_facebook(page_id: str, message: str, image, version: str, token: str, dry_run: bool) -> bool:
    base = f"https://graph.facebook.com/{version}/{page_id}"
    if image:
        url = f"{base}/photos"
        params = {"message": message, "access_token": token}
    else:
        url = f"{base}/feed"
        params = {"message": message, "access_token": token}

    if dry_run:
        logging.info("[DRY-RUN] Tür: %s", "fotoğraflı" if image else "salt metin")
        logging.info("[DRY-RUN] Görsel: %s", image.name if image else "(yok)")
        logging.info("[DRY-RUN] Mesaj:\n%s", message)
        logging.info("[DRY-RUN] Endpoint: POST %s", url)
        return True

    if image:
        mime, _ = mimetypes.guess_type(image.name)
        with image.open("rb") as fh:
            files = {"source": (image.name, fh, mime or "image/jpeg")}
            resp = requests.post(url, params=params, files=files, timeout=90)
    else:
        resp = requests.post(url, params=params, timeout=60)

    try:
        data = resp.json()
    except ValueError:
        logging.error("Facebook anlaşılmaz yanıt verdi: HTTP %s", resp.status_code)
        return False
    if "error" in data:
        err = data["error"]
        logging.error("Facebook hatası (%s): %s", err.get("code"), err.get("message"))
        return False
    logging.info("Paylaşım başarılı. Post id: %s", data.get("id"))
    return True


def main():
    parser = argparse.ArgumentParser(description="BAY-DER Facebook günlük paylaşım botu")
    parser.add_argument("--dry-run", action="store_true", help="Paylaşmadan sadece ne yapacağını gösterir")
    parser.add_argument("--text-only", action="store_true", help="Görsel kullanma, salt metin paylaş")
    parser.add_argument("--no-ai", action="store_true", help="AI kapalı; hazır metin havuzunu kullan")
    parser.add_argument("--pool", type=Path, default=BASE_DIR / "pool", help="Görsel havuzu klasörü")
    parser.add_argument("--state", type=Path, default=BASE_DIR / "data" / "state.json", help="Durum dosyası")
    parser.add_argument("--log", type=Path, default=BASE_DIR / "logs" / "post.log", help="Log dosyası")
    args = parser.parse_args()

    setup_logging(args.log)

    token = os.getenv("FB_ACCESS_TOKEN", "").strip()
    version = os.getenv("FB_API_VERSION", "v21.0").strip().lstrip("v")
    version = f"v{version}"

    if args.dry_run:
        page_id = "(dry-run)"
    else:
        if not token:
            logging.error("FB_ACCESS_TOKEN .env dosyasında tanımlı değil. README.md'ye bakın.")
            sys.exit(1)
        page_id = resolve_page_id(version, token)

    images = list_images(args.pool) if args.pool.exists() else []
    text_only = args.text_only or not images
    image = None
    if not text_only:
        state = load_state(args.state)
        image = pick_image(images, state)
        logging.info("Seçilen görsel: %s", image.name)
    elif images:
        logging.info("Salt metin modu; %d görsel havuzda duruyor.", len(images))

    use_ai = (not args.no_ai) and bool(os.getenv("DEEPSEEK_API_KEY", "").strip())
    if use_ai:
        logging.info("Metin: DeepSeek AI üretecek.")
    else:
        logging.info("Metin: hazır metin havuzundan.")

    state = load_state(args.state)
    theme_key, message = build_message(image, state, use_ai, text_only, args.dry_run)

    ok = post_to_facebook(page_id, message, image, version, token, args.dry_run)

    if ok:
        today = date.today().isoformat()
        if image:
            state["last_used"][image.name] = today
        if not use_ai:
            state["caption_index"][theme_key] = int(state.get("caption_index", {}).get(theme_key, 0)) + 1
        state["last_post"] = {
            "date": today,
            "image": image.name if image else None,
            "ai": use_ai,
            "text": message,
            "dry_run": args.dry_run,
        }
        if not args.dry_run:
            save_state(args.state, state)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
