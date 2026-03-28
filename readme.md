## simple website for my watches
https://wlanboy.github.io/uhren/

### Features

- **Galerie** mit Masonry-Layout — zeigt Zifferblatt-Fotos aller Uhren
- **Drei Ansichtsmodi**: Nur Bild / Nur Tech-Info / Bild + Tech-Info
- **Filterung nach Hersteller** (Spinnaker, Casio)
- **Tag-Filter** (Mehrfachauswahl: Automatik, Solar, G-Shock, Saphirglas, Diver, Digital, Edelstahl, Bluetooth, Funk)
- **Vergleichsfunktion** — zwei Uhren nebeneinander mit technischen Daten
- **Wunschliste** — separate Sektion für zukünftige Wunschuhren
- **Dark/Light-Mode** — per Button oder automatisch via Systemeinstellung

### Datenstruktur

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

### Sammlung

| Uhr | Hersteller | Wert |
|-----|-----------|------|
| Spinnaker Bradner Automatik SP-5062-05 | Spinnaker | 350 € |
| Spinnaker Hull Diver Automatic SP-5088 | Spinnaker | 350 € |
| G-Shock G-Steel GST-B400-1AER | Casio | 300 € |
| G-Shock GW-B5600BC-1BER | Casio | 200 € |
| EFS-S630DC-2AVUEF | Casio | 180 € |
| GBM-2100A-1A3ER | Casio | 150 € |
| A130WE-7AEF | Casio | 55 € |
| AE-1600H-8BVEF | Casio | 45 € |
| AE-1200WH-1CVEF | Casio | 40 € |

### Techstack

- Vanilla JS (kein Framework)
- [PicoCSS v2](https://picocss.com/) für das Styling
- Daten aus lokalen JSON-Dateien

### run locally
```bash
python3 -m http.server 8000
```
