// lib/email/templates/ShippingUpdate.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Font,
  Preview,
} from '@react-email/components'
import type { ShippingUpdateEmailProps } from '@/lib/email/resend'

export function ShippingUpdate({
  customerName,
  orderId,
  trackingCode,
  carrier,
  trackingUrl,
}: ShippingUpdateEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head>
        <Font
          fontFamily="Playfair Display"
          fallbackFontFamily="Georgia"
          webFont={{
            url: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.woff2',
            format: 'woff2',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Preview>Seu pedido foi enviado! Código: {trackingCode}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>GELO & FOGO</Text>
            <Text style={tagline}>Tabacaria Premium</Text>
          </Section>

          <Hr style={divider} />

          {/* Ícone de envio */}
          <Section style={{ textAlign: 'center', padding: '24px 0 8px' }}>
            <Text style={iconText}>📦</Text>
          </Section>

          {/* Título */}
          <Section style={section}>
            <Text style={heading}>Seu pedido está a caminho!</Text>
            <Text style={body_text}>
              Olá, <strong style={{ color: '#f59e0b' }}>{customerName}</strong>
            </Text>
            <Text style={body_text}>
              Seu pedido foi despachado e está nas mãos da{' '}
              <strong style={{ color: '#e5e7eb' }}>{carrier}</strong>. Use o
              código abaixo para acompanhar a entrega.
            </Text>
          </Section>

          {/* Código de rastreio em destaque */}
          <Section style={trackingBox}>
            <Text style={trackingLabel}>CÓDIGO DE RASTREIO</Text>
            <Text style={trackingCode_style}>{trackingCode}</Text>
            <Text style={carrierLabel}>{carrier}</Text>
          </Section>

          {/* CTA */}
          <Section style={{ textAlign: 'center', padding: '24px 0' }}>
            <Button href={trackingUrl} style={button}>
              Rastrear Meu Pedido →
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Info adicional */}
          <Section style={section}>
            <Text style={small_text}>
              Pedido <strong style={{ color: '#d97706' }}>#{orderId.slice(0, 8).toUpperCase()}</strong>
            </Text>
            <Text style={small_text}>
              Em caso de dúvidas, responda este e-mail ou acesse{' '}
              <a href={`${process.env.NEXT_PUBLIC_BASE_URL}/conta/pedidos`} style={link}>
                sua conta
              </a>
              .
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footer}>
            <Text style={footer_text}>
              © {new Date().getFullYear()} Gelo & Fogo — Tabacaria Premium
            </Text>
            <Text style={footer_text}>
              Você está recebendo este e-mail porque realizou uma compra.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ── Estilos dark luxury ────────────────────────────────────────────────────
const body: React.CSSProperties = {
  backgroundColor: '#0a0603',
  fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif',
}

const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  backgroundColor: '#0D0805',
  border: '1px solid #3d1f00',
}

const header: React.CSSProperties = {
  padding: '32px 40px 16px',
  textAlign: 'center',
}

const logo: React.CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '28px',
  fontWeight: 700,
  color: '#f59e0b',
  margin: '0',
  letterSpacing: '0.1em',
}

const tagline: React.CSSProperties = {
  fontSize: '11px',
  color: '#78350f',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  margin: '4px 0 0',
}

const divider: React.CSSProperties = {
  borderColor: '#3d1f00',
  margin: '0',
}

const section: React.CSSProperties = {
  padding: '0 40px',
}

const heading: React.CSSProperties = {
  fontFamily: '"Playfair Display", Georgia, serif',
  fontSize: '26px',
  fontWeight: 700,
  color: '#fef3c7',
  margin: '0 0 16px',
  lineHeight: '1.3',
}

const iconText: React.CSSProperties = {
  fontSize: '48px',
  margin: '0',
}

const body_text: React.CSSProperties = {
  fontSize: '15px',
  color: '#d6c4a0',
  lineHeight: '1.7',
  margin: '0 0 12px',
}

const trackingBox: React.CSSProperties = {
  margin: '24px 40px',
  padding: '24px',
  backgroundColor: '#1a0f06',
  border: '1px solid #92400e',
  textAlign: 'center',
}

const trackingLabel: React.CSSProperties = {
  fontSize: '10px',
  color: '#78350f',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  margin: '0 0 8px',
}

const trackingCode_style: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '22px',
  fontWeight: 700,
  color: '#f59e0b',
  letterSpacing: '0.15em',
  margin: '0 0 6px',
}

const carrierLabel: React.CSSProperties = {
  fontSize: '12px',
  color: '#92400e',
  margin: '0',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

const button: React.CSSProperties = {
  backgroundColor: '#d97706',
  color: '#0D0805',
  padding: '12px 32px',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  display: 'inline-block',
}

const small_text: React.CSSProperties = {
  fontSize: '13px',
  color: '#78350f',
  margin: '0 0 8px',
  lineHeight: '1.6',
}

const link: React.CSSProperties = {
  color: '#f59e0b',
  textDecoration: 'underline',
}

const footer: React.CSSProperties = {
  padding: '16px 40px 32px',
  textAlign: 'center',
}

const footer_text: React.CSSProperties = {
  fontSize: '11px',
  color: '#44220a',
  margin: '0 0 4px',
}