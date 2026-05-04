// components/storefront/CheckoutStepper.tsx
'use client'

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3
}

const STEPS = [
  { number: 1 as const, label: 'Dados' },
  { number: 2 as const, label: 'Entrega' },
  { number: 3 as const, label: 'Pagamento' },
]

export function CheckoutStepper({ currentStep }: CheckoutStepperProps) {
  return (
    <nav
      aria-label="Etapas do checkout"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        padding: '2rem 1rem',
        backgroundColor: '#0D0805',
        borderBottom: '1px solid #1f1108',
      }}
    >
      {STEPS.map((step, index) => {
        const isDone = step.number < currentStep
        const isActive = step.number === currentStep
        const isFuture = step.number > currentStep

        return (
          <div
            key={step.number}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            {/* Step item */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.6rem',
                position: 'relative',
              }}
            >
              {/* Dot / Check */}
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  border: `1px solid ${isDone ? '#d97706' : isActive ? '#fbbf24' : '#2a1a08'}`,
                  backgroundColor: isDone
                    ? '#d97706'
                    : isActive
                    ? '#1A0F06'
                    : '#0D0805',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {isDone ? (
                  // Check mark para etapas concluídas
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <polyline
                      points="2,7 5.5,10.5 12,3.5"
                      stroke="#0D0805"
                      strokeWidth="1.8"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                ) : isActive ? (
                  // Número âmbar com borda pulsante para etapa ativa
                  <>
                    {/* Anel externo pulsante */}
                    <span
                      style={{
                        position: 'absolute',
                        inset: '-4px',
                        border: '1px solid #d97706',
                        opacity: 0.4,
                        animation: 'stepper-pulse 2s ease-in-out infinite',
                      }}
                    />
                    <span
                      style={{
                        color: '#fbbf24',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {step.number}
                    </span>
                  </>
                ) : (
                  // Número apagado para etapas futuras
                  <span
                    style={{
                      color: '#2a1a08',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                    }}
                  >
                    {step.number}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: '0.68rem',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontWeight: isActive ? 700 : 500,
                  color: isDone
                    ? '#d97706'
                    : isActive
                    ? '#fbbf24'
                    : '#2a1a08',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s ease',
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line between steps */}
            {index < STEPS.length - 1 && (
              <div
                style={{
                  width: '80px',
                  height: '1px',
                  backgroundColor: '#1f1108',
                  margin: '0 0.5rem',
                  marginBottom: '1.6rem', // alinha com o centro dos dots
                  position: 'relative',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Linha de progresso preenchida */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: isDone ? '100%' : '0%',
                    backgroundColor: '#d97706',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Keyframe para o pulse do step ativo — injetado via style tag */}
      <style>{`
        @keyframes stepper-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.08); }
        }
      `}</style>
    </nav>
  )
}