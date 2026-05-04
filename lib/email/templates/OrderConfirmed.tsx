import { Html, Head, Body, Container, Section, Text, Img, Hr, Row, Column }
  from '@react-email/components'

interface Props {
  customerName: string
  orderId: string
  items: Array<{ name: string; qty: number; price: number; image: string }>
  total: number
  trackingUrl: string
}

export function OrderConfirmedEmail({ customerName, orderId, items, total, trackingUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ background: '#0D0805', fontFamily: 'Georgia, serif' }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto' }}>

          <Section style={{ background: '#1A0F08', padding: '32px', textAlign: 'center' }}>
            <Text style={{ color: '#C9963A', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              Pedido Confirmado
            </Text>
            <Text style={{ color: '#E8C97A', fontSize: '26px', margin: '8px 0 0' }}>
              Obrigado, {customerName}
            </Text>
          </Section>

          <Section style={{ background: '#231409', padding: '24px 32px' }}>
            <Text style={{ color: '#A08060', fontSize: '12px' }}>Pedido #{orderId}</Text>
            {items.map((item, i) => (
              <Row key={i} style={{ margin: '12px 0' }}>
                <Column style={{ width: '64px' }}>
                  <Img src={item.image} width="56" height="56"
                    style={{ objectFit: 'cover', borderRadius: '2px' }} />
                </Column>
                <Column>
                  <Text style={{ color: '#E8D5B0', margin: '0', fontSize: '14px' }}>{item.name}</Text>
                  <Text style={{ color: '#7A5C30', margin: '2px 0 0', fontSize: '12px' }}>
                    {item.qty}x — {item.price.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
                  </Text>
                </Column>
              </Row>
            ))}
            <Hr style={{ borderColor: '#3D2010' }} />
            <Text style={{ color: '#C9963A', fontSize: '18px', textAlign: 'right' }}>
              Total: {total.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', padding: '24px' }}>
            <a href={trackingUrl}
              style={{ background: '#C9963A', color: '#1A0F08', padding: '12px 32px',
                textDecoration: 'none', fontWeight: 'bold', fontSize: '13px',
                letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Rastrear Pedido
            </a>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}