# KoumanCI — Visioconference P2P

> "Kouman" = parler en nouchi (argot ivoirien). Represente la communication et l'echange, au coeur de la visioconference.

**Jour 14 du Challenge 14-14-14** — Mars 2026

## Fonctionnalites

- Creation / rejoindre une room avec code
- Video / audio en temps reel (WebRTC peer-to-peer)
- Chat textuel integre
- Partage d'ecran
- Controle micro / camera (activation reelle des peripheriques)
- Detection vocale en temps reel (Web Audio API)
- Mode grille ou speaker view
- Gestion des participants (mute, expulser)
- Photo de profil avec upload
- Loader anime aux couleurs de la Cote d'Ivoire
- Design responsive (mobile, tablette, desktop)

## Stack technique

| Couche     | Technologie                  |
|------------|------------------------------|
| Frontend   | Vue.js 3 (Composition API)   |
| Build      | Vite                         |
| State      | Pinia                        |
| Routing    | Vue Router                   |
| Styles     | SCSS (BEM)                   |
| Icones     | Lucide Vue Next              |
| Backend    | AdonisJS *(a venir)*         |
| Temps reel | WebSocket + WebRTC (STUN/TURN) |

## Prerequis

- Node.js 20+ (`nvm use 20`)
- npm 10+

## Installation

```bash
git clone https://github.com/bath01/14challenge-koumanci-frontend.git
cd 14challenge-koumanci-frontend
npm install
```

## Developpement

```bash
npm run dev        # Serveur de dev (http://localhost:5173)
npm run build      # Build production dans dist/
npm run preview    # Previsualiser le build
```

## Docker

```bash
# Build l'image
docker build -t koumanci-frontend .

# Lancer le conteneur
docker run -p 80:80 koumanci-frontend
```

L'image utilise un build multi-stage (Node.js pour le build, Nginx pour servir). La config Nginx gere le routage SPA et le proxy vers le backend AdonisJS.

## Architecture

```
src/
├── views/              # Pages (Home, Room, About)
├── components/
│   ├── common/         # FlagBar, AppLoader
│   ├── home/           # RecentRooms
│   └── room/           # VideoTile, VideoGrid, SpeakerView,
│                         ChatPanel, ParticipantsPanel,
│                         ControlBar, RoomHeader, SidePanel
├── stores/             # Pinia (room, chat, user)
├── composables/        # useCallTimer, useGradient,
│                         useMediaStream, useVoiceDetection
├── services/           # API REST (api.js), WebSocket (socket.js)
├── router/             # Vue Router
└── assets/styles/      # SCSS variables et base
```

## Equipe

| Nom               | Role                          |
|--------------------|-------------------------------|
| Bath Dorgeles      | Chef de projet & Front-end    |
| Oclin Marcel C.    | Dev Front-end (Vue.js)        |
| Rayane Irie        | Back-end (AdonisJS + WebRTC)  |

## Licence

Open Source — [225os.com](https://225os.com) & [GitHub](https://github.com/bath01/14challenge-koumanci-frontend)
