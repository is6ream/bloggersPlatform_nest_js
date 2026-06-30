import type { ReactNode } from 'react'

type PageLayoutProps = {
  title: string
  description?: string
  children?: ReactNode
}

export function PageLayout({ title, description, children }: PageLayoutProps) {
  return (
    <main className="page-layout">
      <section className="page-card">
        <h1>{title}</h1>
        {description && <p className="description">{description}</p>}
        {children}
      </section>
    </main>
  )
}
