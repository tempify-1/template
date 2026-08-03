import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import { Button } from '@/components/ui/button'
import config from '@/payload.config'
import './globals.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-medium">
        {user ? `Welcome back, ${user.email}` : 'Welcome to your new project.'}
      </h1>
      <Button nativeButton={false} render={<a href={payloadConfig.routes.admin} />}>
        Go to admin panel
      </Button>
    </div>
  )
}
