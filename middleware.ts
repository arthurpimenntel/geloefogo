// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(req: NextRequest) {
  // DESABILITADO COMPLETAMENTE - apenas passa adiante
  return NextResponse.next()
}

export const config = {
  matcher: [],
}