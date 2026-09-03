import logging
import os

import requests

from content import TOPICS


def _client_config():
    return {
        "api_key": os.getenv("DEEPSEEK_API_KEY", "").strip(),
        "base_url": os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com").strip(),
        "model": os.getenv("DEEPSEEK_MODEL", "deepseek-chat").strip(),
    }


def generate_post(topic: str = None) -> str:
    cfg = _client_config()
    if not cfg["api_key"]:
        raise RuntimeError("DEEPSEEK_API_KEY tanımlı değil")

    if not topic:
        day_index = int(os.getenv("DAY_OF_YEAR", "0")) or _today_day_of_year()
        topic = TOPICS[day_index % len(TOPICS)]

    system = (
        "Sen 'Ankara Doğubayazıtlılar Derneği (BAY-DER)' adlı kültür ve dayanışma "
        "derneğinin sosyal medya yöneticisisin. Paylaşımlar samimi, sıcak ve içten "
        "olur; hemşehri dayanışmasını ve memleket sevgisini öne çıkarır."
    )
    user = (
        f"Doğubayazıt/Ağrı ve Ankara bağını anlatan bir Facebook gönderisi yaz. "
        f"Konu: {topic}.\n\n"
        "Kurallar:\n"
        "- 3-5 kısa cümle olsun, samimi ve doğal Türkçe.\n"
        "- Tarih, istatistik ya da kesin bilgi UYDURMA; genel ve duygusal anlat.\n"
        "- Son satırda 3-5 tane alakalı hashtag ekle (#AğrıDağı gibi), öncesinde "
        "bir boş satır bırak.\n"
        "- Sadece gönderi metnini yaz, başka açıklama yapma."
    )
    headers = {
        "Authorization": f"Bearer {cfg['api_key']}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": cfg["model"],
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.9,
        "max_tokens": 400,
    }
    url = f"{cfg['base_url'].rstrip('/')}/chat/completions"
    resp = requests.post(url, headers=headers, json=payload, timeout=90)
    if resp.status_code != 200:
        logging.error("DeepSeek API hatası HTTP %s: %s", resp.status_code, resp.text[:500])
        raise RuntimeError("DeepSeek çağrısı başarısız")
    data = resp.json()
    text = data["choices"][0]["message"]["content"].strip()
    text = text.strip('"').strip()
    logging.info("AI konu: %s", topic)
    logging.info("AI model: %s", cfg["model"])
    return text


def _today_day_of_year() -> int:
    import datetime

    return datetime.date.today().timetuple().tm_yday
