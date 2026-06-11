import React, { useEffect, useState, useRef, useCallback } from 'react'

const LETTERS = 'VADITRA'.split('')

export default function LandingPage({ onEnter }) {
  const [phase, setPhase] = useState('logo')
  const [revealedCount, setRevealedCount] = useState(0)
  const [inkLines, setInkLines] = useState([])
  const [notesVisible, setNotesVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const exitedRef = useRef(false)

  useEffect(() => {
    if (revealedCount < LETTERS.length) {
      const t = setTimeout(() => setRevealedCount(c => c + 1), 160)
      return () => clearTimeout(t)
    }
  }, [revealedCount])

  useEffect(() => {
    if (revealedCount >= LETTERS.length) {
      const t1 = setTimeout(() => setNotesVisible(true), 200)
      const t2 = setTimeout(() => setPhase('tagline'), 1000)
      const t3 = setTimeout(() => setPhase('cta'), 3500)
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }
  }, [revealedCount])

  useEffect(() => {
    if (revealedCount > 0 && revealedCount <= LETTERS.length) {
      const newLine = {
        id: Date.now(), x: 10 + Math.random() * 80, y: 10 + Math.random() * 80,
        w: 20 + Math.random() * 60, angle: -8 + Math.random() * 16,
        opacity: 0.02 + Math.random() * 0.04,
      }
      setInkLines(prev => [...prev.slice(-12), newLine])
    }
  }, [revealedCount])

  const triggerExit = useCallback(() => {
    if (exiting || exitedRef.current) return
    exitedRef.current = true
    setExiting(true)
    setTimeout(() => onEnter(), 600)
  }, [exiting, onEnter])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: '#0d0f0e',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: exiting ? 'none' : 'auto',
      }}
      onClick={phase === 'cta' ? triggerExit : undefined}
    >
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        opacity: 0.035, backgroundSize: '180px',
      }} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {inkLines.map(line => (
          <div key={line.id} className="absolute" style={{
            left: `${line.x}%`, top: `${line.y}%`, width: `${line.w}px`, height: '1px',
            background: `rgba(174,211,102,${line.opacity})`,
            transform: `rotate(${line.angle}deg)`, transformOrigin: 'left center',
            borderRadius: '1px',
          }} />
        ))}
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute rounded-full" style={{
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(174,211,102,0.04), transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'breathe 8s ease-in-out infinite',
        }} />
      </div>

      <div className="absolute inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
      }} />

      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="relative flex flex-col items-center">
          <div className="absolute pointer-events-none" style={{
            top: '-10px', left: '4px', opacity: notesVisible ? 1 : 0,
            transition: 'opacity 1s ease',
            animation: notesVisible ? 'noteFloat 4s ease-in-out infinite 0.2s' : 'none',
          }}>
            <span style={{ fontSize: '10px', color: 'rgba(174,211,102,0.85)', fontFamily: 'serif', textShadow: '0 0 8px rgba(174,211,102,0.5), 0 0 20px rgba(174,211,102,0.2)' }}>♪</span>
          </div>
          <div className="absolute pointer-events-none sm:block hidden" style={{
            top: '-12px', right: '-2px', opacity: notesVisible ? 1 : 0,
            transition: 'opacity 1s ease 0.4s',
            animation: notesVisible ? 'noteFloat 3.5s ease-in-out infinite 1s' : 'none',
          }}>
            <span style={{ fontSize: '9px', color: 'rgba(201,240,126,0.8)', fontFamily: 'serif', textShadow: '0 0 8px rgba(201,240,126,0.5), 0 0 18px rgba(201,240,126,0.2)' }}>♫</span>
          </div>
          <div className="absolute pointer-events-none sm:block hidden" style={{
            bottom: '-6px', right: '-6px', opacity: notesVisible ? 1 : 0,
            transition: 'opacity 1s ease 0.7s',
            animation: notesVisible ? 'noteFloat 5s ease-in-out infinite 2s' : 'none',
          }}>
            <span style={{ fontSize: '8px', color: 'rgba(174,211,102,0.75)', fontFamily: 'serif', textShadow: '0 0 6px rgba(174,211,102,0.45), 0 0 14px rgba(174,211,102,0.15)' }}>♩</span>
          </div>
          <div className="absolute pointer-events-none" style={{
            bottom: '-4px', left: '2px', opacity: notesVisible ? 1 : 0,
            transition: 'opacity 1s ease 0.5s',
            animation: notesVisible ? 'noteFloat 4.5s ease-in-out infinite 1.2s' : 'none',
          }}>
            <span style={{ fontSize: '7px', color: 'rgba(201,240,126,0.75)', fontFamily: 'serif', textShadow: '0 0 6px rgba(201,240,126,0.45), 0 0 14px rgba(201,240,126,0.15)' }}>♪</span>
          </div>

          <div className="flex items-end justify-center gap-[2px] sm:gap-[4px] relative">
            <span className="inline-block pointer-events-none leading-none" style={{
              opacity: revealedCount > 1 ? 1 : 0,
              marginRight: 'clamp(6px, 0.5vw, 14px)',
              transition: 'opacity 1.2s ease 0.3s',
              animation: notesVisible ? 'headphoneFloatLeft 5s ease-in-out infinite' : 'none',
              filter: 'drop-shadow(0 0 6px rgba(174,211,102,0.45)) drop-shadow(0 0 14px rgba(174,211,102,0.2))',
            }}>
              <svg width="0.7em" height="0.7em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: '0.15em' }}>
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="rgba(174,211,102,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="2" y="15" width="4" height="7" rx="2" fill="rgba(174,211,102,0.5)" stroke="rgba(174,211,102,0.85)" strokeWidth="1.2"/>
                <rect x="18" y="15" width="4" height="7" rx="2" fill="rgba(174,211,102,0.5)" stroke="rgba(174,211,102,0.85)" strokeWidth="1.2"/>
              </svg>
            </span>

            {LETTERS.map((letter, i) => {
              const revealed = i < revealedCount
              return (
                <span key={i} className="relative inline-block leading-none select-none" style={{
                  fontSize: 'clamp(36px, 10vw, 144px)',
                  fontFamily: '"Space Grotesk", sans-serif',
                  fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1,
                }}>
                  <span style={{
                    position: 'absolute', inset: 0, display: 'block',
                    color: 'transparent', WebkitTextStroke: '1px rgba(174,211,102,0.1)',
                    pointerEvents: 'none',
                  }}>{letter}</span>
                  <span style={{
                    display: 'block', color: '#c9f07e',
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? 'translateY(0px) scaleY(1)' : 'translateY(18px) scaleY(0.85)',
                    transformOrigin: 'bottom center',
                    textShadow: revealed
                      ? '0 0 30px rgba(174,211,102,0.3), 0 0 60px rgba(201,240,126,0.12), 0 2px 0 rgba(0,0,0,0.3)'
                      : 'none',
                    filter: revealed ? 'blur(0px)' : 'blur(3px)',
                    transition: [
                      `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.13}s`,
                      `transform 0.65s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.13}s`,
                      `filter 0.5s ease ${i * 0.13}s`,
                      `text-shadow 0.8s ease ${i * 0.13 + 0.2}s`,
                    ].join(', '),
                  }}>{letter}</span>
                </span>
              )
            })}

            <span className="inline-block pointer-events-none leading-none" style={{
              opacity: revealedCount > 3 ? 1 : 0,
              marginLeft: 'clamp(6px, 0.5vw, 14px)',
              transition: 'opacity 1.2s ease 0.5s',
              animation: notesVisible ? 'headphoneFloatRight 5s ease-in-out infinite 1.5s' : 'none',
              filter: 'drop-shadow(0 0 6px rgba(201,240,126,0.45)) drop-shadow(0 0 14px rgba(201,240,126,0.2))',
            }}>
              <svg width="0.65em" height="0.65em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: '0.12em' }}>
                <path d="M3 18v-6a9 9 0 0 1 18 0v6" stroke="rgba(201,240,126,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="2" y="15" width="4" height="7" rx="2" fill="rgba(201,240,126,0.45)" stroke="rgba(201,240,126,0.8)" strokeWidth="1.2"/>
                <rect x="18" y="15" width="4" height="7" rx="2" fill="rgba(201,240,126,0.45)" stroke="rgba(201,240,126,0.8)" strokeWidth="1.2"/>
              </svg>
            </span>
          </div>

          <div className="relative mt-2 overflow-hidden" style={{ height: '1.5px', width: '100%', borderRadius: '1px' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: revealedCount > 0 ? '100%' : '0%',
              background: 'linear-gradient(90deg, transparent, rgba(174,211,102,0.15), rgba(201,240,126,0.4), rgba(174,211,102,0.15), transparent)',
              transition: 'width 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s',
              boxShadow: '0 0 8px rgba(174,211,102,0.1)',
            }} />
          </div>

          <div className="absolute" style={{
            bottom: 0, right: 0, width: '3px', height: '3px',
            borderRadius: '50%', background: 'rgba(201,240,126,0.5)',
            opacity: revealedCount >= LETTERS.length ? 1 : 0,
            transition: 'opacity 0.4s ease 1.3s',
            boxShadow: '0 0 6px rgba(174,211,102,0.4)',
          }} />
        </div>

        <div className="mt-10 text-center" style={{
          opacity: phase !== 'logo' ? 1 : 0,
          transform: phase !== 'logo' ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.9s ease, transform 0.9s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <p className="font-inter tracking-[0.22em] text-[11px] sm:text-[13px] leading-relaxed" style={{ color: 'rgba(226,227,224,0.7)' }}>
            {['Engineered', 'for'].map((word, i) => (
              <span key={word} className="inline-block mr-2" style={{
                animation: phase !== 'logo' ? `inkWord 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s both` : 'none',
              }}>{word}</span>
            ))}
            <span className="inline-block" style={{
              color: '#c9f07e',
              animation: phase !== 'logo' ? 'inkWord 0.5s cubic-bezier(0.22,1,0.36,1) 0.24s both' : 'none',
            }}>sound.</span>
          </p>
          <p className="font-inter tracking-[0.22em] text-[11px] sm:text-[13px] leading-relaxed mt-1" style={{ color: 'rgba(226,227,224,0.7)' }}>
            {['Designed', 'for'].map((word, i) => (
              <span key={word} className="inline-block mr-2" style={{
                animation: phase !== 'logo' ? `inkWord 0.5s cubic-bezier(0.22,1,0.36,1) ${0.4 + i * 0.12}s both` : 'none',
              }}>{word}</span>
            ))}
            <span className="inline-block" style={{
              color: '#c9f07e',
              animation: phase !== 'logo' ? 'inkWord 0.5s cubic-bezier(0.22,1,0.36,1) 0.64s both' : 'none',
            }}>soul.</span>
          </p>
        </div>

        {/* CTA text below tagline */}
        <div
          className="text-center cursor-pointer mt-14"
          onClick={triggerExit}
          style={{
            opacity: phase === 'cta' && !exiting ? 1 : 0,
            transform: phase === 'cta' && !exiting ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.8s ease 0.1s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s',
            pointerEvents: phase === 'cta' && !exiting ? 'auto' : 'none',
          }}
        >
          <span className="font-inter text-[12px] sm:text-[14px] tracking-[0.25em] uppercase" style={{
            color: 'rgba(201,240,126,0.9)',
            animation: phase === 'cta' ? 'pulseCta 2.5s ease-in-out infinite' : 'none',
          }}>
            click to get started
          </span>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
        background: 'linear-gradient(to top, #0d0f0e, transparent)',
      }} />

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        }
        @keyframes inkWord {
          from { opacity: 0; transform: translateY(6px); filter: blur(2px); }
          to   { opacity: 1; transform: translateY(0);   filter: blur(0);   }
        }
        @keyframes noteFloat {
          0%, 100% { transform: translateY(0) rotate(-3deg); opacity: 0.25; }
          50%       { transform: translateY(-4px) rotate(4deg); opacity: 0.5; }
        }
        @keyframes headphoneFloatLeft {
          0%, 100% { transform: translateX(0) translateY(0) scale(1); opacity: 0.35; }
          50%       { transform: translateX(-3px) translateY(-3px) scale(1.06); opacity: 0.55; }
        }
        @keyframes headphoneFloatRight {
          0%, 100% { transform: translateX(0) translateY(0) scale(1); opacity: 0.35; }
          50%       { transform: translateX(3px) translateY(-3px) scale(1.06); opacity: 0.55; }
        }
        @keyframes pulseCta {
          0%, 100% { letter-spacing: 0.25em; opacity: 0.75; }
          50% { letter-spacing: 0.35em; opacity: 1; }
        }
      `}</style>
    </div>
  )
}
