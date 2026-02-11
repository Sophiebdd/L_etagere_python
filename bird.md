# bird.svg + animation CSS

Ce document résume comment le logo `bird.svg` est utilisé et animé dans le header.

## 1) SVG
- Fichier : `frontend/public/bird.svg`
- Rôle : icône de l’oiseau utilisée dans le header et comme favicon.
- Utilisation : import direct via `<img src="/bird.svg" ... />` dans le header.

### Favicon
- PNG 64px généré pour un rendu plus grand dans l’onglet : `frontend/public/bird-64.png`
- Déclaré dans `frontend/index.html` (favicon PNG + fallback SVG).

## 2) Placement dans le header
- Fichier : `frontend/src/components/Header.jsx`
- L’oiseau est placé en `absolute` dans le bloc du titre pour « orbiter » autour du texte.

Extrait :
```jsx
<div className="mt-6 flex flex-col items-center gap-1 relative">
  <h1 className="text-5xl font-bold text-[#6b4b35] sm:text-6xl" style={{ fontFamily: '"Amatic SC", cursive' }}>
    L&apos;Étagère
  </h1>
  <img src="/bird.svg" alt="" aria-hidden="true" className="bird-orbit absolute h-10 w-auto sm:h-12" />
</div>
```

## 3) Animation CSS
- Fichier : `frontend/src/index.css`
- Classe principale : `.bird-orbit`
- Objectif : trajectoire fluide autour du titre, sans rotation à 360° (l’oiseau ne se retrouve pas à l’envers), avec une forme plus organique que le losange.

Extrait :
```css
.bird-orbit {
  animation: bird-orbit 7.5s linear infinite;
  transform-origin: center;
  opacity: 0.9;
  left: 50%;
  top: 50%;
}

@keyframes bird-orbit {
  0%   { transform: translate(-50%, -50%) translateX(140px) translateY(0) rotate(4deg); }
  12.5%{ transform: translate(-50%, -50%) translateX(110px) translateY(45px) rotate(2deg); }
  25%  { transform: translate(-50%, -50%) translateX(60px)  translateY(80px) rotate(-2deg); }
  37.5%{ transform: translate(-50%, -50%) translateX(5px)   translateY(95px) rotate(-3deg); }
  50%  { transform: translate(-50%, -50%) translateX(-120px) translateY(60px) rotate(-4deg); }
  62.5%{ transform: translate(-50%, -50%) translateX(-140px) translateY(0) rotate(-4deg); }
  75%  { transform: translate(-50%, -50%) translateX(-70px) translateY(-80px) rotate(3deg); }
  87.5%{ transform: translate(-50%, -50%) translateX(40px)  translateY(-95px) rotate(4deg); }
  100% { transform: translate(-50%, -50%) translateX(140px) translateY(0) rotate(4deg); }
}
```

### Paramètres clés
- Rayon horizontal : ~140px
- Rayon vertical : ~95px
- Durée : `7.5s`
- Vitesse : `linear` (pour éviter les à-coups)

## 4) Ajustements rapides
- Rendre l’orbite plus large : augmenter les `translateX(...)` / `translateY(...)`.
- Rendre l’orbite plus lente : augmenter la durée `7.5s`.
- Rendre l’oiseau plus grand : modifier les classes `h-10 sm:h-12` dans `Header.jsx`.
