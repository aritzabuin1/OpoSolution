interface TestDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function TestDetailPage({ params }: TestDetailPageProps) {
  const { id } = await params
  return <h1 className="text-2xl font-bold">Test {id}</h1>
}
