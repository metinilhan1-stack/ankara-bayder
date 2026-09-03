import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
AUTH = Path.home() / ".local/share/opencode/auth.json"


def main():
    env_file = BASE_DIR / ".env"
    if not AUTH.exists():
        print("opencode auth.json bulunamadı:", AUTH)
        return 1

    data = json.loads(AUTH.read_text(encoding="utf-8"))
    provider = data.get("deepseek", {})
    key = (provider.get("key") or "").strip()
    if not key:
        print("auth.json içinde 'deepseek' provider anahtarı bulunamadı.")
        return 1

    if env_file.exists():
        lines = env_file.read_text(encoding="utf-8").splitlines()
    else:
        lines = []
    key_line = f"DEEPSEEK_API_KEY={key}"
    lines = [ln for ln in lines if not ln.startswith("DEEPSEEK_API_KEY=")]
    lines.append(key_line)
    env_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("DeepSeek anahtarı fb-bot/.env içine yazıldı (gitignored).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
