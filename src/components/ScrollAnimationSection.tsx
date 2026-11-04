import React, { useEffect, useRef, useState, useCallback } from 'react';

// Importação dos ícones SVG locais de alta definição com cantos arredondados e sombra suave
import gmailIcon from '../assets/icons/gmail.svg';
import calendarIcon from '../assets/icons/calendar.svg';
import whatsappIcon from '../assets/icons/whatsapp.svg';
import driveIcon from '../assets/icons/drive.svg';
import docsIcon from '../assets/icons/docs.svg';
import slackIcon from '../assets/icons/slack.svg';
import notionIcon from '../assets/icons/notion.svg';
import searchIcon from '../assets/icons/search.svg';

interface IconGeom {
  id: string;
  name: string;
  src: string;
  isMain: boolean;
  finalAngle: number;
  startX: number;
  startY: number;
  startScale: number;
  targetX: number;
  targetY: number;
  targetScale: number;
}

/**
 * Função de interpolação suave Smoothstep (Hermite cúbico)
 */
function smoothstep(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped * clamped * (3 - 2 * clamped);
}

/**
 * Componente isolado de animação por scroll
 * Prefixo de estilos estritamente reservado: .sa-
 */
export const ScrollAnimationSection: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  // Placeholders inline dentro do título
  const phGmailRef = useRef<HTMLSpanElement>(null);
  const phCalendarRef = useRef<HTMLSpanElement>(null);
  const phWhatsAppRef = useRef<HTMLSpanElement>(null);

  // Referências para os elementos DOM dos 8 ícones
  const iconDomRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Geometria pré-calculada (medida apenas no mount, resize e fonts.ready)
  const geomRef = useRef<{
    icons: IconGeom[];
    cardCenter: { x: number; y: number };
    isReducedMotion: boolean;
  }>({
    icons: [],
    cardCenter: { x: 0, y: 0 },
    isReducedMotion: false
  });

  // Estado da animação (alvo vs atual com interpolação lerp)
  const animStateRef = useRef<{
    target: number;
    current: number;
    rafId: number | null;
  }>({
    target: 0,
    current: 0,
    rafId: null
  });

  // ==========================================================================
  // CÁLCULO E MEDIÇÃO GEOMÉTRICA (Executado apenas em eventos de layout)
  // NUNCA executado dentro do loop de animação rAF
  // ==========================================================================
  const measureGeometry = useCallback(() => {
    if (!stageRef.current || !cardRef.current) return;

    const stageRect = stageRef.current.getBoundingClientRect();
    const cardRect = cardRef.current.getBoundingClientRect();

    const isMobile = window.innerWidth < 640;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Centro do cartão relativo ao stage
    const cardCenterX = cardRect.left - stageRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top - stageRect.top + cardRect.height / 2;

    // Raio do círculo à volta do cartão
    // min(30% da largura, 26% da altura, 170px) / mobile < 640px reduz proporcionalmente
    const baseRadius = Math.min(stageRect.width * 0.30, stageRect.height * 0.26, 170);
    const circleRadius = isMobile ? Math.min(baseRadius, stageRect.width * 0.36, 125) : baseRadius;

    // 8 ícones distribuídos equidistantemente a 45°
    // Posições finais no círculo:
    // 0: Gmail, 1: Google Calendar, 2: WhatsApp, 3: Google Drive, 4: Google Docs, 5: Slack, 6: Notion, 7: Google Search
    const iconsDef = [
      { id: 'gmail', name: 'Gmail', src: gmailIcon, isMain: true, phRef: phGmailRef, angle: -Math.PI / 2 },          // topo (12h)
      { id: 'calendar', name: 'Google Calendar', src: calendarIcon, isMain: true, phRef: phCalendarRef, angle: -Math.PI / 4 }, // topo-dir (1h30)
      { id: 'whatsapp', name: 'WhatsApp', src: whatsappIcon, isMain: true, phRef: phWhatsAppRef, angle: 0 },             // dir (3h)
      { id: 'drive', name: 'Google Drive', src: driveIcon, isMain: false, phRef: null, angle: Math.PI / 4 },             // baixo-dir (4h30)
      { id: 'docs', name: 'Google Docs', src: docsIcon, isMain: false, phRef: null, angle: Math.PI / 2 },                // baixo (6h)
      { id: 'slack', name: 'Slack', src: slackIcon, isMain: false, phRef: null, angle: (3 * Math.PI) / 4 },              // baixo-esq (7h30)
      { id: 'notion', name: 'Notion', src: notionIcon, isMain: false, phRef: null, angle: Math.PI },                     // esq (9h)
      { id: 'search', name: 'Google Search', src: searchIcon, isMain: false, phRef: null, angle: -(3 * Math.PI) / 4 }   // topo-esq (10h30)
    ];

    const iconSize = isMobile ? 42 : 50;

    const computedIcons: IconGeom[] = iconsDef.map((def) => {
      // Posição final na circunferência à volta do centro do cartão
      const targetX = cardCenterX + circleRadius * Math.cos(def.angle) - iconSize / 2;
      const targetY = cardCenterY + circleRadius * Math.sin(def.angle) - iconSize / 2;

      let startX = cardCenterX - iconSize / 2;
      let startY = cardCenterY - iconSize / 2;
      let startScale = 0.2;

      if (def.isMain && def.phRef && def.phRef.current) {
        const phRect = def.phRef.current.getBoundingClientRect();
        // Centraliza o ícone exatamente sobre o placeholder inline
        startX = phRect.left - stageRect.left + (phRect.width - iconSize) / 2;
        startY = phRect.top - stageRect.top + (phRect.height - iconSize) / 2;
        startScale = isMobile ? 0.65 : 0.75;
      }

      return {
        id: def.id,
        name: def.name,
        src: def.src,
        isMain: def.isMain,
        finalAngle: def.angle,
        startX,
        startY,
        startScale,
        targetX,
        targetY,
        targetScale: 1.0
      };
    });

    geomRef.current = {
      icons: computedIcons,
      cardCenter: { x: cardCenterX, y: cardCenterY },
      isReducedMotion
    };

    // Renderiza o frame atual de imediato após medição
    applyFrame(animStateRef.current.current);
  }, []);

  // ==========================================================================
  // ATUALIZAÇÃO VISUAL (APENAS TRANSFORM E OPACITY)
  // ==========================================================================
  const applyFrame = (progress: number) => {
    const { icons, isReducedMotion } = geomRef.current;
    if (icons.length === 0) return;

    const cur = isReducedMotion ? 1.0 : progress;

    // 1. TÍTULO: 0 → 0.45 fade-out e move-se ~40px para cima
    if (titleRef.current) {
      const tFade = Math.min(1, Math.max(0, cur / 0.45));
      const titleOpacity = 1 - smoothstep(tFade);
      const titleY = -40 * smoothstep(tFade);
      titleRef.current.style.opacity = `${titleOpacity}`;
      titleRef.current.style.transform = `translate3d(0, ${titleY}px, 0)`;
    }

    // 2. CARTÃO CENTRAL: 0.15 → 0.55 fade-in (scale 0.92 → 1)
    if (cardRef.current) {
      const cProgress = Math.min(1, Math.max(0, (cur - 0.15) / 0.40));
      const cardOpacity = smoothstep(cProgress);
      const cardScale = 0.92 + 0.08 * smoothstep(cProgress);
      cardRef.current.style.opacity = `${cardOpacity}`;
      cardRef.current.style.transform = `scale(${cardScale})`;
    }

    // 3. LEGENDA: 0.70 → 0.95 fade-in
    if (legendRef.current) {
      const lProgress = Math.min(1, Math.max(0, (cur - 0.70) / 0.25));
      const legendOpacity = smoothstep(lProgress);
      const legendY = 16 * (1 - smoothstep(lProgress));
      legendRef.current.style.opacity = `${legendOpacity}`;
      legendRef.current.style.transform = `translate3d(0, ${legendY}px, 0)`;
    }

    // 4. DICA DE ROLAGEM: Visível apenas no início (0 → 0.15 fade-out)
    if (hintRef.current) {
      const hintOpacity = Math.max(0, 1 - cur / 0.15);
      hintRef.current.style.opacity = `${hintOpacity}`;
      hintRef.current.style.transform = `translate3d(-50%, ${cur * 20}px, 0)`;
    }

    // 5. ÍCONES (3 Principais e 5 Extras)
    icons.forEach((icon, index) => {
      const el = iconDomRefs.current[index];
      if (!el) return;

      if (icon.isMain) {
        // FASE 0 → 0.75: Ícones principais voam com easing smoothstep e arco de ~22px
        const mProgress = Math.min(1, Math.max(0, cur / 0.75));
        const eased = smoothstep(mProgress);

        // Interpolação linear de X e Y
        let curX = icon.startX + (icon.targetX - icon.startX) * eased;
        let curY = icon.startY + (icon.targetY - icon.startY) * eased;

        // Adiciona pequeno arco (~22px) a meio do caminho
        // O arco atinge o pico em eased = 0.5 via função seno
        const arcAmount = 22 * Math.sin(eased * Math.PI);
        // O vetor do arco é perpendicular ao vetor de movimento
        const dx = icon.targetX - icon.startX;
        const dy = icon.targetY - icon.startY;
        const dist = Math.hypot(dx, dy) || 1;
        const perpX = -dy / dist;
        const perpY = dx / dist;

        curX += perpX * arcAmount;
        curY += perpY * arcAmount;

        const curScale = icon.startScale + (icon.targetScale - icon.startScale) * eased;
        const curOpacity = 1;

        el.style.opacity = `${curOpacity}`;
        el.style.transform = `translate3d(${curX}px, ${curY}px, 0) scale(${curScale})`;
      } else {
        // FASE 0.20 → 0.75: Ícones extras nascem no centro do cartão e voam para o círculo
        // Partem do centro com scale 0.2 e opacity 0, e crescem até scale 0.9 e opacity 1
        const eProgress = Math.min(1, Math.max(0, (cur - 0.20) / 0.55));
        const eased = smoothstep(eProgress);

        const curX = icon.startX + (icon.targetX - icon.startX) * eased;
        const curY = icon.startY + (icon.targetY - icon.startY) * eased;
        const curScale = 0.2 + 0.75 * eased;
        const curOpacity = eased;

        el.style.opacity = `${curOpacity}`;
        el.style.transform = `translate3d(${curX}px, ${curY}px, 0) scale(${curScale})`;
      }
    });
  };

  // ==========================================================================
  // LOOP DE INTERPOLAÇÃO LERP COM requestAnimationFrame
  // cur += (target - cur) * 0.075; pára quando |target - cur| <= 0.0004
  // ==========================================================================
  const startRafLoop = useCallback(() => {
    if (animStateRef.current.rafId !== null) return;

    const loop = () => {
      const { target, current } = animStateRef.current;
      const diff = target - current;

      if (Math.abs(diff) > 0.0004) {
        animStateRef.current.current += diff * 0.075;
        applyFrame(animStateRef.current.current);
        animStateRef.current.rafId = requestAnimationFrame(loop);
      } else {
        // Estabilizou no alvo
        animStateRef.current.current = target;
        applyFrame(target);
        animStateRef.current.rafId = null;
      }
    };

    animStateRef.current.rafId = requestAnimationFrame(loop);
  }, []);

  // ==========================================================================
  // LISTENER DE SCROLL ULTRA-LEVE (Apenas atualiza target e acorda o rAF)
  // ==========================================================================
  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;

      const rect = heroRef.current.getBoundingClientRect();
      const scrollableDist = rect.height - window.innerHeight;

      if (scrollableDist <= 0) return;

      // Progresso normalizado de 0 a 1
      const progress = Math.max(0, Math.min(1, -rect.top / scrollableDist));
      animStateRef.current.target = progress;

      startRafLoop();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animStateRef.current.rafId !== null) {
        cancelAnimationFrame(animStateRef.current.rafId);
        animStateRef.current.rafId = null;
      }
    };
  }, [startRafLoop]);

  // ==========================================================================
  // INICIALIZAÇÃO E RESIZE (Recalcula medidas e observa fontes)
  // ==========================================================================
  useEffect(() => {
    measureGeometry();

    const handleResize = () => {
      measureGeometry();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Recalcula quando as fontes terminarem de renderizar para precisão absoluta dos spans inline
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        measureGeometry();
      });
    }

    // Timeout de contingência para layout estável
    const timer = setTimeout(() => {
      measureGeometry();
    }, 150);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [measureGeometry]);

  // Lista estática dos 8 ícones para renderização DOM inicial
  const iconList = [
    { id: 'gmail', name: 'Gmail', src: gmailIcon, isMain: true },
    { id: 'calendar', name: 'Google Calendar', src: calendarIcon, isMain: true },
    { id: 'whatsapp', name: 'WhatsApp', src: whatsappIcon, isMain: true },
    { id: 'drive', name: 'Google Drive', src: driveIcon, isMain: false },
    { id: 'docs', name: 'Google Docs', src: docsIcon, isMain: false },
    { id: 'slack', name: 'Slack', src: slackIcon, isMain: false },
    { id: 'notion', name: 'Notion', src: notionIcon, isMain: false },
    { id: 'search', name: 'Google Search', src: searchIcon, isMain: false }
  ];

  return (
    <>
      {/* CSS ISOLADO COM PREFIXO ÚNICO .sa- (Zero colisões com o resto do site) */}
      <style>{`
        .sa-hero {
          position: relative;
          height: 260vh;
          width: 100%;
          background: #090e17;
          color: #f8fafc;
        }

        .sa-stage {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          contain: layout paint;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
        }

        /* Título Centrado com Tipografia Clamp */
        .sa-title-wrap {
          position: absolute;
          z-index: 10;
          text-align: center;
          width: 90%;
          max-width: 980px;
          padding: 0 16px;
          pointer-events: none;
          will-change: transform, opacity;
        }

        .sa-title {
          font-family: inherit;
          font-size: clamp(22px, 3.6vw, 48px);
          font-weight: 800;
          line-height: 1.35;
          letter-spacing: -0.025em;
          color: #f1f5f9;
          margin: 0;
          text-wrap: balance;
        }

        .sa-title-line {
          display: block;
          white-space: normal;
        }

        /* Placeholders inline de exatamente 1em x 1em dentro do texto */
        .sa-ph {
          display: inline-block;
          width: 1.15em;
          height: 1.15em;
          vertical-align: middle;
          margin: 0 0.18em;
          position: relative;
          border-radius: 22%;
          background: transparent;
        }

        /* Cartão Central Quadrado Arredondado (Gradiente Suave Verde-Acinzentado) */
        .sa-card {
          position: absolute;
          width: min(360px, 70vw);
          aspect-ratio: 1;
          border-radius: 32px;
          background: linear-gradient(145deg, #182822 0%, #0f1c17 50%, #0b1411 100%);
          border: 1px solid rgba(52, 211, 153, 0.22);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 5;
          opacity: 0;
          will-change: transform, opacity;
          pointer-events: none;
        }

        .sa-card-glow {
          position: absolute;
          inset: 0;
          border-radius: 32px;
          background: radial-gradient(circle at 50% 30%, rgba(16, 185, 129, 0.18) 0%, transparent 70%);
          pointer-events: none;
        }

        .sa-card-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .sa-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #34d399;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .sa-card-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #34d399;
          box-shadow: 0 0 8px #34d399;
        }

        .sa-card-brand {
          font-size: 20px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.01em;
          margin-bottom: 6px;
        }

        .sa-card-sub {
          font-size: 11.5px;
          color: #94a3b8;
          line-height: 1.4;
          max-width: 220px;
        }

        /* Legenda que aparece no final (0.70 → 0.95) */
        .sa-legend {
          position: absolute;
          bottom: 12vh;
          z-index: 12;
          text-align: center;
          padding: 0 20px;
          max-width: 540px;
          opacity: 0;
          will-change: transform, opacity;
          pointer-events: none;
        }

        .sa-legend-title {
          font-size: clamp(17px, 2.2vw, 22px);
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }

        .sa-legend-desc {
          font-size: clamp(12px, 1.4vw, 14px);
          color: #94a3b8;
          line-height: 1.5;
          margin: 0;
        }

        /* Camada Absoluta de Ícones Flutuantes */
        .sa-icons-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 20;
        }

        .sa-icon-node {
          position: absolute;
          top: 0;
          left: 0;
          width: 50px;
          height: 50px;
          border-radius: 22%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28), 0 2px 6px rgba(0, 0, 0, 0.15);
          will-change: transform, opacity;
          transform-origin: center center;
          opacity: 0;
          border: 1px solid rgba(255, 255, 255, 0.85);
        }

        @media (max-width: 639px) {
          .sa-icon-node {
            width: 42px;
            height: 42px;
            padding: 7px;
          }
        }

        .sa-icon-node img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          display: block;
        }

        /* Dica de Scroll no Rodapé */
        .sa-hint {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translate3d(-50%, 0, 0);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.04em;
          z-index: 15;
          pointer-events: none;
          will-change: transform, opacity;
        }

        .sa-hint-arrow {
          display: inline-block;
          animation: sa-bounce 1.6s infinite ease-in-out;
        }

        @keyframes sa-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(4px); }
        }

        /* Suporte a prefers-reduced-motion */
        @media (prefers-reduced-motion: reduce) {
          .sa-hero {
            height: auto;
            min-height: 80vh;
            padding: 80px 0;
          }
          .sa-stage {
            position: relative;
            height: auto;
            min-height: 600px;
          }
          .sa-title-wrap {
            display: none;
          }
          .sa-card {
            opacity: 1 !important;
            transform: scale(1) !important;
          }
          .sa-legend {
            opacity: 1 !important;
            transform: translate3d(0, 0, 0) !important;
          }
          .sa-hint {
            display: none;
          }
          .sa-icon-node {
            opacity: 1 !important;
          }
        }
      `}</style>

      {/* WRAPPER PRINCIPAL (~260vh de rolagem fluida) */}
      <section ref={heroRef} className="sa-hero" aria-label="Animação de Integração de Canais do NEXA">
        <div ref={stageRef} className="sa-stage">
          
          {/* TÍTULO COM 2 LINHAS E OS 3 ÍCONES INLINE */}
          <div ref={titleRef} className="sa-title-wrap">
            <h2 className="sa-title">
              <span className="sa-title-line">
                A tua IA lê os teus{' '}
                <span ref={phGmailRef} className="sa-ph" aria-label="Gmail"></span>
                {' '}e trata de tudo,
              </span>
              <span className="sa-title-line">
                marca no{' '}
                <span ref={phCalendarRef} className="sa-ph" aria-label="Google Calendar"></span>
                {' '}e responde no{' '}
                <span ref={phWhatsAppRef} className="sa-ph" aria-label="WhatsApp"></span>
              </span>
            </h2>
          </div>

          {/* CARTÃO CENTRAL QUADRADO (ARREDONDADO, GRADIENTE SUAVE VERDE-ACINZENTADO) */}
          <div ref={cardRef} className="sa-card">
            <div className="sa-card-glow" />
            <div className="sa-card-inner">
              <div className="sa-card-badge">
                <span className="sa-card-pulse" />
                <span>NEXA Core</span>
              </div>
              <h3 className="sa-card-brand">Autonomia Total</h3>
              <p className="sa-card-sub">
                Centraliza, orquestra e executa fluxos em todos os teus aplicativos sem interrupções manuais.
              </p>
            </div>
          </div>

          {/* LEGENDA QUE APARECE NO FIM (0.70 → 0.95) */}
          <div ref={legendRef} className="sa-legend">
            <h3 className="sa-legend-title">Monitora</h3>
            <p className="sa-legend-desc">
              O assistente acompanha mensagens, reuniões e documentos de forma proativa e contínua.
            </p>
          </div>

          {/* CAMADA DOS 8 ÍCONES VOADORES */}
          <div className="sa-icons-layer" aria-hidden="true">
            {iconList.map((icon, index) => (
              <div
                key={icon.id}
                ref={(el) => { iconDomRefs.current[index] = el; }}
                className="sa-icon-node"
                title={icon.name}
              >
                <img src={icon.src} alt={icon.name} loading="eager" />
              </div>
            ))}
          </div>

          {/* DICA DE ROLAGEM VISÍVEL APENAS NO INÍCIO */}
          <div ref={hintRef} className="sa-hint">
            <span className="sa-hint-arrow">↓</span>
            <span>rola a página</span>
          </div>

        </div>
      </section>
    </>
  );
};
