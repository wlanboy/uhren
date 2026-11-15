# simple website for my watches

Statische Website meiner Uhrensammlung: Galerie, Filter nach Hersteller und Tags.

https://wlanboy.github.io/uhren/

## Datenstruktur

Uhren werden in `data/watches.json` gepflegt, Wunschliste in `data/wishlist.json`.

Jeder Eintrag hat folgende Felder:

```json
{
  "brand": "Casio",
  "name": "Casio AE-1200WH-1CVEF",
  "code": "AE-1200WH-1CVEF",
  "value": 40,
  "tags": ["Digital", "Weltzeit"],
  "tech": {
    "Werk": "Quarz",
    "Wasserdichtigkeit": "100 m"
  }
}
```

Das `code`-Feld dient auch als Dateiname für das Zifferblatt-Foto: `faces/<code>.jpg`.

## Sammlung

Die aktuelle Liste mit Fotos, Tags und technischen Daten steht auf der Website. Quelle ist `data/watches.json`.

## Techstack

- Vanilla JS (kein Framework)
- Eigenes Stylesheet in `style.css`
- Daten aus lokalen JSON-Dateien

## run locally
```bash
python3 -m http.server 8000
```
